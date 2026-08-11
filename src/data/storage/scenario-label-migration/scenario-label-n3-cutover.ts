/**
 * N3-CUTOVER-CORE — inert authority cutover executor.
 *
 * Sole legal authority transition:
 *   LEGACY_COMMITTED / LEGACY_READY  →  NAMESPACED_COMMITTED / NAMESPACED_READY
 *
 * Mutates ONLY metadata (migration marker + protocol-commit fence).
 * Never writes business legacy / school-v2 keys.
 * Never restores business raws on rollback.
 *
 * Production call sites in this phase: ZERO (see source-contract tests).
 * ACTIVATE is a separate PR.
 *
 * ---------------------------------------------------------------------------
 * POST-MARKER BUSINESS DRIFT POLICY (fail-closed)
 * ---------------------------------------------------------------------------
 * After schema2 marker is written, if legacy or school-v2 presence/value drifts
 * before namespaced fence finalization:
 *   - NEVER write a namespaced fence
 *   - NEVER blindly resurrect the pre-cutover legacy fence (it may certify stale raw A
 *     while current business is B)
 *   - Metadata rollback (marker v2→v1 and/or fence restore) is allowed ONLY when the
 *     fresh business tuple is still coherent legacy AND the snapshot legacy fence
 *     committedRaw exactly matches the current business raws
 *   - Otherwise leave the intermediate metadata state for AWARE fail-closed assessment
 *     and return cutover_degraded / fatal_partial
 * ---------------------------------------------------------------------------
 * NO PERSISTENT JOURNAL — crash between marker and fence leaves an intermediate that
 * AWARE must fail-close; see SCENARIO_LABEL_N3_CUTOVER_CRASH_LIMITATION.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import { isUuid, normalizeUuid } from "../../identity/identity-uuid";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import {
  authoritativePresenceFromRaw,
  rawStoredTextEqual,
  rawStoredTextFromNullable,
} from "./scenario-label-migration-raw";
import type { RawStoredText } from "./scenario-label-migration-types";
import {
  buildScenarioLabelN3NamespacedMarker,
  isScenarioLabelN3LegacyMarker,
  isScenarioLabelN3NamespacedMarker,
  parseScenarioLabelN3AuthorityMarkerJson,
  serializeScenarioLabelN3AuthorityMarker,
} from "./scenario-label-n3-authority-marker";
import { assessScenarioLabelN3CutoverReadiness } from "./scenario-label-n3-authority-protocol";
import type { ScenarioLabelN3AuthorityMarkerParseResult } from "./scenario-label-n3-authority-types";
import { assessScenarioLabelRuntimeAuthority } from "./scenario-label-n3-aware-assessment";
import type { ScenarioLabelAwareStorage } from "./scenario-label-n3-aware-types";
import {
  SCENARIO_LABEL_N3_CUTOVER_CORE_INERT,
  SCENARIO_LABEL_N3_CUTOVER_FENCE_WRITTEN_LAST,
  SCENARIO_LABEL_N3_CUTOVER_NO_BUSINESS_WRITES,
  SCENARIO_LABEL_N3_CUTOVER_NO_PERSISTENT_JOURNAL,
  SCENARIO_LABEL_N3_CUTOVER_PRODUCTION_ACTIVE,
  type ScenarioLabelN3AuthorityCutoverResult,
  type ScenarioLabelN3CutoverBusinessSnapshot,
  type ScenarioLabelN3CutoverMetadataSnapshot,
  type ScenarioLabelN3CutoverNotEligibleReason,
} from "./scenario-label-n3-cutover-types";
import { serializeScenarioLabelN3FenceKey } from "./scenario-label-n3-fence-key";
import {
  assessScenarioLabelFenceCutoverEligibility,
  assessScenarioLabelN3FenceState,
} from "./scenario-label-n3-fence-protocol";
import {
  buildScenarioLabelN3FenceRecord,
  parseScenarioLabelN3FenceRecordJson,
  serializeScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-record";
import {
  SCENARIO_LABEL_N3_FENCE_RESOURCE,
  type ScenarioLabelN3FenceRecordParseResult,
} from "./scenario-label-n3-fence-types";

export type ExecuteScenarioLabelN3AuthorityCutoverDependencies = {
  readonly storage: ScenarioLabelAwareStorage;
  readonly schoolId: EntityId;
};

void SCENARIO_LABEL_N3_CUTOVER_CORE_INERT;
void SCENARIO_LABEL_N3_CUTOVER_PRODUCTION_ACTIVE;
void SCENARIO_LABEL_N3_CUTOVER_NO_PERSISTENT_JOURNAL;
void SCENARIO_LABEL_N3_CUTOVER_NO_BUSINESS_WRITES;
void SCENARIO_LABEL_N3_CUTOVER_FENCE_WRITTEN_LAST;

function isCanonicalSchoolId(value: unknown): value is EntityId {
  return typeof value === "string" && isUuid(value) && value === normalizeUuid(value);
}

function readRaw(storage: ScenarioLabelAwareStorage, key: string): RawStoredText {
  return rawStoredTextFromNullable(storage.getItem(key));
}

function readFenceParse(
  storage: ScenarioLabelAwareStorage,
  fenceKey: string,
): ScenarioLabelN3FenceRecordParseResult {
  return parseScenarioLabelN3FenceRecordJson(storage.getItem(fenceKey));
}

function restorePhysicalExact(
  storage: ScenarioLabelAwareStorage,
  key: string,
  prior: string | null,
): boolean {
  try {
    const current = storage.getItem(key);
    // Already matches snapshot (e.g. fence write never landed) — no write needed.
    if (current === prior) return true;
    if (prior == null) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, prior);
    }
    return true;
  } catch {
    return false;
  }
}

function verifyPhysicalExact(
  storage: ScenarioLabelAwareStorage,
  key: string,
  expected: string | null,
): boolean {
  try {
    const actual = storage.getItem(key);
    return actual === expected;
  } catch {
    return false;
  }
}

type SchoolKeys = {
  readonly schoolTarget: { readonly kind: "school"; readonly schoolId: EntityId };
  readonly schoolKey: string;
  readonly markerKey: string;
  readonly fenceKey: string;
};

function schoolKeysFor(schoolId: EntityId): SchoolKeys {
  const schoolTarget = { kind: "school" as const, schoolId };
  return {
    schoolTarget,
    schoolKey: buildScenarioLabelNamespacedKey(schoolTarget),
    markerKey: serializeScenarioLabelMigrationMarkerKey(schoolTarget),
    fenceKey: serializeScenarioLabelN3FenceKey(schoolTarget),
  };
}

type FreshTuple = {
  readonly legacyRaw: RawStoredText;
  readonly schoolV2Raw: RawStoredText;
  readonly markerJson: string | null;
  readonly fenceJson: string | null;
  readonly marker: ScenarioLabelN3AuthorityMarkerParseResult;
  readonly fence: ScenarioLabelN3FenceRecordParseResult;
};

function readFreshTuple(
  storage: ScenarioLabelAwareStorage,
  keys: SchoolKeys,
): FreshTuple {
  const legacyRaw = readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
  const schoolV2Raw = readRaw(storage, keys.schoolKey);
  const markerJson = storage.getItem(keys.markerKey);
  const fenceJson = storage.getItem(keys.fenceKey);
  return {
    legacyRaw,
    schoolV2Raw,
    markerJson,
    fenceJson,
    marker: parseScenarioLabelN3AuthorityMarkerJson(markerJson),
    fence: readFenceParse(storage, keys.fenceKey),
  };
}

/**
 * Safe metadata rollback proof after a partial cutover attempt.
 * Requires coherent equal business tuple AND snapshot legacy fence certifying those exact raws.
 * Never restores business keys.
 */
