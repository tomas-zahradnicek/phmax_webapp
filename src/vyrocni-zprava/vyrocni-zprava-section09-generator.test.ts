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
import { shouldUseSection08Generator } from "./vyrocni-zprava-section08-generator-service";
import {
  createDefaultSection09Data,
  getSection09Readiness,
} from "./vyrocni-zprava-section09-data-logic";
import { buildSection09GeneratorInput } from "./vyrocni-zprava-section09-generator-input";
import {
  SECTION09_INCOMPLETE_DRAFT_PREFIX,
  generateSection09Draft,
  isSection09IncompleteDraft,
} from "./vyrocni-zprava-section09-local-generator";

function createSection09Profile() {
  return {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Testovací",
    schoolType: "Základní škola",
  };
}

function createCompleteSection09Data() {
  return {
    publicPresentation: {
      description: "Škola průběžně prezentuje své aktivity prostřednictvím webu a veřejných akcí.",
      website: "https://www.zstest.cz",
      socialMedia: "Profil školy na sociálních sítích je využíván pro informování rodičů.",
      mediaOutputs: "Vybrané akce byly zveřejněny v místním zpravodaji.",
      cooperationWithCommunity: "Škola spolupracovala s obcí, zřizovatelem a místními organizacemi.",
      note: "",
    },
    schoolEvents: [
      {
        dateOrPeriod: "říjen 2024",
        title: "Den otevřených dveří",
        eventType: "prezentační akce",
        targetGroup: "rodiče a veřejnost",
        description: "Prezentace vzdělávacích aktivit školy.",
        location: "budova školy",
        partner: "zřizovatel",
        publicEvent: "ANO" as const,
        note: "",
      },
    ],
    competitions: [
      {
        dateOrPeriod: "listopad 2024",
        title: "Matematická olympiáda",
        subjectOrArea: "matematika",
        participants: "žáci 2. stupně",
        result: "postup do okresního kola",
        level: "školní/okresní",
        note: "",
      },
    ],
    projectsAndCooperation: [
      {
        title: "Projekt Čtenářská gramotnost",
        type: "školní projekt",
        partner: "místní knihovna",
        period: "2024/2025",
        description: "Společné aktivity na podporu čtenářství.",
        output: "tematické dílny a čtenářská setkání",
        note: "",
      },
    ],
    extraordinaryAchievements: "Žáci školy získali ocenění v regionálním kole literární soutěže.",
    summaryEvaluation:
      "Kapitola shrnuje realizované aktivity školy, účast žáků na soutěžích a projekty pouze v rozsahu doloženém interními podklady.",
    notes: "Údaje jsou uvedeny v souhrnné podobě.",
  };
}

