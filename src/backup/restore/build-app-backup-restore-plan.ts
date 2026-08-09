import { isRecord } from "../backup-validation";
import { parseSchoolYearLabel } from "../../domain/school-year/school-year-label";
import type { IdentityRegistry } from "../../data/identity/identity-registry-types";
import type { ScenarioLabelMigrationTarget } from "../../data/storage/scenario-label-migration/scenario-label-migration-types";
import { buildScenarioLabelRestorePhysicalOps } from "../../data/storage/scenario-label-migration/scenario-label-restore-ops";
import {
  resolveScenarioLabelRestoreShadowPlan,
  type ScenarioLabelRestoreShadowPlan,
} from "../../data/storage/scenario-label-migration/scenario-label-restore-target";
import { validateAppBackupEnvelope } from "./validate-app-backup";
import {
  ANNUAL_REPORT_SECTION_KEYS,
  NAMED_SNAPSHOTS_LS_KEY,
  NV75_AUTOSAVE_KEY,
  NV75_NAMED_SNAPSHOTS_KEY,
  ownedKeysForModule,
  PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY,
  PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY,
  PHMAX_SS_UNITS_STORAGE_KEY,
  PV_AUTOSAVE_KEY,
  PV_NAMED_SNAPSHOTS_KEY,
  RESTORE_APP_CONTEXT_KEY,
  RESTORE_IDENTITY_KEY,
  SD_AUTOSAVE_KEY,
  SD_NAMED_SNAPSHOTS_KEY,
  SCHOOL_PROFILE_LS_KEY,
  VYROCNI_ZPRAVA_LS_KEY,
  VYROCNI_ZPRAVA_PERSONNEL_LS_KEY,
  ZS_AUTOSAVE_KEY,
} from "./restore-owned-keys";
import type {
  BuildRestorePlanResult,
  RestoreConflict,
  RestoreEnvironment,
  RestoreModulePlanItem,
  RestorePlan,
  RestorePlanPlatform,
  RestoreStorageOperation,
  RestoreWarning,
  ValidatedBackupModule,
} from "./restore-types";

function setOp(
  moduleId: RestoreStorageOperation["moduleId"],
  key: string,
  value: unknown,
): RestoreStorageOperation {
  return {
    action: "set",
    storage: "localStorage",
    key,
    serializedValue: typeof value === "string" ? value : JSON.stringify(value),
    moduleId,
  };
}

function removeOp(
  moduleId: RestoreStorageOperation["moduleId"],
  key: string,
): RestoreStorageOperation {
  return { action: "remove", storage: "localStorage", key, moduleId };
}

function planCalculatorKeys(
  moduleId: "phmax-pv" | "phmax-sd" | "phmax-zs" | "phmax-nv75" | "phmax-ss",
  data: unknown,
  keys: { autosave: string; namedSnapshots: string; notes?: string },
): { operations: RestoreStorageOperation[]; keySemantics: RestoreModulePlanItem["keySemantics"] } {
  const record = data as Record<string, unknown>;
  const operations: RestoreStorageOperation[] = [];
  const keySemantics: RestoreModulePlanItem["keySemantics"] = [];

  if (record.autosave != null) {
    operations.push(setOp(moduleId, keys.autosave, record.autosave));
    keySemantics.push({ key: keys.autosave, effect: "set" });
  } else {
    operations.push(removeOp(moduleId, keys.autosave));
    keySemantics.push({ key: keys.autosave, effect: "remove" });
  }

  if (record.namedSnapshots != null) {
    operations.push(setOp(moduleId, keys.namedSnapshots, record.namedSnapshots));
    keySemantics.push({ key: keys.namedSnapshots, effect: "set" });
  } else {
    operations.push(removeOp(moduleId, keys.namedSnapshots));
    keySemantics.push({ key: keys.namedSnapshots, effect: "remove" });
  }

  if (keys.notes) {
    if (typeof record.notes === "string") {
      operations.push(setOp(moduleId, keys.notes, record.notes));
      keySemantics.push({ key: keys.notes, effect: "set" });
    } else {
      operations.push(removeOp(moduleId, keys.notes));
      keySemantics.push({ key: keys.notes, effect: "remove" });
    }
  }

  return { operations, keySemantics };
}