function canSafelyRollbackMetadataToLegacy(params: {
  readonly storage: ScenarioLabelAwareStorage;
  readonly keys: SchoolKeys;
  readonly schoolId: EntityId;
  readonly metadata: ScenarioLabelN3CutoverMetadataSnapshot;
}): boolean {
  let fresh: FreshTuple;
  try {
    fresh = readFreshTuple(params.storage, params.keys);
  } catch {
    return false;
  }

  if (!rawStoredTextEqual(fresh.legacyRaw, fresh.schoolV2Raw)) {
    return false;
  }

  const snapshotMarker = parseScenarioLabelN3AuthorityMarkerJson(params.metadata.markerRaw);
  if (snapshotMarker.status !== "valid") return false;
  if (!isScenarioLabelN3LegacyMarker(snapshotMarker.payload)) return false;
  if (snapshotMarker.payload.mirrorHealth !== "synced") return false;
  const expectedPresence = authoritativePresenceFromRaw(fresh.legacyRaw);
  if (snapshotMarker.payload.authoritativePresence !== expectedPresence) {
    return false;
  }

  const snapshotFence = parseScenarioLabelN3FenceRecordJson(params.metadata.fenceRaw);
  if (snapshotFence.status !== "valid") return false;
  if (snapshotFence.record.authority !== "legacy") return false;
  if (snapshotFence.record.schoolId !== params.schoolId) return false;
  if (snapshotFence.record.resource !== SCENARIO_LABEL_N3_FENCE_RESOURCE) return false;
  if (snapshotFence.record.markerSchemaVersion !== 1) return false;
  if (!rawStoredTextEqual(snapshotFence.record.committedRaw, fresh.legacyRaw)) {
    // Stale fence resurrection forbidden: certificate does not match current business.
    return false;
  }

  return true;
}

