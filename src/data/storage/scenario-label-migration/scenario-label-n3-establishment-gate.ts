/**
 * N3-AWARE-CORE — inert establishment decision gate for future WIRING.
 *
 * Pure over a fresh authority assessment. Never writes. Never PREP.
 * Schema2 / namespaced states never enter legacy establishment or PREP.
 */

import { assessScenarioLabelRuntimeAuthority } from "./scenario-label-n3-aware-assessment";
import type {
  ScenarioLabelAwareEstablishmentDecision,
  ScenarioLabelAwareStorage,
  ScenarioLabelRuntimeAuthorityAssessment,
} from "./scenario-label-n3-aware-types";
import type { EntityId } from "../../../domain/shared/entity-id";

export type DecideScenarioLabelAwareEstablishmentInput = {
  readonly storage: ScenarioLabelAwareStorage;
  readonly schoolId: EntityId | null;
};

/**
 * Map a fresh runtime authority assessment to an establishment decision.
 * Inert helper — production Profile/VZ ownership remains unchanged until WIRING.
 */
export function decideScenarioLabelAwareEstablishmentFromAssessment(
  assessment: ScenarioLabelRuntimeAuthorityAssessment,
): ScenarioLabelAwareEstablishmentDecision {
  switch (assessment.kind) {
    case "STORAGE_UNAVAILABLE":
      return { action: "blocked", reason: "storage_unavailable" };

    case "AUTHORITY_BLOCKED":
      // Classic N2 adoption input: missing marker + legacy≠school-v2 (often v2 absent).
      // That is exactly what legacy establishment repairs — not namespaced evidence.
      // Do NOT open repair for namespaced/malformed/conflict blocked reasons.
      if (assessment.reason === "ambiguous_marker_loss") {
        return {
          action: "permit_legacy_establishment",
          authority: "legacy",
          reason: "legacy_repairable",
        };
      }
      return { action: "blocked", reason: assessment.reason };

    case "UNBOUND":
      return {
        action: "permit_legacy_establishment",
        authority: "legacy",
        reason: "unbound_compatible",
      };

    case "LEGACY_COMPAT_UNPREPARED":
      // Missing fence with healthy tuple → future PREP path (WIRING).
      // Unhealthy / repairable → current N2 establishment.
      if (assessment.reason === "fence_missing" && assessment.marker != null) {
        return {
          action: "permit_legacy_prep",
          authority: "legacy",
          reason: "legacy_already_ready",
        };
      }
      return {
        action: "permit_legacy_establishment",
        authority: "legacy",
        reason:
          assessment.reason === "marker_missing"
            ? "legacy_unprepared"
            : "legacy_repairable",
      };

    case "LEGACY_READY":
      // Already fence-ready — no establishment / no PREP required.
      return {
        action: "permit_legacy_prep",
        authority: "legacy",
        reason: "legacy_already_ready",
      };

    case "LEGACY_VIOLATED_RECOVERABLE":
      // Explicit mutation / establishment may supersede stale legacy fence.
      return {
        action: "permit_legacy_establishment",
        authority: "legacy",
        reason: "legacy_repairable",
      };

    case "NAMESPACED_READY":
      return {
        action: "no_op_namespaced_authoritative",
        authority: "namespaced",
        reason: "namespaced_ready",
      };

    case "NAMESPACED_DEGRADED":
      // No legacy repair / no PREP under namespaced authority.
      return {
        action: "no_op_namespaced_authoritative",
        authority: "namespaced",
        reason: "namespaced_degraded",
      };

    default: {
      const _exhaustive: never = assessment;
      void _exhaustive;
      return { action: "blocked", reason: "authority_blocked" };
    }
  }
}

/**
 * Fresh-assessment establishment gate (storage I/O for assess only; 0 writes).
 */
export function decideScenarioLabelAwareEstablishment(
  input: DecideScenarioLabelAwareEstablishmentInput,
): ScenarioLabelAwareEstablishmentDecision {
  const assessment = assessScenarioLabelRuntimeAuthority(input);
  return decideScenarioLabelAwareEstablishmentFromAssessment(assessment);
}