function planAnnualReport(
  data: unknown,
): { operations: RestoreStorageOperation[]; keySemantics: RestoreModulePlanItem["keySemantics"]; vzStartYear: number | null } {
  const record = data as Record<string, unknown>;
  const operations: RestoreStorageOperation[] = [];
  const keySemantics: RestoreModulePlanItem["keySemantics"] = [];
  let vzStartYear: number | null = null;

  if (record.main != null) {
    operations.push(setOp("annual-report", VYROCNI_ZPRAVA_LS_KEY, record.main));
    keySemantics.push({ key: VYROCNI_ZPRAVA_LS_KEY, effect: "set" });
    const schoolYear = (record.main as { report?: { schoolYear?: unknown } }).report?.schoolYear;
    if (typeof schoolYear === "string") {
      vzStartYear = parseSchoolYearLabel(schoolYear);
    }
  } else {
    operations.push(removeOp("annual-report", VYROCNI_ZPRAVA_LS_KEY));
    keySemantics.push({ key: VYROCNI_ZPRAVA_LS_KEY, effect: "remove" });
  }

  if (record.personnel != null) {
    operations.push(setOp("annual-report", VYROCNI_ZPRAVA_PERSONNEL_LS_KEY, record.personnel));
    keySemantics.push({ key: VYROCNI_ZPRAVA_PERSONNEL_LS_KEY, effect: "set" });
  } else {
    operations.push(removeOp("annual-report", VYROCNI_ZPRAVA_PERSONNEL_LS_KEY));
    keySemantics.push({ key: VYROCNI_ZPRAVA_PERSONNEL_LS_KEY, effect: "remove" });
  }

  const sections = isRecord(record.sections) ? record.sections : {};
  for (const [sectionId, key] of Object.entries(ANNUAL_REPORT_SECTION_KEYS)) {
    if (sections[sectionId] != null) {
      operations.push(setOp("annual-report", key, sections[sectionId]));
      keySemantics.push({ key, effect: "set" });
    } else {
      operations.push(removeOp("annual-report", key));
      keySemantics.push({ key, effect: "remove" });
    }
  }

  return { operations, keySemantics, vzStartYear };
}

