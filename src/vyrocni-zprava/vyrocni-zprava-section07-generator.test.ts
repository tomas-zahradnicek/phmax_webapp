import { describe, expect, it } from "vitest";
import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { applyGeneratedDraft, saveGeneratedTextEdits } from "./vyrocni-zprava-generated-text-logic";
import { computeSectionStatus, createSectionFromDefinition } from "./vyrocni-zprava-logic";
import { ANNUAL_REPORT_SECTION_DEFINITIONS } from "./vyrocni-zprava-section-definitions";
import {
  createDefaultSection07Data,
  getSection07Readiness,
} from "./vyrocni-zprava-section07-data-logic";
import { buildSection07GeneratorInput } from "./vyrocni-zprava-section07-generator-input";
import {
  SECTION07_INCOMPLETE_DRAFT_PREFIX,
  generateSection07Draft,
  isSection07IncompleteDraft,
} from "./vyrocni-zprava-section07-local-generator";
import { shouldUseSection01Generator } from "./vyrocni-zprava-section01-generator-service";
import { shouldUseSection02Generator } from "./vyrocni-zprava-section02-generator-service";
import { shouldUseSection03Generator } from "./vyrocni-zprava-section03-generator-service";
import { shouldUseSection04Generator } from "./vyrocni-zprava-section04-generator-service";
import { shouldUseSection05Generator } from "./vyrocni-zprava-section05-generator-service";
import { shouldUseSection06Generator } from "./vyrocni-zprava-section06-generator-service";
import { shouldUseSection07Generator } from "./vyrocni-zprava-section07-generator-service";

function createSection07Profile() {
  return {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Testovací",
    schoolType: "Základní škola",
  };
}

function createCompleteSection07Data() {
  return {
    prevention: {
      preventionStrategyDescription: "Škola realizuje průběžnou preventivní práci v třídních kolektivech i ve spolupráci s externími partnery.",
      preventionProgrammes: [
        {
          title: "Bezpečně online",
          targetGroup: "6.–9. ročník",
          description: "Program zaměřený na bezpečné chování v digitálním prostředí.",
          dateOrPeriod: "říjen 2024",
          provider: "Městská policie",
        },
      ],
      preventionTeam: "Školní metodik prevence, výchovný poradce, třídní učitelé",
      cooperation: "PPP, OSPOD a školní poradenské pracoviště",
      evaluation: "Preventivní aktivity byly realizovány podle plánu a průběžně vyhodnocovány.",
    },
    riskBehaviourIncidents: [
      {
        type: "Nevhodná komunikace mezi žáky",
        count: 3,
        adoptedMeasures: "Individuální rozhovory, práce s třídním kolektivem, spolupráce s rodiči",
        note: "Agregovaný údaj bez identifikace žáků",
      },
    ],
    pupilsWithSupportNeeds: {
      pupilsWithSvpTotal: 18,
      pupilsWithSupportMeasures: 16,
      pupilsWithIndividualEducationPlan: 7,
      pupilsWithPedagogicalIntervention: 10,
      pupilsWithTeachingAssistantSupport: 8,
      pupilsGifted: 4,
      pupilsExceptionallyGifted: 1,
      note: "Údaje k rozhodnému datu školního roku",
    },
    supportConditions: {
      counsellingWorkplaceDescription: "Školní poradenské pracoviště koordinuje podporu žáků a metodické vedení pedagogů.",
      cooperationWithPppSpc: "Pravidelná konzultace doporučení PPP/SPC.",
      supportMeasuresDescription: "Podpůrná opatření jsou realizována dle individuálních potřeb žáků.",
      inclusionMeasures: "Kooperativní výuka, diferenciace úloh a metodická podpora třídních učitelů.",
      giftedSupportDescription: "Rozšiřující úkoly, projektová výuka a individuální konzultace.",
      teachingAssistantSupportDescription: "Asistenti pedagoga zajišťují podporu ve výuce i mimo ni.",
      materialAndOrganizationalConditions: "Dostupné kompenzační pomůcky a upravená organizace výuky.",
      evaluation: "Podmínky podpory byly průběžně sledovány a vyhodnocovány.",
    },
    languagePreparation: {
      pupilsWithLanguagePreparationEntitlement: 2,
      languagePreparationProvided: "ANO" as const,
      description: "Jazyková příprava byla realizována formou skupinové podpory českého jazyka.",
      provider: "Interní pedagogové školy",
      note: "",
    },
    summaryEvaluation:
      "Kapitola shrnuje realizovanou prevenci, agregované výskyty rizikového chování a popis poskytované podpory žákům včetně jazykové přípravy. Hodnocení vychází pouze z interně evidovaných podkladů školy.",
    notes: "Text vychází z podkladů školního poradenského pracoviště.",
  };
}