function attemptMetadataRollback(params: {
  readonly storage: ScenarioLabelAwareStorage;
  readonly keys: SchoolKeys;
  readonly schoolId: EntityId;
  readonly metadata: ScenarioLabelN3CutoverMetadataSnapshot;
  readonly phase: "marker_verify" | "fence_write" | "fence_verify" | "post_marker_drift";
}): ScenarioLabelN3AuthorityCutoverResult {
  const { storage, keys, schoolId, metadata, phase } = params;

  if (
    !canSafelyRollbackMetadataToLegacy({
      storage,
      keys,
      schoolId,
      metadata,
    })
  ) {
    if (phase === "post_marker_drift") {
      return {
        status: "cutover_degraded",
        reason: "stale_fence_resurrection_forbidden",
        schoolId,
      };
    }
    return {
      status: "cutover_degraded",
      reason: "rollback_not_safe",
      schoolId,
    };
  }

  const markerOk = restorePhysicalExact(storage, keys.markerKey, metadata.markerRaw);
  const fenceOk = restorePhysicalExact(storage, keys.fenceKey, metadata.fenceRaw);

  if (!markerOk || !fenceOk) {
    return {
      status: "fatal_partial",
      reason: !markerOk ? "marker_rollback_failed" : "fence_rollback_failed",
      phase,
      schoolId,
    };
  }

  const markerVerified = verifyPhysicalExact(storage, keys.markerKey, metadata.markerRaw);
  const fenceVerified = verifyPhysicalExact(storage, keys.fenceKey, metadata.fenceRaw);
  if (!markerVerified || !fenceVerified) {
    return {
      status: "fatal_partial",
      reason: "metadata_rollback_incomplete",
      phase,
      schoolId,
    };
  }

  // Fresh proof: back to LEGACY_READY (never claim cutover_success from rollback).
  let post;
  try {
    post = assessScenarioLabelRuntimeAuthority({ storage, schoolId });
  } catch {
    return {
      status: "fatal_partial",
      reason: "metadata_rollback_incomplete",
      phase,
      schoolId,
    };
  }

  if (post.kind === "LEGACY_READY") {
    const from =
      phase === "marker_verify"
        ? ("marker_verify_failed" as const)
        : phase === "fence_write"
          ? ("fence_write_failed" as const)
          : ("fence_verify_failed" as const);
    // post_marker_drift safe rollback also reports rolled_back via fence_verify class
    // only when we actually attempted fence path — use marker_verify_failed for marker-only.
    if (phase === "post_marker_drift") {
      return {
        status: "rolled_back",
        from: "marker_verify_failed",
        schoolId,
      };
    }
    return { status: "rolled_back", from, schoolId };
  }

  return {
    status: "fatal_partial",
    reason: "metadata_rollback_incomplete",
    phase,
    schoolId,
  };
}

