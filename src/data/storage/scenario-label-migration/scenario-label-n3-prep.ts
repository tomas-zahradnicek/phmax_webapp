/**
 * N3-PREP — passive fence certificate for already-healthy school tuples.
 *
 * Writes ONLY the canonical school N3 fence key when:
 * - fence is physically missing
 * - pure assessment is UNESTABLISHED
 * - legacy + school-v2 + v1 synced marker are already healthy
 *
 * Never repairs data/marker. Never overwrites VIOLATED/INVALID.
 * Never calls the mutation finalizer (FENCE-WRITE may supersede those states).
 * Business authority remains legacy-only. Soft metadata only.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import { isUuid, normalizeUuid } from "../../identity/identity-uuid";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { rawStoredTextEqual, rawStoredTextFromNullable } from "./scenario-label-migration-raw";
import type { RawStoredText } from "./scenario-label-migration-types";
import {
  isScenarioLabelN3NamespacedMarker,
  parseScenarioLabelN3AuthorityMarkerJson,
} from "./scenario-label-n3-authority-marker";
import type { ScenarioLabelN3AuthorityMarkerParseResult } from "./scenario-label-n3-authority-types";
import { serializeScenarioLabelN3FenceKey } from "./scenario-label-n3-fence-key";
import { assessScenarioLabelN3FenceState } from "./scenario-label-n3-fence-protocol";
import {
  buildScenarioLabelN3FenceRecord,
  parseScenarioLabelN3FenceRecordJson,
  serializeScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-record";
import type { ScenarioLabelN3FenceRecordParseResult } from "./scenario-label-n3-fence-types";

export type ScenarioLabelN3PrepStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type ScenarioLabelN3PrepNotPreparableReason =
  | "marker_missing"
  | "marker_invalid"
  | "marker_not_legacy"
  | "marker_not_synced"
  | "raw_mismatch"
  | "presence_mismatch"
  | "fence_not_unestablished"
  | "fence_not_physically_missing";

export type ScenarioLabelN3PrepResult =
  | { readonly status: "already_prepared" }
  | { readonly status: "prepared" }
  | {
      readonly status: "not_preparable";
      readonly reason: ScenarioLabelN3PrepNotPreparableReason;
    }
  | { readonly status: "blocked_violation" }
  | { readonly status: "blocked_invalid" }
  | { readonly status: "unsupported_authority" }
  | { readonly status: "skipped_identity" }
  | { readonly status: "storage_unavailable" }
  | { readonly status: "concurrent_change" }
  | { readonly status: "write_failed" }
  | {
      readonly status: "verify_failed";
      readonly reason: "read_back_malformed" | "assessment_not_legacy_committed";
    };

export type PrepareScenarioLabelN3LegacyFenceDependencies = {
  readonly storage?: ScenarioLabelN3PrepStorage;
  readonly schoolId: EntityId;
};

function isCanonicalSchoolId(value: unknown): value is EntityId {
  return typeof value === "string" && isUuid(value) && value === normalizeUuid(value);
}

function resolveStorage(
  deps: PrepareScenarioLabelN3LegacyFenceDependencies,
): ScenarioLabelN3PrepStorage | null {
  if (deps.storage) return deps.storage;
  try {
    if (typeof localStorage === "undefined" || localStorage == null) return null;
    return localStorage;
  } catch {
    return null;
  }
}

function readRaw(storage: ScenarioLabelN3PrepStorage, key: string): RawStoredText {
  return rawStoredTextFromNullable(storage.getItem(key));
}

function readFenceParse(
  storage: ScenarioLabelN3PrepStorage,
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

function isFencePhysicallyMissing(
  storage: ScenarioLabelN3PrepStorage,
  fenceKey: string,
): boolean {
  return storage.getItem(fenceKey) == null;
}

type HealthyAdmission =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: ScenarioLabelN3PrepNotPreparableReason };

function assessHealthyLegacyAdmission(params: {
  readonly marker: ScenarioLabelN3AuthorityMarkerParseResult;
  readonly legacyRaw: RawStoredText;
  readonly schoolV2Raw: RawStoredText;
}): HealthyAdmission {
  const { marker, legacyRaw, schoolV2Raw } = params;
  if (marker.status === "missing") {
    return { ok: false, reason: "marker_missing" };
  }
  if (marker.status === "invalid") {
    return { ok: false, reason: "marker_invalid" };
  }
  if (isScenarioLabelN3NamespacedMarker(marker.payload)) {
    // Caller should have returned unsupported_authority already; defensive.
    return { ok: false, reason: "marker_not_legacy" };
  }
  if (marker.payload.authority !== "legacy" || marker.payload.schemaVersion !== 1) {
    return { ok: false, reason: "marker_not_legacy" };
  }
  if (marker.payload.mirrorHealth !== "synced") {
    return { ok: false, reason: "marker_not_synced" };
  }
  if (!rawStoredTextEqual(legacyRaw, schoolV2Raw)) {
    return { ok: false, reason: "raw_mismatch" };
  }
  const expectedPresence = legacyRaw.exists ? "present" : "absent";
  if (marker.payload.authoritativePresence !== expectedPresence) {
    return { ok: false, reason: "presence_mismatch" };
  }
  return { ok: true };
}

/**
 * Prepare (or no-op) a legacy fence certificate for an already-healthy school tuple.
 * Only writes when the fence key is physically missing and assessment is UNESTABLISHED.
 * Never invents unbound fences. Never writes schema2 markers or business/shadow data.
 */
