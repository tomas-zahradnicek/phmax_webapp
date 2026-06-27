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
import { shouldUseSection09Generator } from "./vyrocni-zprava-section09-generator-service";
import {
  createDefaultSection10Data,
  getSection10Readiness,
} from "./vyrocni-zprava-section10-data-logic";
import { buildSection10GeneratorInput } from "./vyrocni-zprava-section10-generator-input";
import {
  SECTION10_INCOMPLETE_DRAFT_PREFIX,
  generateSection10Draft,
  isSection10IncompleteDraft,
} from "./vyrocni-zprava-section10-local-generator";

function createSection10Profile() {
  return {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Testovací",
    schoolType: "Základní škola",
  };
}

function createCompleteSection10Data() {
  return {
    inspectionActivityStatus: "PROBEHLA" as const,
    inspections: [
      {
        dateOrPeriod: "listopad 2024",
        inspectionType: "komplexní inspekční činnost",
        subject: "průběh a podmínky vzdělávání",
        reportReference: "ČŠIG-1234/24-G",
        reportUrl: "https://www.csicr.cz/inspekcni-zprava/1234",
        mainFindings: "Inspekce popsala silné stránky i oblasti ke zlepšení.",
        conclusions: "Doporučeno posílení interní evaluace výuky.",
        adoptedMeasures: "Škola zavedla pravidelné metodické rozbory a plán kontrol.",
        note: "",
      },
    ],
    noInspectionStatement: "",
    summaryEvaluation:
      "Kapitola shrnuje výsledky inspekční činnosti České školní inspekce pouze v rozsahu údajů uvedených školou.",
    notes: "Údaje vycházejí z interně evidovaných podkladů školy.",
  };
}

