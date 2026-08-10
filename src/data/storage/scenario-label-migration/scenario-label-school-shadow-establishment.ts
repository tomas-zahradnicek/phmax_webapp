/**
 * N2-ADOPT-PROTO — school-shadow establishment (pure protocol).
 *
 * Roadmap label: N2-ADOPT.
 * Actual semantics: establish / repair a school:<id> shadow from fresh LEGACY,
 * never from unbound. Unbound key + unbound marker are PRESERVE-only.
 *
 * PROTO has zero production call sites and zero runtime lifecycle hooks.
 * First automatic establishment belongs to N2-ADOPT-WRITE.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import type { IdentityRegistryReadResult } from "../../identity/identity-registry-types";
import { isUuid, normalizeUuid } from "../../identity/identity-uuid";
import { authoritativePresenceFromRaw, rawStoredTextEqual } from "./scenario-label-migration-raw";
import type {
  RawStoredText,
  ScenarioLabelMigrationAuthoritativePresence,
  ScenarioLabelMigrationMarkerPayload,
} from "./scenario-label-migration-types";

/** Explicit unbound preservation contract (school-only operations). */
export const SCHOOL_SHADOW_ESTABLISHMENT_UNBOUND_CONTRACT = {
  unboundKey: "preserve",
  unboundMarker: "preserve",
} as const;

/** School-only operation targets. Unbound is intentionally absent. */
export type SchoolShadowEstablishmentOperationTarget = "school_data" | "school_marker";

/**
 * Future WRITE phase order (documentation + type contract).
 * PROTO does not execute these phases.
 */
export type SchoolShadowEstablishmentPhase =
  | "legacy_read_initial"
  | "target_inspect"
  | "marker_invalidate"
  | "school_shadow_write"
  | "school_shadow_verify"
  | "legacy_read_final"
  | "marker_persist";

export const SCHOOL_SHADOW_ESTABLISHMENT_PHASE_ORDER: readonly SchoolShadowEstablishmentPhase[] = [
  "legacy_read_initial",
  "target_inspect",
  "marker_invalidate",
  "school_shadow_write",
  "school_shadow_verify",
  "legacy_read_final",
  "marker_persist",
] as const;

/**
 * Future WRITE / soft-UX result semantics.
 * Profile/Identity business success is independent of this result.
 */
export type SchoolShadowEstablishmentResultStatus =
  | "already_ready"
  | "established"
  | "shadow_dirty"
  | "marker_incomplete"
  | "skipped_namespaced"
  | "skipped_authority_blocked"
  | "skipped_identity"
  | "storage_unavailable";

export type SchoolShadowEstablishmentResult =
  | { readonly status: "already_ready" }
  | { readonly status: "established" }
  | { readonly status: "shadow_dirty" }
  | { readonly status: "marker_incomplete" }
  | { readonly status: "skipped_namespaced" }
  | { readonly status: "skipped_authority_blocked" }
  | {
      readonly status: "skipped_identity";
      readonly reason: SchoolShadowEstablishmentSkipReason;
    }
  | { readonly status: "storage_unavailable" };

export type SchoolShadowEstablishmentSkipReason =
  | "missing"
  | "corrupted"
  | "storage_unavailable"
  | "invalid_school_id";

export type SchoolShadowEstablishmentTargetResolution =
  | { readonly status: "school"; readonly schoolId: EntityId }
  | { readonly status: "skipped"; readonly reason: SchoolShadowEstablishmentSkipReason };

/**
 * Observed school-target marker state for planning.
 * Invalid is fail-closed (never treated as healthy).
 */
export type SchoolShadowEstablishmentMarkerState =
  | { readonly status: "missing" }
  | { readonly status: "invalid" }
  | { readonly status: "valid"; readonly payload: ScenarioLabelMigrationMarkerPayload };

export type SchoolShadowEstablishmentPlanKind =
  | "already_ready"
  | "establish_present"
  | "establish_absent"
  | "repair_present"
  | "repair_absent";

export type SchoolShadowEstablishmentSchoolDataAction =
  | "none"
  | "write_present"
  | "remove";

export type SchoolShadowEstablishmentMarkerAction = "none" | "establish" | "repair";

