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
  saveSchoolProfileToStorage,
} from "./school-profile-storage";
import type { SchoolProfile } from "./school-profile-types";

type SchoolProfileListener = () => void;

export type SaveSchoolProfileResult = {
  identityChangeBlocked: boolean;
  identityBlockReason: SchoolProfileIdentityBlockReason | null;
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

function getSchoolProfileSnapshot(): SchoolProfile {
  return cachedProfile;
}

export function replaceSchoolProfileState(profile: SchoolProfile, persist = true): void {
  cachedProfile = profile;
  if (persist) saveSchoolProfileToStorage(profile);
  emitSchoolProfileChange();
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

  const updateProfile = useCallback((patch: Partial<SchoolProfile>) => {
    const patched = patchSchoolProfile(cachedProfile, patch);
    const { profile: next } = applyGuardedProfileEdits(patched);
    replaceSchoolProfileState(next);
  }, []);

  const saveProfile = useCallback((nextProfile: SchoolProfile): SaveSchoolProfileResult => {
    const { profile: next, identityChangeBlocked, identityBlockReason } =
      applyGuardedProfileEdits(nextProfile);
    replaceSchoolProfileState(next);
    return { identityChangeBlocked, identityBlockReason };
  }, []);

  /** Reset Profile Fields — stejná School; nemaže Identity / AppContext / business data. */
  const resetProfile = useCallback(() => {
    const cleared = resetSchoolProfileFields(cachedProfile);
    replaceSchoolProfileState(cleared);
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
