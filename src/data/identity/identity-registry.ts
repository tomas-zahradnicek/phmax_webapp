import { SCHOOL_PROFILE_LS_KEY } from "../../school-profile/school-profile-constants";
import type { EntityId } from "../../domain/shared/entity-id";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "./identity-registry-types";
import {
  IDENTITY_REGISTRY_LS_KEY,
  readIdentityRegistry,
  writeIdentityRegistry,
} from "./identity-registry-storage";
import type { IdentityRegistry, IdentityRegistryReadResult } from "./identity-registry-types";
import { isUuid, normalizeUuid } from "./identity-uuid";

export { IDENTITY_REGISTRY_LS_KEY, readIdentityRegistry, writeIdentityRegistry };
export { isUuid } from "./identity-uuid";
export type { IdentityRegistry, IdentityRegistryReadResult };

export class IdentityRegistryError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "IdentityRegistryError";
    this.code = code;
  }
}

/** Only a valid UUID may be reused / accepted as an identity EntityId. */
export function isReusableEntityId(value: unknown): value is EntityId {
  return isUuid(value);
}

export function createEntityId(): EntityId {
  if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") {
    throw new IdentityRegistryError(
      "uuid_unavailable",
      "crypto.randomUUID is required to create identity EntityIds.",
    );
  }
  return crypto.randomUUID();
}

export function isValidSchoolYearStartYear(startYear: number): boolean {
  return Number.isInteger(startYear) && startYear >= 1000 && startYear <= 9999;
}

/**
 * Read SchoolProfile.id from legacy storage without writing or normalizing defaults.
 * Returns the id only when it is a valid UUID. Does not mutate SchoolProfile storage.
 */
export function peekLegacySchoolProfileId(): EntityId | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SCHOOL_PROFILE_LS_KEY);
    if (raw == null || raw.trim() === "") return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const id = (parsed as { id?: unknown }).id;
    return isUuid(id) ? normalizeUuid(id) : null;
  } catch {
    return null;
  }
}

function requireReadableRegistry(): IdentityRegistry | null {
  const result = readIdentityRegistry();
  if (!result.ok) {
    throw new IdentityRegistryError(
      result.code,
      result.code === "corrupted"
        ? "Identity registry is corrupted and must not be overwritten."
        : "Identity registry storage is unavailable.",
    );
  }
  return result.registry;
}

function persistRegistry(registry: IdentityRegistry): void {
  const written = writeIdentityRegistry({
    ...registry,
    updatedAt: new Date().toISOString(),
  });
  if (!written.ok) {
    throw new IdentityRegistryError(
      written.code,
      written.code === "corrupted_blocked"
        ? "Refusing to overwrite a corrupted identity registry."
        : "Identity registry storage is unavailable.",
    );
  }
}

/**
 * Bootstrap / resolve stable schoolId.
 *
 * 1. If registry already has schoolId → return it
 * 2. Else peek legacy SchoolProfile.id (read-only); reuse only if valid UUID
 * 3. Else create a new UUID via crypto.randomUUID()
 * 4. Persist only into identity registry (never rewrite SchoolProfile)
 */
export function getOrCreateSchoolId(): EntityId {
  const existing = requireReadableRegistry();
  if (existing?.schoolId) {
    return existing.schoolId;
  }

  const legacyId = peekLegacySchoolProfileId();
  const schoolId = legacyId ?? createEntityId();

  persistRegistry({
    schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
    schoolId,
    schoolYears: [],
    updatedAt: new Date().toISOString(),
  });

  return schoolId;
}

/**
 * Resolve stable schoolYearId for (schoolId, startYear).
 * Same pair always returns the same id; different startYear or schoolId → different id.
 * Does not invent a startYear when the caller omits / invalidates it.
 */
export function getOrCreateSchoolYearId(schoolId: EntityId, startYear: number): EntityId {
  if (!isUuid(schoolId)) {
    throw new IdentityRegistryError("invalid_school_id", "schoolId must be a valid UUID EntityId.");
  }
  if (!isValidSchoolYearStartYear(startYear)) {
    throw new IdentityRegistryError(
      "invalid_start_year",
      `startYear must be a 4-digit integer year, got ${String(startYear)}.`,
    );
  }

  let registry = requireReadableRegistry();
  if (!registry) {
    getOrCreateSchoolId();
    registry = requireReadableRegistry();
    if (!registry) {
      throw new IdentityRegistryError("storage_unavailable", "Failed to initialize identity registry.");
    }
  }

  const normalizedSchoolId = normalizeUuid(schoolId);
  if (normalizedSchoolId !== registry.schoolId) {
    throw new IdentityRegistryError(
      "school_id_mismatch",
      "Identity registry v1 allows SchoolYear entries only for registry.schoolId (single school).",
    );
  }

  const found = registry.schoolYears.find(
    (entry) => entry.schoolId === normalizedSchoolId && entry.startYear === startYear,
  );
  if (found) return found.id;

  const id = createEntityId();
  persistRegistry({
    ...registry,
    schoolYears: [
      ...registry.schoolYears,
      { id, schoolId: normalizedSchoolId, startYear },
    ],
    updatedAt: new Date().toISOString(),
  });

  return id;
}