describe("vyrocni-zprava-section07-generator", () => {
  const profile = createSection07Profile();

  it("prázdná sekce 07 vrací CHYBI_UDAJE", () => {
    const readiness = getSection07Readiness({
      schoolProfile: profile,
      section07Data: createDefaultSection07Data(),
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData.length).toBeGreaterThan(0);
  });

  it("chybějící preventivní strategie blokuje readiness", () => {
    const readiness = getSection07Readiness({
      schoolProfile: profile,
      section07Data: {
        ...createCompleteSection07Data(),
        prevention: { ...createCompleteSection07Data().prevention, preventionStrategyDescription: "" },
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Popis preventivní strategie školy");
  });

  it("chybějící popis podpůrných opatření blokuje readiness", () => {
    const data = createCompleteSection07Data();
    const readiness = getSection07Readiness({
      schoolProfile: profile,
      section07Data: {
        ...data,
        supportConditions: { ...data.supportConditions, supportMeasuresDescription: "" },
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Popis podpůrných opatření");
  });

  it("chybějící souhrnné vyhodnocení blokuje readiness", () => {
    const readiness = getSection07Readiness({
      schoolProfile: profile,
      section07Data: {
        ...createCompleteSection07Data(),
        summaryEvaluation: "",
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Souhrnné vyhodnocení kapitoly");
  });

  it("počet výskytu bez opatření vytváří warning", () => {
    const data = createCompleteSection07Data();
    const readiness = getSection07Readiness({
      schoolProfile: profile,
      section07Data: {
        ...data,
        riskBehaviourIncidents: [{ type: "Kyberšikana", count: 1, adoptedMeasures: "" }],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("chybí přijatá opatření"))).toBe(true);
  });

  it("záporné hodnoty vytváří warning", () => {
    const data = createCompleteSection07Data();
    const readiness = getSection07Readiness({
      schoolProfile: profile,
      section07Data: {
        ...data,
        pupilsWithSupportNeeds: {
          ...data.pupilsWithSupportNeeds,
          pupilsWithSvpTotal: -1,
        },
      },
    });
    expect(readiness.warnings.some((item) => item.includes("záporné hodnoty"))).toBe(true);
  });

  it("nekonzistence jazykové přípravy vytváří warning", () => {
    const data = createCompleteSection07Data();
    const readiness = getSection07Readiness({
      schoolProfile: profile,
      section07Data: {
        ...data,
        languagePreparation: {
          ...data.languagePreparation,
          languagePreparationProvided: "NE",
          pupilsWithLanguagePreparationEntitlement: 3,
          description: "",
        },
      },
    });
    expect(readiness.warnings.some((item) => item.toLowerCase().includes("jazyková příprava"))).toBe(true);
  });

  it("generátor nevymýšlí výsledky prevence ani data podpory", () => {
    const partial = createCompleteSection07Data();
    partial.prevention.evaluation = "";
    partial.pupilsWithSupportNeeds.note = "";
    const result = generateSection07Draft(
      buildSection07GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section07Data: partial,
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).not.toContain("Vyhodnocení prevence:");
    expect(result.text).not.toContain("nad rámec podkladů");
  });

  it("nevytváří dvojitou tečku při uživatelském textu s interpunkcí", () => {
    const data = createCompleteSection07Data();
    data.prevention.cooperation = "PPP a rodiče.";
    const result = generateSection07Draft(
      buildSection07GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section07Data: data,
      }),
    );
    expect(result.text).not.toContain("..");
  });

  it("kompletní data vygenerují kapitolu 07 se sekcemi 7.1–7.5", () => {
    const result = generateSection07Draft(
      buildSection07GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section07Data: createCompleteSection07Data(),
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("07 Údaje o prevenci");
    expect(result.text).toContain("7.1 Prevence sociálně patologických jevů a rizikového chování");
    expect(result.text).toContain("7.2 Počet výskytu rizikového chování, které škola řešila, a přijatá opatření");
    expect(result.text).toContain("7.3 Počty žáků se speciálními vzdělávacími potřebami");
    expect(result.text).toContain("7.4 Podmínky pro vzdělávání a zajištění podpory");
    expect(result.text).toContain("7.5 Zajištění podpory žáků s nárokem na poskytování jazykové přípravy");
  });

  it("generátor nepřidává identifikovatelné údaje o jednotlivých žácích", () => {
    const result = generateSection07Draft(
      buildSection07GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section07Data: createCompleteSection07Data(),
      }),
    );
    expect(result.text).not.toContain("rodné číslo");
    expect(result.text).not.toContain("adresa žáka");
    expect(result.text).not.toContain("jméno žáka");
  });

  it("sekce 01–06 zůstávají beze změny", () => {
    expect(shouldUseSection01Generator("01")).toBe(true);
    expect(shouldUseSection02Generator("02")).toBe(true);
    expect(shouldUseSection03Generator("03")).toBe(true);
    expect(shouldUseSection04Generator("04")).toBe(true);
    expect(shouldUseSection05Generator("05")).toBe(true);
    expect(shouldUseSection06Generator("06")).toBe(true);
    expect(shouldUseSection07Generator("07")).toBe(true);
  });

  it("generated text workflow funguje i pro kapitolu 07", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "07");
    expect(sectionDef).toBeDefined();
    const draft = generateSection07Draft(
      buildSection07GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section07Data: createCompleteSection07Data(),
      }),
    );
    const generated = applyGeneratedDraft(createSectionFromDefinition(sectionDef!), draft.text);
    expect(generated.originalGeneratedText).toBe(draft.text);
    expect(generated.generatedText).toBe(draft.text);
    expect(computeSectionStatus(generated, profile)).toBe("VYGENEROVANO");

    const edited = saveGeneratedTextEdits(generated, "Upravená kapitola 07.");
    expect(edited.editedByUser).toBe(true);
    expect(computeSectionStatus(edited, profile)).toBe("UPRAVENO_UZIVATELEM");
  });

  it("neúplný návrh kapitoly 07 ponechá stav CHYBI_UDAJE", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "07");
    expect(sectionDef).toBeDefined();
    const section = createSectionFromDefinition(sectionDef!);
    const incompleteSection = {
      ...section,
      generatedText: `${SECTION07_INCOMPLETE_DRAFT_PREFIX}\n- test`,
    };
    expect(isSection07IncompleteDraft(incompleteSection.generatedText)).toBe(true);
    expect(computeSectionStatus(incompleteSection, profile)).toBe("CHYBI_UDAJE");
  });
});
