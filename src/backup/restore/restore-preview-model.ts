import { buildAppBackupRestorePlan } from "./build-app-backup-restore-plan";
import { readCurrentRestoreEnvironment } from "./read-restore-environment";
import { validateAppBackupEnvelope } from "./validate-app-backup";
import type {
  RestoreConflict,
  RestoreEnvironment,
  RestoreKnownModuleId,
  RestorePlan,
  ValidatedAppBackupEnvelope,
} from "./restore-types";

/** User-facing module labels for Restore preview (not export registry labels). */
export const RESTORE_UI_MODULE_LABELS: Readonly<Record<RestoreKnownModuleId, string>> = {
  "school-profile": "Profil školy",
  "identity-registry": "Identita školy",
  "annual-report": "Výroční zpráva",
  "phmax-pv": "PHmax MŠ",
  "phmax-sd": "PHmax ŠD",
  "phmax-zs": "PHmax ZŠ",
  "phmax-ss": "PHmax SŠ",
  "phmax-nv75": "Banka odpočtů NV75",
  "phmax-scenario-label": "Scénář školy",
};

export type RestorePreviewModuleItem = {
  label: string;
};

export type RestorePreviewConflictCategory =
  | "different_school"
  | "legacy_unverifiable"
  | "local_data_corrupted"
  | "storage_unavailable"
  | "invalid_backup_data";

export type RestorePreviewModel = {
  exportedAtLabel: string;
  schemaVersionLabel: string;
  schoolName: string | null;
  backupKind: "modern" | "legacy";
  restoreModules: RestorePreviewModuleItem[];
  preserveModules: RestorePreviewModuleItem[];
  unknownModuleWarning: boolean;
  invalidModules: RestorePreviewModuleItem[];
  conflictCategory: RestorePreviewConflictCategory | null;
  canApply: boolean;
  hasRestorableModules: boolean;
  warnings: string[];
  blockedMessage: string | null;
  emptyBackupMessage: string | null;
};

export type RestorePreviewParseErrorStatus =
  | "invalid_json"
  | "invalid_envelope"
  | "unsupported_schema";

export type RestorePreviewReady = {
  validated: ValidatedAppBackupEnvelope;
  preview: RestorePreviewModel;
};

export type RestorePreviewFromTextResult =
  | { status: "parse_error"; parseStatus: RestorePreviewParseErrorStatus; message: string; schemaVersion?: unknown }
  | { status: "preview"; validated: ValidatedAppBackupEnvelope; preview: RestorePreviewModel };

const UNKNOWN_MODULE_WARNING =
  "Záloha obsahuje data z novější verze aplikace, která tato verze neumí obnovit.";

const INVALID_MODULE_MESSAGE = "Záloha obsahuje poškozená nebo nepodporovaná data.";

const EMPTY_BACKUP_MESSAGE =
  "V této záloze nejsou data, která by tato verze aplikace mohla obnovit.";

const PARSE_ERROR_MESSAGES: Record<RestorePreviewParseErrorStatus, string> = {
  invalid_json: "Vybraný soubor není platná záloha Ředitelského průvodce.",
  invalid_envelope: "Vybraný soubor nemá podporovaný formát zálohy.",
  unsupported_schema: "Tato záloha byla vytvořena v nepodporované verzi aplikace.",
};

const CONFLICT_MESSAGES: Record<RestorePreviewConflictCategory, string> = {
  different_school:
    "Záloha patří jiné škole než data, která jsou nyní v tomto prohlížeči.",
  legacy_unverifiable:
    "Nelze bezpečně ověřit, že záloha patří stejné škole jako data v tomto prohlížeči.",
  local_data_corrupted:
    "Současná data aplikace nejsou v konzistentním stavu pro bezpečné obnovení.",
  storage_unavailable:
    "Data v tomto prohlížeči nyní nelze bezpečně číst nebo měnit.",
  invalid_backup_data: INVALID_MODULE_MESSAGE,
};

function uiLabelForModule(moduleId: RestoreKnownModuleId): string {
  return RESTORE_UI_MODULE_LABELS[moduleId];
}

function formatExportedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("cs-CZ");
}

function extractSchoolName(validated: ValidatedAppBackupEnvelope): string | null {
  const profile = validated.modules.find(
    (module) => module.moduleId === "school-profile" && module.status === "present_valid",
  );
  if (!profile || profile.status !== "present_valid") return null;
  const data = profile.data as { name?: unknown };
  if (typeof data.name !== "string") return null;
  const trimmed = data.name.trim();
  return trimmed === "" ? null : trimmed;
}

function backupKindFromValidated(validated: ValidatedAppBackupEnvelope): "modern" | "legacy" {
  return validated.modules.some(
    (module) => module.moduleId === "identity-registry" && module.status === "present_valid",
  )
    ? "modern"
    : "legacy";
}

function hasPresentValidKnownModule(validated: ValidatedAppBackupEnvelope): boolean {
  return validated.modules.some((module) => module.status === "present_valid");
}

