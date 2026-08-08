import { readLegacySchoolProfile } from "../data/legacy/legacy-school-profile";

/**
 * Status-aware SchoolProfile persistence read for Profile page UI (0F-3B).
 * Canonical source: {@link readLegacySchoolProfile} — never inferred from
 * in-memory default draft, empty form fields, or binding warning text.
 */
export type SchoolProfilePersistenceStatus =
  | "missing"
  | "valid"
  | "corrupted"
  | "storage_unavailable";

export function readSchoolProfilePersistenceStatus(): SchoolProfilePersistenceStatus {
  const result = readLegacySchoolProfile();
  if (!result.ok) {
    return result.code;
  }
  if (result.profile == null) {
    return "missing";
  }
  return "valid";
}
