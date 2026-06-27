import {
  SCHOOL_PROFILE_FIELD_LABELS,
  SCHOOL_PROFILE_SECTION_01_REQUIRED_FIELDS,
} from "./school-profile-constants";
import { getSchoolTypeLabel } from "./school-profile-school-type";
import type { SchoolProfile, SchoolProfileFieldKey } from "./school-profile-types";

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `school-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultSchoolProfile(): SchoolProfile {
  const now = new Date().toISOString();
  return {
    id: createId(),
    name: "",
    ico: "",
    redIzo: "",
    izo: "",
    schoolType: getSchoolTypeLabel("ZAKLADNI_SKOLA"),
    address: "",
    municipality: "",
    region: "",
    founder: "",
    principalName: "",
    website: "",
    email: "",
    phone: "",
    dataBox: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function isSchoolProfileFieldFilled(value: string): boolean {
  return value.trim().length > 0;
}

export function detectMissingSchoolProfileFields(
  profile: SchoolProfile,
  fields: readonly SchoolProfileFieldKey[] = SCHOOL_PROFILE_SECTION_01_REQUIRED_FIELDS,
): string[] {
  const missing: string[] = [];
  for (const field of fields) {
    if (!isSchoolProfileFieldFilled(profile[field])) {
      missing.push(SCHOOL_PROFILE_FIELD_LABELS[field]);
    }
  }
  return missing;
}

export function hasAnySchoolProfileData(profile: SchoolProfile): boolean {
  return (Object.keys(SCHOOL_PROFILE_FIELD_LABELS) as SchoolProfileFieldKey[]).some((field) =>
    isSchoolProfileFieldFilled(profile[field]),
  );
}

/** Profil je pro kalkulačky „vyplněný“, pokud má alespoň jeden identifikační údaj (ne jen výchozí typ školy). */
export function isSchoolProfileEstablished(profile: SchoolProfile): boolean {
  return [
    profile.name,
    profile.ico,
    profile.redIzo,
    profile.izo,
    profile.address,
    profile.municipality,
    profile.founder,
    profile.principalName,
    profile.website,
    profile.email,
    profile.phone,
    profile.dataBox,
  ].some(isSchoolProfileFieldFilled);
}

export function normalizeSchoolProfile(value: unknown): SchoolProfile | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Partial<SchoolProfile>;
  const defaults = createDefaultSchoolProfile();
  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id : defaults.id,
    name: typeof raw.name === "string" ? raw.name : "",
    ico: typeof raw.ico === "string" ? raw.ico : "",
    redIzo: typeof raw.redIzo === "string" ? raw.redIzo : "",
    izo: typeof raw.izo === "string" ? raw.izo : "",
    schoolType:
      typeof raw.schoolType === "string" && raw.schoolType.trim()
        ? getSchoolTypeLabel(raw.schoolType) || raw.schoolType.trim()
        : defaults.schoolType,
    address: typeof raw.address === "string" ? raw.address : "",
    municipality: typeof raw.municipality === "string" ? raw.municipality : "",
    region: typeof raw.region === "string" ? raw.region : "",
    founder: typeof raw.founder === "string" ? raw.founder : "",
    principalName: typeof raw.principalName === "string" ? raw.principalName : "",
    website: typeof raw.website === "string" ? raw.website : "",
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    dataBox: typeof raw.dataBox === "string" ? raw.dataBox : "",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : defaults.createdAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : defaults.updatedAt,
  };
}

export function patchSchoolProfile(
  profile: SchoolProfile,
  patch: Partial<SchoolProfile>,
): SchoolProfile {
  return {
    ...profile,
    ...patch,
    id: profile.id,
    createdAt: profile.createdAt,
    updatedAt: new Date().toISOString(),
  };
}
