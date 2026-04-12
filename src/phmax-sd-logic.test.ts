import { describe, expect, it } from "vitest";
import {
  PHMAX_SD_BY_DEPARTMENTS,
  getPhmaxSdBase,
  getPhmaxSdBreakdown,
  getPhmaxSdHourForDepartmentOrder,
  reducedPhmaxIfUnderStaffed,
  suggestedDepartmentsFromPupils,
} from "./phmax-sd-logic";

describe("PHMAX_SD_BY_DEPARTMENTS", () => {
  it("odpovídá tabulce z metodiky (vybrané řádky)", () => {
    expect(PHMAX_SD_BY_DEPARTMENTS[0]).toBe(32.5);
    expect(PHMAX_SD_BY_DEPARTMENTS[3]).toBe(97.5);
    expect(PHMAX_SD_BY_DEPARTMENTS[4]).toBe(130);
    expect(PHMAX_SD_BY_DEPARTMENTS[8]).toBe(227.5);
    expect(PHMAX_SD_BY_DEPARTMENTS[14]).toBe(372.5);
    expect(PHMAX_SD_BY_DEPARTMENTS[20]).toBe(502.5);
  });
});

describe("suggestedDepartmentsFromPupils", () => {
  it("zaokrouhluje nahoru po 27", () => {
    expect(suggestedDepartmentsFromPupils(0)).toBe(0);
    expect(suggestedDepartmentsFromPupils(27)).toBe(1);
    expect(suggestedDepartmentsFromPupils(28)).toBe(2);
    expect(suggestedDepartmentsFromPupils(240)).toBe(9);
    expect(suggestedDepartmentsFromPupils(242)).toBe(9);
  });
});

describe("reducedPhmaxIfUnderStaffed", () => {
  it("nekrátí při průměru alespoň 20 na oddělení", () => {
    const r = reducedPhmaxIfUnderStaffed({
      pupilsFirstGrade: 80,
      departmentCount: 4,
      basePhmax: 97.5,
    });
    expect(r.applied).toBe(false);
    expect(r.adjusted).toBe(97.5);
  });

  it("aplikuje koeficient jako v příkladu Kvic (74 / 80)", () => {
    const r = reducedPhmaxIfUnderStaffed({
      pupilsFirstGrade: 74,
      departmentCount: 4,
      basePhmax: 97.5,
    });
    expect(r.applied).toBe(true);
    expect(r.factor).toBeCloseTo(0.925, 5);
    expect(r.adjusted).toBe(90.19);
  });
});

describe("getPhmaxSdBase", () => {
  it("vrací null mimo tabulku", () => {
    expect(getPhmaxSdBase(0)).toBeNull();
    expect(getPhmaxSdBase(22)).toBeNull();
  });
});

describe("getPhmaxSdBreakdown", () => {
  it("1. a 2. oddělení odpovídají příloze (32,5 a 25)", () => {
    expect(getPhmaxSdHourForDepartmentOrder(1)).toBe(32.5);
    expect(getPhmaxSdHourForDepartmentOrder(2)).toBe(25);
    expect(getPhmaxSdBreakdown(2)).toEqual([32.5, 25]);
  });

  it("součet řádků se rovná PHmax z tabulky pro 1–21 oddělení", () => {
    for (let n = 1; n <= 21; n++) {
      const parts = getPhmaxSdBreakdown(n);
      const total = getPhmaxSdBase(n);
      expect(parts).not.toBeNull();
      expect(total).not.toBeNull();
      const sum = parts!.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(total!, 10);
    }
  });
});
