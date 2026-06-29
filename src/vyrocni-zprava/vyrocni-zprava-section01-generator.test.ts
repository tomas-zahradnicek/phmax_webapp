import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import type { SchoolProfile } from "../school-profile/school-profile-types";
import {
  applyGeneratedDraft,
  saveGeneratedTextEdits,
} from "./vyrocni-zprava-generated-text-logic";
import { computeSectionStatus, createSectionFromDefinition } from "./vyrocni-zprava-logic";
import { ANNUAL_REPORT_SECTION_DEFINITIONS } from "./vyrocni-zprava-section-definitions";
import {
  createDefaultSection01Data,
  getSection01Readiness,
} from "./vyrocni-zprava-section01-data-logic";
import { buildSection01GeneratorInput } from "./vyrocni-zprava-section01-generator-input";
import {
  SECTION01_INCOMPLETE_DRAFT_PREFIX,
  generateSection01Draft,
  isSection01IncompleteDraft,
} from "./vyrocni-zprava-section01-local-generator";
import {
  shouldUseSection01Generator,
} from "./vyrocni-zprava-section01-generator-service";
import { shouldUseSection03Generator } from "./vyrocni-zprava-section03-generator-service";
import {
  SECTION03_INCOMPLETE_DRAFT_PREFIX,
  generateSection03Draft,
} from "./vyrocni-zprava-section03-local-generator";
import { buildSection03GeneratorInput } from "./vyrocni-zprava-section03-generator-input";
import { getAnnualReportCalculatorData } from "./vyrocni-zprava-calculator-data-bridge";
import { createDefaultPersonnelData } from "./vyrocni-zprava-personnel-logic";

function createCompleteSchoolProfileForSection01(): SchoolProfile {
  return {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Ukázková",
    address: "Ukázková 1",
    municipality: "Praha 4",
    region: "Hlavní město Praha",
    founder: "Statutární město Praha",
    principalName: "Mgr. Jan Novák",
    website: "https://www.zsukazkova.cz",
    email: "skola@zsukazkova.cz",
    schoolType: "Základní škola",
  };
}

