import { isUuid, normalizeUuid } from "../identity/identity-uuid";
import {
  APP_CONTEXT_LS_KEY,
  APP_CONTEXT_SCHEMA_VERSION,
  type AppContext,
  type AppContextReadResult,
  type AppContextWriteResult,
} from "./app-context-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNullableEntityId(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (!isUuid(value)) return undefined;
  return normalizeUuid(value);
}

/**
 * Invariant: year pointer requires a school pointer.
 * `activeSchoolId === null && activeSchoolYearId !== null` is invalid.
 */
export function isValidAppContextPointers(
  activeSchoolId: string | null,
  activeSchoolYearId: string | null,
): boolean {
  return !(activeSchoolId == null && activeSchoolYearId != null);
}

/** Validate and normalize a persisted AppContext document. Returns null if shape is invalid. */
export function parseAppContext(value: unknown): AppContext | null {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== APP_CONTEXT_SCHEMA_VERSION) return null;

  const activeSchoolId = parseNullableEntityId(value.activeSchoolId);
  const activeSchoolYearId = parseNullableEntityId(value.activeSchoolYearId);
  if (activeSchoolId === undefined || activeSchoolYearId === undefined) return null;

  // No silent repair: orphan year without school is corrupted/invalid shape.
  if (!isValidAppContextPointers(activeSchoolId, activeSchoolYearId)) {
    return null;
  }

  return {
    schemaVersion: APP_CONTEXT_SCHEMA_VERSION,
    activeSchoolId,
    activeSchoolYearId,
  };
}

/**
 * Read AppContext from localStorage.
 * Missing/empty key → ok with context null.
 * Invalid JSON or invalid shape → corrupted (does NOT write / clear the key).
 */
export function readAppContext(): AppContextReadResult {
  if (typeof localStorage === "undefined") {
    return { ok: false, code: "storage_unavailable" };
  }

  let raw: string | null;
  try {
    raw = localStorage.getItem(APP_CONTEXT_LS_KEY);
  } catch {
    return { ok: false, code: "storage_unavailable" };
  }

  if (raw == null || raw.trim() === "") {
    return { ok: true, context: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, code: "corrupted", detail: "invalid_json" };
  }

  const context = parseAppContext(parsed);
  if (!context) {
    return { ok: false, code: "corrupted", detail: "invalid_shape" };
  }

  return { ok: true, context };
}

/**
 * Persist AppContext. Refuses to overwrite a corrupted existing value.
 * Refuses invalid pointer invariant (null school + non-null year) without writing.
 */
export function writeAppContext(context: AppContext): AppContextWriteResult {
  if (typeof localStorage === "undefined") {
    return { ok: false, code: "storage_unavailable" };
  }

  const existing = readAppContext();
  if (!existing.ok && existing.code === "corrupted") {
    return { ok: false, code: "corrupted_blocked" };
  }

  if (!isValidAppContextPointers(context.activeSchoolId, context.activeSchoolYearId)) {
    return { ok: false, code: "invalid_context" };
  }

  const normalized = parseAppContext(context);
  if (!normalized) {
    return { ok: false, code: "invalid_context" };
  }

  try {
    localStorage.setItem(APP_CONTEXT_LS_KEY, JSON.stringify(normalized));
    return { ok: true };
  } catch {
    return { ok: false, code: "storage_unavailable" };
  }
}

export { APP_CONTEXT_LS_KEY, APP_CONTEXT_SCHEMA_VERSION };
