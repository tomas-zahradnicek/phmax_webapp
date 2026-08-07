import { SCHOOL_PROFILE_LS_KEY } from "../../school-profile/school-profile-constants";
import { normalizeSchoolProfile } from "../../school-profile/school-profile-logic";
import type { SchoolProfile } from "../../school-profile/school-profile-types";

export type LegacySchoolProfileReadResult =
  | { ok: true; profile: SchoolProfile | null }
  | { ok: false; code: "corrupted" | "storage_unavailable" };

/**
 * Read-only legacy SchoolProfile access.
 * Does not invent defaults and does not write localStorage.
 */
export function readLegacySchoolProfile(): LegacySchoolProfileReadResult {
  if (typeof localStorage === "undefined") {
    return { ok: false, code: "storage_unavailable" };
  }

  let raw: string | null;
  try {
    raw = localStorage.getItem(SCHOOL_PROFILE_LS_KEY);
  } catch {
    return { ok: false, code: "storage_unavailable" };
  }

  if (raw == null || raw.trim() === "") {
    return { ok: true, profile: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, code: "corrupted" };
  }

  const normalized = normalizeSchoolProfile(parsed);
  if (!normalized) {
    return { ok: false, code: "corrupted" };
  }

  return { ok: true, profile: normalized };
}

/** Exposed only for tests / inventory — not part of DataRepository API. */
export function getLegacySchoolProfileStorageKey(): string {
  return SCHOOL_PROFILE_LS_KEY;
}
