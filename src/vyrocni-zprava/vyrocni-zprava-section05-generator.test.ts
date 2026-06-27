import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { applyGeneratedDraft, saveGeneratedTextEdits } from "./vyrocni-zprava-generated-text-logic";
import { computeSectionStatus, createSectionFromDefinition } from "./vyrocni-zprava-logic";
import { ANNUAL_REPORT_SECTION_DEFINITIONS } from "./vyrocni-zprava-section-definitions";
import { createSection05DefaultGoals } from "./vyrocni-zprava-section05-default-goals";
import {
  createDefaultSection05Data,
  getSection05Readiness,
} from "./vyrocni-zprava-section05-data-logic";
import { buildSection05GeneratorInput } from "./vyrocni-zprava-section05-generator-input";
import {
  SECTION05_INCOMPLETE_DRAFT_PREFIX,
  generateSection05Draft,
  isSection05IncompleteDraft,
} from "./vyrocni-zprava-section05-local-generator";
import { shouldUseSection05Generator } from "./vyrocni-zprava-section05-generator-service";
import { shouldUseSection01Generator } from "./vyrocni-zprava-section01-generator-service";
import { shouldUseSection02Generator } from "./vyrocni-zprava-section02-generator-service";
import { shouldUseSection03Generator } from "./vyrocni-zprava-section03-generator-service";
import { shouldUseSection04Generator } from "./vyrocni-zprava-section04-generator-service";
import { buildSection04GeneratorInput } from "./vyrocni-zprava-section04-generator-input";
import { generateSection04Draft, SECTION04_INCOMPLETE_DRAFT_PREFIX } from "./vyrocni-zprava-section04-local-generator";

function createSection05ReadyProfile() {
  return {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Ukázková",
    schoolType: "Základní škola",
  };
}

function createCompleteSection05Data() {
  return {
    educationProgram: {
      name: "Školní vzdělávací program pro základní vzdělávání",
      applicableClasses: "1.–9. ročník",
      note: "",
    },
    schoolCurriculumPlan: {
      description: "Učební plán byl realizován podle schválené struktury školy.",
      weeklyHourPlan: [
        {
          subject: "Český jazyk a literatura",
          grade1: 9,
          grade2: 9,
          grade3: 8,
          grade4: 7,
          grade5: 7,
          grade6: 5,
          grade7: 5,
          grade8: 4,
          grade9: 4,
        },
      ],
      note: "",
    },
    goalsEvaluation: [
      {
        goal: "podněcovat žáky k tvořivému myšlení, logickému uvažování a řešení problémů",
        level: "NEKTERE_HODINY" as const,
        evidence: "Projektové dny a laboratorní úlohy v přírodovědných předmětech.",
        note: "",
      },
    ],
    overallEvaluation: "Naplňování cílů ŠVP je průběžně sledováno a vyhodnocováno v předmětových komisích.",
    strengths: "Stabilní výukové týmy a koordinace mezi stupni.",
    areasForImprovement: "Posílení jednotného hodnocení klíčových kompetencí.",
    measuresForNextYear: "Zavedení pravidelných metodických setkání a sdílení příkladů dobré praxe.",
    notes: "",
  };
}

