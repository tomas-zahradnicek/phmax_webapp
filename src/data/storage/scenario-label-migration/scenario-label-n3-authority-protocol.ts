/**
 * N3-PROTO — pure authority-cutover protocol for phmax-scenario-label / value.
 *
 * Defines future states, planners, and invariants only.
 * 0 production cutover, 0 namespaced business reads, 0 automatic migration writes.
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
  buildScenarioLabelN3LegacyMarker,
  buildScenarioLabelN3NamespacedMarker,
  isScenarioLabelN3LegacyMarker,
  isScenarioLabelN3NamespacedMarker,
} from "./scenario-label-n3-authority-marker";
import type {
  ScenarioLabelN3AuthorityMarkerParseResult,
  ScenarioLabelN3AuthorityState,
  ScenarioLabelN3ClassifyInput,
  ScenarioLabelN3ClearPlan,
  ScenarioLabelN3CutoverAssessment,
  ScenarioLabelN3CutoverOutcome,
  ScenarioLabelN3CutoverPlan,
  ScenarioLabelN3EstablishmentDecision,
  ScenarioLabelN3NamespacedWriteOutcome,
  ScenarioLabelN3NamespacedWritePlan,
  ScenarioLabelN3ProductionCutoverEligibility,
  ScenarioLabelN3ReadRoute,
  ScenarioLabelN3ReadRouteInput,
  ScenarioLabelN3RestorePlan,
  ScenarioLabelN3RawSnapshotMembers,
} from "./scenario-label-n3-authority-types";
import {
  SCENARIO_LABEL_N3_CUTOVER_REQUIRES_FENCE,
  SCENARIO_LABEL_N3_NAMESPACED_WRITE_PHASE_ORDER,
  SCENARIO_LABEL_N3_NO_UNSAFE_LEGACY_FALLBACK,
  SCENARIO_LABEL_N3_STRICT_COMPATIBILITY_MIRROR,
} from "./scenario-label-n3-authority-types";

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
 * Classify current (already-loaded) scenario-label authority state.
 * School-target only for PREPARED / NAMESPACED_*; unbound is never namespaced.
 */
export function classifyScenarioLabelAuthorityState(
  input: ScenarioLabelN3ClassifyInput,
): ScenarioLabelN3AuthorityState {
  if (input.storageReadError) {
    return { kind: "AUTHORITY_BLOCKED", reason: "storage_read_error" };
  }

  if (input.targetResolution.status === "skipped") {
    return { kind: "LEGACY_UNPREPARED", reason: "target_unresolved" };
  }

  if (isUnboundResolved(input.targetResolution)) {
    return { kind: "LEGACY_UNPREPARED", reason: "target_unbound" };
  }

  const schoolId = schoolIdFromResolution(input.targetResolution);
  if (schoolId == null) {
    return { kind: "LEGACY_UNPREPARED", reason: "target_unresolved" };
  }

  if (input.marker.status === "invalid") {
    return { kind: "AUTHORITY_BLOCKED", reason: "malformed_marker" };
  }

  if (input.marker.status === "missing") {
    if (rawStoredTextEqual(input.legacyRaw, input.schoolV2Raw)) {
      return { kind: "LEGACY_UNPREPARED", reason: "marker_missing" };
    }
    return { kind: "AUTHORITY_BLOCKED", reason: "ambiguous_marker_loss" };
  }

  const payload = input.marker.payload;

  if (isScenarioLabelN3NamespacedMarker(payload)) {
    const expectedPresence = authoritativePresenceFromRaw(input.schoolV2Raw);
    if (payload.authoritativePresence !== expectedPresence) {
      return {
        kind: "NAMESPACED_DEGRADED",
        schoolId,
        marker: payload,
        reason: "presence_mismatch",
      };
    }
    if (payload.mirrorHealth === "dirty") {
      return {
        kind: "NAMESPACED_DEGRADED",
        schoolId,
        marker: payload,
        reason: "mirror_dirty",
      };
    }
    if (!rawStoredTextEqual(input.legacyRaw, input.schoolV2Raw)) {
      return {
        kind: "NAMESPACED_DEGRADED",
        schoolId,
        marker: payload,
        reason: "raw_mismatch",
      };
    }
    return { kind: "NAMESPACED_ACTIVE", schoolId, marker: payload };
  }

  if (!isScenarioLabelN3LegacyMarker(payload)) {
    return { kind: "AUTHORITY_BLOCKED", reason: "malformed_marker" };
  }

  if (payload.mirrorHealth !== "synced") {
    return { kind: "LEGACY_UNPREPARED", reason: "marker_not_synced" };
  }

  const expectedPresence = authoritativePresenceFromRaw(input.legacyRaw);
  if (payload.authoritativePresence !== expectedPresence) {
    return { kind: "LEGACY_UNPREPARED", reason: "presence_mismatch" };
  }

  if (!rawStoredTextEqual(input.legacyRaw, input.schoolV2Raw)) {
    return { kind: "LEGACY_UNPREPARED", reason: "raw_mismatch" };
  }

  return { kind: "LEGACY_PREPARED", schoolId, marker: payload };
}

