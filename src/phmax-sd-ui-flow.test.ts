import { describe, expect, it } from "vitest";
import {
  calculateSchoolDruzinaPhmaxDetailed,
  calculateSchoolDruzinaPhmaxFromSummary,
  normalizeSchoolDruzinaInput,
  suggestedDepartmentsFromPupils,
} from "./phmax-sd-logic";
import { sdHeroExampleSnapshot } from "./phmax-sd-hero-examples";

function computeFromSdExample(exampleKey: Parameters<typeof sdHeroExampleSnapshot>[0]) {
  const snap = sdHeroExampleSnapshot(exampleKey);
  const effectiveDepts = snap.manualDepts ? snap.departments : suggestedDepartmentsFromPupils(snap.pupils);
  if (snap.inputMode === "summary") {
    return calculateSchoolDruzinaPhmaxFromSummary({
      regularDepartments: effectiveDepts,
      regularParticipantsTotal: snap.pupils,
      regularExceptionGranted: snap.regularExceptionGranted,
      specialExceptionGranted: snap.specialExceptionGranted,
      schoolFirstStageClassCount: snap.schoolFirstStageClassCount,
      specialDepartments: snap.summarySpecialDepartments,
    });
  }
  return calculateSchoolDruzinaPhmaxDetailed(
    normalizeSchoolDruzinaInput({
      departments: snap.detailDepartments,
      regularExceptionGranted: snap.regularExceptionGranted,
      specialExceptionGranted: false,
      schoolFirstStageClassCount: snap.schoolFirstStageClassCount,
    }),
  );
}

describe("ŠD UI flow integration (example -> summary)", () => {
  it("metodický příklad 2 drží očekávaný krácený PHmax", () => {
    const out = computeFromSdExample("meth_2_35");
    expect(out.totalDepartments).toBe(2);
    expect(out.basePhmax).toBe(57.5);
    expect(out.regularReductionFactor).toBe(0.875);
    expect(out.finalPhmax).toBe(50.32);
  });

  it("metodický příklad 7 vrací PHAmax pro speciální oddělení", () => {
    const out = computeFromSdExample("meth_7_special_pha");
    expect(out.totalDepartments).toBe(1);
    expect(out.specialDepartments).toBe(1);
    expect(out.finalPhaMax).toBe(14.25);
    expect(out.finalPhmax).toBe(30.88);
  });
});