describe("vyrocni-zprava-section05-generator", () => {
  const profile = createSection05ReadyProfile();

  it("prázdná sekce 05 vrací CHYBI_UDAJE", () => {
    const readiness = getSection05Readiness({
      schoolProfile: profile,
      section05Data: createDefaultSection05Data(),
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData.length).toBeGreaterThan(0);
  });

  it("educationProgram.name je blokující", () => {
    const readiness = getSection05Readiness({
      schoolProfile: profile,
      section05Data: {
        ...createCompleteSection05Data(),
        educationProgram: { name: "", applicableClasses: "1.–9. ročník" },
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Název školního vzdělávacího programu");
  });

  it("chybějící goalsEvaluation blokuje readiness", () => {
    const readiness = getSection05Readiness({
      schoolProfile: profile,
      section05Data: {
        ...createCompleteSection05Data(),
        goalsEvaluation: [],
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Alespoň jeden cíl ŠVP v části naplňování cílů");
  });

  it("řádek cíle bez level je blokující", () => {
    const readiness = getSection05Readiness({
      schoolProfile: profile,
      section05Data: {
        ...createCompleteSection05Data(),
        goalsEvaluation: [{ goal: "Rozvoj kompetencí", level: undefined }],
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData.some((item) => item.includes("Míra naplňování cíle"))).toBe(true);
  });

  it("overallEvaluation je blokující", () => {
    const readiness = getSection05Readiness({
      schoolProfile: profile,
      section05Data: {
        ...createCompleteSection05Data(),
        overallEvaluation: "",
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Celkové vyhodnocení naplňování ŠVP");
  });

  it("výchozí cíle lze vložit a upravit", () => {
    const defaults = createSection05DefaultGoals();
    expect(defaults.length).toBeGreaterThan(0);
    const edited = defaults.map((row, index) =>
      index === 0 ? { ...row, goal: `${row.goal} (upraveno)` } : row,
    );
    expect(edited[0]?.goal).toContain("(upraveno)");
    expect(defaults[0]?.goal).not.toContain("(upraveno)");
  });

  it("generátor nevymýšlí hodnocení", () => {
    const input = buildSection05GeneratorInput({
      schoolProfile: profile,
      schoolYear: "2024/2025",
      section05Data: {
        ...createCompleteSection05Data(),
        strengths: "",
        areasForImprovement: "",
        measuresForNextYear: "",
        overallEvaluation: "Vyhodnocení proběhlo na základě třídních zpráv.",
      },
    });
    const result = generateSection05Draft(input);
    expect(result.ready).toBe(true);
    expect(result.text).toContain("Celkové vyhodnocení: Vyhodnocení proběhlo na základě třídních zpráv.");
    expect(result.text).not.toContain("Silné stránky:");
  });

  it("kompletní data vygenerují kapitolu 05 se sekcemi 5.1–5.3", () => {
    const result = generateSection05Draft(
      buildSection05GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section05Data: createCompleteSection05Data(),
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("05 Stručné vyhodnocení naplňování cílů školního vzdělávacího programu");
    expect(result.text).toContain("5.1 Vzdělávací program");
    expect(result.text).toContain("5.2 Učební plán školy");
    expect(result.text).toContain("5.3 Naplňování cílů");
  });

  it("neúplný návrh kapitoly 05 ponechá stav CHYBI_UDAJE", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "05");
    expect(sectionDef).toBeDefined();
    const section = createSectionFromDefinition(sectionDef!);
    const incompleteSection = {
      ...section,
      generatedText: `${SECTION05_INCOMPLETE_DRAFT_PREFIX}\n- test`,
    };
    expect(isSection05IncompleteDraft(incompleteSection.generatedText)).toBe(true);
    expect(computeSectionStatus(incompleteSection, profile)).toBe("CHYBI_UDAJE");
  });

  it("sekce 01, 02, 03 a 04 zůstávají beze změny", () => {
    expect(shouldUseSection01Generator("01")).toBe(true);
    expect(shouldUseSection02Generator("02")).toBe(true);
    expect(shouldUseSection03Generator("03")).toBe(true);
    expect(shouldUseSection04Generator("04")).toBe(true);
    expect(shouldUseSection05Generator("05")).toBe(true);

    const section04Draft = generateSection04Draft(
      buildSection04GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section04Data: {
          firstGradeAdmissionCurrentYear: {},
          pupilsAdmittedDuringYear: [],
          pupilsLeftDuringYear: [],
          firstGradeEnrollmentNextYear: {},
          specialEnrollment: {},
          secondarySchoolAdmissions: [],
          pupilCountsSeptember: [],
          pupilCountsJune: [],
          notes: "",
        },
      }),
    );
    expect(section04Draft.ready).toBe(false);
    expect(section04Draft.text.startsWith(SECTION04_INCOMPLETE_DRAFT_PREFIX)).toBe(true);
  });

  it("generated text workflow funguje i pro kapitolu 05", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "05");
    expect(sectionDef).toBeDefined();
    const draft = generateSection05Draft(
      buildSection05GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section05Data: createCompleteSection05Data(),
      }),
    );
    const generated = applyGeneratedDraft(createSectionFromDefinition(sectionDef!), draft.text);
    expect(generated.originalGeneratedText).toBe(draft.text);
    expect(generated.generatedText).toBe(draft.text);
    expect(computeSectionStatus(generated, profile)).toBe("VYGENEROVANO");

    const edited = saveGeneratedTextEdits(generated, "Upravená kapitola 05.");
    expect(edited.editedByUser).toBe(true);
    expect(computeSectionStatus(edited, profile)).toBe("UPRAVENO_UZIVATELEM");
  });
});