export function prepareScenarioLabelN3LegacyFenceCertificate(
  deps: PrepareScenarioLabelN3LegacyFenceDependencies,
): ScenarioLabelN3PrepResult {
  if (!isCanonicalSchoolId(deps.schoolId)) {
    return { status: "skipped_identity" };
  }

  const storage = resolveStorage(deps);
  if (storage == null) {
    return { status: "storage_unavailable" };
  }

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
  let fenceParse: ScenarioLabelN3FenceRecordParseResult;
  try {
    legacyRaw = readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
    schoolV2Raw = readRaw(storage, schoolKey);
    markerJson = storage.getItem(markerKey);
    fenceParse = readFenceParse(storage, fenceKey);
  } catch {
    return { status: "storage_unavailable" };
  }

  const marker = parseScenarioLabelN3AuthorityMarkerJson(markerJson);

  if (marker.status === "valid" && isScenarioLabelN3NamespacedMarker(marker.payload)) {
    return { status: "unsupported_authority" };
  }

  const preAssessment = assessScenarioLabelN3FenceState({
    targetResolution,
    fence: fenceParse,
    marker,
    legacyRaw,
    schoolV2Raw,
  });

  if (preAssessment.status === "UNAVAILABLE") {
    return { status: "storage_unavailable" };
  }
  if (preAssessment.status === "LEGACY_COMMITTED") {
    return { status: "already_prepared" };
  }
  if (preAssessment.status === "NAMESPACED_COMMITTED") {
    return { status: "unsupported_authority" };
  }
  if (preAssessment.status === "VIOLATED") {
    return { status: "blocked_violation" };
  }
  if (preAssessment.status === "INVALID") {
    return { status: "blocked_invalid" };
  }
  if (preAssessment.status !== "UNESTABLISHED") {
    return { status: "not_preparable", reason: "fence_not_unestablished" };
  }

  // Physical missing is mandatory — do not trust classification alone.
  if (fenceParse.status !== "missing" || !isFencePhysicallyMissing(storage, fenceKey)) {
    return { status: "not_preparable", reason: "fence_not_physically_missing" };
  }

  const admission = assessHealthyLegacyAdmission({ marker, legacyRaw, schoolV2Raw });
  if (!admission.ok) {
    return { status: "not_preparable", reason: admission.reason };
  }

  // Immediate pre-write re-check (TOCTOU): fence + full tuple.
  let freshLegacy: RawStoredText;
  let freshSchool: RawStoredText;
  let freshMarkerJson: string | null;
  let freshFenceParse: ScenarioLabelN3FenceRecordParseResult;
  try {
    freshLegacy = readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
    freshSchool = readRaw(storage, schoolKey);
    freshMarkerJson = storage.getItem(markerKey);
    freshFenceParse = readFenceParse(storage, fenceKey);
  } catch {
    return { status: "storage_unavailable" };
  }

  const freshMarker = parseScenarioLabelN3AuthorityMarkerJson(freshMarkerJson);

  if (freshMarker.status === "valid" && isScenarioLabelN3NamespacedMarker(freshMarker.payload)) {
    return { status: "unsupported_authority" };
  }

  const freshAssessment = assessScenarioLabelN3FenceState({
    targetResolution,
    fence: freshFenceParse,
    marker: freshMarker,
    legacyRaw: freshLegacy,
    schoolV2Raw: freshSchool,
  });

  if (freshAssessment.status === "LEGACY_COMMITTED") {
    return { status: "already_prepared" };
  }
  if (freshAssessment.status === "NAMESPACED_COMMITTED") {
    return { status: "unsupported_authority" };
  }
  if (freshAssessment.status === "VIOLATED") {
    return { status: "blocked_violation" };
  }
  if (freshAssessment.status === "INVALID") {
    return { status: "blocked_invalid" };
  }
  if (freshAssessment.status === "UNAVAILABLE") {
    return { status: "storage_unavailable" };
  }
  if (freshAssessment.status !== "UNESTABLISHED") {
    return { status: "not_preparable", reason: "fence_not_unestablished" };
  }
  if (freshFenceParse.status !== "missing" || !isFencePhysicallyMissing(storage, fenceKey)) {
    // Present but not committed/violated/invalid above — refuse overwrite.
    return { status: "not_preparable", reason: "fence_not_physically_missing" };
  }

  const freshAdmission = assessHealthyLegacyAdmission({
    marker: freshMarker,
    legacyRaw: freshLegacy,
    schoolV2Raw: freshSchool,
  });
  if (!freshAdmission.ok) {
    return { status: "not_preparable", reason: freshAdmission.reason };
  }

  const record = buildScenarioLabelN3FenceRecord({
    authority: "legacy",
    schoolId,
    committedRaw: freshLegacy,
  });

  let serialized: string;
  try {
    serialized = serializeScenarioLabelN3FenceRecord(record);
  } catch {
    return { status: "write_failed" };
  }

  // Last-moment physical missing check immediately before setItem.
  try {
    if (!isFencePhysicallyMissing(storage, fenceKey)) {
      const lateFence = readFenceParse(storage, fenceKey);
      const lateMarker = parseScenarioLabelN3AuthorityMarkerJson(storage.getItem(markerKey));
      const lateLegacy = readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
      const lateSchool = readRaw(storage, schoolKey);
      const lateAssessment = assessScenarioLabelN3FenceState({
        targetResolution,
        fence: lateFence,
        marker: lateMarker,
        legacyRaw: lateLegacy,
        schoolV2Raw: lateSchool,
      });
      if (lateAssessment.status === "LEGACY_COMMITTED") {
        return { status: "already_prepared" };
      }
      if (lateAssessment.status === "VIOLATED") {
        return { status: "blocked_violation" };
      }
      if (lateAssessment.status === "INVALID") {
        return { status: "blocked_invalid" };
      }
      if (lateAssessment.status === "NAMESPACED_COMMITTED") {
        return { status: "unsupported_authority" };
      }
      return { status: "not_preparable", reason: "fence_not_physically_missing" };
    }
    storage.setItem(fenceKey, serialized);
  } catch {
    return { status: "write_failed" };
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

  if (postAssessment.status === "LEGACY_COMMITTED") {
    return { status: "prepared" };
  }

  if (
    !rawStoredTextEqual(postLegacy, freshLegacy) ||
    !rawStoredTextEqual(postSchool, freshSchool)
  ) {
    return { status: "concurrent_change" };
  }

  return { status: "verify_failed", reason: "assessment_not_legacy_committed" };
}

/** Soft metadata outcomes — never business failures. */
export function isScenarioLabelN3PrepSoftFailure(result: ScenarioLabelN3PrepResult): boolean {
  return (
    result.status === "not_preparable" ||
    result.status === "blocked_violation" ||
    result.status === "blocked_invalid" ||
    result.status === "unsupported_authority" ||
    result.status === "skipped_identity" ||
    result.status === "storage_unavailable" ||
    result.status === "concurrent_change" ||
    result.status === "write_failed" ||
    result.status === "verify_failed"
  );
}
