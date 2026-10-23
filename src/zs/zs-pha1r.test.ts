import { describe, expect, it } from "vitest";
import {
  computeZsPha1r,
  validateZsPha1rClasses,
  type Pha1rClassRow,
  type Pha1rSchoolFlags,
} from "./zs-pha1r";

const openSchool: Pha1rSchoolFlags = {
  schoolEstablishedSec16_9: false,
  schoolAtInstitutionalOrProtectiveCare: false,
  schoolAtHealthcareFacility: false,
};

function row(
  id: number,
  grade1Pupils: number,
  extras: Partial<Pick<Pha1rClassRow, "grade1Par38" | "grade1Par41" | "establishedSec16_9">> = {},
): Pha1rClassRow {
  return {
    id,
    grade1Pupils,
    grade1Par38: extras.grade1Par38 ?? 0,
    grade1Par41: extras.grade1Par41 ?? 0,
    establishedSec16_9: extras.establishedSec16_9 ?? false,
  };
}

function total(classes: Pha1rClassRow[], flags: Pha1rSchoolFlags = openSchool) {
  return computeZsPha1r({ classes, flags });
}

describe("PHA1Rmax B47", () => {
  it("1. 14 prvňáků => 0", () => {
    expect(total([row(1, 14)]).totalPha1r).toBe(0);
    expect(total([row(1, 14)]).eligibleClassCount).toBe(0);
  });

  it("2. 15 prvňáků => 20", () => {
    const result = total([row(1, 15)]);
    expect(result.totalPha1r).toBe(20);
    expect(result.eligibleClassCount).toBe(1);
    expect(result.classes[0]).toMatchObject({ relevantGrade1Pupils: 15, eligible: true, hours: 20 });
  });

  it("3. 16 prvňáků => 20", () => {
    expect(total([row(1, 16)]).totalPha1r).toBe(20);
  });

  it("4. dvě třídy po 15 => 40", () => {
    const result = total([row(1, 15), row(2, 15)]);
    expect(result.totalPha1r).toBe(40);
    expect(result.eligibleClassCount).toBe(2);
  });

  it("5. 14 + 16 => 20, třídy se nesčítají před prahem", () => {
    const result = total([row(1, 14), row(2, 16)]);
    expect(result.totalPha1r).toBe(20);
    expect(result.eligibleClassCount).toBe(1);
    expect(result.classes.map((item) => item.hours)).toEqual([0, 20]);
  });

  it("6. víceročníková třída s 15 prvňáky => 20", () => {
    expect(total([row(1, 15)]).totalPha1r).toBe(20);
  });

  it("7. 15 prvňáků, 1 podle § 41 => relevantních 14 => 0", () => {
    const result = total([row(1, 15, { grade1Par41: 1 })]);
    expect(result.classes[0].relevantGrade1Pupils).toBe(14);
    expect(result.totalPha1r).toBe(0);
  });

  it("8. 16 prvňáků, 1 podle § 38 => relevantních 15 => 20", () => {
    const result = total([row(1, 16, { grade1Par38: 1 })]);
    expect(result.classes[0].relevantGrade1Pupils).toBe(15);
    expect(result.totalPha1r).toBe(20);
  });

  it("9. 16 prvňáků, 1 § 38 a 1 § 41 => relevantních 14 => 0", () => {
    const result = total([row(1, 16, { grade1Par38: 1, grade1Par41: 1 })]);
    expect(result.classes[0].relevantGrade1Pupils).toBe(14);
    expect(result.totalPha1r).toBe(0);
  });

  it("10. třída § 16/9 s 15+ prvňáky nepřispívá", () => {
    const result = total([row(1, 20, { establishedSec16_9: true })]);
    expect(result.totalPha1r).toBe(0);
    expect(result.classes[0].eligible).toBe(false);
    expect(result.schoolExcluded).toBe(false);
  });

  it("11. běžná třída 15 vedle třídy § 16/9 s 15 => 20", () => {
    const result = total([
      row(1, 15),
      row(2, 15, { establishedSec16_9: true }),
    ]);
    expect(result.totalPha1r).toBe(20);
    expect(result.eligibleClassCount).toBe(1);
  });

  it("12. škola zřízená podle § 16 odst. 9 => 0", () => {
    const result = total([row(1, 20)], { ...openSchool, schoolEstablishedSec16_9: true });
    expect(result.totalPha1r).toBe(0);
    expect(result.schoolExcluded).toBe(true);
    expect(result.exclusionReasons).toEqual(["schoolEstablishedSec16_9"]);
  });

  it("13. škola při ústavní nebo ochranné výchově => 0", () => {
    const result = total([row(1, 20)], {
      ...openSchool,
      schoolAtInstitutionalOrProtectiveCare: true,
    });
    expect(result.totalPha1r).toBe(0);
    expect(result.exclusionReasons).toEqual(["schoolAtInstitutionalOrProtectiveCare"]);
  });

  it("14. škola při zdravotnickém zařízení => 0", () => {
    const result = total([row(1, 20)], { ...openSchool, schoolAtHealthcareFacility: true });
    expect(result.totalPha1r).toBe(0);
    expect(result.exclusionReasons).toEqual(["schoolAtHealthcareFacility"]);
  });

  it("15. PHA1Rmax zůstává oddělené od PHAmax", () => {
    const totalPha = 48;
    const result = total([row(1, 15)]);
    expect(result.totalPha1r).toBe(20);
    expect(totalPha).toBe(48);
    expect(result).not.toHaveProperty("totalPha");
  });

  it("16. prázdné třídy => 0", () => {
    const result = total([]);
    expect(result.totalPha1r).toBe(0);
    expect(result.eligibleClassCount).toBe(0);
    expect(result.schoolExcluded).toBe(false);
  });

  it("19. práh po odečtu 17 − 1 − 1 => relevantních 15 => 20", () => {
    const result = total([row(1, 17, { grade1Par38: 1, grade1Par41: 1 })]);
    expect(result.classes[0].relevantGrade1Pupils).toBe(15);
    expect(result.totalPha1r).toBe(20);
  });

  it("více školních důvodů je v pevném pořadí a třídy mají 0 hodin", () => {
    const result = total([row(1, 16)], {
      schoolEstablishedSec16_9: true,
      schoolAtInstitutionalOrProtectiveCare: true,
      schoolAtHealthcareFacility: true,
    });
    expect(result.exclusionReasons).toEqual([
      "schoolEstablishedSec16_9",
      "schoolAtInstitutionalOrProtectiveCare",
      "schoolAtHealthcareFacility",
    ]);
    expect(result.classes[0].hours).toBe(0);
    expect(result.eligibleClassCount).toBe(0);
  });
});

