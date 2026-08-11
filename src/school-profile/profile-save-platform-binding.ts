import {
  MSG_SCENARIO_LABEL_CUTOVER_METADATA_STRONG,
  runScenarioLabelEstablishmentAfterSchoolReady,
  scenarioLabelEstablishmentNoticeKind,
  type RunScenarioLabelEstablishmentAfterSchoolReadyInput,
  type RunScenarioLabelEstablishmentAfterSchoolReadyResult,
} from "../data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime";
import {
  ensureSchoolPlatformBinding,
  type EnsureSchoolPlatformBindingDependencies,
  type EnsureSchoolPlatformBindingResult,
} from "./ensure-school-platform-binding";
import {
  MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED,
  MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED,
} from "./school-profile-identity-policy";
import type { SchoolProfileStorageSaveResult } from "./school-profile-storage";

export {
  MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED,
  MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED,
};

function profileEstablishmentMetadataNotice(
  establishment: RunScenarioLabelEstablishmentAfterSchoolReadyResult,
  softMessage: string,
): string | null {
  const kind = scenarioLabelEstablishmentNoticeKind(establishment);
  if (kind === "strong") return MSG_SCENARIO_LABEL_CUTOVER_METADATA_STRONG;
  if (kind === "soft") return softMessage;
  return null;
}

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
      /** Soft warning when binding is not ready; null on ready / mount-empty. */
      metadataNotice: string | null;
    };

type EnsureFn = (
  dependencies?: EnsureSchoolPlatformBindingDependencies,
) => Promise<EnsureSchoolPlatformBindingResult>;

export type EstablishAfterSchoolReadyFn = (
  binding: RunScenarioLabelEstablishmentAfterSchoolReadyInput | { readonly status: string },
) => RunScenarioLabelEstablishmentAfterSchoolReadyResult;

/**
 * After SchoolProfile persist: call ensure only when persistence.ok.
 * Business save success is independent — callers must not rollback profile on binding error.
 * empty after successful persist is unexpected → soft metadata notice.
 * After ready: N2-ADOPT school-shadow establishment (fail-soft).
 */
export async function runPlatformBindingAfterProfilePersist(
  persistence: SchoolProfileStorageSaveResult,
  ensure: EnsureFn = ensureSchoolPlatformBinding,
  establishAfterReady: EstablishAfterSchoolReadyFn = runScenarioLabelEstablishmentAfterSchoolReady,
): Promise<ProfileSaveBindingUiOutcome> {
  if (!mayBindPlatformAfterProfilePersist(persistence)) {
    return { bindingAttempted: false, binding: null, metadataNotice: null };
  }

  const binding = await ensure();
  if (binding.status === "ready") {
    let establishment: ReturnType<EstablishAfterSchoolReadyFn>;
    try {
      establishment = establishAfterReady(binding);
    } catch {
      establishment = { status: "storage_unavailable" };
    }
    return {
      bindingAttempted: true,
      binding,
      metadataNotice: profileEstablishmentMetadataNotice(
        establishment,
        MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED,
      ),
    };
  }

  // empty (unexpected after persist) and error → same soft metadata notice
  return {
    bindingAttempted: true,
    binding,
    metadataNotice: MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED,
  };
}

/**
 * Mount / legacy binding (0F-2C).
 * Always calls ensure (0F-1 missing-profile gate → empty, no platform write).
 * empty = no persisted school → NOT a metadata warning (unlike Save path).
 * After ready: N2-ADOPT school-shadow establishment (fail-soft).
 */
export async function runPlatformBindingOnMount(
  ensure: EnsureFn = ensureSchoolPlatformBinding,
  establishAfterReady: EstablishAfterSchoolReadyFn = runScenarioLabelEstablishmentAfterSchoolReady,
): Promise<ProfileSaveBindingUiOutcome> {
  const binding = await ensure();
  if (binding.status === "ready") {
    let establishment: ReturnType<EstablishAfterSchoolReadyFn>;
    try {
      establishment = establishAfterReady(binding);
    } catch {
      establishment = { status: "storage_unavailable" };
    }
    return {
      bindingAttempted: true,
      binding,
      metadataNotice: profileEstablishmentMetadataNotice(
        establishment,
        MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED,
      ),
    };
  }
  if (binding.status === "empty") {
    return { bindingAttempted: true, binding, metadataNotice: null };
  }
  return {
    bindingAttempted: true,
    binding,
    metadataNotice: MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED,
  };
}

/**
 * Serializes ensure calls so mount + Save never overlap ensure invocations.
 * Each successful persist / mount still gets its own ensure (sequential, idempotent).
 */
export function createSerializedPlatformBindingRunner(
  ensure: EnsureFn = ensureSchoolPlatformBinding,
  establishAfterReady: EstablishAfterSchoolReadyFn = runScenarioLabelEstablishmentAfterSchoolReady,
) {
  let chain: Promise<unknown> = Promise.resolve();
  let inFlightCount = 0;

  function enqueue(run: () => Promise<ProfileSaveBindingUiOutcome>): Promise<ProfileSaveBindingUiOutcome> {
    const wrapped = async (): Promise<ProfileSaveBindingUiOutcome> => {
      inFlightCount += 1;
      try {
        return await run();
      } finally {
        inFlightCount -= 1;
      }
    };
    const result = chain.then(wrapped, wrapped);
    chain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

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
      return enqueue(() =>
        runPlatformBindingAfterProfilePersist({ ok: true }, ensure, establishAfterReady),
      );
    },

    /** Lazy mount / legacy binding — empty is not a user-facing error. */
    onMount(): Promise<ProfileSaveBindingUiOutcome> {
      return enqueue(() => runPlatformBindingOnMount(ensure, establishAfterReady));
    },
  };
}
