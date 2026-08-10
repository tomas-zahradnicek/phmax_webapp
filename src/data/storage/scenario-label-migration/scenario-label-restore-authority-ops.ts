/**
 * N3-AWARE-WIRING — Restore T2 authority-aware scenario physical ops.
 *
 * Backup carries logical value only — NEVER dictates legacy vs namespaced.
 * Fresh T2 assessment of CURRENT local authority selects mutation mode.
 *
 * Namespaced success requires NAMESPACED_COMMITTED fence (post-verify finalize
 * with prior fence in touchedKeys/snapshot for rollback on failure).
 */

import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import type { EntityId } from "../../../domain/shared/entity-id";
import { isUuid, normalizeUuid } from "../../identity/identity-uuid";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import {
  buildScenarioLabelN3LegacyMarker,
  buildScenarioLabelN3NamespacedMarker,
  serializeScenarioLabelN3AuthorityMarker,
} from "./scenario-label-n3-authority-marker";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import type { ScenarioLabelMigrationTarget } from "./scenario-label-migration-types";
import { assessScenarioLabelRuntimeAuthority } from "./scenario-label-n3-aware-assessment";
import type {
  ScenarioLabelAwareStorage,
  ScenarioLabelRuntimeAuthorityAssessment,
} from "./scenario-label-n3-aware-types";
import {
  SCENARIO_LABEL_N3_AWARE_BACKUP_CANNOT_CREATE_NAMESPACED,
  SCENARIO_LABEL_N3_AWARE_EMPTY_TARGET_DEFAULTS_TO_LEGACY,
  SCENARIO_LABEL_N3_AWARE_NO_CUTOVER,
} from "./scenario-label-n3-aware-types";
import { serializeScenarioLabelN3FenceKey } from "./scenario-label-n3-fence-key";
import type { ScenarioLabelRestoreShadowPlan } from "./scenario-label-restore-target";
import type { ScenarioLabelRestorePhysicalOps } from "./scenario-label-restore-ops";
import { buildScenarioLabelRestorePhysicalOps } from "./scenario-label-restore-ops";

function isCanonicalSchoolId(value: unknown): value is EntityId {
  return typeof value === "string" && isUuid(value) && value === normalizeUuid(value);
}

export type ScenarioLabelRestoreAuthorityMode = "legacy" | "namespaced";

export type ScenarioLabelRestoreAuthorityPlan =
  | {
      readonly status: "planned";
      readonly authority: ScenarioLabelRestoreAuthorityMode;
      readonly ops: ScenarioLabelRestorePhysicalOps;
      /** Prior fence key included in touchedKeys/snapshot for namespaced rollback. */
      readonly fenceSnapshotKey: string | null;
      /** Post-verify namespaced fence finalize required for success. */
      readonly requiresNamespacedFenceCommit: boolean;
    }
  | {
      readonly status: "blocked";
      readonly reason: string;
    }
  | {
      readonly status: "legacy_only_fallback";
      readonly ops: ScenarioLabelRestorePhysicalOps;
      readonly fenceSnapshotKey: null;
      readonly requiresNamespacedFenceCommit: false;
    };

export type BuildScenarioLabelRestoreAuthorityOpsInput = {
  readonly storage: ScenarioLabelAwareStorage;
  readonly logicalLabel: string;
  readonly shadowPlan: ScenarioLabelRestoreShadowPlan;
  /** Current local schoolId for fresh T2 assessment (null → unbound/empty → legacy). */
  readonly currentSchoolId: EntityId | null;
};

function buildLegacySchoolOps(
  label: string,
  schoolId: EntityId,
): ScenarioLabelRestorePhysicalOps {
  const target: ScenarioLabelMigrationTarget = { kind: "school", schoolId };
  const v2Key = buildScenarioLabelNamespacedKey(target);
  const markerKey = serializeScenarioLabelMigrationMarkerKey(target);
  const markerValue = serializeScenarioLabelN3AuthorityMarker(
    buildScenarioLabelN3LegacyMarker({
      mirrorHealth: "synced",
      authoritativePresence: "present",
    }),
  );

  return {
    operations: [
      {
        action: "set",
        key: PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
        serializedValue: label,
      },
      { action: "set", key: v2Key, serializedValue: label },
      { action: "set", key: markerKey, serializedValue: markerValue },
    ],
    keySemantics: [
      { key: PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, effect: "set" },
      { key: v2Key, effect: "set" },
      { key: markerKey, effect: "set" },
    ],
    expectedTarget: target,
  };
}

function buildNamespacedSchoolOps(
  label: string,
  schoolId: EntityId,
): ScenarioLabelRestorePhysicalOps {
  const target: ScenarioLabelMigrationTarget = { kind: "school", schoolId };
  const v2Key = buildScenarioLabelNamespacedKey(target);
  const markerKey = serializeScenarioLabelMigrationMarkerKey(target);
  const markerValue = serializeScenarioLabelN3AuthorityMarker(
    buildScenarioLabelN3NamespacedMarker({
      mirrorHealth: "synced",
      authoritativePresence: "present",
    }),
  );

  return {
    operations: [
      {
        action: "set",
        key: PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
        serializedValue: label,
      },
      { action: "set", key: v2Key, serializedValue: label },
      { action: "set", key: markerKey, serializedValue: markerValue },
    ],
    keySemantics: [
      { key: PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, effect: "set" },
      { key: v2Key, effect: "set" },
      { key: markerKey, effect: "set" },
    ],
    expectedTarget: target,
  };
}

