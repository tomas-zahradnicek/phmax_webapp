import {
  APP_BACKUP_FORMAT,
  APP_BACKUP_SCHEMA_VERSION,
  type AppBackupEnvelope,
} from "../backup-types";
import type { ScenarioLabelMigrationTarget } from "../../data/storage/scenario-label-migration/scenario-label-migration-types";

export { APP_BACKUP_FORMAT, APP_BACKUP_SCHEMA_VERSION };

/** Known central-backup module ids (Restore-1). */
export const RESTORE_KNOWN_MODULE_IDS = [
  "school-profile",
  "identity-registry",
  "annual-report",
  "phmax-pv",
  "phmax-sd",
  "phmax-zs",
  "phmax-ss",
  "phmax-nv75",
  "phmax-scenario-label",
] as const;

export type RestoreKnownModuleId = (typeof RESTORE_KNOWN_MODULE_IDS)[number];

export type ParseAppBackupResult =
  | { status: "invalid_json" }
  | { status: "invalid_envelope"; reason: string }
  | { status: "unsupported_schema"; schemaVersion: unknown }
  | { status: "parsed"; envelope: AppBackupEnvelope };

export type ValidatedBackupModule =
  | {
      status: "present_valid";
      moduleId: RestoreKnownModuleId;
      label: string;
      schemaVersion: number;
      exportedAt: string;
      /** Validated payload ready for future apply (not written in Restore-1). */
      data: unknown;
    }
  | {
      status: "present_invalid";
      moduleId: RestoreKnownModuleId;
      label: string;
      reason: string;
    }
  | {
      status: "missing";
      moduleId: RestoreKnownModuleId;
      label: string;
    }
  | {
      status: "unknown";
      moduleId: string;
      label?: string;
      warning: string;
    };

export type ValidateAppBackupResult =
  | { status: "invalid_json" }
  | { status: "invalid_envelope"; reason: string }
  | { status: "unsupported_schema"; schemaVersion: unknown }
  | {
      status: "validated";
      envelope: Pick<AppBackupEnvelope, "format" | "schemaVersion" | "exportedAt" | "appVersion">;
      modules: ValidatedBackupModule[];
      hasInvalidKnownModule: boolean;
    };

export type LocalEntityState =
  | { status: "missing" }
  | { status: "valid"; schoolId?: string }
  | { status: "corrupted" }
  | { status: "storage_unavailable" };

export type RestoreEnvironment = {
  identity: LocalEntityState;
  profile: LocalEntityState;
};

export type RestoreStorageOperation =
  | {
      action: "set";
      storage: "localStorage";
      key: string;
      serializedValue: string;
      moduleId: RestoreKnownModuleId;
    }
  | {
      action: "remove";
      storage: "localStorage";
      key: string;
      moduleId: RestoreKnownModuleId;
    };

export type RestoreModulePlanItem = {
  moduleId: string;
  label: string;
  kind:
    | "present_valid"
    | "present_invalid"
    | "missing_preserve"
    | "unknown_warning";
  /** Human/test-facing key semantics for this module. */
  keySemantics: Array<{
    key: string;
    effect: "set" | "remove" | "preserve";
  }>;
  reason?: string;
};

export type RestoreWarning = {
  code: "unknown_module" | "partial_backup" | "info";
  message: string;
  moduleId?: string;
};

export type RestoreConflict =
  | { kind: "cross_school"; localSchoolId: string; backupSchoolId: string }
  | { kind: "legacy_identity_unverifiable" }
  | { kind: "local_identity_corrupted"; recoverableWithTrustedRestore: boolean }
  | { kind: "local_storage_unavailable" }
  | { kind: "backup_identity_invalid" }
  | { kind: "known_module_invalid"; moduleIds: string[] };

export type RestorePlanPlatform = {
  requiresAppContextReset: boolean;
  requiresIdentityBootstrap: boolean;
  requiresPlatformReconcile: boolean;
  requiresVzSchoolYearReconcile: boolean;
};

export type RestorePlan = {
  envelope: {
    schemaVersion: typeof APP_BACKUP_SCHEMA_VERSION;
    exportedAt: string;
    appVersion?: string;
  };
  modules: RestoreModulePlanItem[];
  operations: RestoreStorageOperation[];
  warnings: RestoreWarning[];
  conflict: RestoreConflict | null;
  platform: RestorePlanPlatform;
  touchedKeys: string[];
  sameSchool: boolean | null;
  canApply: boolean;
  /**
   * Expected physical scenario-label v2/marker target for this plan.
   * Null when no dynamic scenario keys are allowed (missing module, legacy-only, blocked).
   */
  expectedScenarioLabelTarget: ScenarioLabelMigrationTarget | null;
};

export type BuildRestorePlanResult =
  | Exclude<ValidateAppBackupResult, { status: "validated" }>
  | { status: "planned"; plan: RestorePlan };

/** Validated central-backup envelope ready for restore planning / apply. */
export type ValidatedAppBackupEnvelope = Extract<
  ValidateAppBackupResult,
  { status: "validated" }
>;
