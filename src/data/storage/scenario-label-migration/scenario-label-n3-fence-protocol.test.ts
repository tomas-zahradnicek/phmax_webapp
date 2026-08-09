import { describe, expect, it } from "vitest";
import type { EntityId } from "../../../domain/shared/entity-id";
import type { ScenarioLabelMigrationTargetResolution } from "./scenario-label-migration-types";
import {
  buildScenarioLabelN3LegacyMarker,
  buildScenarioLabelN3NamespacedMarker,
} from "./scenario-label-n3-authority-marker";
import type {
  ScenarioLabelN3AuthorityMarkerParseResult,
  ScenarioLabelN3CutoverAssessment,
  ScenarioLabelN3CutoverPlan,
} from "./scenario-label-n3-authority-types";
import {
  assessScenarioLabelFenceCutoverEligibility,
  assessScenarioLabelN3FenceState,
  assertScenarioLabelN3FenceRequiresExactRaw,
  isScenarioLabelN3FenceReadyForPreCutover,
  noteScenarioLabelN3PlanReadyIsNotFenceEligibility,
} from "./scenario-label-n3-fence-protocol";
import { buildScenarioLabelN3FenceRecord } from "./scenario-label-n3-fence-record";
import type {
  ScenarioLabelN3FenceAssessInput,
  ScenarioLabelN3FenceRecordParseResult,
} from "./scenario-label-n3-fence-types";
import {
  SCENARIO_LABEL_N3_FENCE_CONSOLE_SNIPPET_HAZARD,
  SCENARIO_LABEL_N3_FENCE_FIRST_FORBIDDEN,
  SCENARIO_LABEL_N3_FENCE_HARD_PREVENTION_IMPOSSIBLE,
  SCENARIO_LABEL_N3_FENCE_PLAN_READY_IS_NOT_ELIGIBILITY,
  SCENARIO_LABEL_N3_FENCE_PROTO_PRODUCTION_CUTOVER_IMPOSSIBLE,
  SCENARIO_LABEL_N3_FENCE_RECOVERY_DEFERRED,
  SCENARIO_LABEL_N3_FENCE_VS_DEPLOYMENT_ROLLBACK,
  SCENARIO_LABEL_N3_FENCE_WRITE_ORDER_LEGACY,
  SCENARIO_LABEL_N3_FENCE_WRITE_ORDER_NAMESPACED,
  SCENARIO_LABEL_N3_FENCE_WRITTEN_LAST,
} from "./scenario-label-n3-fence-types";

const SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" as EntityId;
const SCHOOL_B = "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee" as EntityId;

function schoolTarget(
  schoolId: EntityId = SCHOOL_A,
): ScenarioLabelMigrationTargetResolution {
  return { status: "resolved", target: { kind: "school", schoolId } };
}

function unboundTarget(): ScenarioLabelMigrationTargetResolution {
  return { status: "resolved", target: { kind: "unbound" } };
}

