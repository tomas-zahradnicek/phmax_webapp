import { fromSchoolProfile } from "../../domain/school/school-mappers";
import type { School } from "../../domain/school/school-types";
import type { SchoolYear, SchoolYearStatus } from "../../domain/school-year/school-year-types";
import { DOMAIN_DATA_SCHEMA_VERSION } from "../../domain/shared/data-schema-version";
import type { EntityId } from "../../domain/shared/entity-id";
import {
  getOrCreateSchoolId,
  getOrCreateSchoolYearId,
  IdentityRegistryError,
  isUuid,
  readIdentityRegistry,
} from "../identity/identity-registry";
import type { IdentityRegistry, SchoolYearIdentityEntry } from "../identity/identity-registry-types";
import { normalizeUuid } from "../identity/identity-uuid";
import { readLegacySchoolProfile } from "../legacy/legacy-school-profile";
import { readLegacySchoolYearHint } from "../legacy/legacy-school-year";
import { DataRepositoryError, type DataRepository } from "./data-repository";

/**
 * Legacy SchoolYear.status for identity-based projections in PR 0C.
 * "unknown" = business lifecycle cannot be determined from current legacy data.
 * Not persisted; no date heuristics.
 */
export const SCHOOL_YEAR_PROJECTION_STATUS: SchoolYearStatus = "unknown";

function projectSchoolYear(entry: SchoolYearIdentityEntry): SchoolYear {
  return {
    id: entry.id,
    schemaVersion: DOMAIN_DATA_SCHEMA_VERSION,
    schoolId: entry.schoolId,
    startYear: entry.startYear,
    status: SCHOOL_YEAR_PROJECTION_STATUS,
    // Timestamps omitted — registry.updatedAt is not a SchoolYear business date.
  };
}

function rethrowIdentity(error: unknown): never {
  if (error instanceof IdentityRegistryError) {
    throw new DataRepositoryError(error.code, error.message);
  }
  throw error;
}

function requireRegistry(): IdentityRegistry | null {
  const result = readIdentityRegistry();
  if (!result.ok) {
    throw new DataRepositoryError(
      result.code,
      result.code === "corrupted"
        ? "Identity registry is corrupted and must not be overwritten."
        : "Identity registry storage is unavailable.",
    );
  }
  return result.registry;
}

/**
 * LocalStorage-backed DataRepository (read path).
 *
 * Allowed persistence side effects:
 * - Identity registry bootstrap via getOrCreateSchoolId / getOrCreateSchoolYearId
 *   (key: reditelsky-pruvodce-identity-registry-v1) when a valid SchoolProfile exists
 *   (getSchool) or when resolving known legacy years (listSchoolYears).
 *
 * Never writes SchoolProfile, AnnualReport, PHmax, or NV75 keys.
 * getSchool on empty/missing/corrupted profile must not create identity registry.
 */
export class LocalStorageRepository implements DataRepository {
  async getSchool(id: EntityId): Promise<School | null> {
    if (!isUuid(id)) return null;

    const legacy = readLegacySchoolProfile();
    if (!legacy.ok) {
      throw new DataRepositoryError(
        legacy.code,
        legacy.code === "corrupted"
          ? "Legacy SchoolProfile JSON is corrupted and will not be rewritten."
          : "SchoolProfile storage is unavailable.",
      );
    }
    if (!legacy.profile) {
      return null;
    }

    let schoolId: EntityId;
    try {
      schoolId = getOrCreateSchoolId();
    } catch (error) {
      rethrowIdentity(error);
    }

    if (normalizeUuid(id) !== schoolId) {
      return null;
    }

    const mapped = fromSchoolProfile(legacy.profile);
    // Identity registry schoolId is authoritative for schema v1.
    return { ...mapped, id: schoolId };
  }

  async getSchoolYear(id: EntityId): Promise<SchoolYear | null> {
    if (!isUuid(id)) return null;

    const registry = requireRegistry();
    if (!registry) return null;

    const entry = registry.schoolYears.find((item) => item.id === normalizeUuid(id));
    if (!entry) return null;
    return projectSchoolYear(entry);
  }

  /**
   * Returns SchoolYear projections for the single v1 school.
   * If a valid legacy VZ schoolYear label exists, ensures its identity entry
   * (identity-registry write only) before listing.
   */
  async listSchoolYears(schoolId: EntityId): Promise<SchoolYear[]> {
    if (!isUuid(schoolId)) return [];

    let resolvedSchoolId: EntityId;
    try {
      resolvedSchoolId = getOrCreateSchoolId();
    } catch (error) {
      rethrowIdentity(error);
    }

    if (normalizeUuid(schoolId) !== resolvedSchoolId) {
      return [];
    }

    const hint = readLegacySchoolYearHint();
    if (!hint.ok) {
      if (hint.code === "corrupted") {
        // Invalid VZ payload must not invent a year; still list known identity years.
        // Do not rewrite VZ storage.
      } else {
        throw new DataRepositoryError(hint.code, "Legacy school-year storage is unavailable.");
      }
    } else if (hint.startYear != null) {
      try {
        getOrCreateSchoolYearId(resolvedSchoolId, hint.startYear);
      } catch (error) {
        rethrowIdentity(error);
      }
    }
    // Invalid label (startYear null) → no year creation, no date fallback.

    const registry = requireRegistry();
    if (!registry) return [];

    return registry.schoolYears
      .filter((entry) => entry.schoolId === resolvedSchoolId)
      .map((entry) => projectSchoolYear(entry));
  }
}

export function createLocalStorageRepository(): LocalStorageRepository {
  return new LocalStorageRepository();
}
