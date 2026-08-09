/**
 * N3-PROTO — pure authority-cutover types for phmax-scenario-label / value.
 *
 * Zero production call sites. Zero storage I/O.
 * Production business authority remains LEGACY until a later N3-CUTOVER-WRITE phase.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import type {
  RawStoredText,
  ScenarioLabelMigrationAuthoritativePresence,
  ScenarioLabelMigrationMirrorHealth,
  ScenarioLabelMigrationTargetResolution,
} from "./scenario-label-migration-types";

/** Marker schema for namespaced authority (semantic referent change vs v1). */
export const SCENARIO_LABEL_N3_MARKER_SCHEMA_VERSION = 2 as const;

/** Explicit roadmap stop: production cutover requires a later N3-FENCE phase. */
export const SCENARIO_LABEL_N3_CUTOVER_REQUIRES_FENCE = true as const;

/** Strict compatibility period: successful namespaced writes must leave v2 == legacy. */
export const SCENARIO_LABEL_N3_STRICT_COMPATIBILITY_MIRROR = true as const;

/** Central backup omits authority markers (device migration metadata). */
export const SCENARIO_LABEL_N3_BACKUP_OMITS_AUTHORITY_METADATA = true as const;

/** Intentional runtime namespaced→legacy downgrade is unsupported. */
export const SCENARIO_LABEL_N3_AUTHORITY_DOWNGRADE_UNSUPPORTED = true as const;

/** Namespaced authority must not silently fall back to legacy on read failure. */
export const SCENARIO_LABEL_N3_NO_UNSAFE_LEGACY_FALLBACK = true as const;

/**
 * Deployment rollback to N2 is NOT the same as an already-open old N2 tab.
 * Fence must address the latter before production cutover.
 */
export const SCENARIO_LABEL_N3_MIXED_VERSION_TAB_HAZARD =
  "already-open N2 tab can legacy-write / repair-downgrade namespaced markers; deployment rollback after reload is a distinct, weaker concern." as const;

export type ScenarioLabelN3LegacyMarkerPayload = {
  readonly schemaVersion: 1;
  readonly authority: "legacy";
  readonly mirrorHealth: ScenarioLabelMigrationMirrorHealth;
  readonly authoritativePresence: ScenarioLabelMigrationAuthoritativePresence;
};

export type ScenarioLabelN3NamespacedMarkerPayload = {
  readonly schemaVersion: typeof SCENARIO_LABEL_N3_MARKER_SCHEMA_VERSION;
  readonly authority: "namespaced";
  readonly mirrorHealth: ScenarioLabelMigrationMirrorHealth;
  readonly authoritativePresence: ScenarioLabelMigrationAuthoritativePresence;
};

/** Dual-schema authority marker (v1 legacy OR v2 namespaced). Never mixed pairs. */
export type ScenarioLabelN3AuthorityMarkerPayload =
  | ScenarioLabelN3LegacyMarkerPayload
  | ScenarioLabelN3NamespacedMarkerPayload;

export type ScenarioLabelN3MarkerInvalidReason =
  | "invalid_json"
  | "invalid_shape"
  | "invalid_schema_version"
  | "invalid_authority"
  | "invalid_mirror_health"
  | "invalid_authoritative_presence"
  | "unknown_field"
  | "schema_authority_mismatch";

export type ScenarioLabelN3AuthorityMarkerParseResult =
  | { readonly status: "missing" }
  | { readonly status: "invalid"; readonly reason: ScenarioLabelN3MarkerInvalidReason }
  | { readonly status: "valid"; readonly payload: ScenarioLabelN3AuthorityMarkerPayload };

/** Minimal N3 authority state machine (marker + fresh equality; no in-progress state). */
export type ScenarioLabelN3AuthorityStateKind =
  | "LEGACY_UNPREPARED"
  | "LEGACY_PREPARED"
  | "NAMESPACED_ACTIVE"
  | "NAMESPACED_DEGRADED"
  | "AUTHORITY_BLOCKED";

