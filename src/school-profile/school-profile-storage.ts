import { SCHOOL_PROFILE_LS_KEY } from "./school-profile-constants";
import { createDefaultSchoolProfile, normalizeSchoolProfile } from "./school-profile-logic";
import type { SchoolProfile } from "./school-profile-types";

export { SCHOOL_PROFILE_LS_KEY };

export function loadSchoolProfileFromStorage(): SchoolProfile {
  if (typeof localStorage === "undefined") {
    return createDefaultSchoolProfile();
  }

  try {
    const raw = localStorage.getItem(SCHOOL_PROFILE_LS_KEY);
    if (!raw) return createDefaultSchoolProfile();
    const parsed: unknown = JSON.parse(raw);
    return normalizeSchoolProfile(parsed) ?? createDefaultSchoolProfile();
  } catch {
    return createDefaultSchoolProfile();
  }
}

export function saveSchoolProfileToStorage(profile: SchoolProfile): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(profile));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function clearSchoolProfileStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(SCHOOL_PROFILE_LS_KEY);
  } catch {
    /* ignore */
  }
}

/** Jednorázová migrace profilu z výroční zprávy (starší verze ukládala profil uvnitř reportu). */
export function migrateLegacySchoolProfileIfNeeded(legacy: unknown): SchoolProfile | null {
  const normalized = normalizeSchoolProfile(legacy);
  if (!normalized) return null;

  const current = loadSchoolProfileFromStorage();
  const currentEmpty = !current.name.trim() && !current.ico.trim() && !current.redIzo.trim();
  if (!currentEmpty) return null;

  saveSchoolProfileToStorage(normalized);
  return normalized;
}
