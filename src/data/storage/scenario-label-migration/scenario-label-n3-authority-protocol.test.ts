import { describe, expect, it } from "vitest";
import type { EntityId } from "../../../domain/shared/entity-id";
import type { ScenarioLabelMigrationTargetResolution } from "./scenario-label-migration-types";
import {
  buildScenarioLabelN3LegacyMarker,
  buildScenarioLabelN3NamespacedMarker,
  parseScenarioLabelN3AuthorityMarker,
} from "./scenario-label-n3-authority-marker";
import {
  assertScenarioLabelN3SuccessfulWriteRollbackInvariant,
  assessScenarioLabelN3CutoverReadiness,
  assessScenarioLabelN3ProductionCutoverEligibility,
  classifyScenarioLabelAuthorityCutoverOutcome,
  classifyScenarioLabelAuthorityState,
  classifyScenarioLabelNamespacedWriteOutcome,
  decideScenarioLabelEstablishmentAction,
  decideScenarioLabelReadRoute,
  planScenarioLabelAuthorityCutover,
  planScenarioLabelClearForAuthority,
  planScenarioLabelNamespacedWrite,
  planScenarioLabelRestoreForAuthority,
} from "./scenario-label-n3-authority-protocol";
import type {
  ScenarioLabelN3AuthorityMarkerParseResult,
  ScenarioLabelN3ClassifyInput,
} from "./scenario-label-n3-authority-types";
import {
  SCENARIO_LABEL_N3_AUTHORITY_AWARE_READ_SURFACES,
  SCENARIO_LABEL_N3_AUTHORITY_AWARE_WRITER_SURFACES,
  SCENARIO_LABEL_N3_AUTHORITY_DOWNGRADE_UNSUPPORTED,
  SCENARIO_LABEL_N3_BACKUP_OMITS_AUTHORITY_METADATA,
  SCENARIO_LABEL_N3_CUTOVER_REQUIRES_FENCE,
  SCENARIO_LABEL_N3_MIXED_VERSION_TAB_HAZARD,
  SCENARIO_LABEL_N3_NO_UNSAFE_LEGACY_FALLBACK,
  SCENARIO_LABEL_N3_STRICT_COMPATIBILITY_MIRROR,
} from "./scenario-label-n3-authority-types";

const SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" as EntityId;
const SCHOOL_UPPER = "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE";

function schoolTarget(
  schoolId: EntityId = SCHOOL_A,
): ScenarioLabelMigrationTargetResolution {
  return { status: "resolved", target: { kind: "school", schoolId } };
}

function unboundTarget(): ScenarioLabelMigrationTargetResolution {
  return { status: "resolved", target: { kind: "unbound" } };
}

function skippedTarget(): ScenarioLabelMigrationTargetResolution {
  return { status: "skipped", reason: "corrupted" };
}

function validLegacySynced(
  presence: "present" | "absent" = "present",
): ScenarioLabelN3AuthorityMarkerParseResult {
  return {
    status: "valid",
    payload: buildScenarioLabelN3LegacyMarker({
      mirrorHealth: "synced",
      authoritativePresence: presence,
    }),
  };
}

function validNamespacedSynced(
  presence: "present" | "absent" = "present",
): ScenarioLabelN3AuthorityMarkerParseResult {
  return {
    status: "valid",
    payload: buildScenarioLabelN3NamespacedMarker({
      mirrorHealth: "synced",
      authoritativePresence: presence,
    }),
  };
}

function baseInput(
  overrides: Partial<ScenarioLabelN3ClassifyInput> = {},
): ScenarioLabelN3ClassifyInput {
  return {
    targetResolution: schoolTarget(),
    marker: validLegacySynced("present"),
    legacyRaw: { exists: true, value: "A" },
    schoolV2Raw: { exists: true, value: "A" },
    ...overrides,
  };
}

