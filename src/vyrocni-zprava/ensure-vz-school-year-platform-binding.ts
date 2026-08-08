import {
  AppContextError,
  setActiveSchoolYear,
} from "../data/app-context/app-context";
import {
  getOrCreateSchoolYearId,
  IdentityRegistryError,
} from "../data/identity/identity-registry";
import { readLegacySchoolYearHint } from "../data/legacy/legacy-school-year";
import type { DataRepository } from "../data/repository/data-repository";
import { DataRepositoryError } from "../data/repository/data-repository";
import { createLocalStorageRepository } from "../data/repository/local-storage-repository";
import type { EntityId } from "../domain/shared/entity-id";
import {
  ensureSchoolPlatformBinding,
  type EnsureSchoolPlatformBindingDependencies,
  type EnsureSchoolPlatformBindingResult,
} from "../school-profile/ensure-school-platform-binding";

/**
 * VZ-scoped SchoolYear platform binding (0G-1).
 *
 * Source of truth:
 * - VZ `report.schoolYear` label (persisted) → year identity input
 * - Identity Registry `schoolYears[]` → stable SchoolYear metadata
 * - AppContext `activeSchoolYearId` → workspace pointer
 *
 * Side-effect contract:
 * - School platform not ready → empty / error from school binding (no year create)
 * - Empty / invalid persisted VZ year → noop (does not clear existing active year)
 * - Valid persisted canonical year → getOrCreateSchoolYearId + setActiveSchoolYear
 * - Never invents a year from the current date
 * - Never mutates VZ report / sections / personnel
 *
 * Production call sites intentionally deferred to 0G-2.
 */
export type EnsureVzSchoolYearPlatformBindingReason =
  | "profile_corrupted"
  | "identity_corrupted"
  | "app_context_corrupted"
  | "storage_unavailable"
  | "platform_failure";

/**
 * Result contract for 0G-2:
 * - `ready` → metadata bound (schoolId + schoolYearId + startYear)
 * - `empty` → legitimní no-op: missing SchoolProfile (0F parity)
 * - `noop` (`no_valid_year`) → legitimní no-op: school ready, year not bindable
 * - `error` → metadata failure (VZ business data must remain untouched)
 */
export type EnsureVzSchoolYearPlatformBindingResult =
  | { status: "empty" }
  | { status: "noop"; reason: "no_valid_year" }
  | {
      status: "ready";
      schoolId: EntityId;
      schoolYearId: EntityId;
      startYear: number;
    }
  | {
      status: "error";
      reason: EnsureVzSchoolYearPlatformBindingReason;
      detail?: string;
    };

export type EnsureVzSchoolYearPlatformBindingDependencies = {
  ensureSchool?: (
    dependencies?: EnsureSchoolPlatformBindingDependencies,
  ) => Promise<EnsureSchoolPlatformBindingResult>;
  readYearHint?: typeof readLegacySchoolYearHint;
  createRepository?: () => DataRepository;
  getOrCreateYearId?: typeof getOrCreateSchoolYearId;
  setActiveYear?: typeof setActiveSchoolYear;
};

function mapThrownError(error: unknown): EnsureVzSchoolYearPlatformBindingResult {
  if (error instanceof IdentityRegistryError) {
    if (error.code === "corrupted" || error.code === "corrupted_blocked") {
      return { status: "error", reason: "identity_corrupted", detail: error.code };
    }
    if (error.code === "storage_unavailable") {
      return { status: "error", reason: "storage_unavailable", detail: error.code };
    }
    return { status: "error", reason: "platform_failure", detail: error.code };
  }
  if (error instanceof AppContextError) {
    if (error.code === "corrupted" || error.code === "corrupted_blocked") {
      return { status: "error", reason: "app_context_corrupted", detail: error.code };
    }
    if (error.code === "storage_unavailable") {
      return { status: "error", reason: "storage_unavailable", detail: error.code };
    }
    return { status: "error", reason: "platform_failure", detail: error.code };
  }
  if (error instanceof DataRepositoryError) {
    if (error.code === "corrupted") {
      return { status: "error", reason: "profile_corrupted", detail: error.code };
    }
    if (error.code === "storage_unavailable") {
      return { status: "error", reason: "storage_unavailable", detail: error.code };
    }
    return { status: "error", reason: "platform_failure", detail: error.code };
  }
  return {
    status: "error",
    reason: "platform_failure",
    detail: error instanceof Error ? error.message : "unknown",
  };
}

function mapSchoolBindingResult(
  school: EnsureSchoolPlatformBindingResult,
): EnsureVzSchoolYearPlatformBindingResult | null {
  if (school.status === "empty") {
    return { status: "empty" };
  }
  if (school.status === "error") {
    return {
      status: "error",
      reason: school.reason,
      ...(school.detail !== undefined ? { detail: school.detail } : {}),
    };
  }
  return null;
}

/**
 * Bind persisted VZ schoolYear label to Identity SchoolYear + AppContext pointer.
 * School-first: reuses ensureSchoolPlatformBinding(); does not bootstrap school identity itself.
 */
export async function ensureVzSchoolYearPlatformBinding(
  dependencies: EnsureVzSchoolYearPlatformBindingDependencies = {},
): Promise<EnsureVzSchoolYearPlatformBindingResult> {
  const ensureSchool = dependencies.ensureSchool ?? ensureSchoolPlatformBinding;
  const readYearHint = dependencies.readYearHint ?? readLegacySchoolYearHint;
  const createRepository = dependencies.createRepository ?? createLocalStorageRepository;
  const getOrCreateYearId = dependencies.getOrCreateYearId ?? getOrCreateSchoolYearId;
  const setActiveYear = dependencies.setActiveYear ?? setActiveSchoolYear;

  const school = await ensureSchool();
  const schoolMapped = mapSchoolBindingResult(school);
  if (schoolMapped) {
    return schoolMapped;
  }
  if (school.status !== "ready") {
    return { status: "error", reason: "platform_failure", detail: "unexpected_school_binding_status" };
  }

  const hint = readYearHint();
  if (!hint.ok) {
    if (hint.code === "corrupted") {
      return { status: "error", reason: "platform_failure", detail: "vz_year_corrupted" };
    }
    return { status: "error", reason: "storage_unavailable" };
  }

  if (hint.startYear == null) {
    // Empty / whitespace / invalid label: do not invent a year and do not clear active pointer.
    return { status: "noop", reason: "no_valid_year" };
  }

  const startYear = hint.startYear;
  const schoolId = school.schoolId;

  let schoolYearId: EntityId;
  try {
    schoolYearId = getOrCreateYearId(schoolId, startYear);
    await setActiveYear(createRepository(), schoolYearId);
  } catch (error) {
    return mapThrownError(error);
  }

  return {
    status: "ready",
    schoolId,
    schoolYearId,
    startYear,
  };
}