describe("vyrocni-zprava-section01-generator", () => {
  const completeProfile = createCompleteSchoolProfileForSection01();
  const defaultSection01Data = createDefaultSection01Data();

  it("buildSection01GeneratorInput nevymýšlí chybějící hodnoty", () => {
    const input = buildSection01GeneratorInput({
      schoolProfile: createDefaultSchoolProfile(),
      schoolYear: "2024/2025",
      sectionInputs: defaultSection01Data,
    });

    expect(input.schoolProfile.name).toBeUndefined();
    expect(input.schoolProfile.address).toBeUndefined();
    expect(input.sectionInputs.schoolCharacteristic).toBeUndefined();
    expect(input.readiness).toBe("CHYBI_UDAJE");
    expect(input.missingData.length).toBeGreaterThan(0);
  });

  it("chybějící povinné údaje z profilu školy blokují finální generování", () => {
    const input = buildSection01GeneratorInput({
      schoolProfile: {
        ...createDefaultSchoolProfile(),
        name: "ZŠ Ukázková",
        schoolType: "Základní škola",
      },
      schoolYear: "2024/2025",
      sectionInputs: defaultSection01Data,
    });

    const result = generateSection01Draft(input);
    expect(result.ready).toBe(false);
    expect(result.text.startsWith(SECTION01_INCOMPLETE_DRAFT_PREFIX)).toBe(true);
    expect(result.text).toContain("Sídlo školy");
    expect(result.text).not.toContain("01 Základní údaje o škole");
    expect(result.text).not.toContain("1.1 Název školy");
  });

  it("úplný profil vygeneruje kapitolu 01 s podkapitolami 1.1–1.8", () => {
    const input = buildSection01GeneratorInput({
      schoolProfile: completeProfile,
      schoolYear: "2024/2025",
      sectionInputs: {
        ...defaultSection01Data,
        schoolCharacteristic: "Základní škola s rozšířenou výukou jazyků.",
        schoolParts: "ZŠ, školní jídelna",
        schoolCapacity: "420 žáků",
        schoolCouncilInfo: "Školská rada má 9 členů.",
      },
    });

    const result = generateSection01Draft(input);
    expect(result.ready).toBe(true);
    expect(result.text).toContain("01 Základní údaje o škole");
    expect(result.text).toContain("1.1 Název školy");
    expect(result.text).toContain("1.2 Sídlo školy");
    expect(result.text).toContain("1.3 Charakteristika školy");
    expect(result.text).toContain("1.4 Zřizovatel školy");
    expect(result.text).toContain("1.5 Údaje o vedení školy");
    expect(result.text).toContain("1.6 Adresa pro dálkový přístup");
    expect(result.text).toContain("1.7 Údaje o školské radě");
    expect(result.text).toContain("1.8 Materiálně-technické podmínky");
    expect(result.text).toContain("ZŠ Ukázková");
    expect(result.text).toContain("Statutární město Praha");
    expect(result.text).toContain("Mgr. Jan Novák");
    expect(result.text).toContain("skola@zsukazkova.cz");
  });

  it("materialTechnicalConditions se promítne do podkapitoly 1.8", () => {
    const result = generateSection01Draft(
      buildSection01GeneratorInput({
        schoolProfile: completeProfile,
        schoolYear: "2024/2025",
        sectionInputs: {
          ...defaultSection01Data,
          materialTechnicalConditions: "Škola disponuje modernizovanými učebnami a počítačovou učebnou.",
        },
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("1.8 Materiálně-technické podmínky");
    expect(result.text).toContain("modernizovanými učebnami");
  });

  it("typ školy se v generovaném textu zobrazí lidsky čitelně", () => {
    const result = generateSection01Draft(
      buildSection01GeneratorInput({
        schoolProfile: { ...completeProfile, schoolType: "ZAKLADNI_SKOLA" },
        schoolYear: "2024/2025",
        sectionInputs: defaultSection01Data,
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("Typ školy: Základní škola.");
    expect(result.text).not.toContain("ZAKLADNI_SKOLA");
  });

  it("doporučené chybějící údaje neblokují generování a jsou uvedeny v readiness", () => {
    const readiness = getSection01Readiness({
      schoolProfile: completeProfile,
      section01Data: defaultSection01Data,
    });

    expect(readiness.status).toBe("PRIPRAVENO");
    expect(readiness.missingData).toEqual([]);
    expect(readiness.recommendedData).toContain("IČO");
    expect(readiness.recommendedData).toContain("Charakteristika školy");

    const result = generateSection01Draft(
      buildSection01GeneratorInput({
        schoolProfile: completeProfile,
        schoolYear: "2024/2025",
        sectionInputs: defaultSection01Data,
      }),
    );
    expect(result.ready).toBe(true);
    expect(result.text).toContain("Pro tuto podkapitolu nejsou v podkladech uvedeny doplňující údaje.");
  });

  it("nezdvojuje ředitelku ani web při shodných doplňujících údajích", () => {
    const result = generateSection01Draft(
      buildSection01GeneratorInput({
        schoolProfile: completeProfile,
        schoolYear: "2024/2025",
        sectionInputs: {
          ...defaultSection01Data,
          leadershipInfo: "Ředitelka školy: Mgr. Jan Novák.",
          remoteAccessInfo: "https://www.zsukazkova.cz",
        },
      }),
    );
    expect(result.ready).toBe(true);
    expect((result.text.match(/Mgr\. Jan Novák/g) ?? []).length).toBe(1);
    expect((result.text.match(/https:\/\/www\.zsukazkova\.cz/g) ?? []).length).toBe(1);
  });

  it("neúplný návrh kapitoly 01 ponechá stav CHYBI_UDAJE", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "01");
    expect(sectionDef).toBeDefined();
    const section = createSectionFromDefinition(sectionDef!);
    const incompleteSection = {
      ...section,
      generatedText: `${SECTION01_INCOMPLETE_DRAFT_PREFIX}\n- Název školy`,
    };
    expect(isSection01IncompleteDraft(incompleteSection.generatedText)).toBe(true);
    expect(computeSectionStatus(incompleteSection, completeProfile)).toBe("CHYBI_UDAJE");
  });

  it("generovaný text workflow funguje i pro kapitolu 01", () => {
    const sectionDef = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === "01");
    expect(sectionDef).toBeDefined();
    const draft = generateSection01Draft(
      buildSection01GeneratorInput({
        schoolProfile: completeProfile,
        schoolYear: "2024/2025",
        sectionInputs: defaultSection01Data,
      }),
    );

    const generated = applyGeneratedDraft(createSectionFromDefinition(sectionDef!), draft.text);
    expect(generated.originalGeneratedText).toBe(draft.text);
    expect(generated.generatedText).toBe(draft.text);
    expect(computeSectionStatus(generated, completeProfile)).toBe("VYGENEROVANO");

    const edited = saveGeneratedTextEdits(generated, "Upravená kapitola 01.");
    expect(edited.editedByUser).toBe(true);
    expect(computeSectionStatus(edited, completeProfile)).toBe("UPRAVENO_UZIVATELEM");
  });

  it("generátor kapitoly 03 zůstává beze změny", () => {
    expect(shouldUseSection01Generator("01")).toBe(true);
    expect(shouldUseSection01Generator("1.3")).toBe(true);
    expect(shouldUseSection03Generator("03")).toBe(true);

    const section03Input = buildSection03GeneratorInput({
      schoolProfile: completeProfile,
      schoolYear: "2024/2025",
      personnelData: createDefaultPersonnelData(),
      calculatorData: getAnnualReportCalculatorData(),
    });
    const section03Draft = generateSection03Draft(section03Input);
    expect(section03Draft.ready).toBe(false);
    expect(section03Draft.text.startsWith(SECTION03_INCOMPLETE_DRAFT_PREFIX)).toBe(true);
  });
});