export type ScenarioLabelN3UnpreparedReason =
  | "target_unresolved"
  | "target_unbound"
  | "marker_missing"
  | "marker_invalid"
  | "marker_not_legacy"
  | "marker_not_synced"
  | "presence_mismatch"
  | "raw_mismatch"
  | "storage_read_error";

export type ScenarioLabelN3DegradedReason =
  | "mirror_dirty"
  | "raw_mismatch"
  | "presence_mismatch"
  | "storage_read_error";

export type ScenarioLabelN3AuthorityState =
  | {
      readonly kind: "LEGACY_UNPREPARED";
      readonly reason: ScenarioLabelN3UnpreparedReason;
    }
  | {
      readonly kind: "LEGACY_PREPARED";
      readonly schoolId: EntityId;
      readonly marker: ScenarioLabelN3LegacyMarkerPayload;
    }
  | {
      readonly kind: "NAMESPACED_ACTIVE";
      readonly schoolId: EntityId;
      readonly marker: ScenarioLabelN3NamespacedMarkerPayload;
    }
  | {
      readonly kind: "NAMESPACED_DEGRADED";
      readonly schoolId: EntityId;
      readonly marker: ScenarioLabelN3NamespacedMarkerPayload;
      readonly reason: ScenarioLabelN3DegradedReason;
    }
  | {
      readonly kind: "AUTHORITY_BLOCKED";
      readonly reason: "malformed_marker" | "ambiguous_marker_loss" | "storage_read_error";
    };

export type ScenarioLabelN3CutoverNotReadyReason =
  | ScenarioLabelN3UnpreparedReason
  | "already_namespaced"
  | "namespaced_degraded";

export type ScenarioLabelN3CutoverAssessment =
  | {
      readonly status: "ready_for_cutover";
      readonly schoolId: EntityId;
      readonly fromMarker: ScenarioLabelN3LegacyMarkerPayload;
      readonly toMarker: ScenarioLabelN3NamespacedMarkerPayload;
    }
  | {
      readonly status: "needs_bootstrap_or_repair";
      readonly reason:
        | "marker_missing"
        | "marker_not_synced"
        | "raw_mismatch"
        | "presence_mismatch"
        | "marker_invalid";
    }
  | {
      readonly status: "not_ready";
      readonly reason: ScenarioLabelN3CutoverNotReadyReason;
    };

export type ScenarioLabelN3CutoverPlan =
  | { readonly status: "not_ready"; readonly reason: ScenarioLabelN3CutoverNotReadyReason }
  | {
      readonly status: "needs_bootstrap_or_repair";
      readonly reason: Extract<
        ScenarioLabelN3CutoverAssessment,
        { status: "needs_bootstrap_or_repair" }
      >["reason"];
    }
  | {
      readonly status: "ready";
      readonly schoolId: EntityId;
      readonly operation: "replace_marker_only";
      readonly fromMarker: ScenarioLabelN3LegacyMarkerPayload;
      readonly toMarker: ScenarioLabelN3NamespacedMarkerPayload;
      /** Fresh legacy/v2 equality immediately BEFORE marker write. */
      readonly requiresPreMarkerEquality: true;
      /** Marker write + strict parse read-back of expected v2 payload. */
      readonly requiresMarkerReadBack: true;
      /** Fresh legacy/v2 equality AFTER marker read-back. */
      readonly requiresPostMarkerEquality: true;
    };

/** Future executor outcome taxonomy (pure classification; no runtime). */
export type ScenarioLabelN3CutoverOutcome =
  | { readonly status: "not_ready"; readonly reason: ScenarioLabelN3CutoverNotReadyReason }
  | {
      readonly status: "needs_bootstrap_or_repair";
      readonly reason: Extract<
        ScenarioLabelN3CutoverAssessment,
        { status: "needs_bootstrap_or_repair" }
      >["reason"];
    }
  | { readonly status: "ready" }
  | { readonly status: "cutover_success" }
  | { readonly status: "marker_write_failed" }
  | { readonly status: "marker_verify_failed" }
  | {
      readonly status: "concurrent_drift";
      readonly phase: "pre_marker" | "post_marker";
    }
  | { readonly status: "cutover_degraded"; readonly reason: "post_marker_raw_drift" }
  | { readonly status: "storage_unavailable" };

