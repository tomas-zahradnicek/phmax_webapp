import { describe, expect, it } from "vitest";

import { PHMAX_MODULE_AUTOSAVE_LS_KEYS } from "../phmax-school-scenario-export";
import { ZS_AUTOSAVE_STORAGE_KEY } from "../zs/zs-form-snapshot";
import {
  SECTION_03_MANUAL_FIELD_LABELS,
  getAnnualReportCalculatorData,
  getSection03Readiness,
  isAnnualReportSection03Family,
} from "./vyrocni-zprava-calculator-data-bridge";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

const MINIMAL_ZS_SNAPSHOT = {
  basicType: "full_more_than_2",
  basic1Classes: 10,
  basic1Pupils: 250,
  basic2Classes: 8,
  basic2Pupils: 225,
};

describe("vyrocni-zprava-calculator-data-bridge", () => {
  it("bez dat kalkulaček vrátí chybějící personální údaje", () => {
    const mem = new MemoryStorage();
    const data = getAnnualReportCalculatorData(mem);

    expect(data.personnel.available).toBe(false);
    expect(data.personnel.sources).toEqual([]);
    expect(data.personnel.values).toEqual({});
    expect(data.personnel.missing).toEqual(
      expect.arrayContaining([...SECTION_03_MANUAL_FIELD_LABELS]),
    );

    const readiness = getSection03Readiness({}, mem);
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.availableData).toEqual([]);
    expect(readiness.missingData).toEqual(expect.arrayContaining([...SECTION_03_MANUAL_FIELD_LABELS]));
  });

  it("částečná data PV a ZŠ vypíše dostupné kapacity a ponechá chybějící pole", () => {
    const mem = new MemoryStorage();
    mem.setItem(
      PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv,
      JSON.stringify({
        rows: [{ provoz: "celodenni", classCount: 4, avgHours: 8, sec16Count: 0, languageGroups: 0 }],
      }),
    );
    mem.setItem(
      ZS_AUTOSAVE_STORAGE_KEY,
      JSON.stringify({
        ...MINIMAL_ZS_SNAPSHOT,
        _phmaxAuditTotals: { totalPhmax: 500, totalPha: 12, totalPhp: 8, tab: "phmax" },
      }),
    );

    const data = getAnnualReportCalculatorData(mem);
    expect(data.personnel.available).toBe(true);
    expect(data.personnel.sources).toEqual(
      expect.arrayContaining([
        "Kalkulačka pro předškolní vzdělávání",
        "Kalkulačka pro základní školy",
      ]),
    );
    expect(data.personnel.values.phmax).toBeGreaterThan(0);
    expect(data.personnel.values.phamax).toBe(12);
    expect(data.personnel.values.phpmax).toBe(8);
    expect(data.personnel.values.teachersFte).toBeUndefined();

    for (const label of SECTION_03_MANUAL_FIELD_LABELS) {
      expect(data.personnel.missing).toContain(label);
    }

    const readiness = getSection03Readiness({ calculatorData: data }, mem);
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.availableData.some((line) => line.includes("PHmax"))).toBe(true);
    expect(readiness.missingData.length).toBeGreaterThan(0);
  });

  it("nevymýšlí PHPmax bez auditních součtů ZŠ", () => {
    const mem = new MemoryStorage();
    mem.setItem(ZS_AUTOSAVE_STORAGE_KEY, JSON.stringify(MINIMAL_ZS_SNAPSHOT));

    const data = getAnnualReportCalculatorData(mem);
    expect(data.personnel.values.phpmax).toBeUndefined();
    expect(data.personnel.values.phamax).toBeUndefined();
    expect(data.personnel.missing).toContain("PHPmax (z modulu ZŠ)");
    expect(data.personnel.missing).toContain("PHAmax (z modulů PV, ŠD, ZŠ, SŠ)");
  });

  it("nevymýšlí úvazky ani počty osob", () => {
    const mem = new MemoryStorage();
    mem.setItem(
      PHMAX_MODULE_AUTOSAVE_LS_KEYS.sd,
      JSON.stringify({
        pupils: 120,
        manualDepts: false,
        departments: 4,
        inputMode: "summary",
        regularExceptionGranted: false,
        specialExceptionGranted: false,
        schoolFirstStageClassCount: null,
        summarySpecialDepartments: [],
        detailDepartments: [],
      }),
    );

    const data = getAnnualReportCalculatorData(mem);
    expect(data.personnel.values.educatorsFte).toBeUndefined();
    expect(data.personnel.values.teachersFte).toBeUndefined();
    expect(data.personnel.values.nonTeachingStaffFte).toBeUndefined();
  });

  it("rozpozná rodinu kapitol 03", () => {
    expect(isAnnualReportSection03Family("03")).toBe(true);
    expect(isAnnualReportSection03Family("3.1")).toBe(true);
    expect(isAnnualReportSection03Family("3.4")).toBe(true);
    expect(isAnnualReportSection03Family("02")).toBe(false);
    expect(isAnnualReportSection03Family("04")).toBe(false);
  });
});