function validLegacy(
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

function validNamespaced(
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

function fenceValid(
  authority: "legacy" | "namespaced",
  raw: { exists: false } | { exists: true; value: string },
  schoolId: EntityId = SCHOOL_A,
): ScenarioLabelN3FenceRecordParseResult {
  return {
    status: "valid",
    record: buildScenarioLabelN3FenceRecord({
      authority,
      schoolId,
      committedRaw: raw,
    }),
  };
}

function baseFenceInput(
  overrides: Partial<ScenarioLabelN3FenceAssessInput> = {},
): ScenarioLabelN3FenceAssessInput {
  return {
    targetResolution: schoolTarget(),
    fence: fenceValid("legacy", { exists: true, value: "A" }),
    marker: validLegacy("present"),
    legacyRaw: { exists: true, value: "A" },
    schoolV2Raw: { exists: true, value: "A" },
    ...overrides,
  };
}

/** Structural N3 data-plane READY fixture (no N3 protocol function imports). */
function n3DataReady(
  schoolId: EntityId = SCHOOL_A,
  presence: "present" | "absent" = "present",
): ScenarioLabelN3CutoverAssessment {
  const fromMarker = buildScenarioLabelN3LegacyMarker({
    mirrorHealth: "synced",
    authoritativePresence: presence,
  });
  const toMarker = buildScenarioLabelN3NamespacedMarker({
    mirrorHealth: "synced",
    authoritativePresence: presence,
  });
  return {
    status: "ready_for_cutover",
    schoolId,
    fromMarker,
    toMarker,
  };
}

function n3DataNotReady(): ScenarioLabelN3CutoverAssessment {
  return { status: "needs_bootstrap_or_repair", reason: "marker_missing" };
}

function n3DataUnboundNotReady(): ScenarioLabelN3CutoverAssessment {
  return { status: "not_ready", reason: "target_unbound" };
}

function n3PlanReady(schoolId: EntityId = SCHOOL_A): ScenarioLabelN3CutoverPlan {
  const fromMarker = buildScenarioLabelN3LegacyMarker({
    mirrorHealth: "synced",
    authoritativePresence: "present",
  });
  const toMarker = buildScenarioLabelN3NamespacedMarker({
    mirrorHealth: "synced",
    authoritativePresence: "present",
  });
  return {
    status: "ready",
    schoolId,
    operation: "replace_marker_only",
    fromMarker,
    toMarker,
    requiresPreMarkerEquality: true,
    requiresMarkerReadBack: true,
    requiresPostMarkerEquality: true,
  };
}

describe("N3-FENCE-PROTO state machine", () => {
  it("S1: missing fence + legacy → UNESTABLISHED", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({ fence: { status: "missing" }, marker: validLegacy() }),
      ),
    ).toEqual({
      status: "UNESTABLISHED",
      schoolId: SCHOOL_A,
      reason: "fence_missing_pre_cutover",
    });
  });

  it("S2: exact legacy state → LEGACY_COMMITTED (+ material fenceReady)", () => {
    const assessment = assessScenarioLabelN3FenceState(baseFenceInput());
    expect(assessment).toEqual({
      status: "LEGACY_COMMITTED",
      schoolId: SCHOOL_A,
      record: expect.objectContaining({
        authority: "legacy",
        committedRaw: { exists: true, value: "A" },
      }),
      fenceReady: true,
    });
    expect(isScenarioLabelN3FenceReadyForPreCutover(assessment)).toBe(true);
  });

  it("S3: exact namespaced → NAMESPACED_COMMITTED", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          fence: fenceValid("namespaced", { exists: true, value: "A" }),
          marker: validNamespaced(),
        }),
      ),
    ).toEqual({
      status: "NAMESPACED_COMMITTED",
      schoolId: SCHOOL_A,
      record: expect.objectContaining({ authority: "namespaced" }),
    });
  });

  it("S4: raw changed legacy → VIOLATED", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          legacyRaw: { exists: true, value: "B" },
          schoolV2Raw: { exists: true, value: "B" },
        }),
      ).status,
    ).toBe("VIOLATED");
  });

  it("S5: raw changed v2 only → VIOLATED", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          schoolV2Raw: { exists: true, value: "B" },
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        status: "VIOLATED",
        kind: "divergent_violation",
      }),
    );
  });

  it("S6: marker downgraded (namespaced cert + legacy marker) → VIOLATED", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          fence: fenceValid("namespaced", { exists: true, value: "A" }),
          marker: validLegacy(),
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        status: "VIOLATED",
        kind: "equal_copy_violation",
      }),
    );
  });

  it("S7: marker upgraded while fence legacy → VIOLATED", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          fence: fenceValid("legacy", { exists: true, value: "A" }),
          marker: validNamespaced(),
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        status: "VIOLATED",
        kind: "marker_authority_mismatch",
      }),
    );
  });

  it("S8: presence mismatch → VIOLATED", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          fence: fenceValid("legacy", { exists: false }),
          marker: validLegacy("present"),
          legacyRaw: { exists: false },
          schoolV2Raw: { exists: false },
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        status: "VIOLATED",
        kind: "presence_mismatch",
      }),
    );
  });

  it("S9: corrupted fence → INVALID", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          fence: { status: "invalid", reason: "invalid_shape" },
        }),
      ),
    ).toEqual({ status: "INVALID", reason: "invalid_shape" });
  });

  it("S10: read unavailable → UNAVAILABLE (not UNESTABLISHED)", () => {
    expect(
      assessScenarioLabelN3FenceState(baseFenceInput({ storageReadError: true })),
    ).toEqual({ status: "UNAVAILABLE", reason: "storage_read_error" });
  });

  it("S11: namespaced marker + missing fence → VIOLATED (never committed)", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          fence: { status: "missing" },
          marker: validNamespaced(),
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        status: "VIOLATED",
        kind: "namespaced_without_fence",
      }),
    );
  });

  it("S12: cert school mismatch → INVALID", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          fence: fenceValid("legacy", { exists: true, value: "A" }, SCHOOL_B),
          targetResolution: schoolTarget(SCHOOL_A),
        }),
      ),
    ).toEqual({ status: "INVALID", reason: "school_id_mismatch" });
  });
});

