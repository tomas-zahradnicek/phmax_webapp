/**
 * N2-ADOPT-WRITE / N3-CUTOVER-ACTIVATE — school-shadow establishment + cutover owner.
 *
 * Desired school state = fresh LEGACY raw only (establishment).
 * Unbound key + marker are never read as source and never written by establishment.
 * Legacy remains business authority until the sole production cutover owner
 * (`runScenarioLabelEstablishmentAfterSchoolReady` with allowCutover) transitions
 * metadata to namespaced via `executeScenarioLabelN3AuthorityCutover`.
 *
 * `allowCutover` is a lifecycle context flag only (default false). It does NOT
 * grant eligibility — the CORE executor always fresh-assesses.
 */

import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import type { EntityId } from "../../../domain/shared/entity-id";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { parseScenarioLabelMigrationMarkerPayloadJson } from "./scenario-label-migration-marker-payload";
import {
  buildScenarioLabelMigrationMarkerPayload,
  buildScenarioLabelNamespacedKey,
} from "./scenario-label-migration-protocol";
import { serializeScenarioLabelMigrationMarkerPayload } from "./scenario-label-migration-marker-payload";
import { rawStoredTextEqual, rawStoredTextFromNullable } from "./scenario-label-migration-raw";
import type { RawStoredText, ScenarioLabelMigrationTarget } from "./scenario-label-migration-types";
import {
  assessSyncedMarkerEligibilityAfterFinalLegacyRead,
  classifySchoolShadowEstablishmentOutcome,
  planSchoolShadowEstablishment,
  resolveCanonicalSchoolIdForEstablishment,
  type SchoolShadowEstablishmentMarkerState,
  type SchoolShadowEstablishmentResult,
} from "./scenario-label-school-shadow-establishment";
import { finalizeScenarioLabelLegacyFenceCertificate } from "./scenario-label-n3-fence-finalize";
import { prepareScenarioLabelN3LegacyFenceCertificate } from "./scenario-label-n3-prep";
import { decideScenarioLabelAwareEstablishment } from "./scenario-label-n3-establishment-gate";
import { executeScenarioLabelN3AuthorityCutover } from "./scenario-label-n3-cutover";
import type { ScenarioLabelN3AuthorityCutoverResult } from "./scenario-label-n3-cutover-types";

export type ScenarioLabelEstablishmentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Lifecycle-only: may this orchestration attempt the CORE cutover executor? Default false. */
export type EstablishScenarioLabelSchoolShadowDependencies = {
  readonly storage?: ScenarioLabelEstablishmentStorage;
  readonly allowCutover?: boolean;
  /**
   * Optional test seam for call-count proofs. Production omits — uses CORE executor.
    * Never accepts eligibility / fence-ready / authority-ready bypass flags.
    */
  readonly executeAuthorityCutover?: (input: {
    readonly storage: ScenarioLabelEstablishmentStorage;
    readonly schoolId: EntityId;
  }) => ScenarioLabelN3AuthorityCutoverResult;
};

/** Soft / strong cutover metadata notice attached to otherwise-successful orchestration. */
export type ScenarioLabelCutoverLifecycleAttachment = {
  readonly attempted: true;
  readonly status: ScenarioLabelN3AuthorityCutoverResult["status"];
  readonly notice: "silent" | "soft" | "strong";
};

export type SchoolShadowEstablishmentResultWithCutover = SchoolShadowEstablishmentResult & {
  readonly cutover?: ScenarioLabelCutoverLifecycleAttachment;
};

/**
 * Strong metadata notice when cutover leaves an incomplete metadata transition.
 * No technical jargon; does not claim business data loss.
 */
export const MSG_SCENARIO_LABEL_CUTOVER_METADATA_STRONG =
  "Stav uložených dat scénáře se nepodařilo bezpečně dokončit.";

function resolveStorage(
  deps: EstablishScenarioLabelSchoolShadowDependencies,
): ScenarioLabelEstablishmentStorage | null {
  if (deps.storage) return deps.storage;
  try {
    if (typeof localStorage === "undefined" || localStorage == null) return null;
    return localStorage;
  } catch {
    return null;
  }
}

function readRaw(storage: ScenarioLabelEstablishmentStorage, key: string): RawStoredText {
  return rawStoredTextFromNullable(storage.getItem(key));
}

function writeRawDesired(
  storage: ScenarioLabelEstablishmentStorage,
  key: string,
  desired: RawStoredText,
): void {
  if (desired.exists) {
    storage.setItem(key, desired.value);
  } else {
    storage.removeItem(key);
  }
}