export type SchoolShadowEstablishmentPlan = {
  readonly kind: SchoolShadowEstablishmentPlanKind;
  readonly schoolId: EntityId;
  /** Always derived from fresh legacy raw — never from unbound. */
  readonly desiredSchoolRaw: RawStoredText;
  readonly desiredAuthoritativePresence: ScenarioLabelMigrationAuthoritativePresence;
  readonly schoolDataAction: SchoolShadowEstablishmentSchoolDataAction;
  readonly markerAction: SchoolShadowEstablishmentMarkerAction;
  readonly schoolWriteRequired: boolean;
  readonly markerWriteRequired: boolean;
};

export type SchoolShadowEstablishmentPlannerInput = {
  readonly schoolId: EntityId;
  readonly freshLegacyRaw: RawStoredText;
  readonly currentSchoolShadowRaw: RawStoredText;
  readonly markerState: SchoolShadowEstablishmentMarkerState;
  /**
   * Diagnostic / test-only. NEVER consulted for desired school state.
   * If supplied, planner output must be identical for any unbound value.
   */
  readonly hypotheticalUnboundRaw?: RawStoredText;
};

function isCanonicalEntityId(value: unknown): value is EntityId {
  return typeof value === "string" && isUuid(value) && value === normalizeUuid(value);
}

/** Fail-closed canonical schoolId gate (no serialization-time normalization). */
export function resolveCanonicalSchoolIdForEstablishment(
  schoolId: unknown,
): SchoolShadowEstablishmentTargetResolution {
  if (!isCanonicalEntityId(schoolId)) {
    return { status: "skipped", reason: "invalid_school_id" };
  }
  return { status: "school", schoolId };
}

/**
 * Resolve school-shadow establishment target from Identity read result.
 *
 * missing → skipped (no school target; never unbound)
 * corrupted / storage_unavailable → skipped
 * valid registry → school:<canonical schoolId>
 */
export function resolveSchoolShadowEstablishmentTarget(
  identity: IdentityRegistryReadResult,
): SchoolShadowEstablishmentTargetResolution {
  if (!identity.ok) {
    return { status: "skipped", reason: identity.code };
  }

  if (identity.registry == null) {
    return { status: "skipped", reason: "missing" };
  }

  return resolveCanonicalSchoolIdForEstablishment(identity.registry.schoolId);
}

function isHealthySyncedMarker(
  markerState: SchoolShadowEstablishmentMarkerState,
  legacyRaw: RawStoredText,
): boolean {
  if (markerState.status !== "valid") {
    return false;
  }
  const { payload } = markerState;
  if (
    payload.schemaVersion !== 1 ||
    payload.authority !== "legacy" ||
    payload.mirrorHealth !== "synced"
  ) {
    return false;
  }
  return payload.authoritativePresence === authoritativePresenceFromRaw(legacyRaw);
}

function schoolDataActionForDesired(
  desired: RawStoredText,
): Exclude<SchoolShadowEstablishmentSchoolDataAction, "none"> {
  return desired.exists ? "write_present" : "remove";
}

function planKindForPresence(
  mode: "establish" | "repair",
  presence: ScenarioLabelMigrationAuthoritativePresence,
): SchoolShadowEstablishmentPlanKind {
  if (mode === "establish") {
    return presence === "present" ? "establish_present" : "establish_absent";
  }
  return presence === "present" ? "repair_present" : "repair_absent";
}

/**
 * Pure school-shadow establishment planner.
 *
 * Desired school state = fresh legacy raw only.
 * Unbound (even if supplied as hypotheticalUnboundRaw) is ignored.
 * Zero storage I/O.
 */
export function planSchoolShadowEstablishment(
  input: SchoolShadowEstablishmentPlannerInput,
): SchoolShadowEstablishmentPlan {
  // Touch optional diagnostic field so callers can prove independence without using it.
  void input.hypotheticalUnboundRaw;

  const desiredSchoolRaw = input.freshLegacyRaw;
  const desiredAuthoritativePresence = authoritativePresenceFromRaw(desiredSchoolRaw);
  const schoolRawMatches = rawStoredTextEqual(
    input.currentSchoolShadowRaw,
    desiredSchoolRaw,
  );
  const markerHealthy = isHealthySyncedMarker(input.markerState, desiredSchoolRaw);

  if (schoolRawMatches && markerHealthy) {
    return {
      kind: "already_ready",
      schoolId: input.schoolId,
      desiredSchoolRaw,
      desiredAuthoritativePresence,
      schoolDataAction: "none",
      markerAction: "none",
      schoolWriteRequired: false,
      markerWriteRequired: false,
    };
  }

  const schoolWriteRequired = !schoolRawMatches;
  const schoolDataAction: SchoolShadowEstablishmentSchoolDataAction = schoolWriteRequired
    ? schoolDataActionForDesired(desiredSchoolRaw)
    : "none";

  // Marker missing → establish; dirty/invalid/presence-mismatch → repair.
  const markerAction: SchoolShadowEstablishmentMarkerAction =
    input.markerState.status === "missing" ? "establish" : "repair";

  let mode: "establish" | "repair";
  if (!schoolRawMatches) {
    mode = input.currentSchoolShadowRaw.exists ? "repair" : "establish";
  } else {
    mode = input.markerState.status === "missing" ? "establish" : "repair";
  }

  return {
    kind: planKindForPresence(mode, desiredAuthoritativePresence),
    schoolId: input.schoolId,
    desiredSchoolRaw,
    desiredAuthoritativePresence,
    schoolDataAction,
    markerAction,
    schoolWriteRequired,
    markerWriteRequired: true,
  };
}

