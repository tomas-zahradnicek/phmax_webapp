import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { applyGeneratedDraft, saveGeneratedTextEdits } from "./vyrocni-zprava-generated-text-logic";
import { computeSectionStatus, createSectionFromDefinition } from "./vyrocni-zprava-logic";
import { ANNUAL_REPORT_SECTION_DEFINITIONS } from "./vyrocni-zprava-section-definitions";
import {
  createDefaultSection04Data,
  getSection04Readiness,
} from "./vyrocni-zprava-section04-data-logic";
import { buildSection04GeneratorInput } from "./vyrocni-zprava-section04-generator-input";
import {
  SECTION04_INCOMPLETE_DRAFT_PREFIX,
  generateSection04Draft,
  isSection04IncompleteDraft,
} from "./vyrocni-zprava-section04-local-generator";
import { shouldUseSection04Generator } from "./vyrocni-zprava-section04-generator-service";
import { shouldUseSection01Generator } from "./vyrocni-zprava-section01-generator-service";
import { shouldUseSection02Generator } from "./vyrocni-zprava-section02-generator-service";
import { shouldUseSection03Generator } from "./vyrocni-zprava-section03-generator-service";
import { buildSection03GeneratorInput } from "./vyrocni-zprava-section03-generator-input";
import { generateSection03Draft, SECTION03_INCOMPLETE_DRAFT_PREFIX } from "./vyrocni-zprava-section03-local-generator";
import { createDefaultPersonnelData } from "./vyrocni-zprava-personnel-logic";
import { getAnnualReportCalculatorData } from "./vyrocni-zprava-calculator-data-bridge";

function createSection04ReadyProfile() {
  return {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Ukázková",
    schoolType: "Základní škola",
  };
}

function createCompleteRequiredSection04Data() {
  return {
    firstGradeAdmissionCurrentYear: {
      firstTimeTotal: 40,
      firstTimeGirls: 18,
      afterDeferralTotal: 6,
      afterDeferralGirls: 3,
      enrolledTotal: 38,
      enrolledGirls: 17,
      deferralRequestsTotal: 5,
      deferralRequestsGirls: 2,
    },
    pupilsAdmittedDuringYear: [],
    pupilsLeftDuringYear: [],
    firstGradeEnrollmentNextYear: {
      firstTimeTotal: 43,
      firstTimeGirls: 21,
      afterDeferralTotal: 5,
      afterDeferralGirls: 2,
      enrolledTotal: 41,
      enrolledGirls: 20,
      deferralRequestsTotal: 4,
      deferralRequestsGirls: 2,
    },
    specialEnrollment: {},
    secondarySchoolAdmissions: [],
    pupilCountsSeptember: [
      { className: "1.A", boys: 10, girls: 12, total: 22, classTeacher: "Mgr. Alena Vzorová" },
    ],
    pupilCountsJune: [
      { className: "1.A", boys: 9, girls: 12, total: 21, classTeacher: "Mgr. Alena Vzorová" },
    ],
    notes: "",
  };
}

