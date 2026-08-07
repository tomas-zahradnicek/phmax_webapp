import type { EntityId } from "../../domain/shared/entity-id";
import { getOrCreateSchoolId, IdentityRegistryError, isUuid } from "../identity/identity-registry";
import { normalizeUuid } from "../identity/identity-uuid";
import { readLegacySchoolProfile } from "../legacy/legacy-school-profile";
import { readLegacySchoolYearHint } from "../legacy/legacy-school-year";
import type { DataRepository } from "../repository/data-repository";
import { DataRepositoryError } from "../repository/data-repository";
import { readAppContext, writeAppContext } from "./app-context-storage";
import {
  APP_CONTEXT_LS_KEY,
  APP_CONTEXT_SCHEMA_VERSION,
  type AppContext,
} from "./app-context-types";

export {
  APP_CONTEXT_LS_KEY,
  APP_CONTEXT_SCHEMA_VERSION,
  readAppContext,
  writeAppContext,
} from "./app-context-storage";
export type { AppContext, AppContextReadResult, AppContextWriteResult } from "./app-context-types";

export class AppContextError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AppContextError";
    this.code = code;
  }
}

export type BootstrapAppContextResult = {
  context: AppContext;
  /** True when a previously stored activeSchoolId could not be resolved. */
  staleActiveSchoolId: boolean;
  /** True when a previously stored activeSchoolYearId could not be resolved. */
  staleActiveSchoolYearId: boolean;
};

function emptyContext(): AppContext {
  return {
    schemaVersion: APP_CONTEXT_SCHEMA_VERSION,
    activeSchoolId: null,
    activeSchoolYearId: null,
  };
}

function contextsEqual(a: AppContext, b: AppContext): boolean {
  return (
    a.schemaVersion === b.schemaVersion &&
    a.activeSchoolId === b.activeSchoolId &&
    a.activeSchoolYearId === b.activeSchoolYearId
  );
}

function persistContext(context: AppContext): AppContext {
  const result = writeAppContext(context);
  if (!result.ok) {
    const message =
      result.code === "corrupted_blocked"
        ? "AppContext is corrupted and must not be overwritten."
        : result.code === "invalid_context"
          ? "AppContext pointer invariant violated (year requires school)."
          : "AppContext storage is unavailable.";
    throw new AppContextError(result.code, message);
  }
  return context;
}

function rethrowDataLayer(error: unknown): never {
  if (error instanceof AppContextError) throw error;
  if (error instanceof DataRepositoryError) {
    throw new AppContextError(error.code, error.message);
  }
  if (error instanceof IdentityRegistryError) {
    throw new AppContextError(error.code, error.message);
  }
  throw error;
}

async function sanitizeExistingContext(
  repository: DataRepository,
  stored: AppContext,
): Promise<BootstrapAppContextResult> {
  let activeSchoolId = stored.activeSchoolId;
  let activeSchoolYearId = stored.activeSchoolYearId;
  let staleActiveSchoolId = false;
  let staleActiveSchoolYearId = false;

  if (activeSchoolId != null) {
    if (!isUuid(activeSchoolId)) {
      staleActiveSchoolId = true;
      if (activeSchoolYearId != null) {
        staleActiveSchoolYearId = true;
      }
      activeSchoolId = null;
      activeSchoolYearId = null;
    } else {
      let school;
      try {
        school = await repository.getSchool(activeSchoolId);
      } catch (error) {
        rethrowDataLayer(error);
      }
      if (!school) {
        // Stale school → clear both pointers; year must not outlive parent school.
        staleActiveSchoolId = true;
        if (activeSchoolYearId != null) {
          staleActiveSchoolYearId = true;
        }
        activeSchoolId = null;
        activeSchoolYearId = null;
      } else {
        activeSchoolId = school.id;
      }
    }
  } else if (activeSchoolYearId != null) {
    staleActiveSchoolYearId = true;
    activeSchoolYearId = null;
  }

  if (activeSchoolId != null && activeSchoolYearId != null) {
    if (!isUuid(activeSchoolYearId)) {
      staleActiveSchoolYearId = true;
      activeSchoolYearId = null;
    } else {
      let year;
      try {
        year = await repository.getSchoolYear(activeSchoolYearId);
      } catch (error) {
        rethrowDataLayer(error);
      }
      if (!year || year.schoolId !== activeSchoolId) {
        staleActiveSchoolYearId = true;
        activeSchoolYearId = null;
      } else {
        activeSchoolYearId = year.id;
      }
    }
  }

  const context: AppContext = {
    schemaVersion: APP_CONTEXT_SCHEMA_VERSION,
    activeSchoolId,
    activeSchoolYearId,
  };

  if (!contextsEqual(stored, context)) {
    persistContext(context);
  }

  return { context, staleActiveSchoolId, staleActiveSchoolYearId };
}

