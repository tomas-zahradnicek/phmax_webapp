import { describe, expect, it } from "vitest";
import { computeSdLitePhmax } from "./phmax-sd-lite-logic";

describe("computeSdLitePhmax", () => {
  it("242 žáků, auto oddělení → 9 oddělení, PHmax 227,5", () => {
    const r = computeSdLitePhmax({
      pupils: 242,
      manualDepartments: false,
      departments: 0,
      schoolFirstStageClassCount: null,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.suggestedDepartments).toBe(9);
    expect(r.effectiveDepartments).toBe(9);
    expect(r.phmaxHours).toBeCloseTo(227.5, 1);
    expect(r.narrative.p1).toContain("8 až 12");
    expect(r.staffing.headVedouciHours).toBe(21);
    expect(r.staffing.fullTimeSlots).toBe(7);
    expect(r.staffing.partialHours).toBeCloseTo(10.5, 1);
  });

  it("bez účastníků vrátí chybu", () => {
    const r = computeSdLitePhmax({
      pupils: 0,
      manualDepartments: false,
      departments: 0,
      schoolFirstStageClassCount: null,
    });
    expect(r.ok).toBe(false);
  });

  it("1 oddělení: počet tříd mění minimum při krácení §10", () => {
    const withoutClass = computeSdLitePhmax({
      pupils: 10,
      manualDepartments: true,
      departments: 1,
      schoolFirstStageClassCount: null,
    });
    const withOneClass = computeSdLitePhmax({
      pupils: 10,
      manualDepartments: true,
      departments: 1,
      schoolFirstStageClassCount: 1,
    });
    expect(withoutClass.ok).toBe(true);
    expect(withOneClass.ok).toBe(true);
    if (!withoutClass.ok || !withOneClass.ok) return;
    expect(withoutClass.reductionApplied).toBe(true);
    expect(withoutClass.phmaxHours).toBeCloseTo(16.25, 2);
    expect(withOneClass.reductionApplied).toBe(false);
    expect(withOneClass.phmaxHours).toBeCloseTo(32.5, 2);
  });
});
