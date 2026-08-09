/**
 * N3-FENCE-PROTO — pure fence assessment + data/fence cutover eligibility.
 *
 * 0 production writes. 0 business routing. 0 cutover.
 * Fence certificate binds school target + resource + authority + marker schema + exact committedRaw.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import {
  authoritativePresenceFromRaw,
  rawStoredTextEqual,
} from "./scenario-label-migration-raw";
import type {
  RawStoredText,
  ScenarioLabelMigrationTargetResolution,
} from "./scenario-label-migration-types";
import {
  isScenarioLabelN3LegacyMarker,
  isScenarioLabelN3NamespacedMarker,
} from "./scenario-label-n3-authority-marker";
import type { ScenarioLabelN3CutoverPlan } from "./scenario-label-n3-authority-types";
import {
  SCENARIO_LABEL_N3_FENCE_FIRST_FORBIDDEN,
  SCENARIO_LABEL_N3_FENCE_PLAN_READY_IS_NOT_ELIGIBILITY,
  SCENARIO_LABEL_N3_FENCE_RESOURCE,
  SCENARIO_LABEL_N3_FENCE_WRITTEN_LAST,
  type ScenarioLabelN3FenceAssessInput,
  type ScenarioLabelN3FenceAssessment,
  type ScenarioLabelN3FenceCutoverEligibility,
  type ScenarioLabelN3FenceCutoverEligibilityInput,
  type ScenarioLabelN3FenceRecord,
  type ScenarioLabelN3FenceViolationKind,
} from "./scenario-label-n3-fence-types";

function schoolIdFromResolution(
  targetResolution: ScenarioLabelMigrationTargetResolution,
): EntityId | null {
  if (targetResolution.status !== "resolved") return null;
  if (targetResolution.target.kind !== "school") return null;
  return targetResolution.target.schoolId;
}

function isUnboundResolved(
  targetResolution: ScenarioLabelMigrationTargetResolution,
): boolean {
  return (
    targetResolution.status === "resolved" && targetResolution.target.kind === "unbound"
  );
}

/**
 * Revision / protocolGeneration alone cannot prove raw state unchanged.
 * Old N2 can change raw without touching generation — exact committedRaw required.
 */
export function assertScenarioLabelN3FenceRequiresExactRaw(params: {
  readonly certifiedGeneration: number;
  readonly observedGeneration: number;
  readonly committedRaw: RawStoredText;
  readonly observedRaw: RawStoredText;
}):
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "generation_alone_insufficient" } {
  if (params.certifiedGeneration === params.observedGeneration) {
    if (!rawStoredTextEqual(params.committedRaw, params.observedRaw)) {
      return { ok: false, reason: "generation_alone_insufficient" };
    }
  }
  if (!rawStoredTextEqual(params.committedRaw, params.observedRaw)) {
    return { ok: false, reason: "generation_alone_insufficient" };
  }
  return { ok: true };
}

function classifyViolationKind(params: {
  readonly committedRaw: RawStoredText;
  readonly legacyRaw: RawStoredText;
  readonly schoolV2Raw: RawStoredText;
  readonly authorityMismatch: boolean;
}): ScenarioLabelN3FenceViolationKind {
  const legacyMatches = rawStoredTextEqual(params.committedRaw, params.legacyRaw);
  const v2Matches = rawStoredTextEqual(params.committedRaw, params.schoolV2Raw);
  const copiesEqual = rawStoredTextEqual(params.legacyRaw, params.schoolV2Raw);

  if (params.authorityMismatch && copiesEqual && legacyMatches && v2Matches) {
    // Same raw values, but marker/fence authority downgraded — equal-copy class.
    return "equal_copy_violation";
  }
  if (params.authorityMismatch && copiesEqual && !legacyMatches) {
    // Old N2 equal-copy rewrite to a new value B/B with legacy marker.
    return "equal_copy_violation";
  }
  if (!copiesEqual) {
    return "divergent_violation";
  }
  if (!legacyMatches || !v2Matches) {
    return "raw_mismatch";
  }
  if (params.authorityMismatch) {
    return "marker_authority_mismatch";
  }
  return "raw_mismatch";
}

function violated(
  schoolId: EntityId | null,
  kind: ScenarioLabelN3FenceViolationKind,
  record: ScenarioLabelN3FenceRecord | null,
): ScenarioLabelN3FenceAssessment {
  return { status: "VIOLATED", schoolId, kind, record };
}

/**
 * Assess whether the current raw + marker state matches a persistent fence certificate.
 * Pure: no storage I/O.
 */
