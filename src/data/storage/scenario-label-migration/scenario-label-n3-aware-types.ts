/**
 * N3-AWARE-CORE — inert authority-aware runtime types for phmax-scenario-label / value.
 *
 * Zero production consumers. Production behavior remains N3-PREP (legacy authority).
 * WIRING is a separate future PR.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import type { RawStoredText } from "./scenario-label-migration-types";
import type {
  ScenarioLabelN3AuthorityMarkerPayload,
  ScenarioLabelN3LegacyMarkerPayload,
  ScenarioLabelN3NamespacedMarkerPayload,
} from "./scenario-label-n3-authority-types";
import type {
  ScenarioLabelN3FenceAssessment,
  ScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-types";

/** Minimal storage surface for AWARE-CORE (same-storage DI). */
export type ScenarioLabelAwareStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Runtime authority states understood by AWARE-CORE. */
export type ScenarioLabelRuntimeAuthorityKind =
  | "UNBOUND"
  | "LEGACY_READY"
  | "LEGACY_COMPAT_UNPREPARED"
  | "LEGACY_VIOLATED_RECOVERABLE"
  | "NAMESPACED_READY"
  | "NAMESPACED_DEGRADED"
  | "AUTHORITY_BLOCKED"
  | "STORAGE_UNAVAILABLE";

export type ScenarioLabelRuntimeAuthorityBlockedReason =
  | "malformed_marker"
  | "malformed_fence"
  | "schema_conflict"
  | "namespaced_without_fence"
  | "marker_fence_authority_mismatch"
  | "invalid_fence_binding"
  | "ambiguous_violation"
  | "ambiguous_marker_loss"
  | "namespaced_evidence_conflict"
  | "target_unresolved"
  | "winner_unprovable";

export type ScenarioLabelRuntimeAuthorityDegradedReason =
  | "mirror_dirty"
  | "raw_mismatch"
  | "presence_mismatch"
  | "fence_not_committed";

export type ScenarioLabelRuntimeAuthorityUnpreparedReason =
  | "fence_missing"
  | "marker_missing"
  | "marker_not_synced"
  | "presence_mismatch"
  | "raw_mismatch";

export type ScenarioLabelRuntimeAuthorityAssessment =
  | {
      readonly kind: "UNBOUND";
      readonly legacyRaw: RawStoredText;
    }
  | {
      readonly kind: "LEGACY_READY";
      readonly schoolId: EntityId;
      readonly marker: ScenarioLabelN3LegacyMarkerPayload;
      readonly fence: ScenarioLabelN3FenceRecord;
      readonly legacyRaw: RawStoredText;
      readonly schoolV2Raw: RawStoredText;
      readonly fenceAssessment: ScenarioLabelN3FenceAssessment;
    }
  | {
      readonly kind: "LEGACY_COMPAT_UNPREPARED";
      readonly schoolId: EntityId;
      readonly reason: ScenarioLabelRuntimeAuthorityUnpreparedReason;
      readonly marker: ScenarioLabelN3LegacyMarkerPayload | null;
      readonly legacyRaw: RawStoredText;
      readonly schoolV2Raw: RawStoredText;
      readonly fenceAssessment: ScenarioLabelN3FenceAssessment;
    }
  | {
      readonly kind: "LEGACY_VIOLATED_RECOVERABLE";
      readonly schoolId: EntityId;
      readonly marker: ScenarioLabelN3LegacyMarkerPayload;
      readonly legacyRaw: RawStoredText;
      readonly schoolV2Raw: RawStoredText;
      readonly fenceAssessment: ScenarioLabelN3FenceAssessment;
      readonly signal: "stale_legacy_fence";
    }
  | {
      readonly kind: "NAMESPACED_READY";
      readonly schoolId: EntityId;
      readonly marker: ScenarioLabelN3NamespacedMarkerPayload;
      readonly fence: ScenarioLabelN3FenceRecord;
      readonly legacyRaw: RawStoredText;
      readonly schoolV2Raw: RawStoredText;
      readonly fenceAssessment: ScenarioLabelN3FenceAssessment;
    }
  | {
      readonly kind: "NAMESPACED_DEGRADED";
      readonly schoolId: EntityId;
      readonly marker: ScenarioLabelN3NamespacedMarkerPayload;
      readonly reason: ScenarioLabelRuntimeAuthorityDegradedReason;
      readonly legacyRaw: RawStoredText;
      readonly schoolV2Raw: RawStoredText;
      readonly fenceAssessment: ScenarioLabelN3FenceAssessment;
    }
  | {
      readonly kind: "AUTHORITY_BLOCKED";
      readonly schoolId: EntityId | null;
      readonly reason: ScenarioLabelRuntimeAuthorityBlockedReason;
      readonly fenceAssessment: ScenarioLabelN3FenceAssessment | null;
      readonly marker: ScenarioLabelN3AuthorityMarkerPayload | null;
    }
  | {
      readonly kind: "STORAGE_UNAVAILABLE";
    };