function planPresentValidModule(
  module: Extract<ValidatedBackupModule, { status: "present_valid" }>,
  scenarioShadowPlan: ScenarioLabelRestoreShadowPlan | null,
): {
  operations: RestoreStorageOperation[];
  item: RestoreModulePlanItem;
  vzStartYear: number | null;
  expectedScenarioLabelTarget: ScenarioLabelMigrationTarget | null;
} {
  const { moduleId, data, label } = module;

  if (moduleId === "school-profile") {
    return {
      operations: [setOp(moduleId, SCHOOL_PROFILE_LS_KEY, data)],
      item: {
        moduleId,
        label,
        kind: "present_valid",
        keySemantics: [{ key: SCHOOL_PROFILE_LS_KEY, effect: "set" }],
      },
      vzStartYear: null,
      expectedScenarioLabelTarget: null,
    };
  }

  if (moduleId === "identity-registry") {
    return {
      operations: [setOp(moduleId, RESTORE_IDENTITY_KEY, data)],
      item: {
        moduleId,
        label,
        kind: "present_valid",
        keySemantics: [{ key: RESTORE_IDENTITY_KEY, effect: "set" }],
      },
      vzStartYear: null,
      expectedScenarioLabelTarget: null,
    };
  }

  if (moduleId === "annual-report") {
    const planned = planAnnualReport(data);
    return {
      operations: planned.operations,
      item: {
        moduleId,
        label,
        kind: "present_valid",
        keySemantics: planned.keySemantics,
      },
      vzStartYear: planned.vzStartYear,
      expectedScenarioLabelTarget: null,
    };
  }

  if (moduleId === "phmax-scenario-label") {
    const shadowPlan =
      scenarioShadowPlan ??
      resolveScenarioLabelRestoreShadowPlan({
        backupIdentity: null,
        identityModuleStatus: "missing",
        backupProfileId: null,
      });
    const planned = buildScenarioLabelRestorePhysicalOps(String(data), shadowPlan);
    return {
      operations: planned.operations.map((op) =>
        op.action === "set"
          ? setOp(moduleId, op.key, op.serializedValue)
          : removeOp(moduleId, op.key),
      ),
      item: {
        moduleId,
        label,
        kind: "present_valid",
        keySemantics: planned.keySemantics,
      },
      vzStartYear: null,
      expectedScenarioLabelTarget: planned.expectedTarget,
    };
  }

  const calculatorKeys =
    moduleId === "phmax-pv"
      ? { autosave: PV_AUTOSAVE_KEY, namedSnapshots: PV_NAMED_SNAPSHOTS_KEY }
      : moduleId === "phmax-sd"
        ? { autosave: SD_AUTOSAVE_KEY, namedSnapshots: SD_NAMED_SNAPSHOTS_KEY }
        : moduleId === "phmax-zs"
          ? { autosave: ZS_AUTOSAVE_KEY, namedSnapshots: NAMED_SNAPSHOTS_LS_KEY }
          : moduleId === "phmax-nv75"
            ? { autosave: NV75_AUTOSAVE_KEY, namedSnapshots: NV75_NAMED_SNAPSHOTS_KEY }
            : {
                autosave: PHMAX_SS_UNITS_STORAGE_KEY,
                namedSnapshots: PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY,
                notes: PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY,
              };

  const planned = planCalculatorKeys(moduleId, data, calculatorKeys);
  return {
    operations: planned.operations,
    item: {
      moduleId,
      label,
      kind: "present_valid",
      keySemantics: planned.keySemantics,
    },
    vzStartYear: null,
    expectedScenarioLabelTarget: null,
  };
}

function classifyConflict(params: {
  env: RestoreEnvironment;
  backupIdentity: IdentityRegistry | null;
  identityModuleStatus: "missing" | "present_valid" | "present_invalid";
  hasSchoolProfile: boolean;
}): {
  conflict: RestoreConflict | null;
  sameSchool: boolean | null;
  requiresIdentityBootstrap: boolean;
  identityConflictBlocks: boolean;
} {
  const { env, backupIdentity, identityModuleStatus, hasSchoolProfile } = params;

  if (env.identity.status === "storage_unavailable" || env.profile.status === "storage_unavailable") {
    return {
      conflict: { kind: "local_storage_unavailable" },
      sameSchool: null,
      requiresIdentityBootstrap: false,
      identityConflictBlocks: true,
    };
  }

  // Fail-closed: corrupted local Identity has no reliable same-school proof.
  // Trusted recovery is a future explicit product flow, not Restore-1 auto-apply.
  if (env.identity.status === "corrupted") {
    return {
      conflict: {
        kind: "local_identity_corrupted",
        recoverableWithTrustedRestore: false,
      },
      sameSchool: null,
      requiresIdentityBootstrap: false,
      identityConflictBlocks: true,
    };
  }

  if (identityModuleStatus === "present_invalid") {
    return {
      conflict: { kind: "backup_identity_invalid" },
      sameSchool: null,
      requiresIdentityBootstrap: false,
      identityConflictBlocks: true,
    };
  }

  if (identityModuleStatus === "present_valid" && backupIdentity) {
    if (env.identity.status === "missing") {
      return {
        conflict: null,
        sameSchool: null,
        requiresIdentityBootstrap: false,
        identityConflictBlocks: false,
      };
    }
    if (env.identity.status === "valid") {
      if (env.identity.schoolId === backupIdentity.schoolId) {
        return {
          conflict: null,
          sameSchool: true,
          requiresIdentityBootstrap: false,
          identityConflictBlocks: false,
        };
      }
      return {
        conflict: {
          kind: "cross_school",
          localSchoolId: env.identity.schoolId ?? "",
          backupSchoolId: backupIdentity.schoolId,
        },
        sameSchool: false,
        requiresIdentityBootstrap: false,
        identityConflictBlocks: true,
      };
    }
  }

  // Legacy: identity module missing
  if (env.identity.status === "valid") {
    return {
      conflict: { kind: "legacy_identity_unverifiable" },
      sameSchool: null,
      requiresIdentityBootstrap: false,
      identityConflictBlocks: true,
    };
  }

  // Local identity missing — legacy restore.
  // Bootstrap Identity only when backup carries a SchoolProfile to derive it from.
  return {
    conflict: null,
    sameSchool: null,
    requiresIdentityBootstrap: hasSchoolProfile,
    identityConflictBlocks: false,
  };
}

