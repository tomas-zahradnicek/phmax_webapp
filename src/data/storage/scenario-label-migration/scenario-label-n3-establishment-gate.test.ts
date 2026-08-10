import { describe, expect, it } from "vitest";
import { decideScenarioLabelAwareEstablishment } from "./scenario-label-n3-establishment-gate";
import {
  MemoryStorage,
  SCHOOL_A,
  seedConflictingAuthority,
  seedLegacyReady,
  seedLegacyUnprepared,
  seedLegacyViolatedRecoverable,
  seedNamespacedDegraded,
  seedNamespacedReady,
  schoolKeys,
} from "./scenario-label-n3-aware-test-helpers";
import {
  SCENARIO_LABEL_N3_AWARE_BACKUP_CANNOT_CREATE_NAMESPACED,
  SCENARIO_LABEL_N3_AWARE_EMPTY_TARGET_DEFAULTS_TO_LEGACY,
} from "./scenario-label-n3-aware-types";
import { assessScenarioLabelRuntimeAuthority } from "./scenario-label-n3-aware-assessment";

describe("N3-AWARE-CORE establishment gate (E1–E8)", () => {
  it("E1 legacy repairable → permit establishment", () => {
    const storage = new MemoryStorage();
    seedLegacyViolatedRecoverable(storage);
    const d = decideScenarioLabelAwareEstablishment({ storage, schoolId: SCHOOL_A });
    expect(d).toEqual({
      action: "permit_legacy_establishment",
      authority: "legacy",
      reason: "legacy_repairable",
    });
  });

  it("E2 legacy ready / unprepared healthy → PREP path", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "L");
    expect(decideScenarioLabelAwareEstablishment({ storage, schoolId: SCHOOL_A })).toEqual({
      action: "permit_legacy_prep",
      authority: "legacy",
      reason: "legacy_already_ready",
    });

    const storage2 = new MemoryStorage();
    seedLegacyUnprepared(storage2, "L");
    expect(decideScenarioLabelAwareEstablishment({ storage: storage2, schoolId: SCHOOL_A })).toEqual(
      {
        action: "permit_legacy_prep",
        authority: "legacy",
        reason: "legacy_already_ready",
      },
    );
  });

  it("E3 namespaced ready → no_op", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "NS");
    expect(decideScenarioLabelAwareEstablishment({ storage, schoolId: SCHOOL_A })).toEqual({
      action: "no_op_namespaced_authoritative",
      authority: "namespaced",
      reason: "namespaced_ready",
    });
  });

  it("E4 namespaced degraded → no legacy repair", () => {
    const storage = new MemoryStorage();
    seedNamespacedDegraded(storage);
    const d = decideScenarioLabelAwareEstablishment({ storage, schoolId: SCHOOL_A });
    expect(d.action).toBe("no_op_namespaced_authoritative");
    expect(d).not.toMatchObject({ action: "permit_legacy_establishment" });
    expect(d).not.toMatchObject({ action: "permit_legacy_prep" });
  });

  it("E5 invalid → blocked", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    storage.setItem(keys.marker, "{bad");
    expect(decideScenarioLabelAwareEstablishment({ storage, schoolId: SCHOOL_A }).action).toBe(
      "blocked",
    );
  });

  it("E6 conflicting authority → blocked", () => {
    const storage = new MemoryStorage();
    seedConflictingAuthority(storage);
    expect(decideScenarioLabelAwareEstablishment({ storage, schoolId: SCHOOL_A }).action).toBe(
      "blocked",
    );
  });

  it("E7 no schema2→v1 downgrade via gate", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "NS");
    const d = decideScenarioLabelAwareEstablishment({ storage, schoolId: SCHOOL_A });
    expect(d.action).toBe("no_op_namespaced_authoritative");
    // Gate must never recommend legacy establishment / PREP under namespaced.
    expect(JSON.stringify(d)).not.toContain("permit_legacy");
  });

  it("E8 no PREP for namespaced", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "NS");
    const d = decideScenarioLabelAwareEstablishment({ storage, schoolId: SCHOOL_A });
    expect(d).not.toMatchObject({ action: "permit_legacy_prep" });
  });

  it("empty target defaults to legacy authority (policy lock)", () => {
    expect(SCENARIO_LABEL_N3_AWARE_EMPTY_TARGET_DEFAULTS_TO_LEGACY).toBe(true);
    expect(SCENARIO_LABEL_N3_AWARE_BACKUP_CANNOT_CREATE_NAMESPACED).toBe(true);
    const storage = new MemoryStorage();
    // Empty browser: no marker/fence/v2 — equal missing → legacy unprepared.
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("LEGACY_COMPAT_UNPREPARED");
  });

  it("unbound gate → current compatible policy", () => {
    const storage = new MemoryStorage();
    expect(decideScenarioLabelAwareEstablishment({ storage, schoolId: null })).toEqual({
      action: "permit_legacy_establishment",
      authority: "legacy",
      reason: "unbound_compatible",
    });
  });
});
