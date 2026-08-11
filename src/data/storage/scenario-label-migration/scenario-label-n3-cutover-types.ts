/**
 * N3-CUTOVER-ACTIVATE — production authority cutover contracts.
 *
 * Sole production owner is the shared school-ready establishment/PREP runtime.
 * Direct production callers of the CORE cutover executor: EXACTLY 1.
 * Profile / VZ reach cutover only transitively. Restore keeps allowCutover default false.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import type { RawStoredText } from "./scenario-label-migration-types";

/** CORE executor remains the sole transition implementation; ACTIVATE wires one owner. */
export const SCENARIO_LABEL_N3_CUTOVER_CORE_INERT = false as const;

/** Production authority transition is ACTIVE via the shared establishment/PREP owner. */
export const SCENARIO_LABEL_N3_CUTOVER_PRODUCTION_ACTIVE = true as const;

/** No persistent cutover journal — marker/fence fail-closed state machine is the audit trail. */
export const SCENARIO_LABEL_N3_CUTOVER_NO_PERSISTENT_JOURNAL = true as const;

/** Cutover mutates metadata only — never business legacy / school-v2 keys. */
export const SCENARIO_LABEL_N3_CUTOVER_NO_BUSINESS_WRITES = true as const;

/** Namespaced fence is the commit certificate and MUST be the last physical write. */
export const SCENARIO_LABEL_N3_CUTOVER_FENCE_WRITTEN_LAST = true as const;

/**
 * Crash limitation (no journal):
 * A crash between schema2 marker write and namespaced fence finalization can leave
 * intermediate metadata (e.g. v2 marker + legacy fence). AWARE fail-closes those states.
 * Recovery / ACTIVATE owners must treat them as blocked — never as healthy success.
 */
export const SCENARIO_LABEL_N3_CUTOVER_CRASH_LIMITATION =
  "no persistent cutover journal; intermediate v2-marker states rely on AWARE fail-closed assessment" as const;

/**
 * Safe post-ACTIVATE deployment rollback floor:
 * - N3-CUTOVER-CORE merge 620245a / PR #44 (inert executor, no owner), or
 * - N3-AWARE-WIRING merge 74d2c32 / PR #43 (or newer AWARE-safe).
 * Rolling back to pre-AWARE after namespaced browsers exist is NOT safe.
 */
export const SCENARIO_LABEL_N3_CUTOVER_ROLLBACK_FLOOR =
  "N3-CUTOVER-CORE 620245a / N3-AWARE-WIRING 74d2c32 (or newer AWARE-safe)" as const;

/** @deprecated alias — prefer SCENARIO_LABEL_N3_CUTOVER_ROLLBACK_FLOOR */
export const SCENARIO_LABEL_N3_CUTOVER_FUTURE_ROLLBACK_FLOOR =
  SCENARIO_LABEL_N3_CUTOVER_ROLLBACK_FLOOR;

/** Snippet policy B: namespaced users may be refused scenario mutation via generated snippet. */
export const SCENARIO_LABEL_N3_CUTOVER_SNIPPET_POLICY = "B_refuse_namespaced_mutation" as const;

export type ScenarioLabelN3CutoverNotEligibleReason =
  | "runtime_not_legacy_ready"
  | "data_not_ready_for_cutover"
  | "fence_not_legacy_committed"
  | "fence_cutover_ineligible"
  | "target_not_school"
  | "target_unresolved"
  | "unbound_never_eligible"
  | "raw_mismatch"
  | "presence_mismatch"
  | "mirror_dirty"
  | "marker_invalid"
  | "marker_missing"
  | "marker_not_legacy"
  | "fence_missing"
  | "fence_wrong_school"
  | "fence_wrong_resource"
  | "fence_wrong_authority"
  | "fence_committed_raw_mismatch"
  | "storage_unreadable"
  | "namespaced_degraded_not_cutover_target"
  | "authority_blocked"
  | "legacy_unprepared"
  | "legacy_violated";

export type ScenarioLabelN3AuthorityCutoverResult =
  | {
      readonly status: "cutover_success";
      readonly schoolId: EntityId;
    }
  | {
      readonly status: "already_namespaced";
      readonly schoolId: EntityId;
      readonly kind: "NAMESPACED_READY" | "NAMESPACED_DEGRADED";
    }
  | {
      readonly status: "not_eligible";
      readonly reason: ScenarioLabelN3CutoverNotEligibleReason;
    }
  | { readonly status: "skipped_identity" }
  | { readonly status: "storage_unavailable" }
  | {
      readonly status: "concurrent_drift";
      readonly phase: "pre_marker";
    }
  | { readonly status: "marker_write_failed" }
  | {
      readonly status: "rolled_back";
      readonly from:
        | "marker_verify_failed"
        | "fence_write_failed"
        | "fence_verify_failed";
      readonly schoolId: EntityId;
    }
  | {
      readonly status: "cutover_degraded";
      readonly reason:
        | "post_marker_business_drift"
        | "stale_fence_resurrection_forbidden"
        | "rollback_not_safe";
      readonly schoolId: EntityId;
    }
  | {
      readonly status: "fatal_partial";
      readonly reason:
        | "marker_rollback_failed"
        | "fence_rollback_failed"
        | "metadata_rollback_incomplete";
      readonly phase:
        | "marker_verify"
        | "fence_write"
        | "fence_verify"
        | "post_marker_drift";
      readonly schoolId: EntityId;
    };

/** Metadata rollback snapshot (exact prior physical bytes). */
export type ScenarioLabelN3CutoverMetadataSnapshot = {
  readonly markerRaw: string | null;
  readonly fenceRaw: string | null;
};

/** Business comparison snapshot — NEVER restored by ordinary cutover rollback. */
export type ScenarioLabelN3CutoverBusinessSnapshot = {
  readonly legacyRaw: RawStoredText;
  readonly schoolV2Raw: RawStoredText;
};

export const SCENARIO_LABEL_N3_CUTOVER_SUCCESS_ORDER = [
  "fresh_eligibility",
  "snapshot_metadata_and_business",
  "pre_marker_fresh_drift_check",
  "write_schema2_namespaced_marker",
  "marker_read_back_verify",
  "post_marker_business_equality",
  "write_namespaced_fence_last",
  "fence_read_back_verify",
  "final_fresh_assessment_namespaced_ready_and_committed",
] as const;

export type ScenarioLabelN3CutoverSuccessPhase =
  (typeof SCENARIO_LABEL_N3_CUTOVER_SUCCESS_ORDER)[number];
