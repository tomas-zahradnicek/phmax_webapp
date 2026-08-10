/**
 * N3-AWARE-CORE — canonical runtime authority assessor.
 *
 * Combines marker + fence + fresh raws into a single discriminated authority state.
 * Inert: no production wiring. No write-on-assess.
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
  isScenarioLabelN3LegacyMarker,
  isScenarioLabelN3NamespacedMarker,
  parseScenarioLabelN3AuthorityMarkerJson,
} from "./scenario-label-n3-authority-marker";
import type {
  ScenarioLabelN3AuthorityMarkerParseResult,
  ScenarioLabelN3NamespacedMarkerPayload,
} from "./scenario-label-n3-authority-types";
import { serializeScenarioLabelN3FenceKey } from "./scenario-label-n3-fence-key";
import { assessScenarioLabelN3FenceState } from "./scenario-label-n3-fence-protocol";
import { parseScenarioLabelN3FenceRecordJson } from "./scenario-label-n3-fence-record";
import type {
  ScenarioLabelN3FenceAssessment,
  ScenarioLabelN3FenceRecordParseResult,
} from "./scenario-label-n3-fence-types";
import type {
  ScenarioLabelAwareStorage,
  ScenarioLabelRuntimeAuthorityAssessment,
} from "./scenario-label-n3-aware-types";

export type AssessScenarioLabelRuntimeAuthorityInput = {
  readonly storage: ScenarioLabelAwareStorage;
  /**
   * Canonical school UUID, or `null` for unbound-compatible assessment.
   * Uppercase / non-canonical IDs are treated as unresolved → blocked.
   */
  readonly schoolId: EntityId | null;
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
  return parseScenarioLabelN3FenceRecordJson(storage.getItem(fenceKey));
}

function hasNamespacedFenceEvidence(
  fence: ScenarioLabelN3FenceRecordParseResult,
): boolean {
  return fence.status === "valid" && fence.record.authority === "namespaced";
}

function hasLegacyFenceEvidence(
  fence: ScenarioLabelN3FenceRecordParseResult,
): boolean {
  return fence.status === "valid" && fence.record.authority === "legacy";
}

function isHealthyLegacyTuple(params: {
  readonly marker: ScenarioLabelN3AuthorityMarkerParseResult;
  readonly legacyRaw: RawStoredText;
  readonly schoolV2Raw: RawStoredText;
}): boolean {
  if (params.marker.status !== "valid") return false;
  if (!isScenarioLabelN3LegacyMarker(params.marker.payload)) return false;
  if (params.marker.payload.mirrorHealth !== "synced") return false;
  if (!rawStoredTextEqual(params.legacyRaw, params.schoolV2Raw)) return false;
  const expected = authoritativePresenceFromRaw(params.legacyRaw);
  return params.marker.payload.authoritativePresence === expected;
}

function classifyNamespacedDegraded(params: {
  readonly schoolId: EntityId;
  readonly marker: ScenarioLabelN3NamespacedMarkerPayload;
  readonly legacyRaw: RawStoredText;
  readonly schoolV2Raw: RawStoredText;
  readonly fenceAssessment: ScenarioLabelN3FenceAssessment;
}): ScenarioLabelRuntimeAuthorityAssessment & { kind: "NAMESPACED_DEGRADED" } {
  const { marker } = params;
  let reason: "mirror_dirty" | "raw_mismatch" | "presence_mismatch" | "fence_not_committed" =
    "fence_not_committed";
  if (marker.mirrorHealth === "dirty") {
    reason = "mirror_dirty";
  } else if (!rawStoredTextEqual(params.legacyRaw, params.schoolV2Raw)) {
    reason = "raw_mismatch";
  } else if (
    marker.authoritativePresence !== authoritativePresenceFromRaw(params.schoolV2Raw)
  ) {
    reason = "presence_mismatch";
  }

  return {
    kind: "NAMESPACED_DEGRADED",
    schoolId: params.schoolId,
    marker,
    reason,
    legacyRaw: params.legacyRaw,
    schoolV2Raw: params.schoolV2Raw,
    fenceAssessment: params.fenceAssessment,
  };
}

/**
 * Canonical runtime authority assessor.
 * Fresh reads only — never writes, never PREP, never cutover.
 */
