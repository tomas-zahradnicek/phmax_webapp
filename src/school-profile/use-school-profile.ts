import { useCallback, useSyncExternalStore } from "react";
import {
  createDefaultSchoolProfile,
  detectMissingSchoolProfileFields,
  hasAnySchoolProfileData,
  patchSchoolProfile,
} from "./school-profile-logic";
import {
  clearSchoolProfileStorage,
  loadSchoolProfileFromStorage,
  saveSchoolProfileToStorage,
} from "./school-profile-storage";
import type { SchoolProfile } from "./school-profile-types";

type SchoolProfileListener = () => void;

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

export function useSchoolProfile() {
  const profile = useSyncExternalStore(
    subscribeSchoolProfile,
    getSchoolProfileSnapshot,
    () => createDefaultSchoolProfile(),
  );

  const updateProfile = useCallback((patch: Partial<SchoolProfile>) => {
    replaceSchoolProfileState(patchSchoolProfile(cachedProfile, patch));
  }, []);

  const saveProfile = useCallback((nextProfile: SchoolProfile) => {
    replaceSchoolProfileState({
      ...nextProfile,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const resetProfile = useCallback(() => {
    const fresh = createDefaultSchoolProfile();
    clearSchoolProfileStorage();
    replaceSchoolProfileState(fresh, false);
    saveSchoolProfileToStorage(fresh);
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