describe("N3-FENCE-PROTO old writer scenarios", () => {
  it("O1: cert A namespaced + old N2 B/B + marker legacy → VIOLATED", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          fence: fenceValid("namespaced", { exists: true, value: "A" }),
          marker: validLegacy(),
          legacyRaw: { exists: true, value: "B" },
          schoolV2Raw: { exists: true, value: "B" },
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        status: "VIOLATED",
        kind: "equal_copy_violation",
      }),
    );
  });

  it("O2: cert A + same A/A but marker downgraded → VIOLATED (raw equality alone insufficient)", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          fence: fenceValid("namespaced", { exists: true, value: "A" }),
          marker: validLegacy(),
          legacyRaw: { exists: true, value: "A" },
          schoolV2Raw: { exists: true, value: "A" },
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        status: "VIOLATED",
        kind: "equal_copy_violation",
      }),
    );
  });

  it("O3: cert A + legacy B / v2 A → VIOLATED divergent", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          fence: fenceValid("namespaced", { exists: true, value: "A" }),
          marker: validNamespaced(),
          legacyRaw: { exists: true, value: "B" },
          schoolV2Raw: { exists: true, value: "A" },
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        status: "VIOLATED",
        kind: "divergent_violation",
      }),
    );
  });

  it("O4: pre-cutover legacy cert A + old N2 B/B → not cutover eligible", () => {
    const fenceAssessment = assessScenarioLabelN3FenceState(
      baseFenceInput({
        fence: fenceValid("legacy", { exists: true, value: "A" }),
        marker: validLegacy(),
        legacyRaw: { exists: true, value: "B" },
        schoolV2Raw: { exists: true, value: "B" },
      }),
    );
    expect(fenceAssessment.status).toBe("VIOLATED");
    // Data plane can still be READY at B/B while fence remains violated vs cert A.
    const cutoverAssessment = n3DataReady(SCHOOL_A, "present");
    expect(
      assessScenarioLabelFenceCutoverEligibility({ cutoverAssessment, fenceAssessment }),
    ).toEqual({ eligible: false, reason: "fence_violated" });
  });

  it("O5: Level B absent/absent + v1 marker while namespaced cert present → VIOLATED", () => {
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          fence: fenceValid("namespaced", { exists: true, value: "A" }),
          marker: validLegacy("absent"),
          legacyRaw: { exists: false },
          schoolV2Raw: { exists: false },
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        status: "VIOLATED",
        kind: "equal_copy_violation",
      }),
    );
  });
});

describe("N3-FENCE-PROTO cutover eligibility composer", () => {
  it("E1: N3 data ready + LEGACY_COMMITTED → eligible at data+fence layer", () => {
    const cutoverAssessment = n3DataReady();
    const fenceAssessment = assessScenarioLabelN3FenceState(baseFenceInput());
    expect(
      assessScenarioLabelFenceCutoverEligibility({ cutoverAssessment, fenceAssessment }),
    ).toEqual({
      eligible: true,
      schoolId: SCHOOL_A,
      layer: "data_and_fence",
    });
  });

  it("E2: data ready + UNESTABLISHED → not eligible", () => {
    const cutoverAssessment = n3DataReady();
    const fenceAssessment = assessScenarioLabelN3FenceState(
      baseFenceInput({ fence: { status: "missing" } }),
    );
    expect(
      assessScenarioLabelFenceCutoverEligibility({ cutoverAssessment, fenceAssessment }),
    ).toEqual({ eligible: false, reason: "fence_unestablished" });
  });

  it("E3: data ready + VIOLATED → not eligible", () => {
    const cutoverAssessment = n3DataReady();
    const fenceAssessment = assessScenarioLabelN3FenceState(
      baseFenceInput({ schoolV2Raw: { exists: true, value: "X" } }),
    );
    expect(
      assessScenarioLabelFenceCutoverEligibility({ cutoverAssessment, fenceAssessment }),
    ).toEqual({ eligible: false, reason: "fence_violated" });
  });

  it("E4: data ready + INVALID → not eligible", () => {
    const cutoverAssessment = n3DataReady();
    const fenceAssessment = assessScenarioLabelN3FenceState(
      baseFenceInput({ fence: { status: "invalid", reason: "invalid_json" } }),
    );
    expect(
      assessScenarioLabelFenceCutoverEligibility({ cutoverAssessment, fenceAssessment }),
    ).toEqual({ eligible: false, reason: "fence_invalid" });
  });

  it("E5: data ready + UNAVAILABLE → not eligible", () => {
    const cutoverAssessment = n3DataReady();
    const fenceAssessment = assessScenarioLabelN3FenceState(
      baseFenceInput({ storageReadError: true }),
    );
    expect(
      assessScenarioLabelFenceCutoverEligibility({ cutoverAssessment, fenceAssessment }),
    ).toEqual({ eligible: false, reason: "fence_unavailable" });
  });

  it("E6: data not ready + fence committed → not eligible", () => {
    const cutoverAssessment = n3DataNotReady();
    const fenceAssessment = assessScenarioLabelN3FenceState(baseFenceInput());
    expect(fenceAssessment.status).toBe("LEGACY_COMMITTED");
    expect(
      assessScenarioLabelFenceCutoverEligibility({ cutoverAssessment, fenceAssessment }),
    ).toEqual({ eligible: false, reason: "data_not_ready" });
  });

  it("E7: unbound → never eligible", () => {
    const cutoverAssessment = n3DataUnboundNotReady();
    const fenceAssessment = assessScenarioLabelN3FenceState(
      baseFenceInput({ targetResolution: unboundTarget() }),
    );
    expect(fenceAssessment).toEqual({ status: "INVALID", reason: "target_not_school" });
    expect(
      assessScenarioLabelFenceCutoverEligibility({ cutoverAssessment, fenceAssessment }),
    ).toEqual({ eligible: false, reason: "data_not_ready" });
  });

  it("E8: different school between readiness and fence → no", () => {
    const cutoverAssessment = n3DataReady(SCHOOL_A);
    const fenceAssessment = assessScenarioLabelN3FenceState(
      baseFenceInput({
        targetResolution: schoolTarget(SCHOOL_B),
        fence: fenceValid("legacy", { exists: true, value: "A" }, SCHOOL_B),
      }),
    );
    expect(fenceAssessment.status).toBe("LEGACY_COMMITTED");
    expect(
      assessScenarioLabelFenceCutoverEligibility({ cutoverAssessment, fenceAssessment }),
    ).toEqual({ eligible: false, reason: "target_mismatch" });
  });

  it("plan.ready ≠ fence eligibility (N3-PROTO lower-level note)", () => {
    const plan = n3PlanReady();
    expect(plan.status).toBe("ready");
    const fenceAssessment = assessScenarioLabelN3FenceState(
      baseFenceInput({ fence: { status: "missing" } }),
    );
    const note = noteScenarioLabelN3PlanReadyIsNotFenceEligibility({ plan, fenceAssessment });
    expect(note).toEqual({
      planReady: true,
      fenceEligible: false,
      planReadyIsNotEligibility: true,
    });
    expect(SCENARIO_LABEL_N3_FENCE_PLAN_READY_IS_NOT_ELIGIBILITY).toBe(true);
  });
});

