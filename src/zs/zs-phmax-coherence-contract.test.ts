import { describe, expect, it } from "vitest";
import { buildZsFormSnapshot, type ZsFormSnapshotState } from "./zs-form-snapshot";
import { computeZsPhmaxTotalFromSnapshot } from "./zs-compute-phmax-total-from-snapshot";

function minimalZsSnapshotState(overrides: Partial<ZsFormSnapshotState> = {}): ZsFormSnapshotState {
  return {
    tab: "phmax",
    mode: "basic",
    basicType: "full_more_than_2",
    basic1Classes: 2,
    basic1Pupils: 40,
    basic2Classes: 0,
    basic2Pupils: 0,
    incl1Classes: 0,
    incl1Pupils: 0,
    incl2Classes: 0,
    incl2Pupils: 0,
    psychRows: [],
    healthRows: [],
    exportLabel: "",
    minorityType: "minorityFull1",
    minority1Classes: 0,
    minority1Pupils: 0,
    minority2Classes: 0,
    minority2Pupils: 0,
    gymRows: [],
    mixedRows: [],
    special1Classes: 0,
    special1Pupils: 0,
    special2Classes: 0,
    special2Pupils: 0,
    specialIIClasses: 0,
    specialIIPupils: 0,
    prepClasses: 0,
    prepChildren: 0,
    prepSpecialClasses: 0,
    prepSpecialChildren: 0,
    p38First: 0,
    p38Second: 0,
    p41First: 0,
    p41Second: 0,
    phaRows: [],
    phpYear1: 0,
    phpYear2: 0,
    phpYear3: 0,
    phpWizardStep: "a",
    phpMethodMode: "three_year_avg",
    phpExcludedAbroad: 0,
    phpExcludedForeignSchoolCz: 0,
    phpExcludedIndividual: 0,
    phpExcludedSchool: false,
    selectedExample: "",
    wizardChoice: "",
    zsWizardStep: 1,
    dataMode: "own",
    nv75Role: "ucitel",
    nv75School: "plavecka_skola",
    nv75TeacherMin: 22,
    nv75TeacherMax: 30,
    mixedMethodFirstZsPupils: 0,
    mixedMethodFirstZsClasses: 0,
    mixedMethodFirstSpecialPupils: 0,
    mixedMethodFirstSpecialClasses: 0,
    mixedMethodSecondZsPupils: 0,
    mixedMethodSecondZsClasses: 0,
    mixedMethodSecondSpecialPupils: 0,
    mixedMethodSecondSpecialClasses: 0,
    auditTotals: { totalPhmax: 0, totalPha: 0, totalPhp: 0, tab: "phmax" },
    ...overrides,
  };
}

describe("ZŠ PHmax koherence (autosave vs přepočet)", () => {
  it("přepočet ze snapshotu odpovídá _phmaxAuditTotals z buildZsFormSnapshot", () => {
    const computed = computeZsPhmaxTotalFromSnapshot({
      tab: "phmax",
      basicType: "full_more_than_2",
      basic1Classes: 2,
      basic1Pupils: 40,
    });
    expect(computed).not.toBeNull();

    const snap = buildZsFormSnapshot(
      minimalZsSnapshotState({
        auditTotals: { totalPhmax: computed!, totalPha: 0, totalPhp: 0, tab: "phmax" },
      }),
    );
    expect(computeZsPhmaxTotalFromSnapshot(snap)).toBe(computed);
    expect((snap._phmaxAuditTotals as { totalPhmax: number }).totalPhmax).toBe(computed);
  });

  it("buildZsFormSnapshot vždy zapisuje auditTotals do _phmaxAuditTotals", () => {
    const snap = buildZsFormSnapshot(minimalZsSnapshotState());
    expect(snap._phmaxAuditTotals).toMatchObject({
      totalPhmax: expect.any(Number),
      totalPha: expect.any(Number),
      totalPhp: expect.any(Number),
      tab: "phmax",
    });
  });
});