describe("PHA1Rmax validace", () => {
  it("17. součet § 38 a § 41 nad počtem prvňáků => relevant 0 a nekonzistence", () => {
    const classes = [row(1, 10, { grade1Par38: 6, grade1Par41: 6 })];
    const result = total(classes);
    expect(result.classes[0].relevantGrade1Pupils).toBe(0);
    expect(result.totalPha1r).toBe(0);
    const issues = validateZsPha1rClasses(classes);
    expect(issues.some((issue) => issue.code === "par_sum_exceeds_grade1")).toBe(true);
    expect(issues.every((issue) => issue.section === "pha1r")).toBe(true);
  });

  it("18. záporné vstupy nedají kladný ani záporný PHA1Rmax a validace je zachytí", () => {
    const negativePupils = [row(1, -5)];
    expect(total(negativePupils).totalPha1r).toBe(0);

    const inflated = [row(1, 20, { grade1Par38: -1 })];
    expect(total(inflated).totalPha1r).toBe(0);
    expect(total(inflated).classes[0].hours).toBe(0);

    const issues = validateZsPha1rClasses([
      row(1, -2),
      row(2, 10, { grade1Par38: -1 }),
      row(3, 10, { grade1Par41: -3 }),
    ]);
    expect(issues.map((issue) => issue.code)).toEqual([
      "negative_grade1_pupils",
      "negative_par38",
      "negative_par41",
    ]);
  });
});
