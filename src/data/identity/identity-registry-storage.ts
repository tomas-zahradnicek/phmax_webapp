import {
  IDENTITY_REGISTRY_LS_KEY,
  IDENTITY_REGISTRY_SCHEMA_VERSION,
  type IdentityRegistry,
  type IdentityRegistryReadResult,
  type IdentityRegistryWriteResult,
  type SchoolYearIdentityEntry,
} from "./identity-registry-types";
import { isUuid, normalizeUuid } from "./identity-uuid";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSchoolYearEntry(value: unknown): SchoolYearIdentityEntry | null {
  if (!isRecord(value)) return null;
  if (!isUuid(value.id) || !isUuid(value.schoolId)) return null;
  if (typeof value.startYear !== "number" || !Number.isInteger(value.startYear)) return null;
  return {
    id: normalizeUuid(value.id),
    schoolId: normalizeUuid(value.schoolId),
    startYear: value.startYear,
  };
}

function hasUniqueSchoolYears(entries: readonly SchoolYearIdentityEntry[]): boolean {
  const pairKeys = new Set<string>();
  const ids = new Set<string>();
  for (const entry of entries) {
    const pairKey = `${entry.schoolId}:${entry.startYear}`;
    if (pairKeys.has(pairKey)) return false;
    if (ids.has(entry.id)) return false;
    pairKeys.add(pairKey);
    ids.add(entry.id);
  }
  return true;
}

/** Validate and normalize a persisted registry document. Returns null if shape is invalid. */
export function parseIdentityRegistry(value: unknown): IdentityRegistry | null {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== IDENTITY_REGISTRY_SCHEMA_VERSION) return null;
  if (!isUuid(value.schoolId)) return null;
  if (!Array.isArray(value.schoolYears)) return null;
  if (typeof value.updatedAt !== "string" || !value.updatedAt.trim()) return null;

  const schoolId = normalizeUuid(value.schoolId);
  const schoolYears: SchoolYearIdentityEntry[] = [];
  for (const item of value.schoolYears) {
    const entry = parseSchoolYearEntry(item);
    if (!entry) return null;
    // Schema v1: single school — every year entry must match root schoolId.
    if (entry.schoolId !== schoolId) return null;
    schoolYears.push(entry);
  }

  if (!hasUniqueSchoolYears(schoolYears)) return null;

  return {
    schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
    schoolId,
    schoolYears,
    updatedAt: value.updatedAt,
  };
}

/**
 * Read the identity registry from localStorage.
 * Missing/empty key → ok with registry null.
 * Invalid JSON or invalid shape → corrupted (does NOT write / clear the key).
 */
export function readIdentityRegistry(): IdentityRegistryReadResult {
  if (typeof localStorage === "undefined") {
    return { ok: false, code: "storage_unavailable" };
  }

  let raw: string | null;
  try {
    raw = localStorage.getItem(IDENTITY_REGISTRY_LS_KEY);
  } catch {
    return { ok: false, code: "storage_unavailable" };
  }

  if (raw == null || raw.trim() === "") {
    return { ok: true, registry: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, code: "corrupted", detail: "invalid_json" };
  }

  const registry = parseIdentityRegistry(parsed);
  if (!registry) {
    return { ok: false, code: "corrupted", detail: "invalid_shape" };
  }

  return { ok: true, registry };
}

/**
 * Persist a valid identity registry.
 * Refuses to write when the existing key is corrupted (protects against silent overwrite).
 */
export function writeIdentityRegistry(registry: IdentityRegistry): IdentityRegistryWriteResult {
  if (typeof localStorage === "undefined") {
    return { ok: false, code: "storage_unavailable" };
  }

  const existing = readIdentityRegistry();
  if (!existing.ok && existing.code === "corrupted") {
    return { ok: false, code: "corrupted_blocked" };
  }
  if (!existing.ok && existing.code === "storage_unavailable") {
    return { ok: false, code: "storage_unavailable" };
  }

  const normalized = parseIdentityRegistry(registry);
  if (!normalized) {
    return { ok: false, code: "corrupted_blocked" };
  }

  try {
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, JSON.stringify(normalized));
    return { ok: true };
  } catch {
    return { ok: false, code: "storage_unavailable" };
  }
}

export { IDENTITY_REGISTRY_LS_KEY };