/**
 * N3 cutover readiness — school-only. Unbound is NEVER ready.
 * Distinguishes needs_bootstrap_or_repair vs hard not_ready.
 */
export function assessScenarioLabelN3CutoverReadiness(
  input: ScenarioLabelN3ClassifyInput,
): ScenarioLabelN3CutoverAssessment {
  if (input.storageReadError) {
    return { status: "not_ready", reason: "storage_read_error" };
  }

  if (input.targetResolution.status === "skipped") {
    return { status: "not_ready", reason: "target_unresolved" };
  }

  if (isUnboundResolved(input.targetResolution)) {
    return { status: "not_ready", reason: "target_unbound" };
  }

  const schoolId = schoolIdFromResolution(input.targetResolution);
  if (schoolId == null) {
    return { status: "not_ready", reason: "target_unresolved" };
  }

  if (input.marker.status === "invalid") {
    return { status: "needs_bootstrap_or_repair", reason: "marker_invalid" };
  }

  if (input.marker.status === "missing") {
    return { status: "needs_bootstrap_or_repair", reason: "marker_missing" };
  }

  const payload = input.marker.payload;

  if (isScenarioLabelN3NamespacedMarker(payload)) {
    const state = classifyScenarioLabelAuthorityState(input);
    if (state.kind === "NAMESPACED_DEGRADED") {
      return { status: "not_ready", reason: "namespaced_degraded" };
    }
    return { status: "not_ready", reason: "already_namespaced" };
  }

  if (!isScenarioLabelN3LegacyMarker(payload)) {
    return { status: "needs_bootstrap_or_repair", reason: "marker_invalid" };
  }

  if (payload.authority !== "legacy") {
    return { status: "not_ready", reason: "marker_not_legacy" };
  }

  if (payload.mirrorHealth !== "synced") {
    return { status: "needs_bootstrap_or_repair", reason: "marker_not_synced" };
  }

  const expectedPresence = authoritativePresenceFromRaw(input.legacyRaw);
  if (payload.authoritativePresence !== expectedPresence) {
    return { status: "needs_bootstrap_or_repair", reason: "presence_mismatch" };
  }

  if (!rawStoredTextEqual(input.legacyRaw, input.schoolV2Raw)) {
    return { status: "needs_bootstrap_or_repair", reason: "raw_mismatch" };
  }

  const toMarker = buildScenarioLabelN3NamespacedMarker({
    mirrorHealth: "synced",
    authoritativePresence: expectedPresence,
  });

  return {
    status: "ready_for_cutover",
    schoolId,
    fromMarker: payload,
    toMarker,
  };
}

