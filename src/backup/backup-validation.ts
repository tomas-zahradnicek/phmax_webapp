import { normalizeSchoolProfile } from "../school-profile/school-profile-logic";
import type { BackupValidationFailure, BackupValidationResult } from "./backup-types";

export function readLocalStorageJson(key: string): { ok: true; value: unknown } | { ok: false; error: BackupValidationFailure } {
  if (typeof localStorage === "undefined") {
    return { ok: false, error: { ok: false, code: "storage_unavailable" } };
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw.trim() === "") {
      return { ok: true, value: null };
    }
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, error: { ok: false, code: "invalid_json" } };
  }
}

export function readLocalStorageText(key: string): { ok: true; value: string | null } | { ok: false; error: BackupValidationFailure } {
  if (typeof localStorage === "undefined") {
    return { ok: false, error: { ok: false, code: "storage_unavailable" } };
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw.trim() === "") {
      return { ok: true, value: null };
    }
    return { ok: true, value: raw };
  } catch {
    return { ok: false, error: { ok: false, code: "storage_unavailable" } };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasMeaningfulValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isRecord(value)) return Object.keys(value).length > 0;
  return true;
}

export function validateSchoolProfileExport(data: unknown): BackupValidationResult {
  if (data == null) return { ok: true };
  const normalized = normalizeSchoolProfile(data);
  return normalized ? { ok: true } : { ok: false, code: "invalid_shape" };
}

export function validateAnnualReportMainExport(data: unknown): BackupValidationResult {
  if (data == null) return { ok: true };
  if (!isRecord(data)) return { ok: false, code: "invalid_shape" };
  if (data.version !== 1) return { ok: false, code: "invalid_shape" };
  if (!isRecord(data.report)) return { ok: false, code: "invalid_shape" };
  if (!Array.isArray(data.report.sections)) return { ok: false, code: "invalid_shape" };
  if (typeof data.selectedSectionId !== "string") return { ok: false, code: "invalid_shape" };
  return { ok: true };
}

export function validateNamedSnapshotsExport(data: unknown): BackupValidationResult {
  if (data == null) return { ok: true };
  if (!isRecord(data) || !Array.isArray(data.items)) return { ok: false, code: "invalid_shape" };
  return { ok: true };
}

export function validateScenarioLabelExport(data: unknown): BackupValidationResult {
  if (data == null) return { ok: true };
  if (typeof data !== "string") return { ok: false, code: "invalid_shape" };
  return { ok: true };
}

export function collectRecordValues(record: Record<string, unknown>): unknown[] {
  return Object.values(record).filter((value) => value != null);
}