describe("vyrocni-zprava-section09-generator", () => {
  const profile = createSection09Profile();

  it("prázdná sekce 09 vrací CHYBI_UDAJE", () => {
    const readiness = getSection09Readiness({
      schoolProfile: profile,
      section09Data: createDefaultSection09Data(),
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
  });

  it("chybějící summaryEvaluation blokuje readiness", () => {
    const data = createCompleteSection09Data();
    const readiness = getSection09Readiness({
      schoolProfile: profile,
      section09Data: {
        ...data,
        summaryEvaluation: "",
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Souhrnné vyhodnocení kapitoly");
  });

  it("alespoň jeden validní podklad + summaryEvaluation znamená PRIPRAVENO", () => {
    const data = createDefaultSection09Data();
    const readiness = getSection09Readiness({
      schoolProfile: profile,
      section09Data: {
        ...data,
        extraordinaryAchievements: "Žáci získali ocenění v okresním kole.",
        summaryEvaluation: "Kapitola vychází z doložených podkladů školy o aktivitách a prezentaci na veřejnosti.",
      },
    });
    expect(readiness.status).toBe("PRIPRAVENO");
  });

  it("řádek bez názvu vytváří warning", () => {
    const data = createCompleteSection09Data();
    const readiness = getSection09Readiness({
      schoolProfile: profile,
      section09Data: {
        ...data,
        schoolEvents: [{ ...data.schoolEvents[0], title: "" }],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("chybí název"))).toBe(true);
  });

  it("soutěž bez výsledku vytváří warning", () => {
    const data = createCompleteSection09Data();
    const readiness = getSection09Readiness({
      schoolProfile: profile,
      section09Data: {
        ...data,
        competitions: [{ ...data.competitions[0], result: "" }],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("chybí výsledek"))).toBe(true);
  });

  it("veřejná akce bez popisu vytváří warning", () => {
    const data = createCompleteSection09Data();
    const readiness = getSection09Readiness({
      schoolProfile: profile,
      section09Data: {
        ...data,
        schoolEvents: [{ ...data.schoolEvents[0], publicEvent: "ANO", description: "" }],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("veřejná"))).toBe(true);
  });

  it("generátor nevymýšlí akce, soutěže ani úspěchy", () => {
    const result = generateSection09Draft(
      buildSection09GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section09Data: {
          ...createCompleteSection09Data(),
          notes: "",
        },
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).not.toContain("mimořádně úspěšná škola");
    expect(result.text).not.toContain("nad rámec podkladů");
    expect(result.text).not.toContain("významné mediální pokrytí");
  });

  it("nevytváří dvojitou tečku při ukončených větách zadaných uživatelem", () => {
    const data = createCompleteSection09Data();
    data.publicPresentation.description = "Prezentace školy probíhala kontinuálně.";
    const result = generateSection09Draft(
      buildSection09GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section09Data: data,
      }),
    );
    expect(result.text).not.toContain("..");
  });

  it("kompletní data vygenerují kapitolu 09 se sekcemi 9.1–9.4", () => {
    const result = generateSection09Draft(
      buildSection09GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section09Data: createCompleteSection09Data(),
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("09 Údaje o aktivitách a prezentaci školy na veřejnosti");
    expect(result.text).toContain("9.1 Akce školy");
    expect(result.text).toContain("9.2 Účast žáků na soutěžích");
    expect(result.text).toContain("9.3 Projekty, spolupráce a prezentace školy na veřejnosti");
    expect(result.text).toContain("9.4 Mimořádné výsledky a úspěchy žáků");
  });

  it("sekce 01–08 zůstávají beze změny", () => {
    expect(shouldUseSection01Generator("01")).toBe(true);
    expect(shouldUseSection02Generator("02")).toBe(true);
    expect(shouldUseSection03Generator("03")).toBe(true);
    expect(shouldUseSection04Generator("04")).toBe(true);
    expect(shouldUseSection05Generator("05")).toBe(true);
    expect(shouldUseSection06Generator("06")).toBe(true);
    expect(shouldUseSection07Generator("07")).toBe(true);
    expect(shouldUseSection08Generator("08")).toBe(true);
  });

  it("generated text workflow funguje i pro kapitolu 09", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "09");
    expect(sectionDef).toBeDefined();
    const draft = generateSection09Draft(
      buildSection09GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section09Data: createCompleteSection09Data(),
      }),
    );
    const generated = applyGeneratedDraft(createSectionFromDefinition(sectionDef!), draft.text);
    expect(generated.originalGeneratedText).toBe(draft.text);
    expect(generated.generatedText).toBe(draft.text);
    expect(computeSectionStatus(generated, profile)).toBe("VYGENEROVANO");

    const edited = saveGeneratedTextEdits(generated, "Upravená kapitola 09.");
    expect(edited.editedByUser).toBe(true);
    expect(computeSectionStatus(edited, profile)).toBe("UPRAVENO_UZIVATELEM");
  });

  it("neúplný návrh kapitoly 09 ponechá stav CHYBI_UDAJE", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "09");
    expect(sectionDef).toBeDefined();
    const section = createSectionFromDefinition(sectionDef!);
    const incompleteSection = {
      ...section,
      generatedText: `${SECTION09_INCOMPLETE_DRAFT_PREFIX}\n- test`,
    };
    expect(isSection09IncompleteDraft(incompleteSection.generatedText)).toBe(true);
    expect(computeSectionStatus(incompleteSection, profile)).toBe("CHYBI_UDAJE");
  });
});
