import {
  AppContextError,
  bootstrapAppContext,
  readAppContext,
  type BootstrapAppContextResult,
} from "../data/app-context/app-context";
import {
  IdentityRegistryError,
  readIdentityRegistry,
} from "../data/identity/identity-registry";
import { readLegacySchoolProfile } from "../data/legacy/legacy-school-profile";
import type { DataRepository } from "../data/repository/data-repository";
import { DataRepositoryError } from "../data/repository/data-repository";
import { createLocalStorageRepository } from "../data/repository/local-storage-repository";
import type { EntityId } from "../domain/shared/entity-id";

/**
 * Profile-scoped platform binding (0F-1).
 *
 * Side-effect contract:
 * - PROFILE MISSING → no Identity / AppContext / SchoolYear writes (empty).
 * - PROFILE VALID + metadata missing → may create Identity Registry, AppContext,
 *   and optionally SchoolYear identity metadata from a valid existing VZ year hint (0D).
 * - PROFILE VALID + metadata valid → stable reuse.
 * - CORRUPTED profile / Identity / AppContext → typed failure, no silent repair.
 *
 * Never invents a SchoolProfile, never rewrites SchoolProfile.id / fields,
 * never creates a SchoolYear from the current date.
 */
export type EnsureSchoolPlatformBindingReason =
  | "profile_corrupted"
  | "identity_corrupted"
  | "app_context_corrupted"
  | "storage_unavailable"
  | "platform_failure";

export type EnsureSchoolPlatformBindingResult =
  | { status: "empty" }
  | {
      status: "ready";
      schoolId: EntityId;
      activeSchoolId: EntityId | null;
      activeSchoolYearId: EntityId | null;
      staleActiveSchoolId: boolean;
      staleActiveSchoolYearId: boolean;
    }
  | {
      status: "error";
      reason: EnsureSchoolPlatformBindingReason;
      detail?: string;
    };

export type EnsureSchoolPlatformBindingDependencies = {
  readProfile?: typeof readLegacySchoolProfile;
  readIdentity?: typeof readIdentityRegistry;
  readContext?: typeof readAppContext;
  createRepository?: () => DataRepository;
  bootstrap?: (repository: DataRepository) => Promise<BootstrapAppContextResult>;
};

function mapThrownError(error: unknown): EnsureSchoolPlatformBindingResult {
  // Corrupted Identity / AppContext are normally caught by pre-flight reads.
  // Remaining throws from bootstrap / repository are mapped conservatively.
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
    // Identity failures may be rethrown as AppContextError by bootstrapAppContext;
    // pre-flight reads already classify standing corrupted Identity / AppContext.
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

/**
 * Ensure Identity Registry + AppContext for an already-persisted SchoolProfile.
 * Safe no-op when no persisted profile exists (prevents ghost identity on empty mount).
 */
export async function ensureSchoolPlatformBinding(
  dependencies: EnsureSchoolPlatformBindingDependencies = {},
): Promise<EnsureSchoolPlatformBindingResult> {
  const readProfile = dependencies.readProfile ?? readLegacySchoolProfile;
  const readIdentity = dependencies.readIdentity ?? readIdentityRegistry;
  const readContext = dependencies.readContext ?? readAppContext;
  const createRepository = dependencies.createRepository ?? createLocalStorageRepository;
  const bootstrap = dependencies.bootstrap ?? bootstrapAppContext;

  const profileResult = readProfile();
  if (!profileResult.ok) {
    if (profileResult.code === "corrupted") {
      return { status: "error", reason: "profile_corrupted" };
    }
    return { status: "error", reason: "storage_unavailable" };
  }

  if (profileResult.profile == null) {
    return { status: "empty" };
  }

  // Fail-closed before any platform write when metadata storage is already unsafe.
  const identityResult = readIdentity();
  if (!identityResult.ok) {
    if (identityResult.code === "corrupted") {
      return { status: "error", reason: "identity_corrupted" };
    }
    return { status: "error", reason: "storage_unavailable" };
  }

  const contextResult = readContext();
  if (!contextResult.ok) {
    if (contextResult.code === "corrupted") {
      return { status: "error", reason: "app_context_corrupted" };
    }
    return { status: "error", reason: "storage_unavailable" };
  }

  let boot: BootstrapAppContextResult;
  try {
    boot = await bootstrap(createRepository());
  } catch (error) {
    return mapThrownError(error);
  }

  const registryAfter = readIdentity();
  if (!registryAfter.ok) {
    if (registryAfter.code === "corrupted") {
      return { status: "error", reason: "identity_corrupted" };
    }
    return { status: "error", reason: "storage_unavailable" };
  }
  if (registryAfter.registry == null) {
    return {
      status: "error",
      reason: "platform_failure",
      detail: "identity_missing_after_bootstrap",
    };
  }

  return {
    status: "ready",
    schoolId: registryAfter.registry.schoolId,
    activeSchoolId: boot.context.activeSchoolId,
    activeSchoolYearId: boot.context.activeSchoolYearId,
    staleActiveSchoolId: boot.staleActiveSchoolId,
    staleActiveSchoolYearId: boot.staleActiveSchoolYearId,
  };
}
