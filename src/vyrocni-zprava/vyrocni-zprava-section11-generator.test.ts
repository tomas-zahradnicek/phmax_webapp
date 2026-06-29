import { describe, expect, it } from "vitest";
import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { applyGeneratedDraft, saveGeneratedTextEdits } from "./vyrocni-zprava-generated-text-logic";
import { computeSectionStatus, createDefaultAnnualReport, createSectionFromDefinition } from "./vyrocni-zprava-logic";
import { ANNUAL_REPORT_SECTION_DEFINITIONS } from "./vyrocni-zprava-section-definitions";
import { shouldUseSection01Generator } from "./vyrocni-zprava-section01-generator-service";
import { shouldUseSection02Generator } from "./vyrocni-zprava-section02-generator-service";
import { shouldUseSection03Generator } from "./vyrocni-zprava-section03-generator-service";
import { shouldUseSection04Generator } from "./vyrocni-zprava-section04-generator-service";
import { shouldUseSection05Generator } from "./vyrocni-zprava-section05-generator-service";
import { shouldUseSection06Generator } from "./vyrocni-zprava-section06-generator-service";
import { shouldUseSection07Generator } from "./vyrocni-zprava-section07-generator-service";
import { shouldUseSection08Generator } from "./vyrocni-zprava-section08-generator-service";
import { shouldUseSection09Generator } from "./vyrocni-zprava-section09-generator-service";
import { shouldUseSection10Generator } from "./vyrocni-zprava-section10-generator-service";
import {
  createDefaultSection11Data,
  getSection11Readiness,
} from "./vyrocni-zprava-section11-data-logic";
import { buildSection11GeneratorInput } from "./vyrocni-zprava-section11-generator-input";
import {
  SECTION11_INCOMPLETE_DRAFT_PREFIX,
  generateSection11Draft,
  isSection11IncompleteDraft,
} from "./vyrocni-zprava-section11-local-generator";
import { buildAnnualReportPreview } from "./vyrocni-zprava-report-preview-builder";
import { buildDocxExportModel } from "./vyrocni-zprava-docx-export-logic";
import { parseCzechNumberInput } from "./vyrocni-zprava-number-input-helpers";

function createSection11Profile() {
  return {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Testovací",
    schoolType: "Základní škola",
  };
}

function createCompleteSection11Data() {
  return {
    reportingPeriod: "01.01.2025 - 31.12.2025",
    revenue: {
      stateBudgetContribution: 1000000,
      founderContribution: 300000,
      grantsAndProjects: 120000,
      ownRevenue: 80000,
      donations: 20000,
      otherRevenue: 10000,
      totalRevenue: 1530000,
      note: "",
    },
    expenses: {
      salaryCosts: 900000,
      statutoryContributions: 300000,
      operatingCosts: 120000,
      energyCosts: 70000,
      repairsAndMaintenance: 50000,
      equipmentAndMaterials: 40000,
      services: 30000,
      grantsAndProjectsExpenses: 15000,
      otherExpenses: 5000,
      totalExpenses: 1530000,
      note: "",
    },
    economicResult: {
      profitOrLoss: 0,
      mainActivityResult: 0,
      supplementaryActivityResult: 0,
      reserveFundAllocation: 0,
      note: "",
    },
    grantsAndSubsidies: [
      {
        title: "Šablony OP JAK",
        provider: "MŠMT",
        amount: 120000,
        purpose: "Podpora vzdělávacích aktivit",
        usedAmount: 100000,
        note: "",
      },
    ],
    supplementaryActivity: {
      carriedOut: "ANO" as const,
      description: "Pronájem tělocvičny mimo hlavní činnost školy.",
      revenue: 20000,
      expenses: 15000,
      result: 5000,
      note: "",
    },
    investmentsAndRepairs: [
      {
        title: "Obnova učebny informatiky",
        amount: 180000,
        fundingSource: "Rozpočet zřizovatele",
        description: "Nákup vybavení a modernizace infrastruktury.",
        note: "",
      },
    ],
    summaryCommentary:
      "Kapitola shrnuje základní údaje o hospodaření školy pouze v rozsahu uživatelem poskytnutých ekonomických podkladů za uvedené vykazované období.",
    notes: "Hodnoty jsou uvedeny v Kč.",
  };
}