function isSafeLegacyAssessment(
  assessment: ScenarioLabelRuntimeAuthorityAssessment,
): boolean {
  return (
    assessment.kind === "UNBOUND" ||
    assessment.kind === "LEGACY_READY" ||
    assessment.kind === "LEGACY_COMPAT_UNPREPARED" ||
    assessment.kind === "LEGACY_VIOLATED_RECOVERABLE"
  );
}

function isSafeNamespacedAssessment(
  assessment: ScenarioLabelRuntimeAuthorityAssessment,
): boolean {
  return (
    assessment.kind === "NAMESPACED_READY" ||
    assessment.kind === "NAMESPACED_DEGRADED"
  );
}

/**
 * Fresh T2 authority-aware Restore ops for a present scenario logical value.
 *
 * Empty/new / no namespaced evidence → LEGACY (backup cannot create first namespaced).
 * NAMESPACED_READY / unambiguous NAMESPACED_DEGRADED → namespaced ops (no downgrade).
 * AUTHORITY_BLOCKED / STORAGE_UNAVAILABLE → blocked (whole Restore fail-closed).
 */
export function buildScenarioLabelRestoreAuthorityOps(
  input: BuildScenarioLabelRestoreAuthorityOpsInput,
): ScenarioLabelRestoreAuthorityPlan {
  void SCENARIO_LABEL_N3_AWARE_NO_CUTOVER;
  void SCENARIO_LABEL_N3_AWARE_BACKUP_CANNOT_CREATE_NAMESPACED;
  void SCENARIO_LABEL_N3_AWARE_EMPTY_TARGET_DEFAULTS_TO_LEGACY;

  const { storage, logicalLabel, shadowPlan, currentSchoolId } = input;

  let assessment: ScenarioLabelRuntimeAuthorityAssessment;
  try {
    assessment = assessScenarioLabelRuntimeAuthority({
      storage,
      schoolId: currentSchoolId,
    });
  } catch {
    return { status: "blocked", reason: "storage_unavailable" };
  }

  if (assessment.kind === "STORAGE_UNAVAILABLE") {
    return { status: "blocked", reason: "storage_unavailable" };
  }

  if (assessment.kind === "AUTHORITY_BLOCKED") {
    // Pre-establishment residue (legacy present, school-v2 missing, no marker) is the
    // normal N2 world — Restore must default to legacy ops, not fail closed.
    // True conflicts (malformed / namespaced evidence / schema clash) stay blocked.
    if (assessment.reason !== "ambiguous_marker_loss") {
      return { status: "blocked", reason: assessment.reason };
    }
  }

  // Shadow plan legacy_only → physical legacy key only (no first namespaced).
  if (shadowPlan.mode === "legacy_only") {
    // Exception: already-namespaced local school must not be downgraded via unbound/legacy-only plan.
    if (isSafeNamespacedAssessment(assessment) && currentSchoolId != null) {
      const ops = buildNamespacedSchoolOps(logicalLabel, currentSchoolId);
      const fenceKey = serializeScenarioLabelN3FenceKey({
        kind: "school",
        schoolId: currentSchoolId,
      });
      return {
        status: "planned",
        authority: "namespaced",
        ops,
        fenceSnapshotKey: fenceKey,
        requiresNamespacedFenceCommit: true,
      };
    }
    const ops = buildScenarioLabelRestorePhysicalOps(logicalLabel, shadowPlan);
    return {
      status: "legacy_only_fallback",
      ops,
      fenceSnapshotKey: null,
      requiresNamespacedFenceCommit: false,
    };
  }

  // Unbound shadow target with safe legacy assessment → legacy unbound dual-write.
  // Namespaced local school → preserve school namespaced authority (never invent unbound schema2).
  if (shadowPlan.target.kind === "unbound") {
    if (isSafeNamespacedAssessment(assessment) && currentSchoolId != null) {
      const ops = buildNamespacedSchoolOps(logicalLabel, currentSchoolId);
      const fenceKey = serializeScenarioLabelN3FenceKey({
        kind: "school",
        schoolId: currentSchoolId,
      });
      return {
        status: "planned",
        authority: "namespaced",
        ops,
        fenceSnapshotKey: fenceKey,
        requiresNamespacedFenceCommit: true,
      };
    }
    const ops = buildScenarioLabelRestorePhysicalOps(logicalLabel, shadowPlan);
    return {
      status: "planned",
      authority: "legacy",
      ops,
      fenceSnapshotKey: null,
      requiresNamespacedFenceCommit: false,
    };
  }

  const schoolId = shadowPlan.target.schoolId;
  if (!isCanonicalSchoolId(schoolId)) {
    return { status: "blocked", reason: "target_unresolved" };
  }

  if (isSafeNamespacedAssessment(assessment)) {
    // Preserve namespaced authority — restore logical L as namespaced.
    const ops = buildNamespacedSchoolOps(logicalLabel, schoolId);
    const fenceKey = serializeScenarioLabelN3FenceKey({ kind: "school", schoolId });
    return {
      status: "planned",
      authority: "namespaced",
      ops,
      fenceSnapshotKey: fenceKey,
      requiresNamespacedFenceCommit: true,
    };
  }

  if (
    isSafeLegacyAssessment(assessment) ||
    (assessment.kind === "AUTHORITY_BLOCKED" &&
      assessment.reason === "ambiguous_marker_loss")
  ) {
    // Default empty/new / pre-establishment residue → legacy.
    // Never create first schema2 from backup alone.
    const ops = buildLegacySchoolOps(logicalLabel, schoolId);
    return {
      status: "planned",
      authority: "legacy",
      ops,
      fenceSnapshotKey: null,
      requiresNamespacedFenceCommit: false,
    };
  }

  return { status: "blocked", reason: "authority_unresolved" };
}
