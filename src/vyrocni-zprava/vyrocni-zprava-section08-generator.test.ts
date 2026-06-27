import { describe, expect, it } from "vitest";
import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { applyGeneratedDraft, saveGeneratedTextEdits } from "./vyrocni-zprava-generated-text-logic";
import { computeSectionStatus, createSectionFromDefinition } from "./vyrocni-zprava-logic";
import { ANNUAL_REPORT_SECTION_DEFINITIONS } from "./vyrocni-zprava-section-definitions";
import { shouldUseSection01Generator } from "./vyrocni-zprava-section01-generator-service";
import { shouldUseSection02Generator } from "./vyrocni-zprava-section02-generator-service";
import { shouldUseSection03Generator } from "./vyrocni-zprava-section03-generator-service";
import { shouldUseSection04Generator } from "./vyrocni-zprava-section04-generator-service";
import { shouldUseSection05Generator } from "./vyrocni-zprava-section05-generator-service";
import { shouldUseSection06Generator } from "./vyrocni-zprava-section06-generator-service";
import { shouldUseSection07Generator } from "./vyrocni-zprava-section07-generator-service";
import {
  createDefaultSection08Data,
  getSection08Readiness,
} from "./vyrocni-zprava-section08-data-logic";
import { buildSection08GeneratorInput } from "./vyrocni-zprava-section08-generator-input";
import {
  SECTION08_INCOMPLETE_DRAFT_PREFIX,
  generateSection08Draft,
  isSection08IncompleteDraft,
} from "./vyrocni-zprava-section08-local-generator";

function createSection08Profile() {
  return {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Testovací",
    schoolType: "Základní škola",
  };
}

function createCompleteSection08Data() {
  return {
    dvppOverview: {
      description: "DVPP bylo plánováno podle potřeb školy a jednotlivých pedagogických pracovníků.",
      priorities: "Didaktika, práce s heterogenní třídou, digitální kompetence.",
      evaluation: "Vyhodnocení vychází z interních podkladů a zpětné vazby účastníků.",
    },
    qualificationStudies: [
      {
        title: "Studium pro ředitele škol",
        participantGroup: "vedení školy",
        provider: "NPI ČR",
        period: "září 2024 - červen 2025",
        completed: "PROBIHA" as const,
        note: "",
      },
    ],
    additionalQualificationStudies: [
      {
        title: "Specializační studium školního metodika prevence",
        participantGroup: "pedagogičtí pracovníci",
        provider: "Akreditované zařízení",
        period: "říjen 2024 - květen 2025",
        completed: "PROBIHA" as const,
        note: "",
      },
    ],
    professionalDevelopmentTrainings: [
      {
        title: "Inkluzivní výukové strategie",
        topic: "práce s různorodou třídou",
        participantGroup: "pedagogičtí pracovníci",
        provider: "NPI ČR",
        period: "listopad 2024",
        hours: 8,
        note: "",
      },
    ],
    nonTeachingStaffDevelopment: [
      {
        title: "Bezpečnost práce a požární ochrana",
        staffGroup: "provozní zaměstnanci",
        provider: "Externí školitel",
        period: "prosinec 2024",
        hours: 4,
        note: "",
      },
    ],
    selfStudy: {
      description: "Pedagogičtí pracovníci realizovali samostudium k metodickým materiálům.",
      topics: "formativní hodnocení, digitální nástroje ve výuce",
      note: "",
    },
    summaryEvaluation:
      "Kapitola shrnuje realizované vzdělávací aktivity pedagogických i nepedagogických pracovníků pouze v rozsahu doloženém interními podklady školy.",
    notes: "Údaje jsou vedeny v souhrnné podobě bez osobních údajů jednotlivých zaměstnanců.",
  };
}