describe("vyrocni-zprava-section11-generator", () => {
  const profile = createSection11Profile();

  it("prázdná sekce 11 vrací CHYBI_UDAJE", () => {
    const readiness = getSection11Readiness({
      schoolProfile: profile,
      section11Data: createDefaultSection11Data(),
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
  });

  it("chybějící reportingPeriod blokuje readiness", () => {
    const data = createCompleteSection11Data();
    const readiness = getSection11Readiness({
      schoolProfile: profile,
      section11Data: { ...data, reportingPeriod: "" },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
  });

  it("chybějící data příjmů blokují readiness", () => {
    const data = createCompleteSection11Data();
    const readiness = getSection11Readiness({
      schoolProfile: profile,
      section11Data: { ...data, revenue: createDefaultSection11Data().revenue },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
  });

  it("chybějící data výdajů blokují readiness", () => {
    const data = createCompleteSection11Data();
    const readiness = getSection11Readiness({
      schoolProfile: profile,
      section11Data: { ...data, expenses: createDefaultSection11Data().expenses },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
  });

  it("chybějící summaryCommentary blokuje readiness", () => {
    const data = createCompleteSection11Data();
    const readiness = getSection11Readiness({
      schoolProfile: profile,
      section11Data: { ...data, summaryCommentary: "" },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
  });

  it("záporné hodnoty vytváří warning", () => {
    const data = createCompleteSection11Data();
    const readiness = getSection11Readiness({
      schoolProfile: profile,
      section11Data: { ...data, revenue: { ...data.revenue, ownRevenue: -1 } },
    });
    expect(readiness.warnings.some((item) => item.includes("záporná hodnota"))).toBe(true);
  });

  it("nesoulad součtu příjmů vytváří warning", () => {
    const data = createCompleteSection11Data();
    const readiness = getSection11Readiness({
      schoolProfile: profile,
      section11Data: { ...data, revenue: { ...data.revenue, totalRevenue: 1 } },
    });
    expect(readiness.warnings.some((item) => item.includes("Celkové příjmy/výnosy neodpovídají"))).toBe(true);
  });

  it("nesoulad součtu výdajů vytváří warning", () => {
    const data = createCompleteSection11Data();
    const readiness = getSection11Readiness({
      schoolProfile: profile,
      section11Data: { ...data, expenses: { ...data.expenses, totalExpenses: 1 } },
    });
    expect(readiness.warnings.some((item) => item.includes("Celkové výdaje/náklady neodpovídají"))).toBe(true);
  });

  it("nesoulad hospodářského výsledku vytváří warning", () => {
    const data = createCompleteSection11Data();
    const readiness = getSection11Readiness({
      schoolProfile: profile,
      section11Data: { ...data, economicResult: { ...data.economicResult, profitOrLoss: 100 } },
    });
    expect(readiness.warnings.some((item) => item.includes("Hospodářský výsledek neodpovídá"))).toBe(true);
  });

  it("doplňková činnost ANO bez popisu vytváří warning", () => {
    const data = createCompleteSection11Data();
    const readiness = getSection11Readiness({
      schoolProfile: profile,
      section11Data: {
        ...data,
        supplementaryActivity: { ...data.supplementaryActivity, carriedOut: "ANO", description: "" },
      },
    });
    expect(readiness.warnings.some((item) => item.includes("chybí její popis"))).toBe(true);
  });

  it("grant s čerpáním vyšším než částka vytváří warning", () => {
    const data = createCompleteSection11Data();
    const readiness = getSection11Readiness({
      schoolProfile: profile,
      section11Data: {
        ...data,
        grantsAndSubsidies: [{ ...data.grantsAndSubsidies[0], usedAmount: 200000 }],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("čerpaná částka je vyšší"))).toBe(true);
  });

  it("generátor nevymýšlí finanční data ani účetní závěry", () => {
    const result = generateSection11Draft(
      buildSection11GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section11Data: createCompleteSection11Data(),
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).not.toContain("škola hospodařila efektivně");
    expect(result.text).not.toContain("audit potvrdil");
    expect(result.text).not.toContain("nad rámec podkladů");
  });

  it("kompletní data vygenerují kapitolu 11 se sekcemi 11.1–11.6", () => {
    const result = generateSection11Draft(
      buildSection11GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section11Data: createCompleteSection11Data(),
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("11.1 Přehled příjmů a výdajů školy");
    expect(result.text).toContain("11.2 Hospodářský výsledek");
    expect(result.text).toContain("11.3 Dotace, granty a projekty");
    expect(result.text).toContain("11.4 Doplňková činnost");
    expect(result.text).toContain("11.5 Investice, opravy a větší nákupy");
    expect(result.text).toContain("11.6 Souhrnný komentář k hospodaření školy");
  });

  it("nevytváří dvojitou tečku při uživatelském komentáři", () => {
    const data = createCompleteSection11Data();
    data.summaryCommentary = "Komentář k hospodaření je založen na interních podkladech.";
    const result = generateSection11Draft(
      buildSection11GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section11Data: data,
      }),
    );
    expect(result.text).not.toContain("..");
  });

  it("sekce 11 zachová hodnotu 4 200 000 po parse vstupu", () => {
    expect(parseCzechNumberInput("4 200 000")).toBe(4200000);
  });

  it("sekce 11 generuje částku 4 200 000 Kč bez ztráty řádů", () => {
    const data = createCompleteSection11Data();
    data.revenue.totalRevenue = parseCzechNumberInput("4 200 000");
    const result = generateSection11Draft(
      buildSection11GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section11Data: data,
      }),
    );

    expect(result.text).toContain("4 200 000 Kč");
  });

  it("preview a DOCX zahrnou sekci 11 po vygenerování", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = {
      ...report,
      sections: report.sections.map((section) =>
        section.id === "11"
          ? {
              ...section,
              generatedText: "Text kapitoly 11.",
              status: "VYGENEROVANO",
              approved: false,
            }
          : section,
      ),
    };
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: profile,
    });
    expect(preview.sections.find((section) => section.number === "11")?.generatedText).toBe("Text kapitoly 11.");
    const docxModel = buildDocxExportModel(preview, "visible-generated");
    expect(docxModel.sections.some((section) => section.number === "11")).toBe(true);
  });

  it("sekce 01–10 zůstávají beze změny", () => {
    expect(shouldUseSection01Generator("01")).toBe(true);
    expect(shouldUseSection02Generator("02")).toBe(true);
    expect(shouldUseSection03Generator("03")).toBe(true);
    expect(shouldUseSection04Generator("04")).toBe(true);
    expect(shouldUseSection05Generator("05")).toBe(true);
    expect(shouldUseSection06Generator("06")).toBe(true);
    expect(shouldUseSection07Generator("07")).toBe(true);
    expect(shouldUseSection08Generator("08")).toBe(true);
    expect(shouldUseSection09Generator("09")).toBe(true);
    expect(shouldUseSection10Generator("10")).toBe(true);
  });

  it("generated text workflow funguje i pro kapitolu 11", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "11");
    expect(sectionDef).toBeDefined();
    const draft = generateSection11Draft(
      buildSection11GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section11Data: createCompleteSection11Data(),
      }),
    );
    const generated = applyGeneratedDraft(createSectionFromDefinition(sectionDef!), draft.text);
    expect(generated.originalGeneratedText).toBe(draft.text);
    expect(generated.generatedText).toBe(draft.text);
    expect(computeSectionStatus(generated, profile)).toBe("VYGENEROVANO");

    const edited = saveGeneratedTextEdits(generated, "Upravená kapitola 11.");
    expect(edited.editedByUser).toBe(true);
    expect(computeSectionStatus(edited, profile)).toBe("UPRAVENO_UZIVATELEM");
  });

  it("neúplný návrh kapitoly 11 ponechá stav CHYBI_UDAJE", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "11");
    expect(sectionDef).toBeDefined();
    const section = createSectionFromDefinition(sectionDef!);
    const incompleteSection = {
      ...section,
      generatedText: `${SECTION11_INCOMPLETE_DRAFT_PREFIX}\n- test`,
    };
    expect(isSection11IncompleteDraft(incompleteSection.generatedText)).toBe(true);
    expect(computeSectionStatus(incompleteSection, profile)).toBe("CHYBI_UDAJE");
  });
});
