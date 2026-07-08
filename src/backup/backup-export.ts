import { APP_VERSION } from "../app-version";
import { downloadTextFile } from "../export-utils";
import { BACKUP_MODULE_ADAPTERS } from "./backup-registry";
import type {
  AppBackupEnvelope,
  BackupDownloadResult,
  BackupExportResult,
  BackupModuleStatus,
} from "./backup-types";
import { APP_BACKUP_FORMAT, APP_BACKUP_SCHEMA_VERSION } from "./backup-types";

export function buildAppBackupFilename(exportedAt: Date = new Date()): string {
  const stamp = `${exportedAt.getFullYear()}-${String(exportedAt.getMonth() + 1).padStart(2, "0")}-${String(exportedAt.getDate()).padStart(2, "0")}`;
  return `reditelsky-pruvodce-zaloha-${stamp}.json`;
}

export function buildAppBackupEnvelope(exportedAt: Date = new Date()): BackupExportResult {
  const exportedAtIso = exportedAt.toISOString();
  const modules: AppBackupEnvelope["modules"] = {};
  const moduleStatuses: BackupModuleStatus[] = [];

  for (const adapter of BACKUP_MODULE_ADAPTERS) {
    const readResult = adapter.read();
    if (!readResult.ok) {
      moduleStatuses.push({
        id: adapter.id,
        label: adapter.label,
        hasData: false,
        error: readResult.error.code,
      });
      continue;
    }

    moduleStatuses.push({
      id: adapter.id,
      label: adapter.label,
      hasData: readResult.hasData,
    });

    if (!readResult.hasData) continue;

    if (adapter.validateForExport) {
      const validation = adapter.validateForExport(readResult.data);
      if (!validation.ok) {
        const status = moduleStatuses.find((item) => item.id === adapter.id);
        if (status) {
          status.hasData = false;
          status.error = validation.code;
        }
        continue;
      }
    }

    modules[adapter.id] = {
      label: adapter.label,
      schemaVersion: adapter.schemaVersion,
      exportedAt: exportedAtIso,
      data: readResult.data,
    };
  }

  const envelope: AppBackupEnvelope = {
    format: APP_BACKUP_FORMAT,
    schemaVersion: APP_BACKUP_SCHEMA_VERSION,
    exportedAt: exportedAtIso,
    appVersion: APP_VERSION,
    modules,
  };

  return {
    envelope,
    moduleStatuses,
    filename: buildAppBackupFilename(exportedAt),
  };
}

export function serializeAppBackupEnvelope(envelope: AppBackupEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}

export function downloadAppBackup(envelope: AppBackupEnvelope, filename?: string): BackupDownloadResult {
  if (typeof localStorage === "undefined") {
    return { ok: false, reason: "storage_unavailable" };
  }
  const resolvedFilename = filename ?? buildAppBackupFilename(new Date(envelope.exportedAt));
  try {
    const content = serializeAppBackupEnvelope(envelope);
    downloadTextFile(resolvedFilename, content, "application/json;charset=utf-8");
    return { ok: true, filename: resolvedFilename };
  } catch {
    return { ok: false, reason: "download_failed" };
  }
}

export function exportAppBackup(): BackupDownloadResult {
  const { envelope, filename } = buildAppBackupEnvelope();
  return downloadAppBackup(envelope, filename);
}

export function previewBackupModuleStatuses(): BackupModuleStatus[] {
  return buildAppBackupEnvelope().moduleStatuses;
}
