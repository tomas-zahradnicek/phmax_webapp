import { describe, expect, it } from "vitest";

import { PHMAX_MODULE_AUTOSAVE_LS_KEYS } from "../phmax-school-scenario-export";
import { ZS_AUTOSAVE_STORAGE_KEY } from "../zs/zs-form-snapshot";
import {
  getAnnualReportCalculatorData,
  getSection03Readiness,
} from "./vyrocni-zprava-calculator-data-bridge";
import {
  calculateAgeGenderTotals,
  calculatePersonnelStaffTotals,
  calculateQualificationTotals,
  createDefaultPersonnelData,
  detectMissingPersonnelFields,
  isPersonnelDataComplete,
} from "./vyrocni-zprava-personnel-logic";
import {
  clearPersonnelDataStorage,
  loadPersonnelDataFromStorage,
  savePersonnelDataToStorage,
} from "./vyrocni-zprava-personnel-storage";
import type { AnnualReportPersonnelData } from "./vyrocni-zprava-personnel-types";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

function createCompletePersonnelData(): AnnualReportPersonnelData {
  return {
    staffCounts: {
      teachersPersons: 20,
      teachersFte: 18.5,
      educatorsPersons: 4,
      educatorsFte: 4,
      specialPedagoguesPersons: 2,
      specialPedagoguesFte: 2,
      teachingAssistantsPersons: 3,
      teachingAssistantsFte: 2.5,
      nonTeachingStaffPersons: 6,
      nonTeachingStaffFte: 5.5,
    },
    ageAndGender: {
      under35: { men: 5, women: 7 },
      age36to45: { men: 4, women: 5 },
      age46to55: { men: 3, women: 3 },
      over55: { men: 1, women: 1 },
      retirementAge: { men: 0, women: 0 },
    },
    educationAndGender: {
      belowMaturita: { men: 0, women: 1 },
      maturita: { men: 3, women: 4 },
      higherVocational: { men: 2, women: 3 },
      university: { men: 8, women: 8 },
    },
    qualification: {
      primaryTeachers: { qualified: 8, notQualified: 1 },
      lowerSecondaryTeachers: { qualified: 10, notQualified: 1 },
      educators: { qualified: 3, notQualified: 1 },
      teachingAssistants: { qualified: 2, notQualified: 1 },
      specialPedagogues: { qualified: 2, notQualified: 0 },
    },
    notes: "Test",
  };
}

describe("vyrocni-zprava-personnel-logic", () => {
  it("prázdná data mají všechna povinná pole mezi chybějícími", () => {
    const missing = detectMissingPersonnelFields(createDefaultPersonnelData());
    expect(missing.length).toBeGreaterThan(20);
    expect(isPersonnelDataComplete(createDefaultPersonnelData())).toBe(false);
  });

  it("částečně vyplněná data ponechávají chybějící pole explicitní", () => {
    const partial = createDefaultPersonnelData();
    partial.staffCounts.teachersPersons = 10;
    partial.staffCounts.teachersFte = 9;

    const missing = detectMissingPersonnelFields(partial);
    expect(missing).toContain("Vychovatelé – fyzické osoby");
    expect(missing).not.toContain("Učitelé – fyzické osoby");
    expect(isPersonnelDataComplete(partial)).toBe(false);
  });

  it("počítá součty tabulek správně", () => {
    const data = createCompletePersonnelData();
    const staff = calculatePersonnelStaffTotals(data);
    expect(staff.totalPersons).toBe(35);
    expect(staff.totalPedagogicalPersons).toBe(29);
    expect(staff.totalFte).toBe(32.5);

    const age = calculateAgeGenderTotals(data);
    expect(age.grandTotal).toBe(29);
    expect(age.totalMen).toBe(13);
    expect(age.totalWomen).toBe(16);

    const qual = calculateQualificationTotals(data);
    expect(qual.grandTotal).toBe(29);
  });

  it("plně vyplněná konzistentní data jsou kompletní", () => {
    const data = createCompletePersonnelData();
    expect(detectMissingPersonnelFields(data)).toEqual([]);
    expect(isPersonnelDataComplete(data)).toBe(true);
  });
});

describe("vyrocni-zprava-personnel-storage", () => {
  it("ukládá a načítá data z localStorage", () => {
    const mem = new MemoryStorage();
    const data = createCompletePersonnelData();
    savePersonnelDataToStorage(data, mem, "1. 1. 2026 10:00");
    const loaded = loadPersonnelDataFromStorage(mem);
    expect(loaded.data.staffCounts.teachersPersons).toBe(20);
    expect(loaded.savedAt).toBe("1. 1. 2026 10:00");
    clearPersonnelDataStorage(mem);
    expect(loadPersonnelDataFromStorage(mem).savedAt).toBeNull();
  });
});

describe("section 03 readiness with personnel data", () => {
  it("prázdná personální data neumožní připravenost kapitoly 03", () => {
    const readiness = getSection03Readiness({ personnelData: createDefaultPersonnelData() });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData.length).toBeGreaterThan(0);
  });

  it("plně vyplněná personální data mohou označit kapitolu 03 jako připravenou", () => {
    const readiness = getSection03Readiness({ personnelData: createCompletePersonnelData() });
    expect(readiness.status).toBe("PRIPRAVENO");
    expect(readiness.missingData).toEqual([]);
  });

  it("data z kalkulaček sama o sobě kapitolu 03 nepřipraví", () => {
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
        basicType: "full_more_than_2",
        basic1Classes: 10,
        basic1Pupils: 250,
        basic2Classes: 8,
        basic2Pupils: 225,
        _phmaxAuditTotals: { totalPhmax: 500, totalPha: 12, totalPhp: 8, tab: "phmax" },
      }),
    );

    const calculatorData = getAnnualReportCalculatorData(mem);
    const readiness = getSection03Readiness(
      { calculatorData, personnelData: createDefaultPersonnelData() },
      mem,
    );

    expect(calculatorData.personnel.available).toBe(true);
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.availableData.some((line) => line.includes("PHmax"))).toBe(true);
  });
});