/** Pure cutover plan: metadata-last marker replace only. */
export function planScenarioLabelAuthorityCutover(
  input: ScenarioLabelN3ClassifyInput,
): ScenarioLabelN3CutoverPlan {
  const assessment = assessScenarioLabelN3CutoverReadiness(input);
  if (assessment.status === "needs_bootstrap_or_repair") {
    return {
      status: "needs_bootstrap_or_repair",
      reason: assessment.reason,
    };
  }
  if (assessment.status === "not_ready") {
    return { status: "not_ready", reason: assessment.reason };
  }

  return {
    status: "ready",
    schoolId: assessment.schoolId,
    operation: "replace_marker_only",
    fromMarker: assessment.fromMarker,
    toMarker: assessment.toMarker,
    requiresPreMarkerEquality: true,
    requiresMarkerReadBack: true,
    requiresPostMarkerEquality: true,
  };
}

/**
 * Classify a future cutover execution attempt from reported phase outcomes.
 * No storage I/O — pure outcome taxonomy for N3-CUTOVER-WRITE.
 */
export function classifyScenarioLabelAuthorityCutoverOutcome(params: {
  readonly plan: ScenarioLabelN3CutoverPlan;
  readonly preMarkerEqual: boolean;
  readonly markerWriteSucceeded: boolean;
  readonly markerReadBackMatched: boolean;
  readonly postMarkerEqual: boolean;
  readonly storageUnavailable?: boolean;
}): ScenarioLabelN3CutoverOutcome {
  if (params.storageUnavailable) {
    return { status: "storage_unavailable" };
  }
  if (params.plan.status === "not_ready") {
    return { status: "not_ready", reason: params.plan.reason };
  }
  if (params.plan.status === "needs_bootstrap_or_repair") {
    return {
      status: "needs_bootstrap_or_repair",
      reason: params.plan.reason,
    };
  }

  if (!params.preMarkerEqual) {
    return { status: "concurrent_drift", phase: "pre_marker" };
  }
  if (!params.markerWriteSucceeded) {
    return { status: "marker_write_failed" };
  }
  if (!params.markerReadBackMatched) {
    return { status: "marker_verify_failed" };
  }
  if (!params.postMarkerEqual) {
    return { status: "concurrent_drift", phase: "post_marker" };
  }
  return { status: "cutover_success" };
}

/** Pure read-routing decision. No unsafe silent legacy fallback under namespaced. */
export function decideScenarioLabelReadRoute(
  input: ScenarioLabelN3ReadRouteInput,
): ScenarioLabelN3ReadRoute {
  void SCENARIO_LABEL_N3_NO_UNSAFE_LEGACY_FALLBACK;

  if (input.storageReadError) {
    return { status: "blocked", reason: "storage_read_error" };
  }

  if (input.targetResolution.status === "skipped") {
    return { status: "blocked", reason: "target_unresolved" };
  }

  if (isUnboundResolved(input.targetResolution)) {
    return { status: "legacy", reason: "unbound_target" };
  }

  const schoolId = schoolIdFromResolution(input.targetResolution);
  if (schoolId == null) {
    return { status: "blocked", reason: "target_unresolved" };
  }

  if (input.marker.status === "invalid") {
    return { status: "blocked", reason: "malformed_marker" };
  }

  if (input.marker.status === "missing") {
    if (rawStoredTextEqual(input.legacyRaw, input.schoolV2Raw)) {
      return { status: "legacy", reason: "marker_missing_equal" };
    }
    return { status: "blocked", reason: "marker_missing_divergent" };
  }

  const payload = input.marker.payload;

  if (isScenarioLabelN3LegacyMarker(payload)) {
    return { status: "legacy", reason: "legacy_marker" };
  }

  if (!isScenarioLabelN3NamespacedMarker(payload)) {
    return { status: "blocked", reason: "malformed_marker" };
  }

  const schoolV2ReadOk = input.schoolV2ReadOk !== false;
  if (!schoolV2ReadOk) {
    return { status: "blocked", reason: "namespaced_v2_unavailable" };
  }

  const expectedPresence = authoritativePresenceFromRaw(input.schoolV2Raw);
  if (payload.authoritativePresence === "present" && !input.schoolV2Raw.exists) {
    return { status: "blocked", reason: "namespaced_presence_inconsistent" };
  }
  if (payload.authoritativePresence !== expectedPresence) {
    return { status: "blocked", reason: "namespaced_presence_inconsistent" };
  }

  if (
    payload.mirrorHealth === "dirty" ||
    !rawStoredTextEqual(input.legacyRaw, input.schoolV2Raw)
  ) {
    return {
      status: "namespaced_degraded",
      schoolId,
      signal: payload.mirrorHealth === "dirty" ? "mirror_dirty" : "legacy_diverged",
      readFrom: "school_v2",
    };
  }

  return { status: "namespaced", schoolId };
}