function mapFenceEligibilityReason(
  reason: string,
): ScenarioLabelN3CutoverNotEligibleReason {
  switch (reason) {
    case "unbound_never_eligible":
      return "unbound_never_eligible";
    case "target_unresolved":
      return "target_unresolved";
    case "data_not_ready":
      return "data_not_ready_for_cutover";
    case "fence_unestablished":
      return "fence_missing";
    case "fence_violated":
      return "legacy_violated";
    case "fence_invalid":
      return "fence_wrong_authority";
    case "fence_unavailable":
      return "storage_unreadable";
    case "fence_namespaced_committed":
      return "runtime_not_legacy_ready";
    case "target_mismatch":
      return "fence_wrong_school";
    case "fence_not_legacy_committed":
    default:
      return "fence_not_legacy_committed";
  }
}

function evaluateFreshEligibility(
  storage: ScenarioLabelAwareStorage,
  schoolId: EntityId,
  keys: SchoolKeys,
):
  | { readonly ok: true; readonly tuple: FreshTuple }
  | { readonly ok: false; readonly result: ScenarioLabelN3AuthorityCutoverResult } {
  let runtime;
  try {
    runtime = assessScenarioLabelRuntimeAuthority({ storage, schoolId });
  } catch {
    return { ok: false, result: { status: "storage_unavailable" } };
  }

  if (runtime.kind === "STORAGE_UNAVAILABLE") {
    return { ok: false, result: { status: "storage_unavailable" } };
  }
  if (runtime.kind === "NAMESPACED_READY" || runtime.kind === "NAMESPACED_DEGRADED") {
    return {
      ok: false,
      result: {
        status: "already_namespaced",
        schoolId,
        kind: runtime.kind,
      },
    };
  }
  if (runtime.kind === "UNBOUND") {
    return {
      ok: false,
      result: { status: "not_eligible", reason: "unbound_never_eligible" },
    };
  }
  if (runtime.kind === "AUTHORITY_BLOCKED") {
    return {
      ok: false,
      result: { status: "not_eligible", reason: "authority_blocked" },
    };
  }
  if (runtime.kind === "LEGACY_COMPAT_UNPREPARED") {
    return {
      ok: false,
      result: { status: "not_eligible", reason: "legacy_unprepared" },
    };
  }
  if (runtime.kind === "LEGACY_VIOLATED_RECOVERABLE") {
    return {
      ok: false,
      result: { status: "not_eligible", reason: "legacy_violated" },
    };
  }
  if (runtime.kind !== "LEGACY_READY") {
    return {
      ok: false,
      result: { status: "not_eligible", reason: "runtime_not_legacy_ready" },
    };
  }

  let tuple: FreshTuple;
  try {
    tuple = readFreshTuple(storage, keys);
  } catch {
    return { ok: false, result: { status: "storage_unavailable" } };
  }

  if (tuple.marker.status !== "valid" || !isScenarioLabelN3LegacyMarker(tuple.marker.payload)) {
    return {
      ok: false,
      result: {
        status: "not_eligible",
        reason: tuple.marker.status === "missing" ? "marker_missing" : "marker_invalid",
      },
    };
  }
  if (tuple.marker.payload.mirrorHealth !== "synced") {
    return { ok: false, result: { status: "not_eligible", reason: "mirror_dirty" } };
  }
  if (!rawStoredTextEqual(tuple.legacyRaw, tuple.schoolV2Raw)) {
    return { ok: false, result: { status: "not_eligible", reason: "raw_mismatch" } };
  }
  const expectedPresence = authoritativePresenceFromRaw(tuple.legacyRaw);
  if (tuple.marker.payload.authoritativePresence !== expectedPresence) {
    return { ok: false, result: { status: "not_eligible", reason: "presence_mismatch" } };
  }

  if (tuple.fence.status !== "valid") {
    return {
      ok: false,
      result: {
        status: "not_eligible",
        reason: tuple.fence.status === "missing" ? "fence_missing" : "fence_wrong_authority",
      },
    };
  }
  if (tuple.fence.record.schoolId !== schoolId) {
    return { ok: false, result: { status: "not_eligible", reason: "fence_wrong_school" } };
  }
  if (tuple.fence.record.resource !== SCENARIO_LABEL_N3_FENCE_RESOURCE) {
    return { ok: false, result: { status: "not_eligible", reason: "fence_wrong_resource" } };
  }
  if (tuple.fence.record.authority !== "legacy") {
    return { ok: false, result: { status: "not_eligible", reason: "fence_wrong_authority" } };
  }
  if (tuple.fence.record.markerSchemaVersion !== 1) {
    return { ok: false, result: { status: "not_eligible", reason: "fence_wrong_authority" } };
  }
  if (!rawStoredTextEqual(tuple.fence.record.committedRaw, tuple.legacyRaw)) {
    return {
      ok: false,
      result: { status: "not_eligible", reason: "fence_committed_raw_mismatch" },
    };
  }

  const targetResolution = {
    status: "resolved" as const,
    target: keys.schoolTarget,
  };

  const cutoverAssessment = assessScenarioLabelN3CutoverReadiness({
    targetResolution,
    marker: tuple.marker,
    legacyRaw: tuple.legacyRaw,
    schoolV2Raw: tuple.schoolV2Raw,
  });
  if (cutoverAssessment.status !== "ready_for_cutover") {
    return {
      ok: false,
      result: { status: "not_eligible", reason: "data_not_ready_for_cutover" },
    };
  }

  const fenceAssessment = assessScenarioLabelN3FenceState({
    targetResolution,
    fence: tuple.fence,
    marker: tuple.marker,
    legacyRaw: tuple.legacyRaw,
    schoolV2Raw: tuple.schoolV2Raw,
  });
  if (fenceAssessment.status !== "LEGACY_COMMITTED") {
    return {
      ok: false,
      result: { status: "not_eligible", reason: "fence_not_legacy_committed" },
    };
  }

  // Canonical structured eligibility — NEVER caller-supplied fenceReady boolean.
  const fenceCutover = assessScenarioLabelFenceCutoverEligibility({
    cutoverAssessment,
    fenceAssessment,
  });
  if (!fenceCutover.eligible) {
    return {
      ok: false,
      result: {
        status: "not_eligible",
        reason: mapFenceEligibilityReason(fenceCutover.reason),
      },
    };
  }

  return { ok: true, tuple };
}

