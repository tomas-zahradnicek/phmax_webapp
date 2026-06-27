import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { applyGeneratedDraft, saveGeneratedTextEdits } from "./vyrocni-zprava-generated-text-logic";
import { computeSectionStatus, createSectionFromDefinition } from "./vyrocni-zprava-logic";
import { ANNUAL_REPORT_SECTION_DEFINITIONS } from "./vyrocni-zprava-section-definitions";
import {
  createDefaultSection06Data,
  getSection06Readiness,
} from "./vyrocni-zprava-section06-data-logic";
import { buildSection06GeneratorInput } from "./vyrocni-zprava-section06-generator-input";
import {
  SECTION06_INCOMPLETE_DRAFT_PREFIX,
  generateSection06Draft,
  isSection06IncompleteDraft,
} from "./vyrocni-zprava-section06-local-generator";
import { shouldUseSection06Generator } from "./vyrocni-zprava-section06-generator-service";
import { shouldUseSection01Generator } from "./vyrocni-zprava-section01-generator-service";
import { shouldUseSection02Generator } from "./vyrocni-zprava-section02-generator-service";
import { shouldUseSection03Generator } from "./vyrocni-zprava-section03-generator-service";
import { shouldUseSection04Generator } from "./vyrocni-zprava-section04-generator-service";
import { shouldUseSection05Generator } from "./vyrocni-zprava-section05-generator-service";
import { parseCzechNumberInput } from "./vyrocni-zprava-number-input-helpers";

function createSection06ReadyProfile() {
  return {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Ukázková",
    schoolType: "Základní škola",
  };
}

function createCompleteSection06Data() {
  return {
    firstTermClassResults: [
      {
        className: "1.A",
        pupilsTotal: 22,
        classTeacher: "Mgr. A. Nováková",
        passedWithHonours: 8,
        passed: 13,
        failed: 1,
        notAssessed: 0,
        reducedConductGrade: 0,
        averageGrade: 1.8,
        excusedAbsencePerPupil: 18.5,
        unexcusedAbsencePerPupil: 0,
      },
    ],
    secondTermClassResults: [
      {
        className: "1.A",
        pupilsTotal: 21,
        classTeacher: "Mgr. A. Nováková",
        passedWithHonours: 9,
        passed: 12,
        failed: 0,
        notAssessed: 0,
        reducedConductGrade: 0,
        averageGrade: 1.7,
        excusedAbsencePerPupil: 16.4,
        unexcusedAbsencePerPupil: 0,
      },
    ],
    educationalMeasures: {
      firstTerm: {
        classTeacherPraise: 5,
        principalPraise: 1,
      },
      secondTerm: {
        classTeacherWarning: 1,
      },
    },
    finalExams: {},
    maturitaExams: {},
    absolutorium: {},
    summaryEvaluation:
      "Výsledky vzdělávání byly průběžně sledovány podle cílů vzdělávacích programů a vyhodnoceny na základě klasifikace, docházky a výchovných opatření.",
    notes: "",
  };
}