/** Logical read — never returns fence.committedRaw as business value. */
export type ScenarioLabelAwareLogicalReadResult =
  | {
      readonly status: "ok";
      readonly authority: "legacy";
      readonly raw: RawStoredText;
      readonly signal?: "compat_unprepared" | "legacy_violation_warning";
    }
  | {
      readonly status: "ok";
      readonly authority: "namespaced";
      readonly raw: RawStoredText;
      readonly signal?: "degraded";
      /** Always school-v2 — never fence.committedRaw. */
      readonly source: "school_v2";
    }
  | {
      readonly status: "blocked";
      readonly reason: ScenarioLabelRuntimeAuthorityBlockedReason | "authority_blocked";
    }
  | {
      readonly status: "unavailable";
    }
  | {
      readonly status: "unbound";
      readonly raw: RawStoredText;
    };

/** Explicit logical mutation result union (no authority/fence booleans). */
export type ScenarioLabelAwareWriteResult =
  | {
      readonly status: "success";
      readonly authority: "legacy" | "namespaced";
      readonly fence?: "committed" | "already_committed";
    }
  | {
      readonly status: "authoritative_failed";
      readonly code: "v2_write_failed" | "legacy_write_failed" | "storage_unavailable";
      readonly legacyAdvanced: false;
    }
  | {
      readonly status: "rollback_succeeded";
      readonly business: "failed";
      readonly phase: "legacy_mirror" | "verify";
    }
  | {
      readonly status: "fatal_partial";
      readonly reason: "rollback_failed_after_partial_write";
      readonly phase: "legacy_mirror" | "verify" | "clear_mirror";
    }
  | {
      readonly status: "marker_incomplete";
      readonly kind: "value_only" | "presence_change";
      readonly business: "failed_conservative" | "data_ok_metadata_incomplete";
    }
  | {
      readonly status: "fence_incomplete";
      readonly reason:
        | "fence_write_failed"
        | "read_back_malformed"
        | "assessment_not_namespaced_committed"
        | "concurrent_drift"
        | "storage_unavailable";
      /** Data tuple settled; NOT safely committed for future ops. */
      readonly dataSettled: true;
    }
  | {
      readonly status: "blocked_authority";
      readonly reason: ScenarioLabelRuntimeAuthorityBlockedReason | "concurrent_authority_change";
    }
  | {
      readonly status: "storage_unavailable";
    };

export type ScenarioLabelAwareClearResult = ScenarioLabelAwareWriteResult;

/** Establishment decision gate for future WIRING (inert). */
export type ScenarioLabelAwareEstablishmentDecision =
  | {
      readonly action: "permit_legacy_establishment";
      readonly authority: "legacy";
      readonly reason: "legacy_repairable" | "legacy_unprepared" | "unbound_compatible";
    }
  | {
      readonly action: "permit_legacy_prep";
      readonly authority: "legacy";
      readonly reason: "legacy_already_ready";
    }
  | {
      readonly action: "no_op_namespaced_authoritative";
      readonly authority: "namespaced";
      readonly reason: "namespaced_ready" | "namespaced_degraded";
    }
  | {
      readonly action: "blocked";
      readonly reason:
        | ScenarioLabelRuntimeAuthorityBlockedReason
        | "authority_blocked"
        | "storage_unavailable";
    };

/** Empty-target / backup policy locks (types + tests; no production wiring). */
export const SCENARIO_LABEL_N3_AWARE_EMPTY_TARGET_DEFAULTS_TO_LEGACY = true as const;
export const SCENARIO_LABEL_N3_AWARE_BACKUP_CANNOT_CREATE_NAMESPACED = true as const;
export const SCENARIO_LABEL_N3_AWARE_NO_FENCE_VALUE_ROUTING = true as const;
export const SCENARIO_LABEL_N3_AWARE_NO_WRITE_ON_READ = true as const;
export const SCENARIO_LABEL_N3_AWARE_NO_CUTOVER = true as const;
export const SCENARIO_LABEL_N3_AWARE_NO_LEGACY_TO_SCHEMA2 = true as const;
export const SCENARIO_LABEL_N3_AWARE_NO_NAMESPACED_LEGACY_FALLBACK = true as const;
/** CORE primitives remain; production wiring is active in N3-AWARE-WIRING. */
export const SCENARIO_LABEL_N3_AWARE_CORE_INERT = false as const;
export const SCENARIO_LABEL_N3_AWARE_WIRING_ACTIVE = true as const;

export const SCENARIO_LABEL_N3_AWARE_NAMESPACED_WRITE_PHASE_ORDER = [
  "fresh_authority_gate",
  "raw_snapshot",
  "write_v2_authoritative",
  "write_legacy_compatibility",
  "verify_legacy_equals_v2",
  "write_schema2_namespaced_marker",
  "marker_read_back",
  "finalize_namespaced_fence_last",
  "full_fresh_assessment",
] as const;

export type ScenarioLabelN3AwareNamespacedWritePhase =
  (typeof SCENARIO_LABEL_N3_AWARE_NAMESPACED_WRITE_PHASE_ORDER)[number];