export function assessScenarioLabelRuntimeAuthority(
  input: AssessScenarioLabelRuntimeAuthorityInput,
): ScenarioLabelRuntimeAuthorityAssessment {
  const { storage, schoolId } = input;

  // Unbound path: no school fence/cutover; legacy-compatible raw only.
  if (schoolId == null) {
    try {
      const legacyRaw = readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
      return { kind: "UNBOUND", legacyRaw };
    } catch {
      return { kind: "STORAGE_UNAVAILABLE" };
    }
  }

  if (!isCanonicalSchoolId(schoolId)) {
    return {
      kind: "AUTHORITY_BLOCKED",
      schoolId: null,
      reason: "target_unresolved",
      fenceAssessment: null,
      marker: null,
    };
  }

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
    return { kind: "STORAGE_UNAVAILABLE" };
  }

  const marker = parseScenarioLabelN3AuthorityMarkerJson(markerJson);
  const fenceAssessment = assessScenarioLabelN3FenceState({
    targetResolution,
    fence: fenceParse,
    marker,
    legacyRaw,
    schoolV2Raw,
  });

  if (fenceAssessment.status === "UNAVAILABLE") {
    return { kind: "STORAGE_UNAVAILABLE" };
  }

  // --- Namespaced marker world ---
  if (marker.status === "valid" && isScenarioLabelN3NamespacedMarker(marker.payload)) {
    // Namespaced marker without required fence → blocked (never guess).
    if (fenceParse.status === "missing") {
      return {
        kind: "AUTHORITY_BLOCKED",
        schoolId,
        reason: "namespaced_without_fence",
        fenceAssessment,
        marker: marker.payload,
      };
    }

    // Legacy fence + namespaced marker → conflict.
    if (hasLegacyFenceEvidence(fenceParse)) {
      return {
        kind: "AUTHORITY_BLOCKED",
        schoolId,
        reason: "marker_fence_authority_mismatch",
        fenceAssessment,
        marker: marker.payload,
      };
    }

    if (fenceAssessment.status === "INVALID") {
      return {
        kind: "AUTHORITY_BLOCKED",
        schoolId,
        reason:
          fenceAssessment.reason === "school_id_mismatch" ||
          fenceAssessment.reason === "resource_mismatch" ||
          fenceAssessment.reason === "payload_key_mismatch"
            ? "invalid_fence_binding"
            : "malformed_fence",
        fenceAssessment,
        marker: marker.payload,
      };
    }

    if (fenceAssessment.status === "NAMESPACED_COMMITTED") {
      // Fully coherent namespaced commit.
      return {
        kind: "NAMESPACED_READY",
        schoolId,
        marker: marker.payload,
        fence: fenceAssessment.record,
        legacyRaw,
        schoolV2Raw,
        fenceAssessment,
      };
    }

    // Namespaced authority known; mirror/fence health degraded but unambiguous.
    if (fenceAssessment.status === "UNESTABLISHED") {
      return {
        kind: "AUTHORITY_BLOCKED",
        schoolId,
        reason: "namespaced_without_fence",
        fenceAssessment,
        marker: marker.payload,
      };
    }

    if (fenceAssessment.status === "VIOLATED") {
      const kind = fenceAssessment.kind;
      // Ambiguous authority conflict under namespaced marker → blocked.
      if (kind === "marker_authority_mismatch" || kind === "marker_schema_mismatch") {
        return {
          kind: "AUTHORITY_BLOCKED",
          schoolId,
          reason: "namespaced_evidence_conflict",
          fenceAssessment,
          marker: marker.payload,
        };
      }
      return classifyNamespacedDegraded({
        schoolId,
        marker: marker.payload,
        legacyRaw,
        schoolV2Raw,
        fenceAssessment,
      });
    }

    return {
      kind: "AUTHORITY_BLOCKED",
      schoolId,
      reason: "winner_unprovable",
      fenceAssessment,
      marker: marker.payload,
    };
  }

  // --- Malformed marker ---
  if (marker.status === "invalid") {
    // Any namespaced fence evidence with malformed marker → blocked.
    if (hasNamespacedFenceEvidence(fenceParse)) {
      return {
        kind: "AUTHORITY_BLOCKED",
        schoolId,
        reason: "namespaced_evidence_conflict",
        fenceAssessment,
        marker: null,
      };
    }
    return {
      kind: "AUTHORITY_BLOCKED",
      schoolId,
      reason: "malformed_marker",
      fenceAssessment,
      marker: null,
    };
  }

  // --- Missing marker ---
  if (marker.status === "missing") {
    if (hasNamespacedFenceEvidence(fenceParse)) {
      return {
        kind: "AUTHORITY_BLOCKED",
        schoolId,
        reason: "namespaced_evidence_conflict",
        fenceAssessment,
        marker: null,
      };
    }
    if (!rawStoredTextEqual(legacyRaw, schoolV2Raw)) {
      return {
        kind: "AUTHORITY_BLOCKED",
        schoolId,
        reason: "ambiguous_marker_loss",
        fenceAssessment,
        marker: null,
      };
    }
    // Empty/new or equal residue → legacy-compatible unprepared (defaults to legacy).
    return {
      kind: "LEGACY_COMPAT_UNPREPARED",
      schoolId,
      reason: "marker_missing",
      marker: null,
      legacyRaw,
      schoolV2Raw,
      fenceAssessment,
    };
  }

  // --- Legacy marker world ---
  if (!isScenarioLabelN3LegacyMarker(marker.payload)) {
    return {
      kind: "AUTHORITY_BLOCKED",
      schoolId,
      reason: "malformed_marker",
      fenceAssessment,
      marker: marker.payload,
    };
  }

  const legacyMarker = marker.payload;

  // Any namespaced fence evidence under legacy marker → blocked (ambiguous).
  if (hasNamespacedFenceEvidence(fenceParse)) {
    return {
      kind: "AUTHORITY_BLOCKED",
      schoolId,
      reason: "namespaced_evidence_conflict",
      fenceAssessment,
      marker: legacyMarker,
    };
  }

  if (fenceAssessment.status === "INVALID") {
    // Invalid fence with unambiguous legacy marker + no namespaced evidence:
    // treat as recoverable legacy violation only when tuple is still legacy-shaped.
    if (isHealthyLegacyTuple({ marker, legacyRaw, schoolV2Raw })) {
      return {
        kind: "LEGACY_VIOLATED_RECOVERABLE",
        schoolId,
        marker: legacyMarker,
        legacyRaw,
        schoolV2Raw,
        fenceAssessment,
        signal: "stale_legacy_fence",
      };
    }
    return {
      kind: "AUTHORITY_BLOCKED",
      schoolId,
      reason: "malformed_fence",
      fenceAssessment,
      marker: legacyMarker,
    };
  }

  if (fenceAssessment.status === "NAMESPACED_COMMITTED") {
    return {
      kind: "AUTHORITY_BLOCKED",
      schoolId,
      reason: "marker_fence_authority_mismatch",
      fenceAssessment,
      marker: legacyMarker,
    };
  }

  if (fenceAssessment.status === "LEGACY_COMMITTED") {
    return {
      kind: "LEGACY_READY",
      schoolId,
      marker: legacyMarker,
      fence: fenceAssessment.record,
      legacyRaw,
      schoolV2Raw,
      fenceAssessment,
    };
  }

  if (fenceAssessment.status === "UNESTABLISHED") {
    if (isHealthyLegacyTuple({ marker, legacyRaw, schoolV2Raw })) {
      return {
        kind: "LEGACY_COMPAT_UNPREPARED",
        schoolId,
        reason: "fence_missing",
        marker: legacyMarker,
        legacyRaw,
        schoolV2Raw,
        fenceAssessment,
      };
    }
    // Unhealthy but clearly legacy / no namespaced evidence → unprepared (not blocked).
    if (legacyMarker.mirrorHealth !== "synced") {
      return {
        kind: "LEGACY_COMPAT_UNPREPARED",
        schoolId,
        reason: "marker_not_synced",
        marker: legacyMarker,
        legacyRaw,
        schoolV2Raw,
        fenceAssessment,
      };
    }
    if (!rawStoredTextEqual(legacyRaw, schoolV2Raw)) {
      return {
        kind: "LEGACY_COMPAT_UNPREPARED",
        schoolId,
        reason: "raw_mismatch",
        marker: legacyMarker,
        legacyRaw,
        schoolV2Raw,
        fenceAssessment,
      };
    }
    const expected = authoritativePresenceFromRaw(legacyRaw);
    if (legacyMarker.authoritativePresence !== expected) {
      return {
        kind: "LEGACY_COMPAT_UNPREPARED",
        schoolId,
        reason: "presence_mismatch",
        marker: legacyMarker,
        legacyRaw,
        schoolV2Raw,
        fenceAssessment,
      };
    }
    return {
      kind: "LEGACY_COMPAT_UNPREPARED",
      schoolId,
      reason: "fence_missing",
      marker: legacyMarker,
      legacyRaw,
      schoolV2Raw,
      fenceAssessment,
    };
  }

  if (fenceAssessment.status === "VIOLATED") {
    // Legacy-known recoverable only when:
    // - v1 legacy marker valid
    // - no schema2 / namespaced fence evidence
    // - tuple still unambiguously legacy world
    const kind = fenceAssessment.kind;
    if (
      kind === "namespaced_without_fence" ||
      kind === "marker_authority_mismatch" ||
      kind === "marker_schema_mismatch"
    ) {
      return {
        kind: "AUTHORITY_BLOCKED",
        schoolId,
        reason: "ambiguous_violation",
        fenceAssessment,
        marker: legacyMarker,
      };
    }

    // Stale legacy fence / equal-copy / raw drift under legacy marker → recoverable.
    return {
      kind: "LEGACY_VIOLATED_RECOVERABLE",
      schoolId,
      marker: legacyMarker,
      legacyRaw,
      schoolV2Raw,
      fenceAssessment,
      signal: "stale_legacy_fence",
    };
  }

  return {
    kind: "AUTHORITY_BLOCKED",
    schoolId,
    reason: "winner_unprovable",
    fenceAssessment,
    marker: legacyMarker,
  };
}