describe("N3-FENCE-PROTO contracts", () => {
  it("revision/generation alone cannot prove raw unchanged", () => {
    expect(
      assertScenarioLabelN3FenceRequiresExactRaw({
        certifiedGeneration: 3,
        observedGeneration: 3,
        committedRaw: { exists: true, value: "A" },
        observedRaw: { exists: true, value: "B" },
      }),
    ).toEqual({ ok: false, reason: "generation_alone_insufficient" });
  });

  it("fence-last + crash marker-without-fence contract", () => {
    expect(SCENARIO_LABEL_N3_FENCE_WRITTEN_LAST).toBe(true);
    expect(SCENARIO_LABEL_N3_FENCE_FIRST_FORBIDDEN).toBe(true);
    expect(SCENARIO_LABEL_N3_FENCE_WRITE_ORDER_LEGACY.at(-1)).toBe("fence_last");
    expect(SCENARIO_LABEL_N3_FENCE_WRITE_ORDER_NAMESPACED.at(-1)).toBe("fence_last");
    expect(
      assessScenarioLabelN3FenceState(
        baseFenceInput({
          fence: { status: "missing" },
          marker: validNamespaced(),
        }),
      ).status,
    ).toBe("VIOLATED");
  });

  it("hard prevention impossible + snippet hazard + rollback distinction", () => {
    expect(SCENARIO_LABEL_N3_FENCE_HARD_PREVENTION_IMPOSSIBLE).toContain(
      "cannot be reliably denied",
    );
    expect(SCENARIO_LABEL_N3_FENCE_CONSOLE_SNIPPET_HAZARD).toContain("saved console snippet");
    expect(SCENARIO_LABEL_N3_FENCE_VS_DEPLOYMENT_ROLLBACK).toContain("deployment rollback");
    expect(SCENARIO_LABEL_N3_FENCE_RECOVERY_DEFERRED).toBe(true);
    expect(SCENARIO_LABEL_N3_FENCE_PROTO_PRODUCTION_CUTOVER_IMPOSSIBLE).toBe(true);
  });

  it("exact raw presence edge: missing != present empty under committed assessment", () => {
    const missingCommitted = assessScenarioLabelN3FenceState(
      baseFenceInput({
        fence: fenceValid("legacy", { exists: false }),
        marker: validLegacy("absent"),
        legacyRaw: { exists: false },
        schoolV2Raw: { exists: false },
      }),
    );
    expect(missingCommitted.status).toBe("LEGACY_COMMITTED");

    const emptyVsMissing = assessScenarioLabelN3FenceState(
      baseFenceInput({
        fence: fenceValid("legacy", { exists: false }),
        marker: validLegacy("present"),
        legacyRaw: { exists: true, value: "" },
        schoolV2Raw: { exists: true, value: "" },
      }),
    );
    expect(emptyVsMissing.status).toBe("VIOLATED");
  });
});
