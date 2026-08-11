import type { VyrocniZpravaStorageSaveResult } from "./vyrocni-zprava-storage";
import {
  MSG_SCENARIO_LABEL_CUTOVER_METADATA_STRONG,
  runScenarioLabelEstablishmentAfterSchoolReady,
  scenarioLabelEstablishmentNoticeKind,
  type RunScenarioLabelEstablishmentAfterSchoolReadyInput,
  type RunScenarioLabelEstablishmentAfterSchoolReadyResult,
} from "../data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime";
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
 * Soft metadata notice when VZ SchoolYear binding succeeded but scenario
 * school-shadow establishment degraded (N2-ADOPT-WRITE). Must not claim
 * SchoolYear binding itself failed.
 */
export const MSG_VZ_SCENARIO_SHADOW_METADATA_SOFT =
  "Výroční zpráva byla uložena, ale nepodařilo se dokončit propojení metadat scénáře. Zobrazené údaje zůstávají v pořádku; zkuste uložení zopakovat nebo otevřít Profil školy.";

function vzEstablishmentMetadataNotice(
  establishment: RunScenarioLabelEstablishmentAfterSchoolReadyResult,
): string | null {
  const kind = scenarioLabelEstablishmentNoticeKind(establishment);
  if (kind === "strong") return MSG_SCENARIO_LABEL_CUTOVER_METADATA_STRONG;
  if (kind === "soft") return MSG_VZ_SCENARIO_SHADOW_METADATA_SOFT;
  return null;
}

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
      /** Soft warning on metadata error / soft establishment degrade; null on success. */
      metadataNotice: string | null;
    };

type EnsureFn = (
  dependencies?: EnsureVzSchoolYearPlatformBindingDependencies,
) => Promise<EnsureVzSchoolYearPlatformBindingResult>;

export type EstablishAfterSchoolReadyFn = (
  binding: RunScenarioLabelEstablishmentAfterSchoolReadyInput | { readonly status: string },
) => RunScenarioLabelEstablishmentAfterSchoolReadyResult;

/**
 * After VZ persist: call ensure only when persistence.ok.
 * Business save success is independent — callers must not rollback VZ on binding error.
 * empty / noop are legitimate (no Profile / no valid year) → no SchoolYear metadata warning.
 * Scenario establishment runs only after ready/noop (schoolId available); soft-fail only.
 */
export async function runVzSchoolYearBindingAfterPersist(
  persistence: VyrocniZpravaStorageSaveResult,
  ensure: EnsureFn = ensureVzSchoolYearPlatformBinding,
  establishAfterReady: EstablishAfterSchoolReadyFn = runScenarioLabelEstablishmentAfterSchoolReady,
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

  if (binding.status === "ready" || binding.status === "noop") {
    let establishment: ReturnType<EstablishAfterSchoolReadyFn>;
    try {
      establishment = establishAfterReady(binding);
    } catch {
      establishment = { status: "storage_unavailable" };
    }
    const notice = vzEstablishmentMetadataNotice(establishment);
    if (notice != null) {
      return {
        bindingAttempted: true,
        binding,
        metadataNotice: notice,
      };
    }
  }

  // ready | noop | empty → silent when establishment OK / skipped
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
  establishAfterReady: EstablishAfterSchoolReadyFn = runScenarioLabelEstablishmentAfterSchoolReady,
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
      return enqueue(() =>
        runVzSchoolYearBindingAfterPersist({ ok: true }, ensure, establishAfterReady),
      );
    },
  };
}