/**
 * Build a read-only RestorePlan from a validated backup + explicit local environment.
 * Pure — never writes storage.
 */
export function buildAppBackupRestorePlan(
  validated: Extract<ReturnType<typeof validateAppBackupEnvelope>, { status: "validated" }>,
  env: RestoreEnvironment,
): RestorePlan {
  const operations: RestoreStorageOperation[] = [];
  const modules: RestoreModulePlanItem[] = [];
  const warnings: RestoreWarning[] = [];
  let vzStartYear: number | null = null;
  let hasSchoolProfile = false;
  let backupProfileId: string | null = null;
  let backupIdentity: IdentityRegistry | null = null;
  let identityModuleStatus: "missing" | "present_valid" | "present_invalid" = "missing";
  let missingKnownCount = 0;
  const invalidModuleIds: string[] = [];
  let expectedScenarioLabelTarget: ScenarioLabelMigrationTarget | null = null;

  for (const module of validated.modules) {
    if (module.status === "missing") {
      missingKnownCount += 1;
      modules.push({
        moduleId: module.moduleId,
        label: module.label,
        kind: "missing_preserve",
        keySemantics: ownedKeysForModule(module.moduleId).map((key) => ({
          key,
          effect: "preserve",
        })),
      });
      continue;
    }

    if (module.status === "unknown") {
      warnings.push({
        code: "unknown_module",
        message: module.warning,
        moduleId: module.moduleId,
      });
      modules.push({
        moduleId: module.moduleId,
        label: module.label ?? module.moduleId,
        kind: "unknown_warning",
        keySemantics: [],
        reason: module.warning,
      });
      continue;
    }

    if (module.status === "present_invalid") {
      invalidModuleIds.push(module.moduleId);
      if (module.moduleId === "identity-registry") {
        identityModuleStatus = "present_invalid";
      }
      modules.push({
        moduleId: module.moduleId,
        label: module.label,
        kind: "present_invalid",
        keySemantics: ownedKeysForModule(module.moduleId).map((key) => ({
          key,
          effect: "preserve",
        })),
        reason: module.reason,
      });
      continue;
    }

    // present_valid
    if (module.moduleId === "school-profile") {
      hasSchoolProfile = true;
      const profileData = module.data;
      if (isRecord(profileData) && typeof profileData.id === "string") {
        backupProfileId = profileData.id;
      }
    }
    if (module.moduleId === "identity-registry") {
      identityModuleStatus = "present_valid";
      backupIdentity = module.data as IdentityRegistry;
    }

    const scenarioShadowPlan =
      module.moduleId === "phmax-scenario-label"
        ? resolveScenarioLabelRestoreShadowPlan({
            backupIdentity,
            identityModuleStatus,
            backupProfileId,
          })
        : null;

    const planned = planPresentValidModule(module, scenarioShadowPlan);
    operations.push(...planned.operations);
    modules.push(planned.item);
    if (planned.vzStartYear != null) vzStartYear = planned.vzStartYear;
    if (planned.expectedScenarioLabelTarget != null) {
      expectedScenarioLabelTarget = planned.expectedScenarioLabelTarget;
    }
  }

  if (missingKnownCount > 0) {
    warnings.push({
      code: "partial_backup",
      message: "Záloha neobsahuje všechny známé moduly. Chybějící moduly zůstanou v prohlížeči beze změny.",
    });
  }

  const classification = classifyConflict({
    env,
    backupIdentity,
    identityModuleStatus,
    hasSchoolProfile,
  });

  let conflict: RestoreConflict | null = classification.conflict;
  if (invalidModuleIds.length > 0 && conflict == null) {
    conflict = { kind: "known_module_invalid", moduleIds: invalidModuleIds };
  } else if (invalidModuleIds.length > 0 && conflict?.kind !== "backup_identity_invalid") {
    // Keep primary identity conflict; module invalidity still blocks via canApply.
    if (conflict == null) {
      conflict = { kind: "known_module_invalid", moduleIds: invalidModuleIds };
    }
  }

  const touchesPlatformData =
    operations.some((op) =>
      ["school-profile", "identity-registry", "annual-report"].includes(op.moduleId),
    ) || classification.requiresIdentityBootstrap;

  const platform: RestorePlanPlatform = {
    requiresAppContextReset: touchesPlatformData,
    requiresIdentityBootstrap: classification.requiresIdentityBootstrap,
    requiresPlatformReconcile: touchesPlatformData || classification.requiresIdentityBootstrap,
    requiresVzSchoolYearReconcile: vzStartYear != null,
  };

  const blockedByModules = invalidModuleIds.length > 0;
  const finalCanApply =
    !blockedByModules && !classification.identityConflictBlocks && conflict == null;

  const finalOperations = finalCanApply ? operations : [];
  const finalExpectedScenarioLabelTarget = finalCanApply ? expectedScenarioLabelTarget : null;

  // touchedKeys ⊇ operation keys ∪ keys mutable by post-restore platform side effects.
  // Only meaningful for apply-ready plans (blocked plans keep operations=[]).
  const touched = new Set<string>();
  for (const op of finalOperations) touched.add(op.key);
  if (finalCanApply) {
    if (platform.requiresAppContextReset) touched.add(RESTORE_APP_CONTEXT_KEY);
    if (platform.requiresIdentityBootstrap) {
      touched.add(RESTORE_IDENTITY_KEY);
      touched.add(RESTORE_APP_CONTEXT_KEY);
    }
    if (platform.requiresPlatformReconcile) {
      touched.add(RESTORE_IDENTITY_KEY);
      touched.add(RESTORE_APP_CONTEXT_KEY);
    }
    if (platform.requiresVzSchoolYearReconcile) {
      touched.add(RESTORE_IDENTITY_KEY);
      touched.add(RESTORE_APP_CONTEXT_KEY);
    }
  }

  return {
    envelope: {
      schemaVersion: validated.envelope.schemaVersion,
      exportedAt: validated.envelope.exportedAt,
      ...(validated.envelope.appVersion !== undefined
        ? { appVersion: validated.envelope.appVersion }
        : {}),
    },
    modules,
    operations: finalOperations,
    warnings,
    conflict,
    platform,
    touchedKeys: [...touched].sort(),
    sameSchool: classification.sameSchool,
    canApply: finalCanApply,
    expectedScenarioLabelTarget: finalExpectedScenarioLabelTarget,
  };
}

/**
 * Convenience: parse → validate → plan with provided (or empty) environment.
 * Still NO WRITES.
 */
export function planAppBackupRestore(
  input: string | unknown,
  env: RestoreEnvironment,
): BuildRestorePlanResult {
  const validated = validateAppBackupEnvelope(input);
  if (validated.status !== "validated") {
    return validated;
  }
  return {
    status: "planned",
    plan: buildAppBackupRestorePlan(validated, env),
  };
}
