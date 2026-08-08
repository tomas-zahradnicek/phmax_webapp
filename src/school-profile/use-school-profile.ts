import { useCallback, useSyncExternalStore } from "react";
import {
  applySchoolProfileEdits,
  createDefaultSchoolProfile,
  detectMissingSchoolProfileFields,
  hasAnySchoolProfileData,
  patchSchoolProfile,
  resetSchoolProfileFields,
} from "./school-profile-logic";
import {
  identityBlockReasonForStatus,
  identitySensitiveLockMode,
  readIdentityRegistryPresence,
  type SchoolProfileIdentityBlockReason,
} from "./school-profile-identity-policy";
import {
  loadSchoolProfileFromStorage,
  persistSchoolProfileToStorage,
  type SchoolProfileStorageSaveResult,
} from "./school-profile-storage";
import type { SchoolProfile } from "./school-profile-types";

type SchoolProfileListener = () => void;

export type SaveSchoolProfileResult = {
  identityChangeBlocked: boolean;
  identityBlockReason: SchoolProfileIdentityBlockReason | null;
  /**
   * Truthful storage outcome — binding (0F-2B) may run only when persistence.ok.
   * `profile_corrupted` (0F-3A) rejects overwrite; no cache/emit/binding.
   */
  persistence: SchoolProfileStorageSaveResult;
};

let cachedProfile = loadSchoolProfileFromStorage();
const listeners = new Set<SchoolProfileListener>();

function emitSchoolProfileChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeSchoolProfile(listener: SchoolProfileListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Last shared profile snapshot (successful persist or explicit cache-only replace). */
export function getSchoolProfileSnapshot(): SchoolProfile {
  return cachedProfile;
}

/**
 * Update shared school-profile state.
 *
 * persist=true (Save / Reset / updateProfile):
 *   persist-first via {@link persistSchoolProfileToStorage} (0F-3A corruption guard)
 *   → cache+emit only when storage write succeeds.
 *
 * persist=false:
 *   cache-only (test / non-user paths). Not a storage persist success for Save/Reset.
 */
export function replaceSchoolProfileState(
  profile: SchoolProfile,
  persist = true,
): SchoolProfileStorageSaveResult {
  if (!persist) {
    cachedProfile = profile;
    emitSchoolProfileChange();
    return { ok: true };
  }

  const result = persistSchoolProfileToStorage(profile);
  if (!result.ok) {
    return result;
  }

  cachedProfile = profile;
  emitSchoolProfileChange();
  return { ok: true };
}

function applyGuardedProfileEdits(nextProfile: SchoolProfile): ApplyGuardedResult {
  const status = readIdentityRegistryPresence();
  const lockMode = identitySensitiveLockMode(status);
  const { profile, identityChangeBlocked } = applySchoolProfileEdits(cachedProfile, nextProfile, {
    identityLockMode: lockMode,
  });
  const identityBlockReason =
    identityChangeBlocked ? identityBlockReasonForStatus(status) : null;
  return { profile, identityChangeBlocked, identityBlockReason };
}

type ApplyGuardedResult = {
  profile: SchoolProfile;
  identityChangeBlocked: boolean;
  identityBlockReason: SchoolProfileIdentityBlockReason | null;
};

export function useSchoolProfile() {
  const profile = useSyncExternalStore(
    subscribeSchoolProfile,
    getSchoolProfileSnapshot,
    () => createDefaultSchoolProfile(),
  );

  const updateProfile = useCallback((patch: Partial<SchoolProfile>): SaveSchoolProfileResult => {
    const patched = patchSchoolProfile(cachedProfile, patch);
    const { profile: next, identityChangeBlocked, identityBlockReason } =
      applyGuardedProfileEdits(patched);
    const persistence = replaceSchoolProfileState(next);
    return { identityChangeBlocked, identityBlockReason, persistence };
  }, []);

  const saveProfile = useCallback((nextProfile: SchoolProfile): SaveSchoolProfileResult => {
    const { profile: next, identityChangeBlocked, identityBlockReason } =
      applyGuardedProfileEdits(nextProfile);
    const persistence = replaceSchoolProfileState(next);
    return { identityChangeBlocked, identityBlockReason, persistence };
  }, []);

  /** Reset Profile Fields — stejná School; nemaže Identity / AppContext / business data. */
  const resetProfile = useCallback((): SaveSchoolProfileResult => {
    const cleared = resetSchoolProfileFields(cachedProfile);
    const persistence = replaceSchoolProfileState(cleared);
    return {
      identityChangeBlocked: false,
      identityBlockReason: null,
      persistence,
    };
  }, []);

  const missingRequiredFields = detectMissingSchoolProfileFields(profile);
  const hasProfileData = hasAnySchoolProfileData(profile);

  return {
    profile,
    updateProfile,
    saveProfile,
    resetProfile,
    missingRequiredFields,
    hasProfileData,
    isProfileComplete: missingRequiredFields.length === 0,
  };
}