function verifyNamespacedMarkerReadBack(
  marker: ScenarioLabelN3AuthorityMarkerParseResult,
  expectedPresence: "present" | "absent",
): boolean {
  return (
    marker.status === "valid" &&
    isScenarioLabelN3NamespacedMarker(marker.payload) &&
    marker.payload.schemaVersion === 2 &&
    marker.payload.authority === "namespaced" &&
    marker.payload.mirrorHealth === "synced" &&
    marker.payload.authoritativePresence === expectedPresence
  );
}

/**
 * Execute inert authority cutover for a canonical school target.
 *
 * 0 production owners in CUTOVER-CORE. Tests may call directly.
 */
export function executeScenarioLabelN3AuthorityCutover(
  deps: ExecuteScenarioLabelN3AuthorityCutoverDependencies,
): ScenarioLabelN3AuthorityCutoverResult {
  if (!isCanonicalSchoolId(deps.schoolId)) {
    return { status: "skipped_identity" };
  }

  const storage = deps.storage;
  const schoolId = deps.schoolId;
  const keys = schoolKeysFor(schoolId);

  // 1. Fresh eligibility
  const initial = evaluateFreshEligibility(storage, schoolId, keys);
  if (!initial.ok) return initial.result;

  const expectedPresence = authoritativePresenceFromRaw(initial.tuple.legacyRaw);

  // 2. Snapshot (metadata rollback vs business comparison — distinct)
  const metadataSnapshot: ScenarioLabelN3CutoverMetadataSnapshot = {
    markerRaw: initial.tuple.markerJson,
    fenceRaw: initial.tuple.fenceJson,
  };
  const businessSnapshot: ScenarioLabelN3CutoverBusinessSnapshot = {
    legacyRaw: initial.tuple.legacyRaw,
    schoolV2Raw: initial.tuple.schoolV2Raw,
  };

  // 3. Final pre-marker fresh drift / equality check (no automatic retry)
  let preMarker: FreshTuple;
  try {
    preMarker = readFreshTuple(storage, keys);
  } catch {
    return { status: "storage_unavailable" };
  }

  const preCheck = evaluateFreshEligibility(storage, schoolId, keys);
  if (!preCheck.ok) {
    if (preCheck.result.status === "already_namespaced") return preCheck.result;
    if (preCheck.result.status === "storage_unavailable") return preCheck.result;
    return { status: "concurrent_drift", phase: "pre_marker" };
  }
  if (
    !rawStoredTextEqual(preMarker.legacyRaw, businessSnapshot.legacyRaw) ||
    !rawStoredTextEqual(preMarker.schoolV2Raw, businessSnapshot.schoolV2Raw) ||
    preMarker.markerJson !== metadataSnapshot.markerRaw ||
    preMarker.fenceJson !== metadataSnapshot.fenceRaw
  ) {
    return { status: "concurrent_drift", phase: "pre_marker" };
  }

  // 4. Write schemaVersion:2 authority:namespaced marker
  const desiredMarker = buildScenarioLabelN3NamespacedMarker({
    mirrorHealth: "synced",
    authoritativePresence: expectedPresence,
  });
  let markerSerialized: string;
  try {
    markerSerialized = serializeScenarioLabelN3AuthorityMarker(desiredMarker);
  } catch {
    return { status: "marker_write_failed" };
  }

  try {
    storage.setItem(keys.markerKey, markerSerialized);
  } catch {
    // Business unchanged; old legacy marker/fence remain.
    return { status: "marker_write_failed" };
  }

  // 5–6. Fresh marker read-back + parse/schema/authority/presence verify
  let markerBack: ScenarioLabelN3AuthorityMarkerParseResult;
  try {
    markerBack = parseScenarioLabelN3AuthorityMarkerJson(storage.getItem(keys.markerKey));
  } catch {
    return attemptMetadataRollback({
      storage,
      keys,
      schoolId,
      metadata: metadataSnapshot,
      phase: "marker_verify",
    });
  }

  if (!verifyNamespacedMarkerReadBack(markerBack, expectedPresence)) {
    // Business may still be unchanged — prefer safe metadata rollback.
    let businessStillEqual = false;
    try {
      const cur = readFreshTuple(storage, keys);
      businessStillEqual =
        rawStoredTextEqual(cur.legacyRaw, businessSnapshot.legacyRaw) &&
        rawStoredTextEqual(cur.schoolV2Raw, businessSnapshot.schoolV2Raw);
    } catch {
      businessStillEqual = false;
    }

    if (!businessStillEqual) {
      return {
        status: "cutover_degraded",
        reason: "post_marker_business_drift",
        schoolId,
      };
    }

    return attemptMetadataRollback({
      storage,
      keys,
      schoolId,
      metadata: metadataSnapshot,
      phase: "marker_verify",
    });
  }

  // 7–8. Fresh re-read business + post-marker equality / presence
  let postMarkerBusiness: { legacyRaw: RawStoredText; schoolV2Raw: RawStoredText };
  try {
    postMarkerBusiness = {
      legacyRaw: readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY),
      schoolV2Raw: readRaw(storage, keys.schoolKey),
    };
  } catch {
    return attemptMetadataRollback({
      storage,
      keys,
      schoolId,
      metadata: metadataSnapshot,
      phase: "marker_verify",
    });
  }

  if (
    !rawStoredTextEqual(postMarkerBusiness.legacyRaw, businessSnapshot.legacyRaw) ||
    !rawStoredTextEqual(postMarkerBusiness.schoolV2Raw, businessSnapshot.schoolV2Raw)
  ) {
    // CRITICAL: never write namespaced fence; never blindly resurrect stale legacy fence.
    // Business raws are NOT restored.
    return attemptMetadataRollback({
      storage,
      keys,
      schoolId,
      metadata: metadataSnapshot,
      phase: "post_marker_drift",
    });
  }

  // 9. Write namespaced protocol-commit fence LAST
  const namespacedFence = buildScenarioLabelN3FenceRecord({
    authority: "namespaced",
    schoolId,
    committedRaw: postMarkerBusiness.schoolV2Raw,
  });
  let fenceSerialized: string;
  try {
    fenceSerialized = serializeScenarioLabelN3FenceRecord(namespacedFence);
  } catch {
    return attemptMetadataRollback({
      storage,
      keys,
      schoolId,
      metadata: metadataSnapshot,
      phase: "fence_write",
    });
  }

  try {
    storage.setItem(keys.fenceKey, fenceSerialized);
  } catch {
    return attemptMetadataRollback({
      storage,
      keys,
      schoolId,
      metadata: metadataSnapshot,
      phase: "fence_write",
    });
  }

  // 10–11. Fresh fence read-back + full runtime/fence assessment
  let finalRuntime;
  let finalFenceAssessment;
  try {
    const finalTuple = readFreshTuple(storage, keys);
    if (finalTuple.fence.status !== "valid") {
      return attemptMetadataRollback({
        storage,
        keys,
        schoolId,
        metadata: metadataSnapshot,
        phase: "fence_verify",
      });
    }
    if (
      finalTuple.fence.record.authority !== "namespaced" ||
      finalTuple.fence.record.schoolId !== schoolId ||
      finalTuple.fence.record.resource !== SCENARIO_LABEL_N3_FENCE_RESOURCE ||
      finalTuple.fence.record.markerSchemaVersion !== 2 ||
      !rawStoredTextEqual(finalTuple.fence.record.committedRaw, postMarkerBusiness.schoolV2Raw)
    ) {
      return attemptMetadataRollback({
        storage,
        keys,
        schoolId,
        metadata: metadataSnapshot,
        phase: "fence_verify",
      });
    }

    finalFenceAssessment = assessScenarioLabelN3FenceState({
      targetResolution: {
        status: "resolved",
        target: keys.schoolTarget,
      },
      fence: finalTuple.fence,
      marker: finalTuple.marker,
      legacyRaw: finalTuple.legacyRaw,
      schoolV2Raw: finalTuple.schoolV2Raw,
    });

    finalRuntime = assessScenarioLabelRuntimeAuthority({ storage, schoolId });
  } catch {
    return attemptMetadataRollback({
      storage,
      keys,
      schoolId,
      metadata: metadataSnapshot,
      phase: "fence_verify",
    });
  }

  // 12. Success ONLY if NAMESPACED_READY AND fence NAMESPACED_COMMITTED
  if (
    finalRuntime.kind === "NAMESPACED_READY" &&
    finalFenceAssessment.status === "NAMESPACED_COMMITTED"
  ) {
    // Prove business unchanged.
    if (
      rawStoredTextEqual(finalRuntime.legacyRaw, businessSnapshot.legacyRaw) &&
      rawStoredTextEqual(finalRuntime.schoolV2Raw, businessSnapshot.schoolV2Raw)
    ) {
      return { status: "cutover_success", schoolId };
    }
    // Business drifted after fence write — fail closed via rollback attempt.
    return attemptMetadataRollback({
      storage,
      keys,
      schoolId,
      metadata: metadataSnapshot,
      phase: "fence_verify",
    });
  }

  return attemptMetadataRollback({
    storage,
    keys,
    schoolId,
    metadata: metadataSnapshot,
    phase: "fence_verify",
  });
}