function conflictCategoryFromPlan(
  conflict: RestoreConflict | null,
  hasInvalidKnownModule: boolean,
): RestorePreviewConflictCategory | null {
  if (conflict != null) {
    if (conflict.kind === "cross_school") return "different_school";
    if (conflict.kind === "legacy_identity_unverifiable") return "legacy_unverifiable";
    if (conflict.kind === "local_identity_corrupted") return "local_data_corrupted";
    if (conflict.kind === "local_storage_unavailable") return "storage_unavailable";
    if (conflict.kind === "backup_identity_invalid") return "invalid_backup_data";
    if (conflict.kind === "known_module_invalid") return "invalid_backup_data";
  }
  if (hasInvalidKnownModule) return "invalid_backup_data";
  return null;
}

function userWarningsFromPlan(plan: RestorePlan): string[] {
  const warnings: string[] = [];
  if (plan.warnings.some((warning) => warning.code === "unknown_module")) {
    warnings.push(UNKNOWN_MODULE_WARNING);
  }
  if (plan.warnings.some((warning) => warning.code === "partial_backup")) {
    warnings.push(
      "Data modulů, které v záloze nejsou, zůstanou v tomto prohlížeči beze změny.",
    );
  }
  return warnings;
}

/**
 * Pure mapper: RestorePlan + validated envelope → user-facing preview model.
 * Never exposes storage keys, UUIDs, or internal enum identifiers.
 */
export function buildRestorePreviewModel(
  plan: RestorePlan,
  validated: ValidatedAppBackupEnvelope,
): RestorePreviewModel {
  const restoreModules: RestorePreviewModuleItem[] = [];
  const preserveModules: RestorePreviewModuleItem[] = [];
  const invalidModules: RestorePreviewModuleItem[] = [];

  for (const item of plan.modules) {
    if (item.kind === "present_valid" && item.moduleId in RESTORE_UI_MODULE_LABELS) {
      restoreModules.push({
        label: uiLabelForModule(item.moduleId as RestoreKnownModuleId),
      });
      continue;
    }
    if (item.kind === "missing_preserve" && item.moduleId in RESTORE_UI_MODULE_LABELS) {
      preserveModules.push({
        label: uiLabelForModule(item.moduleId as RestoreKnownModuleId),
      });
      continue;
    }
    if (item.kind === "present_invalid" && item.moduleId in RESTORE_UI_MODULE_LABELS) {
      invalidModules.push({
        label: uiLabelForModule(item.moduleId as RestoreKnownModuleId),
      });
    }
  }

  const hasRestorableModules = hasPresentValidKnownModule(validated);
  const conflictCategory = conflictCategoryFromPlan(plan.conflict, validated.hasInvalidKnownModule);
  const warnings = userWarningsFromPlan(plan);

  let blockedMessage: string | null = null;
  if (conflictCategory != null) {
    blockedMessage = CONFLICT_MESSAGES[conflictCategory];
  } else if (validated.hasInvalidKnownModule || invalidModules.length > 0) {
    blockedMessage = INVALID_MODULE_MESSAGE;
  } else if (!hasRestorableModules) {
    blockedMessage = null;
  } else if (!plan.canApply) {
    blockedMessage = INVALID_MODULE_MESSAGE;
  }

  return {
    exportedAtLabel: formatExportedAt(validated.envelope.exportedAt),
    schemaVersionLabel: String(validated.envelope.schemaVersion),
    schoolName: extractSchoolName(validated),
    backupKind: backupKindFromValidated(validated),
    restoreModules,
    preserveModules,
    unknownModuleWarning: plan.warnings.some((warning) => warning.code === "unknown_module"),
    invalidModules,
    conflictCategory,
    canApply: plan.canApply,
    hasRestorableModules,
    warnings,
    blockedMessage,
    emptyBackupMessage: hasRestorableModules ? null : EMPTY_BACKUP_MESSAGE,
  };
}

export type BuildRestorePreviewOptions = {
  readEnvironment?: () => RestoreEnvironment;
};

/**
 * Read-only replan from an already validated envelope (T1 refresh, no reparse).
 * Never writes storage.
 */
export function buildRestorePreviewFromValidated(
  validated: ValidatedAppBackupEnvelope,
  options: BuildRestorePreviewOptions = {},
): RestorePreviewReady {
  const readEnvironment = options.readEnvironment ?? readCurrentRestoreEnvironment;
  const env = readEnvironment();
  const plan = buildAppBackupRestorePlan(validated, env);
  return {
    validated,
    preview: buildRestorePreviewModel(plan, validated),
  };
}

/**
 * Read-only pipeline: backup file text → validated plan → preview model.
 * Never writes storage.
 */
export function buildRestorePreviewFromBackupText(
  text: string,
  options: BuildRestorePreviewOptions = {},
): RestorePreviewFromTextResult {
  const validated = validateAppBackupEnvelope(text);
  if (validated.status === "invalid_json") {
    return {
      status: "parse_error",
      parseStatus: "invalid_json",
      message: PARSE_ERROR_MESSAGES.invalid_json,
    };
  }
  if (validated.status === "invalid_envelope") {
    return {
      status: "parse_error",
      parseStatus: "invalid_envelope",
      message: PARSE_ERROR_MESSAGES.invalid_envelope,
    };
  }
  if (validated.status === "unsupported_schema") {
    return {
      status: "parse_error",
      parseStatus: "unsupported_schema",
      message: PARSE_ERROR_MESSAGES.unsupported_schema,
      schemaVersion: validated.schemaVersion,
    };
  }

  const ready = buildRestorePreviewFromValidated(validated, options);
  return {
    status: "preview",
    validated: ready.validated,
    preview: ready.preview,
  };
}