export function assessScenarioLabelN3FenceState(
  input: ScenarioLabelN3FenceAssessInput,
): ScenarioLabelN3FenceAssessment {
  void SCENARIO_LABEL_N3_FENCE_WRITTEN_LAST;
  void SCENARIO_LABEL_N3_FENCE_FIRST_FORBIDDEN;

  if (input.storageReadError) {
    return { status: "UNAVAILABLE", reason: "storage_read_error" };
  }

  if (input.targetResolution.status === "skipped") {
    return { status: "INVALID", reason: "target_unresolved" };
  }

  if (isUnboundResolved(input.targetResolution)) {
    return { status: "INVALID", reason: "target_not_school" };
  }

  const schoolId = schoolIdFromResolution(input.targetResolution);
  if (schoolId == null) {
    return { status: "INVALID", reason: "target_unresolved" };
  }

  if (input.fence.status === "invalid") {
    return { status: "INVALID", reason: input.fence.reason };
  }

  if (input.fence.status === "missing") {
    // Pre-cutover / legacy world without certificate → UNESTABLISHED.
    if (input.marker.status === "missing") {
      return {
        status: "UNESTABLISHED",
        schoolId,
        reason: "fence_missing_pre_cutover",
      };
    }
    if (input.marker.status === "invalid") {
      // Malformed marker with no fence — still not a committed namespaced state.
      // Treat as pre-cutover unestablished only when clearly legacy-shaped failures
      // are not claimed; fail closed as VIOLATED for ambiguous post-cutover hazard.
      return violated(schoolId, "marker_invalid", null);
    }
    if (isScenarioLabelN3NamespacedMarker(input.marker.payload)) {
      // Namespaced marker + missing fence → never NAMESPACED_COMMITTED.
      return violated(schoolId, "namespaced_without_fence", null);
    }
    if (isScenarioLabelN3LegacyMarker(input.marker.payload)) {
      return {
        status: "UNESTABLISHED",
        schoolId,
        reason: "fence_missing_pre_cutover",
      };
    }
    return violated(schoolId, "marker_invalid", null);
  }

  const record = input.fence.record;

  // Payload / key / target binding.
  if (record.schoolId !== schoolId) {
    return { status: "INVALID", reason: "school_id_mismatch" };
  }
  if (record.resource !== SCENARIO_LABEL_N3_FENCE_RESOURCE) {
    return { status: "INVALID", reason: "resource_mismatch" };
  }

  if (input.marker.status === "missing") {
    return violated(schoolId, "marker_missing", record);
  }
  if (input.marker.status === "invalid") {
    return violated(schoolId, "marker_invalid", record);
  }

  const marker = input.marker.payload;

  // Fence / marker authority coherence.
  if (record.authority === "namespaced" && isScenarioLabelN3LegacyMarker(marker)) {
    const kind = classifyViolationKind({
      committedRaw: record.committedRaw,
      legacyRaw: input.legacyRaw,
      schoolV2Raw: input.schoolV2Raw,
      authorityMismatch: true,
    });
    return violated(schoolId, kind, record);
  }
  if (record.authority === "legacy" && isScenarioLabelN3NamespacedMarker(marker)) {
    return violated(schoolId, "marker_authority_mismatch", record);
  }

  if (record.authority === "legacy") {
    if (!isScenarioLabelN3LegacyMarker(marker)) {
      return violated(schoolId, "marker_authority_mismatch", record);
    }
    if (record.markerSchemaVersion !== 1 || marker.schemaVersion !== 1) {
      return violated(schoolId, "marker_schema_mismatch", record);
    }
    if (marker.mirrorHealth !== "synced") {
      return violated(schoolId, "marker_not_synced", record);
    }

    const expectedPresence = authoritativePresenceFromRaw(input.legacyRaw);
    if (marker.authoritativePresence !== expectedPresence) {
      return violated(schoolId, "presence_mismatch", record);
    }
    if (!rawStoredTextEqual(record.committedRaw, input.legacyRaw)) {
      const kind = classifyViolationKind({
        committedRaw: record.committedRaw,
        legacyRaw: input.legacyRaw,
        schoolV2Raw: input.schoolV2Raw,
        authorityMismatch: false,
      });
      return violated(schoolId, kind, record);
    }
    if (!rawStoredTextEqual(record.committedRaw, input.schoolV2Raw)) {
      const kind = classifyViolationKind({
        committedRaw: record.committedRaw,
        legacyRaw: input.legacyRaw,
        schoolV2Raw: input.schoolV2Raw,
        authorityMismatch: false,
      });
      return violated(schoolId, kind, record);
    }

    return {
      status: "LEGACY_COMMITTED",
      schoolId,
      record,
      fenceReady: true,
    };
  }

  // namespaced fence
  if (!isScenarioLabelN3NamespacedMarker(marker)) {
    return violated(schoolId, "marker_authority_mismatch", record);
  }
  if (record.markerSchemaVersion !== 2 || marker.schemaVersion !== 2) {
    return violated(schoolId, "marker_schema_mismatch", record);
  }
  if (marker.mirrorHealth !== "synced") {
    return violated(schoolId, "marker_not_synced", record);
  }

  const expectedPresence = authoritativePresenceFromRaw(input.schoolV2Raw);
  if (marker.authoritativePresence !== expectedPresence) {
    return violated(schoolId, "presence_mismatch", record);
  }
  if (!rawStoredTextEqual(record.committedRaw, input.schoolV2Raw)) {
    const kind = classifyViolationKind({
      committedRaw: record.committedRaw,
      legacyRaw: input.legacyRaw,
      schoolV2Raw: input.schoolV2Raw,
      authorityMismatch: false,
    });
    return violated(schoolId, kind, record);
  }
  if (!rawStoredTextEqual(record.committedRaw, input.legacyRaw)) {
    const kind = classifyViolationKind({
      committedRaw: record.committedRaw,
      legacyRaw: input.legacyRaw,
      schoolV2Raw: input.schoolV2Raw,
      authorityMismatch: false,
    });
    return violated(schoolId, kind, record);
  }

  return {
    status: "NAMESPACED_COMMITTED",
    schoolId,
    record,
  };
}

