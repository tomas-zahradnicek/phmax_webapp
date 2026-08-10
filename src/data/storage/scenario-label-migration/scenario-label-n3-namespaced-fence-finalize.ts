/**
 * N3-AWARE-CORE — namespaced fence certificate finalizer.
 *
 * Dedicated executor for already-namespaced authority.
 * Does NOT reuse legacy finalizer semantics (soft success + fence fail).
 * `committed` only after fence set → read-back → strict parse → full assessment
 * === NAMESPACED_COMMITTED.
 *
 * Caller never supplies raw physical fence key.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import { isUuid, normalizeUuid } from "../../identity/identity-uuid";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import { rawStoredTextEqual, rawStoredTextFromNullable } from "./scenario-label-migration-raw";
import type { RawStoredText } from "./scenario-label-migration-types";
import {
  isScenarioLabelN3NamespacedMarker,
  parseScenarioLabelN3AuthorityMarkerJson,
} from "./scenario-label-n3-authority-marker";
import type { ScenarioLabelAwareStorage } from "./scenario-label-n3-aware-types";
import { serializeScenarioLabelN3FenceKey } from "./scenario-label-n3-fence-key";
import { assessScenarioLabelN3FenceState } from "./scenario-label-n3-fence-protocol";
import {
  buildScenarioLabelN3FenceRecord,
  parseScenarioLabelN3FenceRecordJson,
  serializeScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-record";
import type { ScenarioLabelN3FenceRecordParseResult } from "./scenario-label-n3-fence-types";

export type ScenarioLabelNamespacedFenceFinalizeResult =
  | { readonly status: "already_committed" }
  | { readonly status: "committed" }
  | { readonly status: "skipped"; readonly reason: "invalid_school_id" }
  | {
      readonly status: "not_certifiable";
      readonly reason:
        | "marker_missing"
        | "marker_invalid"
        | "marker_not_namespaced"
        | "marker_not_synced"
        | "raw_mismatch"
        | "presence_mismatch"
        | "legacy_marker";
    }
  | { readonly status: "incomplete"; readonly reason: "fence_write_failed" }
  | {
      readonly status: "verify_failed";
      readonly reason: "read_back_malformed" | "assessment_not_namespaced_committed";
    }
  | { readonly status: "concurrent_drift" }
  | { readonly status: "storage_unavailable" };

export type FinalizeScenarioLabelNamespacedFenceDependencies = {
  readonly storage: ScenarioLabelAwareStorage;
  readonly schoolId: EntityId;
};

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
  let raw: string | null;
  try {
    raw = storage.getItem(fenceKey);
  } catch {
    throw new Error("storage_unavailable");
  }
  return parseScenarioLabelN3FenceRecordJson(raw);
}

/**
 * Finalize the namespaced school fence certificate LAST.
 * committedRaw is taken from authoritative school-v2.
 * Never invents unbound fences. Never accepts caller-supplied physical keys.
 */
export function finalizeScenarioLabelNamespacedFenceCertificate(
  deps: FinalizeScenarioLabelNamespacedFenceDependencies,
): ScenarioLabelNamespacedFenceFinalizeResult {
  if (!isCanonicalSchoolId(deps.schoolId)) {
    return { status: "skipped", reason: "invalid_school_id" };
  }

  const storage = deps.storage;
  const schoolId = deps.schoolId;
  const schoolTarget = { kind: "school" as const, schoolId };
  const schoolKey = buildScenarioLabelNamespacedKey(schoolTarget);
  const markerKey = serializeScenarioLabelMigrationMarkerKey(schoolTarget);
  const fenceKey = serializeScenarioLabelN3FenceKey(schoolTarget);
  const targetResolution = {
    status: "resolved" as const,
    target: schoolTarget,
  };

  let legacyRaw: RawStoredText;
  let schoolV2Raw: RawStoredText;
  let markerJson: string | null;
  try {
    legacyRaw = readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
    schoolV2Raw = readRaw(storage, schoolKey);
    markerJson = storage.getItem(markerKey);
  } catch {
    return { status: "storage_unavailable" };
  }

  const marker = parseScenarioLabelN3AuthorityMarkerJson(markerJson);

  if (marker.status === "valid" && marker.payload.authority === "legacy") {
    return { status: "not_certifiable", reason: "legacy_marker" };
  }

  let fenceParse: ScenarioLabelN3FenceRecordParseResult;
  try {
    fenceParse = readFenceParse(storage, fenceKey);
  } catch {
    return { status: "storage_unavailable" };
  }

  const preAssessment = assessScenarioLabelN3FenceState({
    targetResolution,
    fence: fenceParse,
    marker,
    legacyRaw,
    schoolV2Raw,
  });

  if (preAssessment.status === "NAMESPACED_COMMITTED") {
    return { status: "already_committed" };
  }

  if (marker.status === "missing") {
    return { status: "not_certifiable", reason: "marker_missing" };
  }
  if (marker.status === "invalid") {
    return { status: "not_certifiable", reason: "marker_invalid" };
  }
  if (!isScenarioLabelN3NamespacedMarker(marker.payload)) {
    return { status: "not_certifiable", reason: "marker_not_namespaced" };
  }
  if (marker.payload.mirrorHealth !== "synced") {
    return { status: "not_certifiable", reason: "marker_not_synced" };
  }
  if (!rawStoredTextEqual(legacyRaw, schoolV2Raw)) {
    return { status: "not_certifiable", reason: "raw_mismatch" };
  }
  const expectedPresence = schoolV2Raw.exists ? "present" : "absent";
  if (marker.payload.authoritativePresence !== expectedPresence) {
    return { status: "not_certifiable", reason: "presence_mismatch" };
  }

  // Certificate: authority namespaced, markerSchemaVersion 2, protocolGeneration 3,
  // committedRaw from authoritative school-v2.
  const record = buildScenarioLabelN3FenceRecord({
    authority: "namespaced",
    schoolId,
    committedRaw: schoolV2Raw,
  });

  let serialized: string;
  try {
    serialized = serializeScenarioLabelN3FenceRecord(record);
  } catch {
    return { status: "incomplete", reason: "fence_write_failed" };
  }

  try {
    storage.setItem(fenceKey, serialized);
  } catch {
    return { status: "incomplete", reason: "fence_write_failed" };
  }

  let postLegacy: RawStoredText;
  let postSchool: RawStoredText;
  let postMarkerJson: string | null;
  let postFence: ScenarioLabelN3FenceRecordParseResult;
  try {
    postLegacy = readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
    postSchool = readRaw(storage, schoolKey);
    postMarkerJson = storage.getItem(markerKey);
    postFence = readFenceParse(storage, fenceKey);
  } catch {
    return { status: "storage_unavailable" };
  }

  if (postFence.status !== "valid") {
    return { status: "verify_failed", reason: "read_back_malformed" };
  }

  const postMarker = parseScenarioLabelN3AuthorityMarkerJson(postMarkerJson);
  const postAssessment = assessScenarioLabelN3FenceState({
    targetResolution,
    fence: postFence,
    marker: postMarker,
    legacyRaw: postLegacy,
    schoolV2Raw: postSchool,
  });

  if (postAssessment.status === "NAMESPACED_COMMITTED") {
    return { status: "committed" };
  }

  if (
    !rawStoredTextEqual(postLegacy, legacyRaw) ||
    !rawStoredTextEqual(postSchool, schoolV2Raw)
  ) {
    return { status: "concurrent_drift" };
  }

  return { status: "verify_failed", reason: "assessment_not_namespaced_committed" };
}