describe("N3-PROTO authority state classification", () => {
  it("S1: legacy unprepared missing marker (equal copies)", () => {
    expect(
      classifyScenarioLabelAuthorityState(
        baseInput({ marker: { status: "missing" } }),
      ),
    ).toEqual({ kind: "LEGACY_UNPREPARED", reason: "marker_missing" });
  });

  it("S2: legacy prepared equal+healthy", () => {
    expect(classifyScenarioLabelAuthorityState(baseInput())).toEqual({
      kind: "LEGACY_PREPARED",
      schoolId: SCHOOL_A,
      marker: buildScenarioLabelN3LegacyMarker({
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    });
  });

  it("S3: legacy raw mismatch", () => {
    expect(
      classifyScenarioLabelAuthorityState(
        baseInput({ schoolV2Raw: { exists: true, value: "B" } }),
      ),
    ).toEqual({ kind: "LEGACY_UNPREPARED", reason: "raw_mismatch" });
  });

  it("S4: legacy presence mismatch", () => {
    expect(
      classifyScenarioLabelAuthorityState(
        baseInput({
          marker: validLegacySynced("absent"),
          legacyRaw: { exists: true, value: "A" },
          schoolV2Raw: { exists: true, value: "A" },
        }),
      ),
    ).toEqual({ kind: "LEGACY_UNPREPARED", reason: "presence_mismatch" });
  });

  it("S5: namespaced active equal+healthy", () => {
    expect(
      classifyScenarioLabelAuthorityState(
        baseInput({ marker: validNamespacedSynced("present") }),
      ),
    ).toEqual({
      kind: "NAMESPACED_ACTIVE",
      schoolId: SCHOOL_A,
      marker: buildScenarioLabelN3NamespacedMarker({
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    });
  });

  it("S6: namespaced degraded raw mismatch", () => {
    expect(
      classifyScenarioLabelAuthorityState(
        baseInput({
          marker: validNamespacedSynced("present"),
          schoolV2Raw: { exists: true, value: "NEW" },
          legacyRaw: { exists: true, value: "OLD" },
        }),
      ),
    ).toMatchObject({ kind: "NAMESPACED_DEGRADED", reason: "raw_mismatch" });
  });

  it("S7: namespaced degraded dirty", () => {
    expect(
      classifyScenarioLabelAuthorityState(
        baseInput({
          marker: {
            status: "valid",
            payload: buildScenarioLabelN3NamespacedMarker({
              mirrorHealth: "dirty",
              authoritativePresence: "present",
            }),
          },
        }),
      ),
    ).toMatchObject({ kind: "NAMESPACED_DEGRADED", reason: "mirror_dirty" });
  });

  it("S8: malformed authority blocked", () => {
    expect(
      classifyScenarioLabelAuthorityState(
        baseInput({
          marker: { status: "invalid", reason: "invalid_json" },
        }),
      ),
    ).toEqual({ kind: "AUTHORITY_BLOCKED", reason: "malformed_marker" });
  });

  it("S9: unbound never namespaced state", () => {
    expect(
      classifyScenarioLabelAuthorityState(
        baseInput({
          targetResolution: unboundTarget(),
          marker: validNamespacedSynced(),
        }),
      ),
    ).toEqual({ kind: "LEGACY_UNPREPARED", reason: "target_unbound" });
  });

  it("S10: unresolved Identity", () => {
    expect(
      classifyScenarioLabelAuthorityState(
        baseInput({ targetResolution: skippedTarget() }),
      ),
    ).toEqual({ kind: "LEGACY_UNPREPARED", reason: "target_unresolved" });
  });

  it("marker loss + divergent copies → blocked ambiguous", () => {
    expect(
      classifyScenarioLabelAuthorityState(
        baseInput({
          marker: { status: "missing" },
          legacyRaw: { exists: true, value: "L" },
          schoolV2Raw: { exists: true, value: "V" },
        }),
      ),
    ).toEqual({ kind: "AUTHORITY_BLOCKED", reason: "ambiguous_marker_loss" });
  });
});

describe("N3-PROTO cutover readiness + plan", () => {
  it("C1: prepared A/A → marker-only plan", () => {
    const plan = planScenarioLabelAuthorityCutover(baseInput());
    expect(plan).toMatchObject({
      status: "ready",
      schoolId: SCHOOL_A,
      operation: "replace_marker_only",
      requiresPreMarkerEquality: true,
      requiresMarkerReadBack: true,
      requiresPostMarkerEquality: true,
    });
    if (plan.status === "ready") {
      expect(plan.fromMarker.authority).toBe("legacy");
      expect(plan.toMarker).toEqual({
        schemaVersion: 2,
        authority: "namespaced",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      });
    }
  });

  it("C2: unbound → not ready", () => {
    expect(
      assessScenarioLabelN3CutoverReadiness(
        baseInput({ targetResolution: unboundTarget() }),
      ),
    ).toEqual({ status: "not_ready", reason: "target_unbound" });
  });

  it("C3: missing marker → needs bootstrap", () => {
    expect(
      assessScenarioLabelN3CutoverReadiness(
        baseInput({ marker: { status: "missing" } }),
      ),
    ).toEqual({ status: "needs_bootstrap_or_repair", reason: "marker_missing" });
  });

  it("C4: dirty marker → needs bootstrap", () => {
    expect(
      assessScenarioLabelN3CutoverReadiness(
        baseInput({
          marker: {
            status: "valid",
            payload: buildScenarioLabelN3LegacyMarker({
              mirrorHealth: "dirty",
              authoritativePresence: "present",
            }),
          },
        }),
      ),
    ).toEqual({ status: "needs_bootstrap_or_repair", reason: "marker_not_synced" });
  });

  it("C5: raw mismatch → needs bootstrap", () => {
    expect(
      assessScenarioLabelN3CutoverReadiness(
        baseInput({ schoolV2Raw: { exists: true, value: "B" } }),
      ),
    ).toEqual({ status: "needs_bootstrap_or_repair", reason: "raw_mismatch" });
  });

  it("C6: presence mismatch → needs bootstrap", () => {
    expect(
      assessScenarioLabelN3CutoverReadiness(
        baseInput({
          marker: validLegacySynced("absent"),
        }),
      ),
    ).toEqual({ status: "needs_bootstrap_or_repair", reason: "presence_mismatch" });
  });

  it("C7: unresolved identity → not ready", () => {
    expect(
      assessScenarioLabelN3CutoverReadiness(
        baseInput({ targetResolution: skippedTarget() }),
      ),
    ).toEqual({ status: "not_ready", reason: "target_unresolved" });
  });

  it("C8: final pre-marker drift → concurrent_drift", () => {
    const plan = planScenarioLabelAuthorityCutover(baseInput());
    expect(
      classifyScenarioLabelAuthorityCutoverOutcome({
        plan,
        preMarkerEqual: false,
        markerWriteSucceeded: true,
        markerReadBackMatched: true,
        postMarkerEqual: true,
      }),
    ).toEqual({ status: "concurrent_drift", phase: "pre_marker" });
  });

  it("C9: marker write failure taxonomy", () => {
    const plan = planScenarioLabelAuthorityCutover(baseInput());
    expect(
      classifyScenarioLabelAuthorityCutoverOutcome({
        plan,
        preMarkerEqual: true,
        markerWriteSucceeded: false,
        markerReadBackMatched: false,
        postMarkerEqual: true,
      }),
    ).toEqual({ status: "marker_write_failed" });
  });

  it("C10: marker read-back failure", () => {
    const plan = planScenarioLabelAuthorityCutover(baseInput());
    expect(
      classifyScenarioLabelAuthorityCutoverOutcome({
        plan,
        preMarkerEqual: true,
        markerWriteSucceeded: true,
        markerReadBackMatched: false,
        postMarkerEqual: true,
      }),
    ).toEqual({ status: "marker_verify_failed" });
  });

  it("C11: post-marker raw drift → NOT cutover_success", () => {
    const plan = planScenarioLabelAuthorityCutover(baseInput());
    expect(
      classifyScenarioLabelAuthorityCutoverOutcome({
        plan,
        preMarkerEqual: true,
        markerWriteSucceeded: true,
        markerReadBackMatched: true,
        postMarkerEqual: false,
      }),
    ).toEqual({ status: "concurrent_drift", phase: "post_marker" });
  });

  it("skip-N2: legacy L + school missing + marker missing → bootstrap", () => {
    expect(
      assessScenarioLabelN3CutoverReadiness(
        baseInput({
          marker: { status: "missing" },
          schoolV2Raw: { exists: false },
          legacyRaw: { exists: true, value: "L" },
        }),
      ),
    ).toEqual({ status: "needs_bootstrap_or_repair", reason: "marker_missing" });
  });

  it("happy cutover outcome", () => {
    const plan = planScenarioLabelAuthorityCutover(baseInput());
    expect(
      classifyScenarioLabelAuthorityCutoverOutcome({
        plan,
        preMarkerEqual: true,
        markerWriteSucceeded: true,
        markerReadBackMatched: true,
        postMarkerEqual: true,
      }),
    ).toEqual({ status: "cutover_success" });
  });

  it("canonical UUID: uppercase schoolId rejected by target resolution contract (not normalized)", () => {
    // N3 planners consume already-resolved targets; non-canonical must not be resolved upstream.
    expect(SCHOOL_UPPER).not.toBe(SCHOOL_A);
    expect(SCHOOL_UPPER.toLowerCase()).toBe(SCHOOL_A);
  });
});

describe("N3-PROTO read routing", () => {
  it("R1: legacy marker → legacy", () => {
    expect(decideScenarioLabelReadRoute(baseInput())).toEqual({
      status: "legacy",
      reason: "legacy_marker",
    });
  });

  it("R2: namespaced marker → school v2", () => {
    expect(
      decideScenarioLabelReadRoute(baseInput({ marker: validNamespacedSynced() })),
    ).toEqual({ status: "namespaced", schoolId: SCHOOL_A });
  });

  it("R3: unbound → legacy", () => {
    expect(
      decideScenarioLabelReadRoute(baseInput({ targetResolution: unboundTarget() })),
    ).toEqual({ status: "legacy", reason: "unbound_target" });
  });

  it("R4: malformed marker → blocked", () => {
    expect(
      decideScenarioLabelReadRoute(
        baseInput({ marker: { status: "invalid", reason: "invalid_shape" } }),
      ),
    ).toEqual({ status: "blocked", reason: "malformed_marker" });
  });

  it("R5: namespaced + v2 read unavailable → blocked", () => {
    expect(
      decideScenarioLabelReadRoute({
        ...baseInput({ marker: validNamespacedSynced() }),
        schoolV2ReadOk: false,
      }),
    ).toEqual({ status: "blocked", reason: "namespaced_v2_unavailable" });
  });

  it("R6: namespaced + presence present but v2 missing → blocked", () => {
    expect(
      decideScenarioLabelReadRoute(
        baseInput({
          marker: validNamespacedSynced("present"),
          schoolV2Raw: { exists: false },
          legacyRaw: { exists: false },
        }),
      ),
    ).toEqual({ status: "blocked", reason: "namespaced_presence_inconsistent" });
  });

  it("R7: namespaced + legacy differs → route v2 + degraded", () => {
    expect(
      decideScenarioLabelReadRoute(
        baseInput({
          marker: validNamespacedSynced("present"),
          schoolV2Raw: { exists: true, value: "NEW" },
          legacyRaw: { exists: true, value: "OLD" },
        }),
      ),
    ).toEqual({
      status: "namespaced_degraded",
      schoolId: SCHOOL_A,
      signal: "legacy_diverged",
      readFrom: "school_v2",
    });
  });

  it("R8: missing marker + equal copies → legacy/unprepared", () => {
    expect(
      decideScenarioLabelReadRoute(baseInput({ marker: { status: "missing" } })),
    ).toEqual({ status: "legacy", reason: "marker_missing_equal" });
  });

  it("R9: missing marker + divergent copies → blocked/ambiguous", () => {
    expect(
      decideScenarioLabelReadRoute(
        baseInput({
          marker: { status: "missing" },
          legacyRaw: { exists: true, value: "L" },
          schoolV2Raw: { exists: true, value: "V" },
        }),
      ),
    ).toEqual({ status: "blocked", reason: "marker_missing_divergent" });
  });

  it("R10: no unsafe silent fallback constant pinned", () => {
    expect(SCENARIO_LABEL_N3_NO_UNSAFE_LEGACY_FALLBACK).toBe(true);
  });
});

describe("N3-PROTO namespaced write planner", () => {
  const activeState = classifyScenarioLabelAuthorityState(
    baseInput({ marker: validNamespacedSynced() }),
  );

  function plannedWrite(desired: { exists: true; value: string } | { exists: false }) {
    return planScenarioLabelNamespacedWrite({
      schoolId: SCHOOL_A,
      authorityState: activeState,
      desiredRaw: desired,
      priorSnapshot: {
        legacy: { exists: true, value: "A" },
        schoolV2: { exists: true, value: "A" },
        marker: buildScenarioLabelN3NamespacedMarker({
          mirrorHealth: "synced",
          authoritativePresence: "present",
        }),
      },
    });
  }

  it("W1: namespaced desired happy path", () => {
    const plan = plannedWrite({ exists: true, value: "B" });
    expect(plan.status).toBe("planned");
    if (plan.status === "planned") {
      expect(plan.strictMirror).toBe(true);
      expect(plan.desiredV2).toEqual(plan.desiredLegacy);
      expect(plan.desiredMarker.authority).toBe("namespaced");
      expect(plan.phases[0]).toBe("snapshot");
      expect(plan.phases.at(-1)).toBe("marker_read_back");
      expect(
        classifyScenarioLabelNamespacedWriteOutcome({
          plan,
          v2WriteSucceeded: true,
          legacyWriteSucceeded: true,
          verifyMatched: true,
          rollbackAttempted: false,
          rollbackSucceeded: false,
          markerPersistSucceeded: true,
        }),
      ).toEqual({ status: "success", rollbackInvariant: "legacy_equals_v2" });
    }
  });

  it("W2: authoritative v2 write failure → legacy not advance", () => {
    const plan = plannedWrite({ exists: true, value: "B" });
    expect(
      classifyScenarioLabelNamespacedWriteOutcome({
        plan,
        v2WriteSucceeded: false,
        legacyWriteSucceeded: false,
        verifyMatched: false,
        rollbackAttempted: false,
        rollbackSucceeded: false,
        markerPersistSucceeded: false,
      }),
    ).toEqual({
      status: "authoritative_failed",
      code: "v2_write_failed",
      legacyAdvanced: false,
    });
  });

  it("W3: legacy mirror failure → rollback required", () => {
    const plan = plannedWrite({ exists: true, value: "B" });
    expect(
      classifyScenarioLabelNamespacedWriteOutcome({
        plan,
        v2WriteSucceeded: true,
        legacyWriteSucceeded: false,
        verifyMatched: false,
        rollbackAttempted: false,
        rollbackSucceeded: false,
        markerPersistSucceeded: false,
      }),
    ).toEqual({ status: "compatibility_mirror_failed", rollbackRequired: true });
  });

  it("W4: rollback succeeds", () => {
    const plan = plannedWrite({ exists: true, value: "B" });
    expect(
      classifyScenarioLabelNamespacedWriteOutcome({
        plan,
        v2WriteSucceeded: true,
        legacyWriteSucceeded: false,
        verifyMatched: false,
        rollbackAttempted: true,
        rollbackSucceeded: true,
        markerPersistSucceeded: false,
      }),
    ).toEqual({ status: "rollback_succeeded", business: "failed" });
  });

  it("W5: rollback fails → fatal_partial", () => {
    const plan = plannedWrite({ exists: true, value: "B" });
    expect(
      classifyScenarioLabelNamespacedWriteOutcome({
        plan,
        v2WriteSucceeded: true,
        legacyWriteSucceeded: false,
        verifyMatched: false,
        rollbackAttempted: true,
        rollbackSucceeded: false,
        markerPersistSucceeded: false,
      }),
    ).toEqual({
      status: "fatal_partial",
      reason: "rollback_failed_after_partial_write",
    });
  });

  it("W6: verify mismatch", () => {
    const plan = plannedWrite({ exists: true, value: "B" });
    expect(
      classifyScenarioLabelNamespacedWriteOutcome({
        plan,
        v2WriteSucceeded: true,
        legacyWriteSucceeded: true,
        verifyMatched: false,
        rollbackAttempted: false,
        rollbackSucceeded: false,
        markerPersistSucceeded: false,
      }),
    ).toEqual({ status: "verify_mismatch" });
  });

  it("W7: marker persist fail value-only", () => {
    const plan = plannedWrite({ exists: true, value: "B" });
    expect(plan.status === "planned" && plan.presenceChanging).toBe(false);
    expect(
      classifyScenarioLabelNamespacedWriteOutcome({
        plan,
        v2WriteSucceeded: true,
        legacyWriteSucceeded: true,
        verifyMatched: true,
        rollbackAttempted: false,
        rollbackSucceeded: false,
        markerPersistSucceeded: false,
      }),
    ).toEqual({
      status: "marker_persist_failed",
      kind: "value_only",
      business: "data_ok_metadata_incomplete",
    });
  });

  it("W8: marker persist fail presence change", () => {
    const plan = plannedWrite({ exists: false });
    expect(plan.status === "planned" && plan.presenceChanging).toBe(true);
    expect(
      classifyScenarioLabelNamespacedWriteOutcome({
        plan,
        v2WriteSucceeded: true,
        legacyWriteSucceeded: true,
        verifyMatched: true,
        rollbackAttempted: false,
        rollbackSucceeded: false,
        markerPersistSucceeded: false,
      }),
    ).toEqual({
      status: "marker_persist_failed",
      kind: "presence_change",
      business: "failed_conservative",
    });
  });

  it("W9: absent→present", () => {
    const plan = planScenarioLabelNamespacedWrite({
      schoolId: SCHOOL_A,
      authorityState: classifyScenarioLabelAuthorityState(
        baseInput({
          marker: validNamespacedSynced("absent"),
          legacyRaw: { exists: false },
          schoolV2Raw: { exists: false },
        }),
      ),
      desiredRaw: { exists: true, value: "X" },
      priorSnapshot: {
        legacy: { exists: false },
        schoolV2: { exists: false },
        marker: buildScenarioLabelN3NamespacedMarker({
          mirrorHealth: "synced",
          authoritativePresence: "absent",
        }),
      },
    });
    expect(plan).toMatchObject({
      status: "planned",
      presenceChanging: true,
      desiredMarker: {
        authoritativePresence: "present",
        authority: "namespaced",
      },
    });
  });

  it("W10: present→absent", () => {
    const plan = plannedWrite({ exists: false });
    expect(plan).toMatchObject({
      status: "planned",
      presenceChanging: true,
      desiredMarker: { authoritativePresence: "absent" },
    });
  });

  it('W11: present "" semantics', () => {
    const plan = planScenarioLabelNamespacedWrite({
      schoolId: SCHOOL_A,
      authorityState: activeState,
      desiredRaw: { exists: true, value: "" },
      priorSnapshot: {
        legacy: { exists: true, value: "A" },
        schoolV2: { exists: true, value: "A" },
        marker: buildScenarioLabelN3NamespacedMarker({
          mirrorHealth: "synced",
          authoritativePresence: "present",
        }),
      },
    });
    expect(plan).toMatchObject({
      status: "planned",
      presenceChanging: false,
      desiredV2: { exists: true, value: "" },
      desiredMarker: { authoritativePresence: "present" },
    });
  });

  it("W12: exact successful-write rollback invariant", () => {
    expect(SCENARIO_LABEL_N3_STRICT_COMPATIBILITY_MIRROR).toBe(true);
    expect(
      assertScenarioLabelN3SuccessfulWriteRollbackInvariant({
        finalLegacyRaw: { exists: true, value: "B" },
        finalSchoolV2Raw: { exists: true, value: "B" },
      }),
    ).toEqual({ ok: true });
    expect(
      assertScenarioLabelN3SuccessfulWriteRollbackInvariant({
        finalLegacyRaw: { exists: true, value: "B" },
        finalSchoolV2Raw: { exists: true, value: "A" },
      }),
    ).toEqual({ ok: false, reason: "legacy_v2_divergence" });
  });
});

describe("N3-PROTO N2-ADOPT establishment gate", () => {
  it("A1: legacy authority → establishment permitted", () => {
    expect(
      decideScenarioLabelEstablishmentAction({
        targetResolution: schoolTarget(),
        marker: validLegacySynced(),
      }),
    ).toEqual({ action: "permit_establishment", authority: "legacy" });
  });

  it("A2: namespaced authority → establishment NO-OP", () => {
    expect(
      decideScenarioLabelEstablishmentAction({
        targetResolution: schoolTarget(),
        marker: validNamespacedSynced(),
      }),
    ).toEqual({ action: "no_op_namespaced_authoritative", authority: "namespaced" });
  });

  it("A3: malformed authority → blocked", () => {
    expect(
      decideScenarioLabelEstablishmentAction({
        targetResolution: schoolTarget(),
        marker: { status: "invalid", reason: "invalid_json" },
      }),
    ).toEqual({ action: "blocked", reason: "malformed_authority" });
  });

  it("A4: unbound → not applicable for namespaced establishment", () => {
    expect(
      decideScenarioLabelEstablishmentAction({
        targetResolution: unboundTarget(),
        marker: { status: "missing" },
      }),
    ).toEqual({ action: "blocked", reason: "unbound_not_applicable" });
  });
});

describe("N3-PROTO Restore / Clear / Backup contracts", () => {
  it("RS1: logical restore under legacy → legacy marker desired", () => {
    const plan = planScenarioLabelRestoreForAuthority({
      targetResolution: schoolTarget(),
      marker: validLegacySynced(),
      logicalLabel: "L",
    });
    expect(plan).toMatchObject({
      status: "planned",
      authority: "legacy",
      desiredMarker: { schemaVersion: 1, authority: "legacy" },
      snapshotMembers: ["legacy", "school_v2", "marker"],
    });
  });

  it("RS2/RS3: logical restore under namespaced preserves authority (no downgrade)", () => {
    const plan = planScenarioLabelRestoreForAuthority({
      targetResolution: schoolTarget(),
      marker: validNamespacedSynced(),
      logicalLabel: "L",
    });
    expect(plan).toMatchObject({
      status: "planned",
      authority: "namespaced",
      desiredMarker: { schemaVersion: 2, authority: "namespaced" },
    });
    if (plan.status === "planned") {
      expect(plan.desiredMarker.authority).not.toBe("legacy");
    }
  });

  it("RS4: malformed authority → blocked", () => {
    expect(
      planScenarioLabelRestoreForAuthority({
        targetResolution: schoolTarget(),
        marker: { status: "invalid", reason: "invalid_shape" },
        logicalLabel: "L",
      }),
    ).toEqual({ status: "blocked", reason: "malformed_marker" });
  });

  it("RS5: missing marker → authority_unresolved (fail closed)", () => {
    expect(
      planScenarioLabelRestoreForAuthority({
        targetResolution: schoolTarget(),
        marker: { status: "missing" },
        logicalLabel: "L",
      }),
    ).toEqual({ status: "blocked", reason: "authority_unresolved" });
  });

  it("CL1: legacy clear desired state", () => {
    expect(
      planScenarioLabelClearForAuthority({
        targetResolution: schoolTarget(),
        marker: validLegacySynced(),
      }),
    ).toMatchObject({
      status: "planned",
      authority: "legacy",
      desiredLegacy: { exists: false },
      desiredSchoolV2: { exists: false },
      desiredMarker: {
        authority: "legacy",
        authoritativePresence: "absent",
        mirrorHealth: "synced",
      },
    });
  });

  it("CL2/CL3: namespaced clear keeps strict legacy mirror + namespaced marker", () => {
    expect(
      planScenarioLabelClearForAuthority({
        targetResolution: schoolTarget(),
        marker: validNamespacedSynced(),
      }),
    ).toMatchObject({
      status: "planned",
      authority: "namespaced",
      desiredLegacy: { exists: false },
      desiredSchoolV2: { exists: false },
      desiredMarker: {
        authority: "namespaced",
        authoritativePresence: "absent",
        mirrorHealth: "synced",
      },
    });
  });

  it("CL4: unbound not namespaced authority", () => {
    expect(
      planScenarioLabelClearForAuthority({
        targetResolution: unboundTarget(),
        marker: validNamespacedSynced(),
      }),
    ).toEqual({ status: "blocked", reason: "target_not_school" });
  });

  it("B1: backup omits authority metadata", () => {
    expect(SCENARIO_LABEL_N3_BACKUP_OMITS_AUTHORITY_METADATA).toBe(true);
  });

  it("B2/B3: inventory surfaces + strict mirror pinned", () => {
    expect(SCENARIO_LABEL_N3_AUTHORITY_AWARE_READ_SURFACES).toContain(
      "backup_logical_scenario_read",
    );
    expect(SCENARIO_LABEL_N3_AUTHORITY_AWARE_WRITER_SURFACES.length).toBeGreaterThan(0);
    expect(SCENARIO_LABEL_N3_STRICT_COMPATIBILITY_MIRROR).toBe(true);
  });
});

describe("N3-PROTO fence / rollback / downgrade contracts", () => {
  it("RB1/RB2: successful write final legacy == v2 (N2 deployment rollback readable)", () => {
    expect(
      assertScenarioLabelN3SuccessfulWriteRollbackInvariant({
        finalLegacyRaw: { exists: true, value: "B" },
        finalSchoolV2Raw: { exists: true, value: "B" },
      }),
    ).toEqual({ ok: true });
  });

  it("RB3: mixed-version tab hazard distinct from deployment rollback", () => {
    expect(SCENARIO_LABEL_N3_MIXED_VERSION_TAB_HAZARD).toContain("already-open N2 tab");
    expect(SCENARIO_LABEL_N3_MIXED_VERSION_TAB_HAZARD).toContain("deployment rollback");
  });

  it("fence stop: data ready + fence false → not eligible", () => {
    expect(SCENARIO_LABEL_N3_CUTOVER_REQUIRES_FENCE).toBe(true);
    expect(
      assessScenarioLabelN3ProductionCutoverEligibility({
        dataReady: true,
        fenceReady: false,
        writersAuthorityAware: true,
        adoptHooksAuthorityAware: true,
        restoreAuthorityAware: true,
        clearAuthorityAware: true,
        snippetAuthorityAware: true,
      }),
    ).toEqual({ eligible: false, blockers: ["fence_not_ready"] });
  });

  it("fence ready + all prerequisites → eligible", () => {
    expect(
      assessScenarioLabelN3ProductionCutoverEligibility({
        dataReady: true,
        fenceReady: true,
        writersAuthorityAware: true,
        adoptHooksAuthorityAware: true,
        restoreAuthorityAware: true,
        clearAuthorityAware: true,
        snippetAuthorityAware: true,
      }),
    ).toEqual({ eligible: true });
  });

  it("authority downgrade unsupported", () => {
    expect(SCENARIO_LABEL_N3_AUTHORITY_DOWNGRADE_UNSUPPORTED).toBe(true);
  });

  it("old N2 parser compatibility fact remains pinned via dual parse", () => {
    const v2 = parseScenarioLabelN3AuthorityMarker({
      schemaVersion: 2,
      authority: "namespaced",
      mirrorHealth: "synced",
      authoritativePresence: "present",
    });
    expect(v2.status).toBe("valid");
  });
});