/**
 * Material pre-cutover fence readiness — derived only from LEGACY_COMMITTED assessment.
 * Never a caller-supplied boolean.
 */
export function isScenarioLabelN3FenceReadyForPreCutover(
  assessment: ScenarioLabelN3FenceAssessment,
): boolean {
  return assessment.status === "LEGACY_COMMITTED" && assessment.fenceReady === true;
}

/**
 * Compose N3 school data readiness + LEGACY_COMMITTED fence into data+fence eligibility.
 *
 * Does NOT use the old N2 unbound-permitting readiness helper.
 * Does NOT claim full production cutover readiness (N3-AWARE still required).
 */
export function assessScenarioLabelFenceCutoverEligibility(
  input: ScenarioLabelN3FenceCutoverEligibilityInput,
): ScenarioLabelN3FenceCutoverEligibility {
  const { cutoverAssessment, fenceAssessment } = input;

  if (cutoverAssessment.status !== "ready_for_cutover") {
    return { eligible: false, reason: "data_not_ready" };
  }

  if (fenceAssessment.status === "UNESTABLISHED") {
    return { eligible: false, reason: "fence_unestablished" };
  }
  if (fenceAssessment.status === "VIOLATED") {
    return { eligible: false, reason: "fence_violated" };
  }
  if (fenceAssessment.status === "INVALID") {
    if (fenceAssessment.reason === "target_not_school") {
      return { eligible: false, reason: "unbound_never_eligible" };
    }
    if (fenceAssessment.reason === "target_unresolved") {
      return { eligible: false, reason: "target_unresolved" };
    }
    return { eligible: false, reason: "fence_invalid" };
  }
  if (fenceAssessment.status === "UNAVAILABLE") {
    return { eligible: false, reason: "fence_unavailable" };
  }
  if (fenceAssessment.status === "NAMESPACED_COMMITTED") {
    return { eligible: false, reason: "fence_namespaced_committed" };
  }
  if (fenceAssessment.status !== "LEGACY_COMMITTED") {
    return { eligible: false, reason: "fence_not_legacy_committed" };
  }

  if (fenceAssessment.schoolId !== cutoverAssessment.schoolId) {
    return { eligible: false, reason: "target_mismatch" };
  }

  return {
    eligible: true,
    schoolId: fenceAssessment.schoolId,
    layer: "data_and_fence",
  };
}

/**
 * Explicit note: N3-PROTO `plan.status === "ready"` is lower-level DATA PLANE readiness.
 * It is not fence/cutover eligibility by itself.
 */
export function noteScenarioLabelN3PlanReadyIsNotFenceEligibility(params: {
  readonly plan: ScenarioLabelN3CutoverPlan;
  readonly fenceAssessment: ScenarioLabelN3FenceAssessment;
}): {
  readonly planReady: boolean;
  readonly fenceEligible: boolean;
  readonly planReadyIsNotEligibility: typeof SCENARIO_LABEL_N3_FENCE_PLAN_READY_IS_NOT_ELIGIBILITY;
} {
  void SCENARIO_LABEL_N3_FENCE_PLAN_READY_IS_NOT_ELIGIBILITY;
  const planReady = params.plan.status === "ready";
  const fenceEligible = isScenarioLabelN3FenceReadyForPreCutover(params.fenceAssessment);
  return {
    planReady,
    fenceEligible,
    planReadyIsNotEligibility: true,
  };
}
