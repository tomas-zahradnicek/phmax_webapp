import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { PHMAX_MODULE_AUTOSAVE_LS_KEYS } from "../phmax-school-scenario-export";
import { getAnnualReportCalculatorData } from "./vyrocni-zprava-calculator-data-bridge";
import { computeSectionStatus, createSectionFromDefinition } from "./vyrocni-zprava-logic";
import { ANNUAL_REPORT_SECTION_DEFINITIONS } from "./vyrocni-zprava-section-definitions";
import { createDefaultPersonnelData } from "./vyrocni-zprava-personnel-logic";
import type { AnnualReportPersonnelData } from "./vyrocni-zprava-personnel-types";
import { buildSection03GeneratorInput } from "./vyrocni-zprava-section03-generator-input";
import {
  SECTION03_CALCULATOR_SUPPORT_PARAGRAPH,
  SECTION03_INCOMPLETE_DRAFT_PREFIX,
  generateSection03Draft,
  isSection03IncompleteDraft,
} from "./vyrocni-zprava-section03-local-generator";
import { shouldUseSection03Generator } from "./vyrocni-zprava-section03-generator-service";
import { VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER } from "./vyrocni-zprava-types";

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
  };
}

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("vyrocni-zprava-section03-generator", () => {
  const schoolProfile = {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Ukázková",
    municipality: "Praha",
    schoolType: "Základní škola",
  };

  it("buildSection03GeneratorInput nevymýšlí chybějící hodnoty", () => {
    const input = buildSection03GeneratorInput({
      schoolProfile,
      schoolYear: "2024/2025",
      personnelData: createDefaultPersonnelData(),
      calculatorData: getAnnualReportCalculatorData(new MemoryStorage()),
    });

    expect(input.staffCounts.teachersPersons).toBeUndefined();
    expect(input.staffCounts.totalPersons).toBe(0);
    expect(input.readiness).toBe("CHYBI_UDAJE");
    expect(input.missingData.length).toBeGreaterThan(0);
    expect(input.schoolIdentification.name).toBe("ZŠ Ukázková");
  });

  it("neúplná personální data vrátí chybovou zprávu místo kapitoly", () => {
    const input = buildSection03GeneratorInput({
      schoolProfile,
      schoolYear: "2024/2025",
      personnelData: createDefaultPersonnelData(),
      calculatorData: getAnnualReportCalculatorData(new MemoryStorage()),
    });

    const result = generateSection03Draft(input);
    expect(result.ready).toBe(false);
    expect(result.text.startsWith(SECTION03_INCOMPLETE_DRAFT_PREFIX)).toBe(true);
    expect(result.text).toContain("Učitelé – fyzické osoby");
    expect(result.text).not.toContain("3.1 Základní údaje o pracovnících školy");
  });

  it("úplná personální data vygenerují strukturovanou českou kapitolu", () => {
    const input = buildSection03GeneratorInput({
      schoolProfile,
      schoolYear: "2024/2025",
      personnelData: createCompletePersonnelData(),
      calculatorData: getAnnualReportCalculatorData(new MemoryStorage()),
    });

    const result = generateSection03Draft(input);
    expect(result.ready).toBe(true);
    expect(result.text).toContain("03 Rámcový popis personálního zabezpečení činnosti školy");
    expect(result.text).toContain("3.1 Základní údaje o pracovnících školy");
    expect(result.text).toContain("3.2 Členění pedagogických zaměstnanců podle věku a pohlaví");
    expect(result.text).toContain("3.3 Členění pedagogických zaměstnanců podle vzdělání a pohlaví");
    expect(result.text).toContain("3.4 Členění pedagogických pracovníků podle odborné kvalifikace");
    expect(result.text).toContain("Ve školním roce 2024/2025 v ZŠ Ukázková");
    expect(result.text).toContain("Celkem pracovníci školy: 35 fyzických osob");
  });

  it("údaje z kalkulaček jsou uvedeny jen jako podpůrné informace", () => {
    const mem = new MemoryStorage();
    mem.setItem(
      PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv,
      JSON.stringify({
        rows: [{ provoz: "celodenni", classCount: 4, avgHours: 8, sec16Count: 0, languageGroups: 0 }],
      }),
    );

    const withoutCalculator = generateSection03Draft(
      buildSection03GeneratorInput({
        schoolProfile,
        schoolYear: "2024/2025",
        personnelData: createCompletePersonnelData(),
        calculatorData: getAnnualReportCalculatorData(new MemoryStorage()),
      }),
    );
    expect(withoutCalculator.text).not.toContain(SECTION03_CALCULATOR_SUPPORT_PARAGRAPH);

    const withCalculator = generateSection03Draft(
      buildSection03GeneratorInput({
        schoolProfile,
        schoolYear: "2024/2025",
        personnelData: createCompletePersonnelData(),
        calculatorData: getAnnualReportCalculatorData(mem),
      }),
    );
    expect(withCalculator.text).toContain(SECTION03_CALCULATOR_SUPPORT_PARAGRAPH);
    expect(withCalculator.text).toContain("PHmax");
  });

  it("neúplný návrh kapitoly 03 ponechá stav CHYBI_UDAJE", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "03");
    expect(sectionDef).toBeDefined();
    const section = createSectionFromDefinition(sectionDef!);
    const incompleteSection = {
      ...section,
      generatedText: `${SECTION03_INCOMPLETE_DRAFT_PREFIX}\n- test`,
    };
    expect(isSection03IncompleteDraft(incompleteSection.generatedText)).toBe(true);
    expect(computeSectionStatus(incompleteSection, schoolProfile)).toBe("CHYBI_UDAJE");
  });

  it("generování mimo kapitolu 03 zůstává beze změny", () => {
    expect(shouldUseSection03Generator("03")).toBe(true);
    expect(shouldUseSection03Generator("3.2")).toBe(true);
    expect(shouldUseSection03Generator("05")).toBe(false);
    expect(VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER).toContain("AI asistenta");
  });
});