describe("vyrocni-zprava-section10-generator", () => {
  const profile = createSection10Profile();

  it("prázdná sekce 10 vrací CHYBI_UDAJE", () => {
    const readiness = getSection10Readiness({
      schoolProfile: profile,
      section10Data: { ...createDefaultSection10Data(), inspectionActivityStatus: undefined },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
  });

  it("chybějící inspectionActivityStatus blokuje readiness", () => {
    const readiness = getSection10Readiness({
      schoolProfile: profile,
      section10Data: {
        ...createDefaultSection10Data(),
        inspectionActivityStatus: undefined,
        summaryEvaluation: "Shrnutí kapitoly.",
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData.some((item) => item.includes("inspekční činnost"))).toBe(true);
  });

  it("NEPROBEHLA s noInspectionStatement je PRIPRAVENO", () => {
    const readiness = getSection10Readiness({
      schoolProfile: profile,
      section10Data: {
        ...createDefaultSection10Data(),
        inspectionActivityStatus: "NEPROBEHLA",
        noInspectionStatement: "Ve sledovaném období neproběhla inspekční činnost ČŠI.",
      },
    });
    expect(readiness.status).toBe("PRIPRAVENO");
  });

  it("NEPROBEHLA se summaryEvaluation je PRIPRAVENO", () => {
    const readiness = getSection10Readiness({
      schoolProfile: profile,
      section10Data: {
        ...createDefaultSection10Data(),
        inspectionActivityStatus: "NEPROBEHLA",
        summaryEvaluation: "Podle zadaných údajů ve školním roce neproběhla inspekční činnost ČŠI.",
      },
    });
    expect(readiness.status).toBe("PRIPRAVENO");
  });

  it("PROBEHLA bez inspekčního záznamu blokuje readiness", () => {
    const readiness = getSection10Readiness({
      schoolProfile: profile,
      section10Data: {
        ...createDefaultSection10Data(),
        inspectionActivityStatus: "PROBEHLA",
        inspections: [],
        summaryEvaluation: "Shrnutí kapitoly.",
      },
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData.some((item) => item.includes("záznam"))).toBe(true);
  });

  it("PROBEHLA s inspekčním záznamem a summaryEvaluation je PRIPRAVENO", () => {
    const readiness = getSection10Readiness({
      schoolProfile: profile,
      section10Data: createCompleteSection10Data(),
    });
    expect(readiness.status).toBe("PRIPRAVENO");
  });

  it("warning pro reportUrl funguje", () => {
    const data = createCompleteSection10Data();
    const readiness = getSection10Readiness({
      schoolProfile: profile,
      section10Data: {
        ...data,
        inspections: [{ ...data.inspections[0], reportUrl: "csi-zprava-1234" }],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("formát URL"))).toBe(true);
  });

  it("nedostatky bez opatření vytváří warning", () => {
    const data = createCompleteSection10Data();
    const readiness = getSection10Readiness({
      schoolProfile: profile,
      section10Data: {
        ...data,
        inspections: [
          {
            ...data.inspections[0],
            mainFindings: "Byly zjištěny nedostatky v dokumentaci.",
            adoptedMeasures: "",
          },
        ],
      },
    });
    expect(readiness.warnings.some((item) => item.includes("chybí přijatá opatření"))).toBe(true);
  });

  it("záznamy při NEPROBEHLA vytváří warning", () => {
    const data = createCompleteSection10Data();
    const readiness = getSection10Readiness({
      schoolProfile: profile,
      section10Data: {
        ...data,
        inspectionActivityStatus: "NEPROBEHLA",
      },
    });
    expect(readiness.warnings.some((item) => item.includes("Neproběhla"))).toBe(true);
  });

  it("generátor nevymýšlí inspekční zjištění", () => {
    const data = createCompleteSection10Data();
    const result = generateSection10Draft(
      buildSection10GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section10Data: {
          ...data,
          inspections: [{ ...data.inspections[0], mainFindings: "", conclusions: "" }],
        },
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).not.toContain("inspekce jednoznačně potvrdila");
    expect(result.text).not.toContain("nad rámec podkladů");
  });

  it("NEPROBEHLA generátor vrací stručný faktický text", () => {
    const result = generateSection10Draft(
      buildSection10GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section10Data: {
          ...createDefaultSection10Data(),
          inspectionActivityStatus: "NEPROBEHLA",
          noInspectionStatement: "Ve školním roce neproběhla inspekční činnost ČŠI.",
        },
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("neproběhla inspekční činnost České školní inspekce");
  });

  it("PROBEHLA generátor vytváří podsekce 10.1 a 10.2", () => {
    const result = generateSection10Draft(
      buildSection10GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section10Data: createCompleteSection10Data(),
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("10.1 Inspekční činnost provedená Českou školní inspekcí");
    expect(result.text).toContain("10.2 Výsledky inspekční činnosti a přijatá opatření");
  });

  it("sekce 01–09 zůstávají beze změny", () => {
    expect(shouldUseSection01Generator("01")).toBe(true);
    expect(shouldUseSection02Generator("02")).toBe(true);
    expect(shouldUseSection03Generator("03")).toBe(true);
    expect(shouldUseSection04Generator("04")).toBe(true);
    expect(shouldUseSection05Generator("05")).toBe(true);
    expect(shouldUseSection06Generator("06")).toBe(true);
    expect(shouldUseSection07Generator("07")).toBe(true);
    expect(shouldUseSection08Generator("08")).toBe(true);
    expect(shouldUseSection09Generator("09")).toBe(true);
  });

  it("generated text workflow funguje i pro kapitolu 10", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "10");
    expect(sectionDef).toBeDefined();
    const draft = generateSection10Draft(
      buildSection10GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section10Data: createCompleteSection10Data(),
      }),
    );
    const generated = applyGeneratedDraft(createSectionFromDefinition(sectionDef!), draft.text);
    expect(generated.originalGeneratedText).toBe(draft.text);
    expect(generated.generatedText).toBe(draft.text);
    expect(computeSectionStatus(generated, profile)).toBe("VYGENEROVANO");

    const edited = saveGeneratedTextEdits(generated, "Upravená kapitola 10.");
    expect(edited.editedByUser).toBe(true);
    expect(computeSectionStatus(edited, profile)).toBe("UPRAVENO_UZIVATELEM");
  });

  it("neúplný návrh kapitoly 10 ponechá stav CHYBI_UDAJE", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "10");
    expect(sectionDef).toBeDefined();
    const section = createSectionFromDefinition(sectionDef!);
    const incompleteSection = {
      ...section,
      generatedText: `${SECTION10_INCOMPLETE_DRAFT_PREFIX}\n- test`,
    };
    expect(isSection10IncompleteDraft(incompleteSection.generatedText)).toBe(true);
    expect(computeSectionStatus(incompleteSection, profile)).toBe("CHYBI_UDAJE");
  });
});
