import { describe, expect, it } from "vitest";
import {
  calculateSchoolDruzinaPhmaxDetailed,
  calculateSchoolDruzinaPhmaxFromSummary,
  getPhmaxSdBase,
  normalizeSchoolDruzinaInput,
} from "./phmax-sd-logic";

describe("ŠD golden matrix", () => {
  it("počítá referenční scénáře pro běžná i speciální oddělení", () => {
    const baseOnly = calculateSchoolDruzinaPhmaxFromSummary({
      regularDepartments: 4,
      regularParticipantsTotal: 100,
    });
    expect(baseOnly.basePhmax).toBe(97.5);
    expect(baseOnly.finalPhmax).toBe(97.5);
    expect(baseOnly.finalPhaMax).toBe(0);

    const reducedRegular = calculateSchoolDruzinaPhmaxFromSummary({
      regularDepartments: 2,
      regularParticipantsTotal: 35,
      regularExceptionGranted: true,
    });
    expect(reducedRegular.basePhmax).toBe(57.5);
    expect(reducedRegular.regularReductionFactor).toBe(0.875);
    expect(reducedRegular.finalPhmax).toBe(50.31);

    const specialWithException = calculateSchoolDruzinaPhmaxDetailed(
      normalizeSchoolDruzinaInput({
        departments: [
          { kind: "regular", participants: 20 },
          { kind: "special", participants: 5, specialExceptionGranted: true },
        ],
      }),
    );
    expect(specialWithException.basePhmax).toBe(57.5);
    expect(specialWithException.specialSharePhmax).toBe(27.31);
    expect(specialWithException.finalPhaMax).toBe(14.25);
    expect(specialWithException.finalPhmax).toBe(56.06);
  });
});

describe("ŠD hraniční pásma a limity", () => {
  it("drží hranice tabulky oddělení 1-21", () => {
    expect(getPhmaxSdBase(1)).toBe(32.5);
    expect(getPhmaxSdBase(21)).toBe(502.5);
    expect(getPhmaxSdBase(22)).toBeNull();
  });

  it("správně překlápí koeficient výjimky speciálního oddělení na hranici 6 účastníků", () => {
    const atBoundary = calculateSchoolDruzinaPhmaxDetailed(
      normalizeSchoolDruzinaInput({
        departments: [{ kind: "special", participants: 6, specialExceptionGranted: true }],
      }),
    );
    expect(atBoundary.breakdown[0].reductionFactor).toBe(1);
    expect(atBoundary.breakdown[0].finalPhaMax).toBe(15);

    const belowBoundary = calculateSchoolDruzinaPhmaxDetailed(
      normalizeSchoolDruzinaInput({
        departments: [{ kind: "special", participants: 5.99, specialExceptionGranted: true }],
      }),
    );
    expect(belowBoundary.breakdown[0].reductionFactor).toBe(0.95);
    expect(belowBoundary.breakdown[0].finalPhaMax).toBe(14.25);
  });
});
