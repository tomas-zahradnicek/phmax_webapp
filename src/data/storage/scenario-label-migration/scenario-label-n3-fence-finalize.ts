/**
 * N3-FENCE-WRITE — runtime finalizer for legacy-authoritative school fence certificates.
 *
 * Fence is written LAST after a compatible mutation has already settled
 * legacy + school v2 + v1 marker. Business authority remains legacy-only.
 *
 * `committed` means post-write full pure assessment === LEGACY_COMMITTED.
 * Fence failure never overturns an authoritative business success.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import { isUuid, normalizeUuid } from "../../identity/identity-uuid";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { rawStoredTextEqual, rawStoredTextFromNullable } from "./scenario-label-migration-raw";
import type { RawStoredText } from "./scenario-label-migration-types";
import { parseScenarioLabelN3AuthorityMarkerJson } from "./scenario-label-n3-authority-marker";
import { serializeScenarioLabelN3FenceKey } from "./scenario-label-n3-fence-key";
import { assessScenarioLabelN3FenceState } from "./scenario-label-n3-fence-protocol";
import {
  buildScenarioLabelN3FenceRecord,
  parseScenarioLabelN3FenceRecordJson,
  serializeScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-record";
import type { ScenarioLabelN3FenceRecordParseResult } from "./scenario-label-n3-fence-types";

export type ScenarioLabelFenceFinalizeStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

export type ScenarioLabelFenceFinalizeResult =
  | { readonly status: "already_committed" }
  | { readonly status: "committed" }
  | { readonly status: "skipped"; readonly reason: "invalid_school_id" }
  | {
      readonly status: "not_certifiable";
      readonly reason:
        | "marker_missing"
        | "marker_invalid"
        | "marker_not_legacy"
        | "marker_not_synced"
        | "raw_mismatch"
        | "presence_mismatch"
        | "namespaced_marker";
    }
  | { readonly status: "incomplete"; readonly reason: "fence_write_failed" }
  | {
      readonly status: "verify_failed";
      readonly reason: "read_back_malformed" | "assessment_not_legacy_committed";
    }
  | { readonly status: "concurrent_drift" }
  | { readonly status: "storage_unavailable" };

export type FinalizeScenarioLabelLegacyFenceDependencies = {
  readonly storage: ScenarioLabelFenceFinalizeStorage;
  readonly schoolId: EntityId;
};

function isCanonicalSchoolId(value: unknown): value is EntityId {
  return typeof value === "string" && isUuid(value) && value === normalizeUuid(value);
}

function readRaw(
  storage: ScenarioLabelFenceFinalizeStorage,
  key: string,
): RawStoredText {
  return rawStoredTextFromNullable(storage.getItem(key));
}

function readFenceParse(
  storage: ScenarioLabelFenceFinalizeStorage,
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
 * Finalize (or no-op) the school fence certificate for the current physical tuple.
 * Caller must already have completed legacy + school v2 + v1 marker for a school target.
 * Never writes schema2 namespaced markers. Never invents unbound fences.
 */
export function finalizeScenarioLabelLegacyFenceCertificate(
  deps: FinalizeScenarioLabelLegacyFenceDependencies,
): ScenarioLabelFenceFinalizeResult {
  if (!isCanonicalSchoolId(deps.schoolId)) {
    return { status: "skipped", reason: "invalid_school_id" };
  }

  const storage = deps.storage;
  const schoolId = deps.schoolId;
  const schoolTarget = { kind: "school" as const, schoolId };
  const schoolKey = buildScenarioLabelNamespacedKey(schoolTarget);
  const markerKey = serializeScenarioLabelMigrationMarkerKey(schoolTarget);
  // Canonical key only — never accept caller-supplied physical fence keys.
  const fenceKey = serializeScenarioLabelN3FenceKey(schoolTarget);

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
  const targetResolution = {
    status: "resolved" as const,
    target: schoolTarget,
  };

  // Reject schema2 / non-legacy before any fence write (AWARE not deployed).
  if (marker.status === "valid" && marker.payload.authority === "namespaced") {
    return { status: "not_certifiable", reason: "namespaced_marker" };
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

  if (preAssessment.status === "LEGACY_COMMITTED") {
    return { status: "already_committed" };
  }

  // Certifiability for a NEW legacy certificate (independent of prior fence state).
  if (marker.status === "missing") {
    return { status: "not_certifiable", reason: "marker_missing" };
  }
  if (marker.status === "invalid") {
    return { status: "not_certifiable", reason: "marker_invalid" };
  }
  if (marker.payload.authority !== "legacy" || marker.payload.schemaVersion !== 1) {
    return { status: "not_certifiable", reason: "marker_not_legacy" };
  }
  if (marker.payload.mirrorHealth !== "synced") {
    return { status: "not_certifiable", reason: "marker_not_synced" };
  }
  if (!rawStoredTextEqual(legacyRaw, schoolV2Raw)) {
    return { status: "not_certifiable", reason: "raw_mismatch" };
  }
  const expectedPresence = legacyRaw.exists ? "present" : "absent";
  if (marker.payload.authoritativePresence !== expectedPresence) {
    return { status: "not_certifiable", reason: "presence_mismatch" };
  }

  const record = buildScenarioLabelN3FenceRecord({
    authority: "legacy",
    schoolId,
    committedRaw: legacyRaw,
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

  // Fresh re-read entire tuple + fence after write.
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

  if (postAssessment.status === "LEGACY_COMMITTED") {
    return { status: "committed" };
  }

  // Concurrent drift: tuple changed between cert build and post-assess.
  if (
    !rawStoredTextEqual(postLegacy, legacyRaw) ||
    !rawStoredTextEqual(postSchool, schoolV2Raw)
  ) {
    return { status: "concurrent_drift" };
  }

  return { status: "verify_failed", reason: "assessment_not_legacy_committed" };
}

/** Soft metadata outcomes — never business failures. */
export function isScenarioLabelFenceFinalizeSoftFailure(
  result: ScenarioLabelFenceFinalizeResult,
): boolean {
  return (
    result.status === "incomplete" ||
    result.status === "verify_failed" ||
    result.status === "concurrent_drift" ||
    result.status === "storage_unavailable" ||
    result.status === "not_certifiable"
  );
}