describe("vyrocni-zprava-section04-generator", () => {
  const profile = createSection04ReadyProfile();

  it("prázdná sekce 04 vrací CHYBI_UDAJE", () => {
    const readiness = getSection04Readiness({
      schoolProfile: profile,
      section04Data: createDefaultSection04Data(),
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData.length).toBeGreaterThan(0);
  });

  it("chybějící tabulky počtů žáků blokují readiness", () => {
    const readiness = getSection04Readiness({
      schoolProfile: profile,
      section04Data: {
        ...createCompleteRequiredSection04Data(),
        pupilCountsSeptember: [],
        pupilCountsJune: [],
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("4.7 Počty žáků k 1. září – alespoň jedna třída");
    expect(readiness.missingData).toContain("4.7 Počty žáků k 30. červnu – alespoň jedna třída");
  });

  it("varování při nesouladu chlapci + děvčata vs celkem fungují", () => {
    const readiness = getSection04Readiness({
      schoolProfile: profile,
      section04Data: {
        ...createCompleteRequiredSection04Data(),
        pupilCountsSeptember: [{ className: "2.B", boys: 8, girls: 10, total: 15, classTeacher: "Mgr. Eva Test" }],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("součet chlapců a děvčat"))).toBe(true);
  });

  it("kompletní povinná data znamenají PRIPRAVENO", () => {
    const readiness = getSection04Readiness({
      schoolProfile: profile,
      section04Data: createCompleteRequiredSection04Data(),
    });
    expect(readiness.status).toBe("PRIPRAVENO");
    expect(readiness.missingData).toEqual([]);
  });

  it("generátor nevymýšlí chybějící hodnoty", () => {
    const input = buildSection04GeneratorInput({
      schoolProfile: profile,
      schoolYear: "2024/2025",
      section04Data: {
        ...createCompleteRequiredSection04Data(),
        pupilsAdmittedDuringYear: [{ grade: "3. ročník" }],
      },
    });

    expect(input.pupilsAdmittedDuringYear[0]?.count).toBeUndefined();

    const result = generateSection04Draft(input);
    expect(result.ready).toBe(true);
    expect(result.text).toContain("- 3. ročník: — žáků");
  });

  it("kompletní data vygenerují kapitolu 04 se sekcemi 4.1–4.7", () => {
    const result = generateSection04Draft(
      buildSection04GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section04Data: {
          ...createCompleteRequiredSection04Data(),
          pupilsAdmittedDuringYear: [{ grade: "2. ročník", count: 1 }],
          pupilsLeftDuringYear: [{ grade: "5. ročník", count: 2 }],
        },
      }),
    );

    expect(result.ready).toBe(true);
    expect(result.text).toContain(
      "04 Údaje o přijímacím řízení nebo o zápisu k povinné školní docházce a následném přijetí do školy",
    );
    expect(result.text).toContain("4.1 Žáci přijatí do 1. ročníku základní školy pro tento školní rok");
    expect(result.text).toContain("4.2 Žáci přijati v průběhu školního roku");
    expect(result.text).toContain("4.3 Žáci v průběhu školního roku odhlášeni");
    expect(result.text).toContain("4.4 Zápis pro následující školní rok");
    expect(result.text).toContain("4.5 Zvláštní zápis");
    expect(result.text).toContain("4.6 Žáci přijati ke vzdělávání do střední školy");
    expect(result.text).toContain("4.7 Počty žáků");
    expect(result.text).toContain("Třída | Chlapců | Dívek | Celkem | Třídní učitel");
    expect(result.text).not.toContain("Děvčata");
  });

  it("počty žáků používají správné české tvary", () => {
    const result = generateSection04Draft(
      buildSection04GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section04Data: {
          ...createCompleteRequiredSection04Data(),
          pupilsAdmittedDuringYear: [{ grade: "2. ročník", count: 1 }],
          pupilsLeftDuringYear: [{ grade: "5. ročník", count: 2 }],
          secondarySchoolAdmissions: [{ schoolType: "Gymnázium", count: 4 }],
        },
      }),
    );
    expect(result.text).toContain("2. ročník: 1 žák");
    expect(result.text).toContain("5. ročník: 2 žáci");
    expect(result.text).toContain("Gymnázium: 4 žáci");
    expect(result.text).not.toContain("1 žáků");
  });

  it("neúplný návrh kapitoly 04 ponechá stav CHYBI_UDAJE", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "04");
    expect(sectionDef).toBeDefined();
    const section = createSectionFromDefinition(sectionDef!);
    const incompleteSection = {
      ...section,
      generatedText: `${SECTION04_INCOMPLETE_DRAFT_PREFIX}\n- test`,
    };
    expect(isSection04IncompleteDraft(incompleteSection.generatedText)).toBe(true);
    expect(computeSectionStatus(incompleteSection, profile)).toBe("CHYBI_UDAJE");
  });

  it("generated text workflow funguje i pro kapitolu 04", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "04");
    expect(sectionDef).toBeDefined();

    const draft = generateSection04Draft(
      buildSection04GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section04Data: createCompleteRequiredSection04Data(),
      }),
    );
    const generated = applyGeneratedDraft(createSectionFromDefinition(sectionDef!), draft.text);
    expect(generated.originalGeneratedText).toBe(draft.text);
    expect(generated.generatedText).toBe(draft.text);
    expect(computeSectionStatus(generated, profile)).toBe("VYGENEROVANO");

    const edited = saveGeneratedTextEdits(generated, "Upravená kapitola 04.");
    expect(edited.editedByUser).toBe(true);
    expect(computeSectionStatus(edited, profile)).toBe("UPRAVENO_UZIVATELEM");
  });

  it("sekce 01, 02 a 03 zůstávají beze změny", () => {
    expect(shouldUseSection01Generator("01")).toBe(true);
    expect(shouldUseSection02Generator("02")).toBe(true);
    expect(shouldUseSection03Generator("03")).toBe(true);
    expect(shouldUseSection04Generator("04")).toBe(true);

    const section03Draft = generateSection03Draft(
      buildSection03GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        personnelData: createDefaultPersonnelData(),
        calculatorData: getAnnualReportCalculatorData(),
      }),
    );
    expect(section03Draft.ready).toBe(false);
    expect(section03Draft.text.startsWith(SECTION03_INCOMPLETE_DRAFT_PREFIX)).toBe(true);
  });
});