function readSchoolMarkerState(
  storage: ScenarioLabelEstablishmentStorage,
  target: ScenarioLabelMigrationTarget,
): SchoolShadowEstablishmentMarkerState {
  const key = serializeScenarioLabelMigrationMarkerKey(target);
  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { status: "invalid" };
  }
  if (raw == null) return { status: "missing" };
  const payload = parseScenarioLabelMigrationMarkerPayloadJson(raw);
  if (!payload) return { status: "invalid" };
  return { status: "valid", payload };
}

function invalidateSchoolMarkerBestEffort(
  storage: ScenarioLabelEstablishmentStorage,
  target: ScenarioLabelMigrationTarget,
): boolean {
  try {
    const key = serializeScenarioLabelMigrationMarkerKey(target);
    storage.removeItem(key);
    return storage.getItem(key) == null;
  } catch {
    return false;
  }
}

function persistSchoolMarker(
  storage: ScenarioLabelEstablishmentStorage,
  target: ScenarioLabelMigrationTarget,
  mirrorHealth: "synced" | "dirty",
  authoritativeRaw: RawStoredText,
): boolean {
  try {
    const key = serializeScenarioLabelMigrationMarkerKey(target);
    const payload = buildScenarioLabelMigrationMarkerPayload({
      mirrorHealth,
      authoritativeRaw,
    });
    storage.setItem(key, serializeScenarioLabelMigrationMarkerPayload(payload));
    return true;
  } catch {
    return false;
  }
}

function mapCutoverNotice(
  result: ScenarioLabelN3AuthorityCutoverResult,
): "silent" | "soft" | "strong" {
  switch (result.status) {
    case "cutover_success":
    case "already_namespaced":
    case "not_eligible":
    case "skipped_identity":
    case "concurrent_drift":
      return "silent";
    case "fatal_partial":
      return "strong";
    case "rolled_back":
    case "cutover_degraded":
    case "storage_unavailable":
    case "marker_write_failed":
      return "soft";
    default: {
      const _exhaustive: never = result;
      void _exhaustive;
      return "soft";
    }
  }
}

function attachCutover(
  base: SchoolShadowEstablishmentResult,
  cutover: ScenarioLabelN3AuthorityCutoverResult | null,
): SchoolShadowEstablishmentResultWithCutover {
  if (cutover == null) return base;
  return {
    ...base,
    cutover: {
      attempted: true,
      status: cutover.status,
      notice: mapCutoverNotice(cutover),
    },
  };
}

/**
 * Single-attempt lifecycle helper. Owner decides WHEN; CORE decides WHETHER.
 * Max one executor call per lifecycle event. Throws are caught by caller.
 */
function attemptCutoverAfterLegacyCommitted(input: {
  readonly storage: ScenarioLabelEstablishmentStorage;
  readonly schoolId: EntityId;
  readonly allowCutover: boolean;
  readonly executeAuthorityCutover: NonNullable<
    EstablishScenarioLabelSchoolShadowDependencies["executeAuthorityCutover"]
  >;
}): ScenarioLabelN3AuthorityCutoverResult | null {
  if (!input.allowCutover) return null;
  return input.executeAuthorityCutover({
    storage: input.storage,
    schoolId: input.schoolId,
  });
}

function resolveCutoverExecutor(
  deps: EstablishScenarioLabelSchoolShadowDependencies,
): NonNullable<EstablishScenarioLabelSchoolShadowDependencies["executeAuthorityCutover"]> {
  return (
    deps.executeAuthorityCutover ??
    ((args) =>
      executeScenarioLabelN3AuthorityCutover({
        storage: args.storage,
        schoolId: args.schoolId,
      }))
  );
}

/**
 * Establish / repair school:<id> scenario shadow from fresh legacy.
 * Never touches unbound. Never writes legacy.
 *
 * `allowCutover` defaults to false — Restore and direct callers must not create
 * first schema2. Only `runScenarioLabelEstablishmentAfterSchoolReady` enables it.
 */
