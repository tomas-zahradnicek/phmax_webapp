/**
 * N2-ADOPT-WRITE — school-shadow establishment executor (runtime).
 *
 * Desired school state = fresh LEGACY raw only.
 * Unbound key + marker are never read as source and never written.
 * Legacy remains the sole business authority.
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

export type ScenarioLabelEstablishmentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type EstablishScenarioLabelSchoolShadowDependencies = {
  readonly storage?: ScenarioLabelEstablishmentStorage;
};

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

/**
 * Establish / repair school:<id> scenario shadow from fresh legacy.
 * Never touches unbound. Never writes legacy.
 */
export function establishScenarioLabelSchoolShadowFromLegacy(
  schoolId: unknown,
  deps: EstablishScenarioLabelSchoolShadowDependencies = {},
): SchoolShadowEstablishmentResult {
  const canonical = resolveCanonicalSchoolIdForEstablishment(schoolId);
  if (canonical.status === "skipped") {
    return { status: "skipped_identity", reason: canonical.reason };
  }

  const storage = resolveStorage(deps);
  if (storage == null) {
    return { status: "storage_unavailable" };
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
  if (outcome.status === "established") {
    try {
      finalizeScenarioLabelLegacyFenceCertificate({
        storage,
        schoolId: canonical.schoolId,
      });
    } catch {
      // Soft metadata only — establishment business outcome unchanged.
    }
  }

  return outcome;
}

export type RunScenarioLabelEstablishmentAfterSchoolReadyInput =
  | { readonly status: "ready"; readonly schoolId: EntityId }
  | { readonly status: "noop"; readonly schoolId: EntityId };

export type RunScenarioLabelEstablishmentAfterSchoolReadyResult =
  | SchoolShadowEstablishmentResult
  | { readonly status: "skipped_not_ready" };

/**
 * Shared post-ready orchestration helper.
 * Callers: Profile Save/mount runners, VZ afterPersist runner.
 * Fail-soft: unexpected throws are mapped to storage_unavailable-equivalent soft result.
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
    return establishScenarioLabelSchoolShadowFromLegacy(binding.schoolId, deps);
  } catch {
    return { status: "storage_unavailable" };
  }
}

/** Soft metadata outcomes that warrant a non-blocking UI warning. */
export function isScenarioLabelEstablishmentSoftFailure(
  result: RunScenarioLabelEstablishmentAfterSchoolReadyResult,
): boolean {
  return (
    result.status === "shadow_dirty" ||
    result.status === "marker_incomplete" ||
    result.status === "storage_unavailable" ||
    result.status === "skipped_identity"
  );
}