describe("vyrocni-zprava-section06-generator", () => {
  const profile = createSection06ReadyProfile();

  it("prázdná sekce 06 vrací CHYBI_UDAJE", () => {
    const readiness = getSection06Readiness({
      schoolProfile: profile,
      section06Data: createDefaultSection06Data(),
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData.length).toBeGreaterThan(0);
  });

  it("chybějící výsledky 1. pololetí blokují readiness", () => {
    const readiness = getSection06Readiness({
      schoolProfile: profile,
      section06Data: {
        ...createCompleteSection06Data(),
        firstTermClassResults: [],
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Alespoň jedna třída v 1. pololetí (třída + počet žáků)");
  });

  it("chybějící výsledky 2. pololetí blokují readiness", () => {
    const readiness = getSection06Readiness({
      schoolProfile: profile,
      section06Data: {
        ...createCompleteSection06Data(),
        secondTermClassResults: [],
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Alespoň jedna třída v 2. pololetí (třída + počet žáků)");
  });

  it("chybějící souhrnné vyhodnocení blokuje readiness", () => {
    const readiness = getSection06Readiness({
      schoolProfile: profile,
      section06Data: {
        ...createCompleteSection06Data(),
        summaryEvaluation: "",
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Souhrnné vyhodnocení výsledků vzdělávání");
  });

  it("varování pro nesoulad součtů hodnocení funguje", () => {
    const readiness = getSection06Readiness({
      schoolProfile: profile,
      section06Data: {
        ...createCompleteSection06Data(),
        firstTermClassResults: [
          {
            className: "2.B",
            pupilsTotal: 20,
            passedWithHonours: 3,
            passed: 10,
            failed: 2,
            notAssessed: 1,
          },
        ],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("součet výsledků"))).toBe(true);
  });

  it("varování pro záporné hodnoty funguje", () => {
    const readiness = getSection06Readiness({
      schoolProfile: profile,
      section06Data: {
        ...createCompleteSection06Data(),
        secondTermClassResults: [
          {
            className: "3.C",
            pupilsTotal: -1,
          },
        ],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("záporn"))).toBe(true);
  });

  it("kompletní data znamenají PRIPRAVENO", () => {
    const readiness = getSection06Readiness({
      schoolProfile: profile,
      section06Data: createCompleteSection06Data(),
    });
    expect(readiness.status).toBe("PRIPRAVENO");
    expect(readiness.missingData).toEqual([]);
  });

  it("generátor nevymýšlí výsledky", () => {
    const input = buildSection06GeneratorInput({
      schoolProfile: profile,
      schoolYear: "2024/2025",
      section06Data: {
        ...createCompleteSection06Data(),
        firstTermClassResults: [{ className: "4.A", pupilsTotal: 23 }],
      },
    });
    const result = generateSection06Draft(input);
    expect(result.ready).toBe(true);
    expect(result.text).toContain("4.A | 23 | — | — | — | — | —");
  });

  it("kompletní data vygenerují kapitolu 06 se sekcemi 6.1–6.3", () => {
    const result = generateSection06Draft(
      buildSection06GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section06Data: createCompleteSection06Data(),
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain(
      "06 Údaje o výsledcích vzdělávání žáků podle cílů stanovených vzdělávacími programy a podle poskytovaného stupně vzdělání",
    );
    expect(result.text).toContain("6.1 Souhrnná statistika tříd 1. pololetí školního roku");
    expect(result.text).toContain("6.2 Souhrnná statistika tříd 2. pololetí školního roku");
    expect(result.text).toContain("6.3 Výchovná opatření");
  });

  it("volitelné zkoušky přidají sekci 6.4", () => {
    const result = generateSection06Draft(
      buildSection06GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section06Data: {
          ...createCompleteSection06Data(),
          finalExams: {
            description: "Závěrečné zkoušky oboru.",
            pupilsTotal: 10,
            passed: 9,
            failed: 1,
          },
        },
      }),
    );
    expect(result.text).toContain("6.4 Výsledky závěrečných zkoušek, maturitních zkoušek a absolutorií");
  });

  it("prázdné volitelné zkoušky nevytvoří sekci 6.4", () => {
    const result = generateSection06Draft(
      buildSection06GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section06Data: {
          ...createCompleteSection06Data(),
          finalExams: {},
          maturitaExams: {},
          absolutorium: {},
        },
      }),
    );
    expect(result.text).not.toContain("6.4 Výsledky závěrečných zkoušek, maturitních zkoušek a absolutorií");
  });

  it("nulové hodnoty volitelných zkoušek nevytvoří sekci 6.4", () => {
    const result = generateSection06Draft(
      buildSection06GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section06Data: {
          ...createCompleteSection06Data(),
          finalExams: { pupilsTotal: 0, passed: 0, failed: 0 },
          maturitaExams: { pupilsTotal: 0, passed: 0, failed: 0 },
          absolutorium: { pupilsTotal: 0, passed: 0, failed: 0 },
        },
      }),
    );
    expect(result.text).not.toContain("6.4 Výsledky závěrečných zkoušek, maturitních zkoušek a absolutorií");
  });

  it("popis zkoušky vytvoří sekci 6.4 i bez počtů", () => {
    const result = generateSection06Draft(
      buildSection06GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section06Data: {
          ...createCompleteSection06Data(),
          maturitaExams: { description: "Maturitní zkoušky proběhly dle harmonogramu." },
        },
      }),
    );
    expect(result.text).toContain("6.4 Výsledky závěrečných zkoušek, maturitních zkoušek a absolutorií");
  });

  it("nenulový počet žáků vytvoří sekci 6.4", () => {
    const result = generateSection06Draft(
      buildSection06GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section06Data: {
          ...createCompleteSection06Data(),
          absolutorium: { pupilsTotal: 2, passed: 2, failed: 0 },
        },
      }),
    );
    expect(result.text).toContain("6.4 Výsledky závěrečných zkoušek, maturitních zkoušek a absolutorií");
  });

  it("průměrný prospěch 1,18 zůstane v rozsahu bez warningu", () => {
    const data = createCompleteSection06Data();
    const readiness = getSection06Readiness({
      schoolProfile: profile,
      section06Data: {
        ...data,
        firstTermClassResults: [{ ...data.firstTermClassResults[0], averageGrade: parseCzechNumberInput("1,18") }],
        secondTermClassResults: [{ ...data.secondTermClassResults[0], averageGrade: parseCzechNumberInput("1,18") }],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("mimo očekávaný rozsah"))).toBe(false);
  });

  it("průměrný prospěch 1,18 se vygeneruje s českou desetinnou čárkou", () => {
    const data = createCompleteSection06Data();
    const result = generateSection06Draft(
      buildSection06GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section06Data: {
          ...data,
          firstTermClassResults: [{ ...data.firstTermClassResults[0], averageGrade: parseCzechNumberInput("1,18") }],
          secondTermClassResults: [{ ...data.secondTermClassResults[0], averageGrade: parseCzechNumberInput("1,16") }],
        },
      }),
    );

    expect(result.text).toContain("| 1,18 |");
    expect(result.text).toContain("| 1,16 |");
    expect(result.text).not.toContain("| 1.18 |");
    expect(result.text).not.toContain("| 18 |");
    expect(result.text).not.toContain("| 16 |");
  });

  it("sekce 01–05 zůstávají beze změny", () => {
    expect(shouldUseSection01Generator("01")).toBe(true);
    expect(shouldUseSection02Generator("02")).toBe(true);
    expect(shouldUseSection03Generator("03")).toBe(true);
    expect(shouldUseSection04Generator("04")).toBe(true);
    expect(shouldUseSection05Generator("05")).toBe(true);
    expect(shouldUseSection06Generator("06")).toBe(true);
  });

  it("generated text workflow funguje i pro kapitolu 06", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "06");
    expect(sectionDef).toBeDefined();
    const draft = generateSection06Draft(
      buildSection06GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section06Data: createCompleteSection06Data(),
      }),
    );
    const generated = applyGeneratedDraft(createSectionFromDefinition(sectionDef!), draft.text);
    expect(generated.originalGeneratedText).toBe(draft.text);
    expect(generated.generatedText).toBe(draft.text);
    expect(computeSectionStatus(generated, profile)).toBe("VYGENEROVANO");

    const edited = saveGeneratedTextEdits(generated, "Upravená kapitola 06.");
    expect(edited.editedByUser).toBe(true);
    expect(computeSectionStatus(edited, profile)).toBe("UPRAVENO_UZIVATELEM");
  });

  it("neúplný návrh kapitoly 06 ponechá stav CHYBI_UDAJE", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "06");
    expect(sectionDef).toBeDefined();
    const section = createSectionFromDefinition(sectionDef!);
    const incompleteSection = {
      ...section,
      generatedText: `${SECTION06_INCOMPLETE_DRAFT_PREFIX}\n- test`,
    };
    expect(isSection06IncompleteDraft(incompleteSection.generatedText)).toBe(true);
    expect(computeSectionStatus(incompleteSection, profile)).toBe("CHYBI_UDAJE");
  });
});