export type ScenarioLabelN3ReadRoute =
  | {
      readonly status: "legacy";
      readonly reason:
        | "legacy_marker"
        | "unbound_target"
        | "marker_missing_equal"
        | "legacy_unprepared";
    }
  | {
      readonly status: "namespaced";
      readonly schoolId: EntityId;
    }
  | {
      readonly status: "namespaced_degraded";
      readonly schoolId: EntityId;
      readonly signal: "legacy_diverged" | "mirror_dirty";
      /** Business read still routes to v2; legacy is NOT substituted. */
      readonly readFrom: "school_v2";
    }
  | {
      readonly status: "blocked";
      readonly reason:
        | "malformed_marker"
        | "namespaced_v2_unavailable"
        | "namespaced_presence_inconsistent"
        | "marker_missing_divergent"
        | "target_unresolved"
        | "storage_read_error"
        | "unsafe_fallback_forbidden";
    };

export type ScenarioLabelN3NamespacedWritePhase =
  | "snapshot"
  | "write_v2_authoritative"
  | "write_legacy_compatibility"
  | "verify_both_equal_desired"
  | "marker_persist"
  | "marker_read_back";

export const SCENARIO_LABEL_N3_NAMESPACED_WRITE_PHASE_ORDER: readonly ScenarioLabelN3NamespacedWritePhase[] =
  [
    "snapshot",
    "write_v2_authoritative",
    "write_legacy_compatibility",
    "verify_both_equal_desired",
    "marker_persist",
    "marker_read_back",
  ] as const;

export type ScenarioLabelN3RawSnapshotMembers = {
  readonly legacy: RawStoredText;
  readonly schoolV2: RawStoredText;
  readonly marker: ScenarioLabelN3AuthorityMarkerPayload | null;
};

export type ScenarioLabelN3NamespacedWritePlan =
  | {
      readonly status: "blocked";
      readonly reason: "not_namespaced_active" | "target_not_school" | "storage_read_error";
    }
  | {
      readonly status: "planned";
      readonly schoolId: EntityId;
      readonly phases: typeof SCENARIO_LABEL_N3_NAMESPACED_WRITE_PHASE_ORDER;
      readonly snapshotMembers: readonly ["legacy", "school_v2", "marker"];
      readonly desiredV2: RawStoredText;
      readonly desiredLegacy: RawStoredText;
  /** Strict compatibility period: desired copies are identical. */
  readonly strictMirror: true;
      readonly desiredMarker: ScenarioLabelN3NamespacedMarkerPayload;
      readonly presenceChanging: boolean;
      readonly onV2WriteFailure: "authoritative_failed_legacy_must_not_advance";
      readonly onLegacyMirrorFailure: "rollback_v2_then_business_fail";
      readonly onRollbackFailure: "fatal_partial";
    };

export type ScenarioLabelN3NamespacedWriteOutcome =
  | { readonly status: "success"; readonly rollbackInvariant: "legacy_equals_v2" }
  | {
      readonly status: "authoritative_failed";
      readonly code: "v2_write_failed" | "storage_unavailable";
      readonly legacyAdvanced: false;
    }
  | {
      readonly status: "compatibility_mirror_failed";
      readonly rollbackRequired: true;
    }
  | {
      readonly status: "rollback_succeeded";
      readonly business: "failed";
    }
  | {
      readonly status: "fatal_partial";
      readonly reason: "rollback_failed_after_partial_write";
    }
  | { readonly status: "verify_mismatch" }
  | {
      readonly status: "marker_persist_failed";
      readonly kind: "value_only" | "presence_change";
      /** Presence-changing marker failure is never silent success. */
      readonly business:
        | "failed_conservative"
        | "data_ok_metadata_incomplete";
    };