/**
 * Future namespaced business-write planner (strict compatibility window).
 * Order: snapshot → v2 → legacy → verify → marker last → read-back.
 */
export function planScenarioLabelNamespacedWrite(params: {
  readonly schoolId: EntityId;
  readonly authorityState: ScenarioLabelN3AuthorityState;
  readonly desiredRaw: RawStoredText;
  readonly priorSnapshot: ScenarioLabelN3RawSnapshotMembers;
}): ScenarioLabelN3NamespacedWritePlan {
  void SCENARIO_LABEL_N3_STRICT_COMPATIBILITY_MIRROR;
  void params.priorSnapshot;

  if (
    params.authorityState.kind !== "NAMESPACED_ACTIVE" &&
    params.authorityState.kind !== "NAMESPACED_DEGRADED"
  ) {
    return { status: "blocked", reason: "not_namespaced_active" };
  }

  if (params.authorityState.schoolId !== params.schoolId) {
    return { status: "blocked", reason: "target_not_school" };
  }

  const priorPresence = authoritativePresenceFromRaw(params.priorSnapshot.schoolV2);
  const desiredPresence = authoritativePresenceFromRaw(params.desiredRaw);
  const presenceChanging = priorPresence !== desiredPresence;

  return {
    status: "planned",
    schoolId: params.schoolId,
    phases: SCENARIO_LABEL_N3_NAMESPACED_WRITE_PHASE_ORDER,
    snapshotMembers: ["legacy", "school_v2", "marker"],
    desiredV2: params.desiredRaw,
    desiredLegacy: params.desiredRaw,
    strictMirror: true,
    desiredMarker: buildScenarioLabelN3NamespacedMarker({
      mirrorHealth: "synced",
      authoritativePresence: desiredPresence,
    }),
    presenceChanging,
    onV2WriteFailure: "authoritative_failed_legacy_must_not_advance",
    onLegacyMirrorFailure: "rollback_v2_then_business_fail",
    onRollbackFailure: "fatal_partial",
  };
}

/**
 * Classify reported namespaced-write phase outcomes into the failure taxonomy.
 */
export function classifyScenarioLabelNamespacedWriteOutcome(params: {
  readonly plan: ScenarioLabelN3NamespacedWritePlan;
  readonly v2WriteSucceeded: boolean;
  readonly legacyWriteSucceeded: boolean;
  readonly verifyMatched: boolean;
  readonly rollbackAttempted: boolean;
  readonly rollbackSucceeded: boolean;
  readonly markerPersistSucceeded: boolean;
  readonly storageUnavailable?: boolean;
}): ScenarioLabelN3NamespacedWriteOutcome {
  if (params.plan.status !== "planned") {
    return {
      status: "authoritative_failed",
      code: "storage_unavailable",
      legacyAdvanced: false,
    };
  }

  if (params.storageUnavailable) {
    return {
      status: "authoritative_failed",
      code: "storage_unavailable",
      legacyAdvanced: false,
    };
  }

  if (!params.v2WriteSucceeded) {
    return {
      status: "authoritative_failed",
      code: "v2_write_failed",
      legacyAdvanced: false,
    };
  }

  if (!params.legacyWriteSucceeded) {
    if (!params.rollbackAttempted) {
      return { status: "compatibility_mirror_failed", rollbackRequired: true };
    }
    if (params.rollbackSucceeded) {
      return { status: "rollback_succeeded", business: "failed" };
    }
    return {
      status: "fatal_partial",
      reason: "rollback_failed_after_partial_write",
    };
  }

  if (!params.verifyMatched) {
    if (!params.rollbackAttempted) {
      return { status: "verify_mismatch" };
    }
    if (params.rollbackSucceeded) {
      return { status: "rollback_succeeded", business: "failed" };
    }
    return {
      status: "fatal_partial",
      reason: "rollback_failed_after_partial_write",
    };
  }

  if (!params.markerPersistSucceeded) {
    if (params.plan.presenceChanging) {
      return {
        status: "marker_persist_failed",
        kind: "presence_change",
        business: "failed_conservative",
      };
    }
    return {
      status: "marker_persist_failed",
      kind: "value_only",
      business: "data_ok_metadata_incomplete",
    };
  }

  return { status: "success", rollbackInvariant: "legacy_equals_v2" };
}

