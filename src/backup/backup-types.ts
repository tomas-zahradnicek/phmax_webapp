export const APP_BACKUP_FORMAT = "reditelsky-pruvodce-backup" as const;
export const APP_BACKUP_SCHEMA_VERSION = 1 as const;

export type AppBackupModulePayload = {
  label: string;
  schemaVersion?: number;
  exportedAt: string;
  data: unknown;
};

export type AppBackupEnvelope = {
  format: typeof APP_BACKUP_FORMAT;
  schemaVersion: typeof APP_BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  appVersion?: string;
  modules: Record<string, AppBackupModulePayload>;
};

export type BackupValidationResult =
  | { ok: true }
  | {
      ok: false;
      code: "invalid_json" | "invalid_shape" | "storage_unavailable" | "authority_blocked";
    };

export type BackupValidationFailure = Extract<BackupValidationResult, { ok: false }>;

export type BackupModuleReadResult =
  | { ok: true; hasData: boolean; data: unknown }
  | { ok: false; hasData: false; error: BackupValidationFailure };

export type BackupModuleAdapter = {
  id: string;
  label: string;
  schemaVersion?: number;
  storageKeys: readonly string[];
  read(): BackupModuleReadResult;
  validateForExport?(data: unknown): BackupValidationResult;
};

export type BackupModuleStatus = {
  id: string;
  label: string;
  hasData: boolean;
  error?: string;
};

export type BackupExportResult = {
  envelope: AppBackupEnvelope;
  moduleStatuses: BackupModuleStatus[];
  filename: string;
};

export type BackupDownloadResult =
  | { ok: true; filename: string }
  | { ok: false; reason: "storage_unavailable" | "no_modules" | "download_failed" };
