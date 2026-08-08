import { readIdentityRegistry } from "../../data/identity/identity-registry-storage";
import { readLegacySchoolProfile } from "../../data/legacy/legacy-school-profile";
import type { LocalEntityState, RestoreEnvironment } from "./restore-types";

/**
 * Read-only snapshot of local platform state for restore conflict classification.
 * Never bootstraps, repairs, or writes.
 */
export function readCurrentRestoreEnvironment(): RestoreEnvironment {
  return {
    identity: readLocalIdentityState(),
    profile: readLocalProfileState(),
  };
}

function readLocalIdentityState(): LocalEntityState {
  const result = readIdentityRegistry();
  if (!result.ok) {
    if (result.code === "corrupted") return { status: "corrupted" };
    return { status: "storage_unavailable" };
  }
  if (result.registry == null) return { status: "missing" };
  return { status: "valid", schoolId: result.registry.schoolId };
}

function readLocalProfileState(): LocalEntityState {
  const result = readLegacySchoolProfile();
  if (!result.ok) {
    if (result.code === "corrupted") return { status: "corrupted" };
    return { status: "storage_unavailable" };
  }
  if (result.profile == null) return { status: "missing" };
  return {
    status: "valid",
    schoolId: typeof result.profile.id === "string" ? result.profile.id : undefined,
  };
}