/**
 * Future N2-ADOPT establishment gate under N3 authority states.
 * Namespaced → NO-OP (prevents Profile/VZ/Restore downgrade).
 */
export function decideScenarioLabelEstablishmentAction(params: {
  readonly targetResolution: ScenarioLabelMigrationTargetResolution;
  readonly marker: ScenarioLabelN3AuthorityMarkerParseResult;
}): ScenarioLabelN3EstablishmentDecision {
  if (params.targetResolution.status === "skipped") {
    return { action: "blocked", reason: "target_unresolved" };
  }

  if (isUnboundResolved(params.targetResolution)) {
    return { action: "blocked", reason: "unbound_not_applicable" };
  }

  if (params.marker.status === "invalid") {
    return { action: "blocked", reason: "malformed_authority" };
  }

  if (params.marker.status === "missing") {
    // Missing marker under school target remains N2 establishment-eligible (legacy world).
    return { action: "permit_establishment", authority: "legacy" };
  }

  if (isScenarioLabelN3NamespacedMarker(params.marker.payload)) {
    return { action: "no_op_namespaced_authoritative", authority: "namespaced" };
  }

  if (isScenarioLabelN3LegacyMarker(params.marker.payload)) {
    return { action: "permit_establishment", authority: "legacy" };
  }

  return { action: "blocked", reason: "malformed_authority" };
}

