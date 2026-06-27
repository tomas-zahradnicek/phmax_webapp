import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import {
  applyGeneratedDraft,
  saveGeneratedTextEdits,
} from "./vyrocni-zprava-generated-text-logic";
import { computeSectionStatus, createSectionFromDefinition } from "./vyrocni-zprava-logic";
import { ANNUAL_REPORT_SECTION_DEFINITIONS } from "./vyrocni-zprava-section-definitions";
import {
  createDefaultSection02Data,
  getSection02Readiness,
} from "./vyrocni-zprava-section02-data-logic";
import { buildSection02GeneratorInput } from "./vyrocni-zprava-section02-generator-input";
import {
  SECTION02_INCOMPLETE_DRAFT_PREFIX,
  generateSection02Draft,
  isSection02IncompleteDraft,
} from "./vyrocni-zprava-section02-local-generator";
import { shouldUseSection02Generator } from "./vyrocni-zprava-section02-generator-service";
import { shouldUseSection01Generator } from "./vyrocni-zprava-section01-generator-service";
import { shouldUseSection03Generator } from "./vyrocni-zprava-section03-generator-service";
import { buildSection03GeneratorInput } from "./vyrocni-zprava-section03-generator-input";
import {
  SECTION03_INCOMPLETE_DRAFT_PREFIX,
  generateSection03Draft,
} from "./vyrocni-zprava-section03-local-generator";
import { createDefaultPersonnelData } from "./vyrocni-zprava-personnel-logic";
import { getAnnualReportCalculatorData } from "./vyrocni-zprava-calculator-data-bridge";

function createSection02ReadyProfile() {
  return {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Ukázková",
    schoolType: "Základní škola",
  };
}

describe("vyrocni-zprava-section02-generator", () => {
  const profile = createSection02ReadyProfile();

  it("prázdné educationFields vrací CHYBI_UDAJE", () => {
    const readiness = getSection02Readiness({
      schoolProfile: profile,
      section02Data: createDefaultSection02Data(),
    });
    expect(readiness.status).toBe("CHYBI_UDAJE");
    expect(readiness.missingData).toContain("Alespoň jeden obor vzdělání");
  });

  it("obor jen s názvem může být PRIPRAVENO", () => {
    const readiness = getSection02Readiness({
      schoolProfile: profile,
      section02Data: {
        educationFields: [{ name: "Základní škola" }],
      },
    });
    expect(readiness.status).toBe("PRIPRAVENO");
    expect(readiness.missingData).toEqual([]);
  });

  it("kód oboru a údaje o rejstříku jsou doporučené, neblokují generování", () => {
    const readiness = getSection02Readiness({
      schoolProfile: profile,
      section02Data: {
        educationFields: [{ name: "Základní škola" }],
      },
    });
    expect(readiness.status).toBe("PRIPRAVENO");
    expect(readiness.recommendedData).toContain("Kód oboru (řádek 1)");
    expect(readiness.recommendedData).toContain("Zdroj ověření v rejstříku");
    expect(readiness.recommendedData).toContain("Datum ověření");
  });

  it("generátor nevymýšlí chybějící údaje", () => {
    const input = buildSection02GeneratorInput({
      schoolProfile: profile,
      schoolYear: "2024/2025",
      section02Data: {
        educationFields: [{ name: "Základní škola" }],
      },
    });
    expect(input.educationFields[0]?.code).toBeUndefined();
    expect(input.registrySource).toBeUndefined();
    expect(input.registryVerifiedAt).toBeUndefined();

    const result = generateSection02Draft(input);
    expect(result.ready).toBe(true);
    expect(result.text).toContain("1 | — | Základní škola | — | — | —");
    expect(result.text).not.toContain("Údaje byly ověřeny podle dostupných údajů ve školském rejstříku.");
  });

  it("kompletní data vygenerují kapitolu 02", () => {
    const result = generateSection02Draft(
      buildSection02GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section02Data: {
          educationFields: [
            {
              code: "79-01-C/01",
              name: "Základní škola",
              form: "denní",
              level: "základní vzdělání",
              note: "Výuka podle školního vzdělávacího programu.",
            },
          ],
          registrySource: "Veřejný rejstřík MŠMT",
          registryVerifiedAt: "15. 9. 2025",
          notes: "Údaje odpovídají interní kontrole školy.",
        },
      }),
    );

    expect(result.ready).toBe(true);
    expect(result.text).toContain(
      "02 Přehled oborů vzdělání, které škola vyučuje v souladu se zápisem ve školském rejstříku",
    );
    expect(result.text).toContain("Škola ve školním roce 2024/2025");
    expect(result.text).toContain("79-01-C/01");
    expect(result.text).toContain("Údaje byly ověřeny podle dostupných údajů ve školském rejstříku.");
  });

  it("neúplný návrh kapitoly 02 ponechá stav CHYBI_UDAJE", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "02");
    expect(sectionDef).toBeDefined();
    const section = createSectionFromDefinition(sectionDef!);
    const incompleteSection = {
      ...section,
      generatedText: `${SECTION02_INCOMPLETE_DRAFT_PREFIX}\n- Alespoň jeden obor vzdělání`,
    };
    expect(isSection02IncompleteDraft(incompleteSection.generatedText)).toBe(true);
    expect(computeSectionStatus(incompleteSection, profile)).toBe("CHYBI_UDAJE");
  });

  it("generated text workflow funguje i pro kapitolu 02", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "02");
    expect(sectionDef).toBeDefined();

    const draft = generateSection02Draft(
      buildSection02GeneratorInput({
        schoolProfile: profile,
        schoolYear: "2024/2025",
        section02Data: {
          educationFields: [{ name: "Základní škola" }],
        },
      }),
    );

    const generated = applyGeneratedDraft(createSectionFromDefinition(sectionDef!), draft.text);
    expect(generated.originalGeneratedText).toBe(draft.text);
    expect(generated.generatedText).toBe(draft.text);
    expect(computeSectionStatus(generated, profile)).toBe("VYGENEROVANO");

    const edited = saveGeneratedTextEdits(generated, "Upravená kapitola 02.");
    expect(edited.editedByUser).toBe(true);
    expect(computeSectionStatus(edited, profile)).toBe("UPRAVENO_UZIVATELEM");
  });

  it("generátory sekce 01 a 03 zůstávají beze změny", () => {
    expect(shouldUseSection02Generator("02")).toBe(true);
    expect(shouldUseSection01Generator("01")).toBe(true);
    expect(shouldUseSection03Generator("03")).toBe(true);

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
