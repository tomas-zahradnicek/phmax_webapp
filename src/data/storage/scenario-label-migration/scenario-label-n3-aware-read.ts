/**
 * N3-AWARE-CORE — inert logical read API.
 *
 * 0 writes. Never returns fence certificate bytes as business value.
 * No PREP / finalize / marker write / repair / establishment / cutover.
 */

import { assessScenarioLabelRuntimeAuthority } from "./scenario-label-n3-aware-assessment";
import type {
  ScenarioLabelAwareLogicalReadResult,
  ScenarioLabelAwareStorage,
} from "./scenario-label-n3-aware-types";
import {
  SCENARIO_LABEL_N3_AWARE_NO_FENCE_VALUE_ROUTING,
  SCENARIO_LABEL_N3_AWARE_NO_WRITE_ON_READ,
} from "./scenario-label-n3-aware-types";
import type { EntityId } from "../../../domain/shared/entity-id";

export type ReadScenarioLabelAwareLogicalInput = {
  readonly storage: ScenarioLabelAwareStorage;
  readonly schoolId: EntityId | null;
};

/**
 * Authority-aware logical read.
 * Uses RawStoredText exactly (missing ≠ present "").
 * Fence is proof only — never routed as value.
 */
export function readScenarioLabelAwareLogical(
  input: ReadScenarioLabelAwareLogicalInput,
): ScenarioLabelAwareLogicalReadResult {
  void SCENARIO_LABEL_N3_AWARE_NO_WRITE_ON_READ;
  void SCENARIO_LABEL_N3_AWARE_NO_FENCE_VALUE_ROUTING;

  const assessment = assessScenarioLabelRuntimeAuthority(input);

  switch (assessment.kind) {
    case "STORAGE_UNAVAILABLE":
      return { status: "unavailable" };

    case "UNBOUND":
      return { status: "unbound", raw: assessment.legacyRaw };

    case "LEGACY_READY":
      return {
        status: "ok",
        authority: "legacy",
        raw: assessment.legacyRaw,
      };

    case "LEGACY_COMPAT_UNPREPARED":
      return {
        status: "ok",
        authority: "legacy",
        raw: assessment.legacyRaw,
        signal: "compat_unprepared",
      };

    case "LEGACY_VIOLATED_RECOVERABLE":
      return {
        status: "ok",
        authority: "legacy",
        raw: assessment.legacyRaw,
        signal: "legacy_violation_warning",
      };

    case "NAMESPACED_READY":
      return {
        status: "ok",
        authority: "namespaced",
        raw: assessment.schoolV2Raw,
        source: "school_v2",
      };

    case "NAMESPACED_DEGRADED":
      return {
        status: "ok",
        authority: "namespaced",
        raw: assessment.schoolV2Raw,
        signal: "degraded",
        source: "school_v2",
      };

    case "AUTHORITY_BLOCKED":
      return {
        status: "blocked",
        reason: assessment.reason,
      };

    default: {
      const _exhaustive: never = assessment;
      void _exhaustive;
      return { status: "blocked", reason: "authority_blocked" };
    }
  }
}
