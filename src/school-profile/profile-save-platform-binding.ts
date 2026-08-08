import {
  ensureSchoolPlatformBinding,
  type EnsureSchoolPlatformBindingDependencies,
  type EnsureSchoolPlatformBindingResult,
} from "./ensure-school-platform-binding";
import { MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED } from "./school-profile-identity-policy";
import type { SchoolProfileStorageSaveResult } from "./school-profile-storage";

export { MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED };

/**
 * 0F-2B gate: platform binding is allowed only after truthful persist success.
 */
export function mayBindPlatformAfterProfilePersist(
  persistence: SchoolProfileStorageSaveResult,
): boolean {
  return persistence.ok;
}

export type ProfileSaveBindingUiOutcome =
  | { bindingAttempted: false; binding: null; metadataNotice: null }
  | {
      bindingAttempted: true;
      binding: EnsureSchoolPlatformBindingResult;
      /** Soft warning when binding is not ready; null on ready. */
      metadataNotice: string | null;
    };

/**
 * After SchoolProfile persist: call ensure only when persistence.ok.
 * Business save success is independent — callers must not rollback profile on binding error.
 */
export async function runPlatformBindingAfterProfilePersist(
  persistence: SchoolProfileStorageSaveResult,
  ensure: (
    dependencies?: EnsureSchoolPlatformBindingDependencies,
  ) => Promise<EnsureSchoolPlatformBindingResult> = ensureSchoolPlatformBinding,
): Promise<ProfileSaveBindingUiOutcome> {
  if (!mayBindPlatformAfterProfilePersist(persistence)) {
    return { bindingAttempted: false, binding: null, metadataNotice: null };
  }

  const binding = await ensure();
  if (binding.status === "ready") {
    return { bindingAttempted: true, binding, metadataNotice: null };
  }

  // empty (unexpected after persist) and error → same soft metadata notice
  return {
    bindingAttempted: true,
    binding,
    metadataNotice: MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED,
  };
}

type EnsureFn = (
  dependencies?: EnsureSchoolPlatformBindingDependencies,
) => Promise<EnsureSchoolPlatformBindingResult>;

/**
 * Serializes ensure calls so concurrent Saves never overlap ensure invocations.
 * Each successful persist still gets its own ensure (sequential, idempotent).
 */
export function createSerializedPlatformBindingRunner(ensure: EnsureFn = ensureSchoolPlatformBinding) {
  let chain: Promise<unknown> = Promise.resolve();
  let inFlightCount = 0;

  return {
    isInFlight(): boolean {
      return inFlightCount > 0;
    },

    afterPersist(
      persistence: SchoolProfileStorageSaveResult,
    ): Promise<ProfileSaveBindingUiOutcome> {
      if (!mayBindPlatformAfterProfilePersist(persistence)) {
        return Promise.resolve({
          bindingAttempted: false,
          binding: null,
          metadataNotice: null,
        });
      }

      const run = async (): Promise<ProfileSaveBindingUiOutcome> => {
        inFlightCount += 1;
        try {
          return await runPlatformBindingAfterProfilePersist({ ok: true }, ensure);
        } finally {
          inFlightCount -= 1;
        }
      };

      const result = chain.then(run, run);
      chain = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  };
}
