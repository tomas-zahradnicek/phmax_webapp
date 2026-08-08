import { SCHOOL_PROFILE_LS_KEY } from "./school-profile-constants";
import { createDefaultSchoolProfile, normalizeSchoolProfile } from "./school-profile-logic";
import type { SchoolProfile } from "./school-profile-types";

export { SCHOOL_PROFILE_LS_KEY };

/**
 * Truthful SchoolProfile persistence result (0F-2A).
 * Success = setItem completed without throwing. No read-back verification.
 */
export type SchoolProfileStorageSaveResult =
  | { ok: true }
  | { ok: false; reason: "storage_unavailable" };

/** Safe access — `globalThis.localStorage` getter may throw (e.g. SecurityError). */
function resolveLocalStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    if (storage == null) return null;
    return storage;
  } catch {
    return null;
  }
}

export function loadSchoolProfileFromStorage(): SchoolProfile {
  const storage = resolveLocalStorage();
  if (!storage) {
    return createDefaultSchoolProfile();
  }

  try {
    const raw = storage.getItem(SCHOOL_PROFILE_LS_KEY);
    if (!raw) return createDefaultSchoolProfile();
    const parsed: unknown = JSON.parse(raw);
    return normalizeSchoolProfile(parsed) ?? createDefaultSchoolProfile();
  } catch {
    return createDefaultSchoolProfile();
  }
}

/**
 * Persist SchoolProfile. Maps all storage / stringify failures to storage_unavailable.
 * Does not throw DOMExceptions to callers.
 */
export function saveSchoolProfileToStorage(profile: SchoolProfile): SchoolProfileStorageSaveResult {
  const storage = resolveLocalStorage();
  if (!storage) {
    return { ok: false, reason: "storage_unavailable" };
  }

  try {
    const serialized = JSON.stringify(profile);
    storage.setItem(SCHOOL_PROFILE_LS_KEY, serialized);
    return { ok: true };
  } catch {
    return { ok: false, reason: "storage_unavailable" };
  }
}

export function clearSchoolProfileStorage(): void {
  const storage = resolveLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(SCHOOL_PROFILE_LS_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * One-shot migration of a profile embedded in an older AnnualReport payload.
 *
 * Returns normalized profile only when it was successfully written to storage.
 * Persist failure → null (in-memory candidate is not claimed as migrated).
 * Caller must reload from storage; do not treat a prior non-null return as persistence proof.
 */
export function migrateLegacySchoolProfileIfNeeded(legacy: unknown): SchoolProfile | null {
  const normalized = normalizeSchoolProfile(legacy);
  if (!normalized) return null;

  const current = loadSchoolProfileFromStorage();
  const currentEmpty = !current.name.trim() && !current.ico.trim() && !current.redIzo.trim();
  if (!currentEmpty) return null;

  const persisted = saveSchoolProfileToStorage(normalized);
  if (!persisted.ok) return null;

  return normalized;
}