export type ScenarioLabelN3EstablishmentDecision =
  | { readonly action: "permit_establishment"; readonly authority: "legacy" }
  | {
      readonly action: "no_op_namespaced_authoritative";
      readonly authority: "namespaced";
    }
  | {
      readonly action: "blocked";
      readonly reason: "malformed_authority" | "target_unresolved" | "unbound_not_applicable";
    };

export type ScenarioLabelN3RestorePlan =
  | {
      readonly status: "planned";
      readonly authority: "legacy";
      readonly schoolId: EntityId;
      readonly desiredLegacy: RawStoredText;
      readonly desiredSchoolV2: RawStoredText;
      readonly desiredMarker: ScenarioLabelN3LegacyMarkerPayload;
      readonly snapshotMembers: readonly ["legacy", "school_v2", "marker"];
    }
  | {
      readonly status: "planned";
      readonly authority: "namespaced";
      readonly schoolId: EntityId;
      readonly desiredLegacy: RawStoredText;
      readonly desiredSchoolV2: RawStoredText;
      readonly desiredMarker: ScenarioLabelN3NamespacedMarkerPayload;
      readonly snapshotMembers: readonly ["legacy", "school_v2", "marker"];
    }
  | {
      readonly status: "blocked";
      readonly reason: "authority_unresolved" | "target_not_school" | "malformed_marker";
    };

export type ScenarioLabelN3ClearPlan =
  | {
      readonly status: "planned";
      readonly authority: "legacy";
      readonly schoolId: EntityId;
      readonly desiredLegacy: { readonly exists: false };
      readonly desiredSchoolV2: { readonly exists: false };
      readonly desiredMarker: ScenarioLabelN3LegacyMarkerPayload;
    }
  | {
      readonly status: "planned";
      readonly authority: "namespaced";
      readonly schoolId: EntityId;
      readonly desiredLegacy: { readonly exists: false };
      readonly desiredSchoolV2: { readonly exists: false };
      readonly desiredMarker: ScenarioLabelN3NamespacedMarkerPayload;
    }
  | {
      readonly status: "blocked";
      readonly reason: "authority_unresolved" | "target_not_school" | "malformed_marker";
    };

export type ScenarioLabelN3ProductionCutoverEligibility =
  | { readonly eligible: true }
  | {
      readonly eligible: false;
      readonly blockers: readonly ScenarioLabelN3ProductionCutoverBlocker[];
    };

export type ScenarioLabelN3ProductionCutoverBlocker =
  | "fence_not_ready"
  | "data_not_ready"
  | "writers_not_authority_aware"
  | "adopt_hooks_not_authority_aware"
  | "restore_not_authority_aware"
  | "clear_not_authority_aware"
  | "snippet_not_authority_aware";

/** Surfaces that MUST become authority-aware before cutover (inventory contract). */
export const SCENARIO_LABEL_N3_AUTHORITY_AWARE_WRITER_SURFACES = [
  "scenario_repository_dashboard_writer",
  "runtime_handoff_writer",
  "console_handoff_snippet",
  "level_b_clear",
  "post_export_clear",
  "restore_scenario_ops",
  "profile_vz_restore_establishment_hooks",
] as const;

export const SCENARIO_LABEL_N3_AUTHORITY_AWARE_READ_SURFACES = [
  "dashboard_ui_scenario_read",
  "repository_raw_ui_reads",
  "backup_logical_scenario_read",
  "exports_handoff_logical_reads",
] as const;

export type ScenarioLabelN3ClassifyInput = {
  readonly targetResolution: ScenarioLabelMigrationTargetResolution;
  readonly marker: ScenarioLabelN3AuthorityMarkerParseResult;
  readonly legacyRaw: RawStoredText;
  readonly schoolV2Raw: RawStoredText;
  /** When true, treat raw/marker reads as unavailable. */
  readonly storageReadError?: boolean;
};

export type ScenarioLabelN3ReadRouteInput = ScenarioLabelN3ClassifyInput & {
  /**
   * When namespaced: whether school v2 authoritative raw was successfully loaded.
   * Defaults to true when schoolV2Raw is supplied without error.
   */
  readonly schoolV2ReadOk?: boolean;
};
