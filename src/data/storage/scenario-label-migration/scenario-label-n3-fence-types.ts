/**
 * N3-FENCE-PROTO — pure persistent commit-certificate types for phmax-scenario-label / value.
 *
 * Fence ≠ business authority. Migration marker chooses legacy vs namespaced authority;
 * fence certifies whether the current raw + marker tuple was committed by a compatible writer.
 *
 * Zero production call sites. Zero storage I/O. Zero cutover.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import type { RawStoredText } from "./scenario-label-migration-types";
import type {
  ScenarioLabelN3AuthorityMarkerParseResult,
  ScenarioLabelN3CutoverAssessment,
  ScenarioLabelN3CutoverPlan,
} from "./scenario-label-n3-authority-types";
import type { ScenarioLabelMigrationTargetResolution } from "./scenario-label-migration-types";

/** Fence record serialization version (independent of marker / backup / StorageAddress). */
export const SCENARIO_LABEL_N3_FENCE_SCHEMA_VERSION = 1 as const;

/** Compatible writer generation encoded in the certificate. */
export const SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION = 3 as const;

/** Exact resource literal bound into fence payload (module/resource). */
export const SCENARIO_LABEL_N3_FENCE_RESOURCE = "phmax-scenario-label/value" as const;

/** Dedicated metadata segment under v2 root — outside business address + migration-state. */
export const SCENARIO_LABEL_N3_FENCE_SEGMENT = "protocol-commit" as const;

/** Fence is written last in any future certified writer transaction. */
export const SCENARIO_LABEL_N3_FENCE_WRITTEN_LAST = true as const;

/** Fence-first ordering is forbidden (crash would leave false commitment). */
export const SCENARIO_LABEL_N3_FENCE_FIRST_FORBIDDEN = true as const;

/**
 * Client-only hard revocation of already-running same-origin old JS is impossible.
 * Safety bar is detect → fail closed → recover — not impossible write denial.
 */
export const SCENARIO_LABEL_N3_FENCE_HARD_PREVENTION_IMPOSSIBLE =
  "same-origin already-running old JS cannot be reliably denied browser storage writes by new client-only JS; fence detects incompatible commits." as const;

/**
 * Optional cross-tab live UX (broadcast / storage events) is secondary only —
 * never a correctness prerequisite.
 */
export const SCENARIO_LABEL_N3_FENCE_LIVE_UX_SECONDARY_ONLY = true as const;

/** Fence metadata must never enter central backup (local protocol/migration metadata). */
export const SCENARIO_LABEL_N3_FENCE_BACKUP_OMITS_CERTIFICATE = true as const;

/**
 * Automatic recovery is deferred.
 * equal-copy may later allow explicit re-certification; divergent must block / manual recovery.
 */
export const SCENARIO_LABEL_N3_FENCE_RECOVERY_DEFERRED = true as const;

/**
 * Deployment rollback (strict legacy mirror) ≠ already-open old tab / saved console snippet.
 * Fence addresses the latter; N3-PROTO strict mirror addresses the former.
 */
export const SCENARIO_LABEL_N3_FENCE_VS_DEPLOYMENT_ROLLBACK =
  "deployment rollback relies on strict legacy==v2 mirror; old open tab/snippet is detected by fence certificate mismatch." as const;

/** Saved console snippet is equivalent to a stale N2 writer after all old tabs are gone. */
export const SCENARIO_LABEL_N3_FENCE_CONSOLE_SNIPPET_HAZARD =
  "old saved console snippet can write legacy+shadow+v1 marker without updating fence; tab registry / BC alone cannot provide correctness." as const;

/** N3-PROTO plan.status==="ready" is data-plane readiness only — not fence/cutover eligibility. */
export const SCENARIO_LABEL_N3_FENCE_PLAN_READY_IS_NOT_ELIGIBILITY = true as const;

/** Production cutover still impossible after FENCE-PROTO (needs FENCE-WRITE + AWARE). */
export const SCENARIO_LABEL_N3_FENCE_PROTO_PRODUCTION_CUTOVER_IMPOSSIBLE = true as const;

export type ScenarioLabelN3FenceAuthority = "legacy" | "namespaced";

export type ScenarioLabelN3FenceMarkerSchemaVersion = 1 | 2;

/** Canonical school-only fence target. No unbound / schoolYear. */
export type ScenarioLabelN3FenceTarget = {
  readonly kind: "school";
  readonly schoolId: EntityId;
};

/**
 * Persistent per-target commit certificate payload.
 * `committedRaw` is verification metadata — never an alternate business read source.
 */
export type ScenarioLabelN3FenceRecord = {
  readonly schemaVersion: typeof SCENARIO_LABEL_N3_FENCE_SCHEMA_VERSION;
  readonly protocolGeneration: typeof SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION;
  readonly authority: ScenarioLabelN3FenceAuthority;
  readonly markerSchemaVersion: ScenarioLabelN3FenceMarkerSchemaVersion;
  readonly schoolId: EntityId;
  readonly resource: typeof SCENARIO_LABEL_N3_FENCE_RESOURCE;
  readonly committedRaw: RawStoredText;
};