/**
 * Final-legacy re-read gate for future WRITE.
 *
 * Healthy synced marker may be persisted only when final fresh legacy equals
 * the verified school shadow. Cross-tab change between initial read and final
 * re-read → not eligible (no lying synced marker).
 */
export function assessSyncedMarkerEligibilityAfterFinalLegacyRead(params: {
  readonly verifiedSchoolRaw: RawStoredText;
  readonly finalLegacyRaw: RawStoredText;
}):
  | { readonly eligible: true }
  | { readonly eligible: false; readonly reason: "legacy_diverged_or_mismatch" } {
  if (!rawStoredTextEqual(params.finalLegacyRaw, params.verifiedSchoolRaw)) {
    return { eligible: false, reason: "legacy_diverged_or_mismatch" };
  }
  return { eligible: true };
}

/**
 * Pure future-WRITE outcome classifier (no I/O).
 *
 * Separates data-mirror health from marker readiness:
 * - shadow write/verify failure → shadow_dirty (legacy untouched)
 * - data verified equal + marker persist fail → marker_incomplete
 * - final legacy diverged before marker → not established as synced (shadow_dirty)
 */
export function classifySchoolShadowEstablishmentOutcome(params: {
  readonly plan: SchoolShadowEstablishmentPlan;
  readonly schoolWriteSucceeded: boolean;
  readonly schoolVerifyMatched: boolean;
  readonly finalLegacyMatchesVerifiedSchool: boolean;
  readonly markerPersistSucceeded: boolean;
}): SchoolShadowEstablishmentResult {
  if (params.plan.kind === "already_ready") {
    return { status: "already_ready" };
  }

  if (params.plan.schoolWriteRequired) {
    if (!params.schoolWriteSucceeded || !params.schoolVerifyMatched) {
      return { status: "shadow_dirty" };
    }
  } else if (!params.schoolVerifyMatched) {
    return { status: "shadow_dirty" };
  }

  if (!params.finalLegacyMatchesVerifiedSchool) {
    // Do not establish a synced marker for a stale snapshot.
    return { status: "shadow_dirty" };
  }

  if (!params.markerPersistSucceeded) {
    return { status: "marker_incomplete" };
  }

  return { status: "established" };
}

/**
 * WRITE stop-condition notes (design contract for N2-ADOPT-WRITE audit).
 * Kept as typed constants — not executable policy.
 */
export const SCHOOL_SHADOW_ESTABLISHMENT_WRITE_STOP_CONDITIONS = {
  restoreRollbackOrdering:
    "Before N2-ADOPT-WRITE: decide when establishment may run in Restore lifecycle. " +
    "Must not perform scenario school writes outside rollback protection that would " +
    "survive a failed Restore.",
  lifecycleOwnership:
    "Before N2-ADOPT-WRITE: choose ONE ownership site for post-ensure → establishment. " +
    "Watch nested ensureVzSchoolYearPlatformBinding → ensureSchoolPlatformBinding; " +
    "forbid redundant double hooks without an explicit policy.",
  softUx:
    "Profile/VZ business persistence must not be marked failed solely because " +
    "establishment metadata failed (marker_incomplete / soft shadow_dirty).",
} as const;

/** Proof helper: PROTO never declares unbound mutation ops. */
export function schoolShadowEstablishmentAllowedOperationTargets(): readonly SchoolShadowEstablishmentOperationTarget[] {
  return ["school_data", "school_marker"] as const;
}