/** Pure Restore planning under current local authority. Preserves namespaced authority. */
export function planScenarioLabelRestoreForAuthority(params: {
  readonly targetResolution: ScenarioLabelMigrationTargetResolution;
  readonly marker: ScenarioLabelN3AuthorityMarkerParseResult;
  readonly logicalLabel: string;
}): ScenarioLabelN3RestorePlan {
  const schoolId = schoolIdFromResolution(params.targetResolution);
  if (schoolId == null) {
    return { status: "blocked", reason: "target_not_school" };
  }

  if (params.marker.status === "invalid") {
    return { status: "blocked", reason: "malformed_marker" };
  }

  const desired: RawStoredText = { exists: true, value: params.logicalLabel };

  if (params.marker.status === "missing") {
    // Fail closed — do not guess namespaced vs legacy from missing metadata.
    return { status: "blocked", reason: "authority_unresolved" };
  }

  if (isScenarioLabelN3NamespacedMarker(params.marker.payload)) {
    return {
      status: "planned",
      authority: "namespaced",
      schoolId,
      desiredLegacy: desired,
      desiredSchoolV2: desired,
      desiredMarker: buildScenarioLabelN3NamespacedMarker({
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
      snapshotMembers: ["legacy", "school_v2", "marker"],
    };
  }

  if (isScenarioLabelN3LegacyMarker(params.marker.payload)) {
    return {
      status: "planned",
      authority: "legacy",
      schoolId,
      desiredLegacy: desired,
      desiredSchoolV2: desired,
      desiredMarker: buildScenarioLabelN3LegacyMarker({
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
      snapshotMembers: ["legacy", "school_v2", "marker"],
    };
  }

  return { status: "blocked", reason: "authority_unresolved" };
}

/** Pure clear planning under current local authority. */
export function planScenarioLabelClearForAuthority(params: {
  readonly targetResolution: ScenarioLabelMigrationTargetResolution;
  readonly marker: ScenarioLabelN3AuthorityMarkerParseResult;
}): ScenarioLabelN3ClearPlan {
  const schoolId = schoolIdFromResolution(params.targetResolution);
  if (schoolId == null) {
    return { status: "blocked", reason: "target_not_school" };
  }

  if (params.marker.status === "invalid") {
    return { status: "blocked", reason: "malformed_marker" };
  }

  if (params.marker.status === "missing") {
    return { status: "blocked", reason: "authority_unresolved" };
  }

  const absent = { exists: false } as const;

  if (isScenarioLabelN3NamespacedMarker(params.marker.payload)) {
    return {
      status: "planned",
      authority: "namespaced",
      schoolId,
      desiredLegacy: absent,
      desiredSchoolV2: absent,
      desiredMarker: buildScenarioLabelN3NamespacedMarker({
        mirrorHealth: "synced",
        authoritativePresence: "absent",
      }),
    };
  }

  if (isScenarioLabelN3LegacyMarker(params.marker.payload)) {
    return {
      status: "planned",
      authority: "legacy",
      schoolId,
      desiredLegacy: absent,
      desiredSchoolV2: absent,
      desiredMarker: buildScenarioLabelN3LegacyMarker({
        mirrorHealth: "synced",
        authoritativePresence: "absent",
      }),
    };
  }

  return { status: "blocked", reason: "authority_unresolved" };
}

/**
 * Production cutover eligibility gate.
 * Data readiness alone is insufficient — fence + authority-aware surfaces required.
 */
export function assessScenarioLabelN3ProductionCutoverEligibility(params: {
  readonly dataReady: boolean;
  readonly fenceReady: boolean;
  readonly writersAuthorityAware: boolean;
  readonly adoptHooksAuthorityAware: boolean;
  readonly restoreAuthorityAware: boolean;
  readonly clearAuthorityAware: boolean;
  readonly snippetAuthorityAware: boolean;
}): ScenarioLabelN3ProductionCutoverEligibility {
  void SCENARIO_LABEL_N3_CUTOVER_REQUIRES_FENCE;

  const blockers: Array<
    | "fence_not_ready"
    | "data_not_ready"
    | "writers_not_authority_aware"
    | "adopt_hooks_not_authority_aware"
    | "restore_not_authority_aware"
    | "clear_not_authority_aware"
    | "snippet_not_authority_aware"
  > = [];

  if (!params.dataReady) blockers.push("data_not_ready");
  if (!params.fenceReady) blockers.push("fence_not_ready");
  if (!params.writersAuthorityAware) blockers.push("writers_not_authority_aware");
  if (!params.adoptHooksAuthorityAware) blockers.push("adopt_hooks_not_authority_aware");
  if (!params.restoreAuthorityAware) blockers.push("restore_not_authority_aware");
  if (!params.clearAuthorityAware) blockers.push("clear_not_authority_aware");
  if (!params.snippetAuthorityAware) blockers.push("snippet_not_authority_aware");

  if (blockers.length > 0) {
    return { eligible: false, blockers };
  }
  return { eligible: true };
}

/** Successful namespaced write rollback-to-N2 invariant (deployment reload). */
export function assertScenarioLabelN3SuccessfulWriteRollbackInvariant(params: {
  readonly finalLegacyRaw: RawStoredText;
  readonly finalSchoolV2Raw: RawStoredText;
}):
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "legacy_v2_divergence" } {
  if (!rawStoredTextEqual(params.finalLegacyRaw, params.finalSchoolV2Raw)) {
    return { ok: false, reason: "legacy_v2_divergence" };
  }
  return { ok: true };
}