async function discoverFromLegacy(repository: DataRepository): Promise<AppContext> {
  const legacyProfile = readLegacySchoolProfile();
  if (!legacyProfile.ok) {
    throw new AppContextError(
      legacyProfile.code,
      legacyProfile.code === "corrupted"
        ? "Legacy SchoolProfile JSON is corrupted and will not be rewritten."
        : "SchoolProfile storage is unavailable.",
    );
  }

  if (!legacyProfile.profile) {
    return emptyContext();
  }

  let schoolId: EntityId;
  try {
    schoolId = getOrCreateSchoolId();
  } catch (error) {
    rethrowDataLayer(error);
  }

  let school;
  try {
    school = await repository.getSchool(schoolId);
  } catch (error) {
    rethrowDataLayer(error);
  }
  if (!school) {
    return emptyContext();
  }

  const hint = readLegacySchoolYearHint();
  if (!hint.ok) {
    if (hint.code === "corrupted") {
      // Do not invent a year from corrupted VZ payload.
      return {
        schemaVersion: APP_CONTEXT_SCHEMA_VERSION,
        activeSchoolId: school.id,
        activeSchoolYearId: null,
      };
    }
    throw new AppContextError(hint.code, "Legacy school-year storage is unavailable.");
  }

  if (hint.startYear == null) {
    return {
      schemaVersion: APP_CONTEXT_SCHEMA_VERSION,
      activeSchoolId: school.id,
      activeSchoolYearId: null,
    };
  }

  let years;
  try {
    years = await repository.listSchoolYears(school.id);
  } catch (error) {
    rethrowDataLayer(error);
  }

  const match = years.find((year) => year.startYear === hint.startYear);
  return {
    schemaVersion: APP_CONTEXT_SCHEMA_VERSION,
    activeSchoolId: school.id,
    activeSchoolYearId: match?.id ?? null,
  };
}

/**
 * Bootstrap or validate AppContext.
 * Allowed writes: Identity Registry (via repository / getOrCreateSchoolId) + AppContext.
 * Never invents School/SchoolYear from the current date.
 */
export async function bootstrapAppContext(
  repository: DataRepository,
): Promise<BootstrapAppContextResult> {
  const read = readAppContext();
  if (!read.ok) {
    throw new AppContextError(
      read.code,
      read.code === "corrupted"
        ? "AppContext is corrupted and must not be overwritten."
        : "AppContext storage is unavailable.",
    );
  }

  if (read.context) {
    return sanitizeExistingContext(repository, read.context);
  }

  const discovered = await discoverFromLegacy(repository);
  persistContext(discovered);
  return {
    context: discovered,
    staleActiveSchoolId: false,
    staleActiveSchoolYearId: false,
  };
}

/**
 * Set active school. Clears activeSchoolYearId when null.
 * On school change (schema v1), clears year unless it still belongs to the new school.
 */
export async function setActiveSchool(
  repository: DataRepository,
  schoolId: EntityId | null,
): Promise<AppContext> {
  const read = readAppContext();
  if (!read.ok) {
    throw new AppContextError(
      read.code,
      read.code === "corrupted"
        ? "AppContext is corrupted and must not be overwritten."
        : "AppContext storage is unavailable.",
    );
  }

  const current = read.context ?? emptyContext();

  if (schoolId == null) {
    return persistContext(emptyContext());
  }

  if (!isUuid(schoolId)) {
    throw new AppContextError("invalid_school_id", "activeSchoolId must be a UUID or null.");
  }

  let school;
  try {
    school = await repository.getSchool(schoolId);
  } catch (error) {
    rethrowDataLayer(error);
  }
  if (!school) {
    throw new AppContextError("school_not_found", "Cannot activate a school that does not resolve.");
  }

  const sameSchool =
    current.activeSchoolId != null && normalizeUuid(current.activeSchoolId) === school.id;

  // Prefer clearing year on school change; keep only when same school and still valid.
  let activeSchoolYearId: EntityId | null = null;
  if (sameSchool && current.activeSchoolYearId != null) {
    let year;
    try {
      year = await repository.getSchoolYear(current.activeSchoolYearId);
    } catch (error) {
      rethrowDataLayer(error);
    }
    if (year && year.schoolId === school.id) {
      activeSchoolYearId = year.id;
    }
  }

  return persistContext({
    schemaVersion: APP_CONTEXT_SCHEMA_VERSION,
    activeSchoolId: school.id,
    activeSchoolYearId,
  });
}

/**
 * Set active school year. Year must exist and belong to activeSchoolId.
 */
export async function setActiveSchoolYear(
  repository: DataRepository,
  schoolYearId: EntityId | null,
): Promise<AppContext> {
  const read = readAppContext();
  if (!read.ok) {
    throw new AppContextError(
      read.code,
      read.code === "corrupted"
        ? "AppContext is corrupted and must not be overwritten."
        : "AppContext storage is unavailable.",
    );
  }

  const current = read.context ?? emptyContext();

  if (schoolYearId == null) {
    return persistContext({
      schemaVersion: APP_CONTEXT_SCHEMA_VERSION,
      activeSchoolId: current.activeSchoolId,
      activeSchoolYearId: null,
    });
  }

  if (!isUuid(schoolYearId)) {
    throw new AppContextError(
      "invalid_school_year_id",
      "activeSchoolYearId must be a UUID or null.",
    );
  }

  if (current.activeSchoolId == null) {
    throw new AppContextError(
      "active_school_required",
      "Cannot activate a school year without an active school.",
    );
  }

  let year;
  try {
    year = await repository.getSchoolYear(normalizeUuid(schoolYearId));
  } catch (error) {
    rethrowDataLayer(error);
  }
  if (!year) {
    throw new AppContextError(
      "school_year_not_found",
      "Cannot activate a school year that does not resolve.",
    );
  }
  if (year.schoolId !== current.activeSchoolId) {
    throw new AppContextError(
      "school_year_school_mismatch",
      "Cannot activate a school year that belongs to a different school.",
    );
  }

  return persistContext({
    schemaVersion: APP_CONTEXT_SCHEMA_VERSION,
    activeSchoolId: current.activeSchoolId,
    activeSchoolYearId: year.id,
  });
}
