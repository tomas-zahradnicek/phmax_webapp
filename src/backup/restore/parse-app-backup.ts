import {
  APP_BACKUP_FORMAT,
  APP_BACKUP_SCHEMA_VERSION,
  type AppBackupEnvelope,
  type AppBackupModulePayload,
} from "../backup-types";
import { isRecord } from "../backup-validation";
import type { ParseAppBackupResult } from "./restore-types";

function isModulePayload(value: unknown): value is AppBackupModulePayload {
  if (!isRecord(value)) return false;
  if (typeof value.label !== "string" || value.label.trim() === "") return false;
  if (typeof value.exportedAt !== "string" || value.exportedAt.trim() === "") return false;
  if (value.schemaVersion !== undefined && typeof value.schemaVersion !== "number") return false;
  if (!("data" in value)) return false;
  return true;
}

/**
 * Syntactic parse of central backup text/unknown → envelope shape.
 * Does not validate module payloads (Restore-1 validate step).
 * Pure — no storage I/O.
 */
export function parseAppBackup(input: string | unknown): ParseAppBackupResult {
  let value: unknown;

  if (typeof input === "string") {
    try {
      value = JSON.parse(input) as unknown;
    } catch {
      return { status: "invalid_json" };
    }
  } else {
    value = input;
  }

  if (!isRecord(value)) {
    return { status: "invalid_envelope", reason: "root_not_object" };
  }

  if (value.format !== APP_BACKUP_FORMAT) {
    return { status: "invalid_envelope", reason: "wrong_format" };
  }

  if (value.schemaVersion !== APP_BACKUP_SCHEMA_VERSION) {
    return { status: "unsupported_schema", schemaVersion: value.schemaVersion };
  }

  if (typeof value.exportedAt !== "string" || value.exportedAt.trim() === "") {
    return { status: "invalid_envelope", reason: "missing_exported_at" };
  }

  if (value.appVersion !== undefined && typeof value.appVersion !== "string") {
    return { status: "invalid_envelope", reason: "invalid_app_version" };
  }

  if (!isRecord(value.modules)) {
    return { status: "invalid_envelope", reason: "modules_not_object" };
  }

  const modules: Record<string, AppBackupModulePayload> = {};
  for (const [moduleId, payload] of Object.entries(value.modules)) {
    if (!moduleId.trim()) {
      return { status: "invalid_envelope", reason: "empty_module_id" };
    }
    if (!isModulePayload(payload)) {
      return { status: "invalid_envelope", reason: `invalid_module_payload:${moduleId}` };
    }
    modules[moduleId] = {
      label: payload.label,
      schemaVersion: payload.schemaVersion,
      exportedAt: payload.exportedAt,
      data: payload.data,
    };
  }

  const envelope: AppBackupEnvelope = {
    format: APP_BACKUP_FORMAT,
    schemaVersion: APP_BACKUP_SCHEMA_VERSION,
    exportedAt: value.exportedAt,
    ...(value.appVersion !== undefined ? { appVersion: value.appVersion } : {}),
    modules,
  };

  return { status: "parsed", envelope };
}
