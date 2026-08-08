import { readLegacySchoolProfile } from "../data/legacy/legacy-school-profile";
import { SCHOOL_PROFILE_LS_KEY } from "./school-profile-constants";
import { createDefaultSchoolProfile, normalizeSchoolProfile } from "./school-profile-logic";
import type { SchoolProfile } from "./school-profile-types";

export { SCHOOL_PROFILE_LS_KEY };

/**
 * Truthful SchoolProfile persistence result (0F-2A / 0F-3A).
 * Success = setItem completed without throwing. No read-back verification.
 *
 * `profile_corrupted` = data-safety rejection (storage may work; overwrite blocked).
 * Distinct from `storage_unavailable`.
 */
export type SchoolProfileStorageSaveResult =
  | { ok: true }
  | { ok: false; reason: "storage_unavailable" | "profile_corrupted" };

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
 * Low-level persist primitive. Does not apply corruption write guard.
 * Production writers must use {@link persistSchoolProfileToStorage}.
 * Left open for a future explicit recovery API (0F-3B+) that may overwrite
 * corrupted bytes after a conscious user action / Full Reset path.
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

/**
 * Production SchoolProfile write orchestration (0F-3A).
 *
 * Uses canonical {@link readLegacySchoolProfile} (no duplicated JSON validation):
 * - missing → first write allowed
 * - valid → normal update allowed
 * - corrupted → reject; raw bytes unchanged
 * - storage unavailable → reject as storage_unavailable
 */
export function persistSchoolProfileToStorage(
  profile: SchoolProfile,
): SchoolProfileStorageSaveResult {
  const existing = readLegacySchoolProfile();
  if (!existing.ok) {
    if (existing.code === "corrupted") {
      return { ok: false, reason: "profile_corrupted" };
    }
    return { ok: false, reason: "storage_unavailable" };
  }
  return saveSchoolProfileToStorage(profile);
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
 *
 * 0F-3A: never overwrites a persisted profile that the canonical reader treats as corrupted.
 */
export function migrateLegacySchoolProfileIfNeeded(legacy: unknown): SchoolProfile | null {
  const normalized = normalizeSchoolProfile(legacy);
  if (!normalized) return null;

  const existing = readLegacySchoolProfile();
  if (!existing.ok) {
    // corrupted / storage_unavailable — do not overwrite or claim migration
    return null;
  }

  if (existing.profile != null) {
    const current = existing.profile;
    const currentEmpty = !current.name.trim() && !current.ico.trim() && !current.redIzo.trim();
    if (!currentEmpty) return null;
  }

  const persisted = persistSchoolProfileToStorage(normalized);
  if (!persisted.ok) return null;

  return normalized;
}