describe("vyrocni-zprava-section08-generator", () => {
  const profile = createSection08Profile();

  it("prázdná sekce 08 vrací CHYBI_UDAJE", () => {
    const readiness = getSection08Readiness({
      schoolProfile: profile,
      section08Data: createDefaultSection08Data(),
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData.length).toBeGreaterThan(0);
  });

  it("chybějící dvppOverview.description blokuje readiness", () => {
    const data = createCompleteSection08Data();
    const readiness = getSection08Readiness({
      schoolProfile: profile,
      section08Data: {
        ...data,
        dvppOverview: { ...data.dvppOverview, description: "" },
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Popis DVPP ve školním roce");
  });

  it("bez aktivit a bez samostudia blokuje readiness", () => {
    const data = createCompleteSection08Data();
    const readiness = getSection08Readiness({
      schoolProfile: profile,
      section08Data: {
        ...data,
        qualificationStudies: [],
        additionalQualificationStudies: [],
        professionalDevelopmentTrainings: [],
        nonTeachingStaffDevelopment: [],
        selfStudy: { ...data.selfStudy, description: "" },
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData.some((item) => item.includes("Alespoň jedna aktivita"))).toBe(true);
  });

  it("chybějící summaryEvaluation blokuje readiness", () => {
    const data = createCompleteSection08Data();
    const readiness = getSection08Readiness({
      schoolProfile: profile,
      section08Data: {
        ...data,
        summaryEvaluation: "",
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Souhrnné vyhodnocení kapitoly");
  });

  it("záporné hodiny vytváří warning", () => {
    const data = createCompleteSection08Data();
    const readiness = getSection08Readiness({
      schoolProfile: profile,
      section08Data: {
        ...data,
        professionalDevelopmentTrainings: [{ ...data.professionalDevelopmentTrainings[0], hours: -1 }],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("počet hodin"))).toBe(true);
  });

  it("řádek bez názvu vytváří warning", () => {
    const data = createCompleteSection08Data();
    const readiness = getSection08Readiness({
      schoolProfile: profile,
      section08Data: {
        ...data,
        professionalDevelopmentTrainings: [{ ...data.professionalDevelopmentTrainings[0], title: "" }],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("chybí název"))).toBe(true);
  });

  it("kvalifikační studium bez completed vytváří warning", () => {
    const data = createCompleteSection08Data();
    const readiness = getSection08Readiness({
      schoolProfile: profile,
      section08Data: {
        ...data,
        qualificationStudies: [{ ...data.qualificationStudies[0], completed: undefined }],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("chybí údaj „Dokončeno“"))).toBe(true);
  });

  it("generátor nevymýšlí školení ani hodnoticí tvrzení", () => {
    const data = createCompleteSection08Data();
    const result = generateSection08Draft(
      buildSection08GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section08Data: {
          ...data,
          dvppOverview: {
            ...data.dvppOverview,
            evaluation: "",
          },
          notes: "",
        },
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).not.toContain("systémové");
    expect(result.text).not.toContain("úspěšně");
    expect(result.text).not.toContain("nad rámec podkladů");
  });

  it("kompletní data vygenerují kapitolu 08 se sekcemi 8.1–8.3", () => {
    const result = generateSection08Draft(
      buildSection08GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section08Data: createCompleteSection08Data(),
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("08 Údaje o dalším vzdělávání pedagogických pracovníků");
    expect(result.text).toContain("8.1 Další vzdělávání pedagogických pracovníků");
    expect(result.text).toContain("8.1.1 Studium ke splnění kvalifikačních předpokladů");
    expect(result.text).toContain("8.1.2 Studium ke splnění dalších kvalifikačních předpokladů");
    expect(result.text).toContain("8.1.3 Studium k prohlubování odborné kvalifikace");
    expect(result.text).toContain("8.2 Odborný rozvoj nepedagogických pracovníků");
    expect(result.text).toContain("8.3 Samostudium");
  });

  it("sekce 01–07 zůstávají beze změny", () => {
    expect(shouldUseSection01Generator("01")).toBe(true);
    expect(shouldUseSection02Generator("02")).toBe(true);
    expect(shouldUseSection03Generator("03")).toBe(true);
    expect(shouldUseSection04Generator("04")).toBe(true);
    expect(shouldUseSection05Generator("05")).toBe(true);
    expect(shouldUseSection06Generator("06")).toBe(true);
    expect(shouldUseSection07Generator("07")).toBe(true);
  });

  it("generated text workflow funguje i pro kapitolu 08", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "08");
    expect(sectionDef).toBeDefined();
    const draft = generateSection08Draft(
      buildSection08GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section08Data: createCompleteSection08Data(),
      }),
    );
    const generated = applyGeneratedDraft(createSectionFromDefinition(sectionDef!), draft.text);
    expect(generated.originalGeneratedText).toBe(draft.text);
    expect(generated.generatedText).toBe(draft.text);
    expect(computeSectionStatus(generated, profile)).toBe("VYGENEROVANO");

    const edited = saveGeneratedTextEdits(generated, "Upravená kapitola 08.");
    expect(edited.editedByUser).toBe(true);
    expect(computeSectionStatus(edited, profile)).toBe("UPRAVENO_UZIVATELEM");
  });

  it("neúplný návrh kapitoly 08 ponechá stav CHYBI_UDAJE", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "08");
    expect(sectionDef).toBeDefined();
    const section = createSectionFromDefinition(sectionDef!);
    const incompleteSection = {
      ...section,
      generatedText: `${SECTION08_INCOMPLETE_DRAFT_PREFIX}\n- test`,
    };
    expect(isSection08IncompleteDraft(incompleteSection.generatedText)).toBe(true);
    expect(computeSectionStatus(incompleteSection, profile)).toBe("CHYBI_UDAJE");
  });
});