export type ScenarioLabelN3FenceRecordInvalidReason =
  | "invalid_json"
  | "invalid_shape"
  | "invalid_schema_version"
  | "invalid_protocol_generation"
  | "invalid_authority"
  | "invalid_marker_schema_version"
  | "authority_marker_schema_mismatch"
  | "invalid_school_id"
  | "invalid_resource"
  | "invalid_committed_raw"
  | "unknown_field";

export type ScenarioLabelN3FenceRecordParseResult =
  | { readonly status: "missing" }
  | { readonly status: "invalid"; readonly reason: ScenarioLabelN3FenceRecordInvalidReason }
  | { readonly status: "valid"; readonly record: ScenarioLabelN3FenceRecord };

export type ScenarioLabelN3FenceViolationKind =
  | "raw_mismatch"
  | "marker_authority_mismatch"
  | "marker_schema_mismatch"
  | "presence_mismatch"
  | "marker_not_synced"
  | "marker_invalid"
  | "marker_missing"
  | "namespaced_without_fence"
  | "equal_copy_violation"
  | "divergent_violation";

export type ScenarioLabelN3FenceAssessment =
  | {
      readonly status: "UNESTABLISHED";
      readonly schoolId: EntityId;
      readonly reason: "fence_missing_pre_cutover";
    }
  | {
      readonly status: "LEGACY_COMMITTED";
      readonly schoolId: EntityId;
      readonly record: ScenarioLabelN3FenceRecord;
      /** Material pre-cutover fence readiness (not a caller-supplied bool). */
      readonly fenceReady: true;
    }
  | {
      readonly status: "NAMESPACED_COMMITTED";
      readonly schoolId: EntityId;
      readonly record: ScenarioLabelN3FenceRecord;
    }
  | {
      readonly status: "VIOLATED";
      readonly schoolId: EntityId | null;
      readonly kind: ScenarioLabelN3FenceViolationKind;
      readonly record: ScenarioLabelN3FenceRecord | null;
    }
  | {
      readonly status: "INVALID";
      readonly reason:
        | ScenarioLabelN3FenceRecordInvalidReason
        | "target_not_school"
        | "target_unresolved"
        | "payload_key_mismatch"
        | "school_id_mismatch"
        | "resource_mismatch";
    }
  | {
      readonly status: "UNAVAILABLE";
      readonly reason: "storage_read_error";
    };

export type ScenarioLabelN3FenceAssessInput = {
  readonly targetResolution: ScenarioLabelMigrationTargetResolution;
  /** Already-loaded fence parse result for the expected school key. */
  readonly fence: ScenarioLabelN3FenceRecordParseResult;
  readonly marker: ScenarioLabelN3AuthorityMarkerParseResult;
  readonly legacyRaw: RawStoredText;
  readonly schoolV2Raw: RawStoredText;
  /** When true, treat storage/reads as unavailable (distinct from UNESTABLISHED). */
  readonly storageReadError?: boolean;
};

export type ScenarioLabelN3FenceCutoverEligibilityReason =
  | "data_not_ready"
  | "fence_not_legacy_committed"
  | "fence_unestablished"
  | "fence_violated"
  | "fence_invalid"
  | "fence_unavailable"
  | "fence_namespaced_committed"
  | "target_mismatch"
  | "unbound_never_eligible"
  | "target_unresolved";

/**
 * Data+fence eligibility only.
 * Full production cutover ALSO requires N3-AWARE completion (documented; not claimed here).
 */
export type ScenarioLabelN3FenceCutoverEligibility =
  | {
      readonly eligible: true;
      readonly schoolId: EntityId;
      readonly layer: "data_and_fence";
    }
  | {
      readonly eligible: false;
      readonly reason: ScenarioLabelN3FenceCutoverEligibilityReason;
    };

export type ScenarioLabelN3FenceCutoverEligibilityInput = {
  /** N3 school-only data-plane readiness assessment (`ready_for_cutover` required). */
  readonly cutoverAssessment: ScenarioLabelN3CutoverAssessment;
  readonly fenceAssessment: ScenarioLabelN3FenceAssessment;
};

/** Optional lower-level plan input — plan.ready ≠ eligibility by itself. */
export type ScenarioLabelN3FencePlanEligibilityNoteInput = {
  readonly plan: ScenarioLabelN3CutoverPlan;
  readonly fenceAssessment: ScenarioLabelN3FenceAssessment;
};

/** Future FENCE-WRITE order contracts (pure documentation constants). */
export const SCENARIO_LABEL_N3_FENCE_WRITE_ORDER_LEGACY = [
  "legacy_authoritative_data",
  "school_v2_shadow",
  "verify",
  "v1_legacy_marker",
  "fence_last",
] as const;

export const SCENARIO_LABEL_N3_FENCE_WRITE_ORDER_NAMESPACED = [
  "school_v2_authoritative",
  "legacy_compatibility_mirror",
  "verify",
  "v2_namespaced_marker",
  "fence_last",
] as const;
