import {
  clearAllApplicationStorage,
  type ClearAllApplicationStorageResult,
} from "./application-storage-registry";
import {
  buildAppBackupEnvelope,
  downloadAppBackup,
} from "./backup/backup-export";
import type {
  BackupDownloadResult,
  BackupExportResult,
} from "./backup/backup-types";

type BackupFailureReason =
  | Extract<BackupDownloadResult, { ok: false }>["reason"]
  | "build_failed";

export type FullResetBackupAttemptResult =
  | {
      status: "complete";
      filename: string;
    }
  | {
      status: "partial";
      filename: string;
      failedModules: number;
    }
  | {
      status: "error";
      reason: BackupFailureReason;
    };

export type FullResetBackupDependencies = {
  buildBackup: () => BackupExportResult;
  downloadBackup: (
    envelope: BackupExportResult["envelope"],
    filename: string,
  ) => BackupDownloadResult;
};

const DEFAULT_BACKUP_DEPENDENCIES: FullResetBackupDependencies = {
  buildBackup: () => buildAppBackupEnvelope(),
  downloadBackup: downloadAppBackup,
};

/**
 * Builds the backup exactly once and downloads that same evaluated envelope.
 */
export function downloadBackupBeforeFullReset(
  dependencies: FullResetBackupDependencies = DEFAULT_BACKUP_DEPENDENCIES,
): FullResetBackupAttemptResult {
  let backup: BackupExportResult;
  try {
    backup = dependencies.buildBackup();
  } catch {
    return { status: "error", reason: "build_failed" };
  }

  let download: BackupDownloadResult;
  try {
    download = dependencies.downloadBackup(backup.envelope, backup.filename);
  } catch {
    return { status: "error", reason: "download_failed" };
  }
  if (!download.ok) {
    return { status: "error", reason: download.reason };
  }

  const failedModules = backup.moduleStatuses.filter((module) => module.error != null).length;
  return failedModules > 0
    ? { status: "partial", filename: download.filename, failedModules }
    : { status: "complete", filename: download.filename };
}

export type FullResetExecutionDependencies = {
  clearStorage: () => ClearAllApplicationStorageResult;
  hardReload: () => void;
};

const DEFAULT_RESET_DEPENDENCIES: FullResetExecutionDependencies = {
  clearStorage: clearAllApplicationStorage,
  hardReload: () => window.location.reload(),
};

/**
 * Executes the synchronous dashboard-only reset.
 *
 * Completeness is decided exclusively by result.ok. On success hardReload is
 * called immediately, with no intervening business operation or async work.
 *
 * If this flow is ever exposed on a page with active autosave, those components
 * must first be unmounted or protected by an explicit reset-in-progress guard.
 */
export function executeFullApplicationReset(
  dependencies: FullResetExecutionDependencies = DEFAULT_RESET_DEPENDENCIES,
): ClearAllApplicationStorageResult {
  const result = dependencies.clearStorage();
  if (result.ok) {
    dependencies.hardReload();
  }
  return result;
}