export function establishScenarioLabelSchoolShadowFromLegacy(
  schoolId: unknown,
  deps: EstablishScenarioLabelSchoolShadowDependencies = {},
): SchoolShadowEstablishmentResultWithCutover {
  const allowCutover = deps.allowCutover === true;
  const executeAuthorityCutover = resolveCutoverExecutor(deps);

  const canonical = resolveCanonicalSchoolIdForEstablishment(schoolId);
  if (canonical.status === "skipped") {
    return { status: "skipped_identity", reason: canonical.reason };
  }

  const storage = resolveStorage(deps);
  if (storage == null) {
    return { status: "storage_unavailable" };
  }

  // Fresh N3 authority gate must precede every legacy establishment mutation.
  const decision = decideScenarioLabelAwareEstablishment({
    storage,
    schoolId: canonical.schoolId,
  });
  if (decision.action === "no_op_namespaced_authoritative") {
    return { status: "skipped_namespaced" };
  }
  if (decision.action === "blocked") {
    if (decision.reason === "storage_unavailable") {
      return { status: "storage_unavailable" };
    }
    return { status: "skipped_authority_blocked" };
  }
  if (decision.action === "permit_legacy_prep") {
    let prepStatus: string;
    try {
      // PREP is idempotent; LEGACY_COMMITTED returns already_prepared with zero writes.
      const prep = prepareScenarioLabelN3LegacyFenceCertificate({
        schoolId: canonical.schoolId,
        storage,
      });
      prepStatus = prep.status;
    } catch {
      // Soft metadata only — never overturn Profile/VZ business success.
      return { status: "already_ready" };
    }

    if (prepStatus !== "prepared" && prepStatus !== "already_prepared") {
      return { status: "already_ready" };
    }

    let cutover: ScenarioLabelN3AuthorityCutoverResult | null = null;
    try {
      cutover = attemptCutoverAfterLegacyCommitted({
        storage,
        schoolId: canonical.schoolId,
        allowCutover,
        executeAuthorityCutover,
      });
    } catch {
      cutover = { status: "storage_unavailable" };
    }
    return attachCutover({ status: "already_ready" }, cutover);
  }

  const schoolTarget: ScenarioLabelMigrationTarget = {
    kind: "school",
    schoolId: canonical.schoolId,
  };
  const schoolKey = buildScenarioLabelNamespacedKey(schoolTarget);

  let freshLegacyRaw: RawStoredText;
  let currentSchoolShadowRaw: RawStoredText;
  let markerState: SchoolShadowEstablishmentMarkerState;
  try {
    freshLegacyRaw = readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
    currentSchoolShadowRaw = readRaw(storage, schoolKey);
    markerState = readSchoolMarkerState(storage, schoolTarget);
  } catch {
    return { status: "storage_unavailable" };
  }

  const plan = planSchoolShadowEstablishment({
    schoolId: canonical.schoolId,
    freshLegacyRaw,
    currentSchoolShadowRaw,
    markerState,
  });

  if (plan.kind === "already_ready") {
    return { status: "already_ready" };
  }

  // Invalidate prior healthy marker before mutating school shadow.
  invalidateSchoolMarkerBestEffort(storage, schoolTarget);

  let schoolWriteSucceeded = true;
  if (plan.schoolWriteRequired) {
    try {
      writeRawDesired(storage, schoolKey, plan.desiredSchoolRaw);
    } catch {
      schoolWriteSucceeded = false;
    }
  }

  let verifiedSchoolRaw: RawStoredText = { exists: false };
  let schoolVerifyMatched = false;
  try {
    verifiedSchoolRaw = readRaw(storage, schoolKey);
    schoolVerifyMatched = rawStoredTextEqual(plan.desiredSchoolRaw, verifiedSchoolRaw);
  } catch {
    schoolWriteSucceeded = false;
    schoolVerifyMatched = false;
  }

  if (!schoolWriteSucceeded || !schoolVerifyMatched) {
    invalidateSchoolMarkerBestEffort(storage, schoolTarget);
    persistSchoolMarker(storage, schoolTarget, "dirty", plan.desiredSchoolRaw);
    return classifySchoolShadowEstablishmentOutcome({
      plan,
      schoolWriteSucceeded,
      schoolVerifyMatched,
      finalLegacyMatchesVerifiedSchool: false,
      markerPersistSucceeded: false,
    });
  }

  let finalLegacyRaw: RawStoredText;
  try {
    finalLegacyRaw = readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
  } catch {
    return { status: "shadow_dirty" };
  }

  const eligibility = assessSyncedMarkerEligibilityAfterFinalLegacyRead({
    verifiedSchoolRaw,
    finalLegacyRaw,
  });

  if (!eligibility.eligible) {
    invalidateSchoolMarkerBestEffort(storage, schoolTarget);
    persistSchoolMarker(storage, schoolTarget, "dirty", finalLegacyRaw);
    return classifySchoolShadowEstablishmentOutcome({
      plan,
      schoolWriteSucceeded: true,
      schoolVerifyMatched: true,
      finalLegacyMatchesVerifiedSchool: false,
      markerPersistSucceeded: false,
    });
  }

  const markerPersistSucceeded = persistSchoolMarker(
    storage,
    schoolTarget,
    "synced",
    finalLegacyRaw,
  );

  const outcome = classifySchoolShadowEstablishmentOutcome({
    plan,
    schoolWriteSucceeded: true,
    schoolVerifyMatched: true,
    finalLegacyMatchesVerifiedSchool: true,
    markerPersistSucceeded,
  });

  // Fence LAST only after a real mutation produced a certifiable synced tuple.
  // already_ready returns earlier with ZERO fence writes (PREP owns bootstrap).
  if (outcome.status !== "established") {
    return outcome;
  }

  let fenceOk = false;
  try {
    const fenceResult = finalizeScenarioLabelLegacyFenceCertificate({
      storage,
      schoolId: canonical.schoolId,
    });
    fenceOk =
      fenceResult.status === "committed" || fenceResult.status === "already_committed";
  } catch {
    // Soft metadata only — establishment business outcome unchanged.
    fenceOk = false;
  }

  if (!fenceOk) {
    return outcome;
  }

  let cutover: ScenarioLabelN3AuthorityCutoverResult | null = null;
  try {
    cutover = attemptCutoverAfterLegacyCommitted({
      storage,
      schoolId: canonical.schoolId,
      allowCutover,
      executeAuthorityCutover,
    });
  } catch {
    cutover = { status: "storage_unavailable" };
  }
  return attachCutover(outcome, cutover);
}

