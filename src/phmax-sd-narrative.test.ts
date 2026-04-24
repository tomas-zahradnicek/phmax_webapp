import { describe, expect, it } from "vitest";
import { buildSdPlainNarrativeText, getSdDepartmentRangeFromPupils } from "./phmax-sd-narrative";

describe("getSdDepartmentRangeFromPupils", () => {
  it("242 žáků → 8 až 12, doporučeno 9 (inspirace z metodických orientací)", () => {
    const r = getSdDepartmentRangeFromPupils(242);
    expect(r).toEqual({ minBy32: 8, maxBy20: 12, recommended: 9 });
  });
});

describe("buildSdPlainNarrativeText", () => {
  it("při souladu mezí a doporučení vrátí dva souhrnné odstavce", () => {
    const t = buildSdPlainNarrativeText({
      pupils: 242,
      hasSpecialDepartments: false,
      totalDepartments: 9,
      phmaxHours: 227.5,
    });
    expect(t).not.toBeNull();
    expect(t!.p1).toContain("8 až 12");
    expect(t!.p1).toContain("9");
    expect(t!.p2).toContain("227,50");
    expect(t!.p2).toContain("9 oddělení");
    expect(t!.p2).toContain("Model úvazků (NV 75/2005)");
    expect(t!.disclaimer.length).toBeGreaterThan(20);
  });
});
