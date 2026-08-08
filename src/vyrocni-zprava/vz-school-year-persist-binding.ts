import type { VyrocniZpravaStorageSaveResult } from "./vyrocni-zprava-storage";
import {
  ensureVzSchoolYearPlatformBinding,
  type EnsureVzSchoolYearPlatformBindingDependencies,
  type EnsureVzSchoolYearPlatformBindingResult,
} from "./ensure-vz-school-year-platform-binding";

/**
 * Soft metadata notice after VZ business persist succeeded but SchoolYear
 * platform sync failed (0G-2). Must not claim business save failed.
 */
export const MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED =
  "Výroční zpráva byla uložena, ale nepodařilo se aktualizovat propojení školního roku s dalšími částmi aplikace. Zkontrolujte Profil školy a zkuste uložení zopakovat.";

/**
 * 0G-2 gate: SchoolYear metadata binding only after truthful VZ persist success.
 */
export function mayBindVzSchoolYearAfterPersist(
  persistence: VyrocniZpravaStorageSaveResult,
): boolean {
  return persistence.ok;
}

export type VzSchoolYearPersistBindingUiOutcome =
  | { bindingAttempted: false; binding: null; metadataNotice: null }
  | {
      bindingAttempted: true;
      binding: EnsureVzSchoolYearPlatformBindingResult;
      /** Soft warning on metadata error only; null on ready / noop / empty. */
      metadataNotice: string | null;
    };

type EnsureFn = (
  dependencies?: EnsureVzSchoolYearPlatformBindingDependencies,
) => Promise<EnsureVzSchoolYearPlatformBindingResult>;

/**
 * After VZ persist: call ensure only when persistence.ok.
 * Business save success is independent — callers must not rollback VZ on binding error.
 * empty / noop are legitimate (no Profile / no valid year) → no metadata warning.
 */
export async function runVzSchoolYearBindingAfterPersist(
  persistence: VyrocniZpravaStorageSaveResult,
  ensure: EnsureFn = ensureVzSchoolYearPlatformBinding,
): Promise<VzSchoolYearPersistBindingUiOutcome> {
  if (!mayBindVzSchoolYearAfterPersist(persistence)) {
    return { bindingAttempted: false, binding: null, metadataNotice: null };
  }

  const binding = await ensure();
  if (binding.status === "error") {
    return {
      bindingAttempted: true,
      binding,
      metadataNotice: MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED,
    };
  }

  // ready | noop | empty → silent
  return { bindingAttempted: true, binding, metadataNotice: null };
}

/**
 * Whether a pending async binding outcome may update React UI state.
 * Used by the hook (and unit-tested without a React harness).
 */
export function shouldApplyVzSchoolYearBindingUiOutcome(options: {
  mounted: boolean;
  generation: number;
  currentGeneration: number;
  outcome: VzSchoolYearPersistBindingUiOutcome;
}): boolean {
  if (!options.mounted) return false;
  if (options.generation !== options.currentGeneration) return false;
  if (!options.outcome.bindingAttempted) return false;
  return true;
}

/**
 * Serializes ensure calls so rapid VZ autosaves never overlap ensure invocations.
 * Each successful persist still gets its own ensure (sequential; helper reads live LS).
 */
export function createSerializedVzSchoolYearBindingRunner(
  ensure: EnsureFn = ensureVzSchoolYearPlatformBinding,
) {
  let chain: Promise<unknown> = Promise.resolve();
  let inFlightCount = 0;

  function enqueue(
    run: () => Promise<VzSchoolYearPersistBindingUiOutcome>,
  ): Promise<VzSchoolYearPersistBindingUiOutcome> {
    const wrapped = async (): Promise<VzSchoolYearPersistBindingUiOutcome> => {
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
      persistence: VyrocniZpravaStorageSaveResult,
    ): Promise<VzSchoolYearPersistBindingUiOutcome> {
      if (!mayBindVzSchoolYearAfterPersist(persistence)) {
        return Promise.resolve({
          bindingAttempted: false,
          binding: null,
          metadataNotice: null,
        });
      }
      return enqueue(() => runVzSchoolYearBindingAfterPersist({ ok: true }, ensure));
    },
  };
}