export type RunScenarioLabelEstablishmentAfterSchoolReadyInput =
  | { readonly status: "ready"; readonly schoolId: EntityId }
  | { readonly status: "noop"; readonly schoolId: EntityId };

export type RunScenarioLabelEstablishmentAfterSchoolReadyResult =
  | SchoolShadowEstablishmentResultWithCutover
  | { readonly status: "skipped_not_ready" };

/**
 * Shared post-ready orchestration helper — sole production cutover owner.
 * Callers: Profile Save/mount runners, VZ afterPersist runner.
 * Fail-soft: unexpected throws are mapped to storage_unavailable-equivalent soft result.
 *
 * Always enables `allowCutover: true` (lifecycle context). CORE still fresh-assesses.
 * Restore must call `establishScenarioLabelSchoolShadowFromLegacy` directly (default false).
 */
export function runScenarioLabelEstablishmentAfterSchoolReady(
  binding: RunScenarioLabelEstablishmentAfterSchoolReadyInput | { readonly status: string },
  deps: EstablishScenarioLabelSchoolShadowDependencies = {},
): RunScenarioLabelEstablishmentAfterSchoolReadyResult {
  if (binding.status !== "ready" && binding.status !== "noop") {
    return { status: "skipped_not_ready" };
  }
  if (!("schoolId" in binding) || binding.schoolId == null) {
    return { status: "skipped_not_ready" };
  }

  try {
    return establishScenarioLabelSchoolShadowFromLegacy(binding.schoolId, {
      ...deps,
      allowCutover: true,
    });
  } catch {
    return { status: "storage_unavailable" };
  }
}

/** Soft metadata outcomes that warrant a non-blocking UI warning. */
export function isScenarioLabelEstablishmentSoftFailure(
  result: RunScenarioLabelEstablishmentAfterSchoolReadyResult,
): boolean {
  if (scenarioLabelEstablishmentNoticeKind(result) !== "none") {
    return true;
  }
  return (
    result.status === "shadow_dirty" ||
    result.status === "marker_incomplete" ||
    result.status === "storage_unavailable" ||
    result.status === "skipped_authority_blocked" ||
    result.status === "skipped_identity"
  );
}

/**
 * Notice severity for platform binding UX.
 * Cutover soft/strong never overturns Profile/VZ business persistence success.
 */
export function scenarioLabelEstablishmentNoticeKind(
  result: RunScenarioLabelEstablishmentAfterSchoolReadyResult,
): "none" | "soft" | "strong" {
  if ("cutover" in result && result.cutover != null) {
    if (result.cutover.notice === "strong") return "strong";
    if (result.cutover.notice === "soft") return "soft";
  }
  if (
    result.status === "shadow_dirty" ||
    result.status === "marker_incomplete" ||
    result.status === "storage_unavailable" ||
    result.status === "skipped_authority_blocked" ||
    result.status === "skipped_identity"
  ) {
    return "soft";
  }
  return "none";
}
