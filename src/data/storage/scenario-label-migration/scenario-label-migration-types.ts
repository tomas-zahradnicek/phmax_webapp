import type { EntityId } from "../../../domain/shared/entity-id";

/** Pilot module/resource identity (fixed for scenario-label migration). */
export const SCENARIO_LABEL_MIGRATION_MODULE_ID = "phmax-scenario-label" as const;
export const SCENARIO_LABEL_MIGRATION_RESOURCE_ID = "value" as const;

export const SCENARIO_LABEL_MIGRATION_MARKER_SCHEMA_VERSION = 1 as const;

/**
 * Exact raw persisted text state.
 *
 * `exists: false` means the key is absent (`getItem(...) === null`).
 * `exists: true` with `value: ""` means the key is present but empty.
 */
export type RawStoredText =
  | { readonly exists: false }
  | { readonly exists: true; readonly value: string };

/** Resolved physical migration target. Never `schoolYear`. */
export type ScenarioLabelMigrationTarget =
  | { readonly kind: "unbound" }
  | { readonly kind: "school"; readonly schoolId: EntityId };

export type ScenarioLabelMigrationTargetSkipReason = "corrupted" | "storage_unavailable";

export type ScenarioLabelMigrationTargetResolution =
  | { readonly status: "resolved"; readonly target: ScenarioLabelMigrationTarget }
  | {
      readonly status: "skipped";
      readonly reason: ScenarioLabelMigrationTargetSkipReason;
    };

export type ScenarioLabelMigrationAuthority = "legacy";

export type ScenarioLabelMigrationMirrorHealth = "synced" | "dirty";

export type ScenarioLabelMigrationAuthoritativePresence = "present" | "absent";

/**
 * Minimal per-target migration marker payload (v1).
 *
 * Resource and scope live in the marker key, not in the payload.
 */
export type ScenarioLabelMigrationMarkerPayload = {
  readonly schemaVersion: typeof SCENARIO_LABEL_MIGRATION_MARKER_SCHEMA_VERSION;
  readonly authority: ScenarioLabelMigrationAuthority;
  readonly mirrorHealth: ScenarioLabelMigrationMirrorHealth;
  readonly authoritativePresence: ScenarioLabelMigrationAuthoritativePresence;
};

/** Runtime shadow outcome for a successful authoritative write (N2-WRITE). */
export type ScenarioLabelShadowOutcome = "synced" | "dirty" | "skipped";

export type ScenarioLabelWriteResult =
  | { readonly status: "authoritative_failed"; readonly code: "legacy_write_failed" | "storage_unavailable" }
  | { readonly status: "success"; readonly shadow: ScenarioLabelShadowOutcome };

/** Pure write-order contract: authoritative legacy must succeed before any shadow step. */
export type ScenarioLabelWritePhase =
  | "legacy_authoritative"
  | "shadow_mirror"
  | "shadow_verify"
  | "marker_persist";

export const SCENARIO_LABEL_WRITE_PHASE_ORDER: readonly ScenarioLabelWritePhase[] = [
  "legacy_authoritative",
  "shadow_mirror",
  "shadow_verify",
  "marker_persist",
] as const;
