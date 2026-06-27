import { describe, expect, it, beforeEach, vi } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import {
  REGENERATE_EDITED_SECTION_CONFIRM,
  applyGeneratedDraft,
  approveSectionDraft,
  restoreOriginalGeneratedDraft,
  saveGeneratedTextEdits,
  shouldConfirmRegenerate,
} from "./vyrocni-zprava-generated-text-logic";
import {
  computeSectionStatus,
  createDefaultAnnualReport,
  createSectionFromDefinition,
  refreshAllSections,
} from "./vyrocni-zprava-logic";
import { ANNUAL_REPORT_SECTION_DEFINITIONS } from "./vyrocni-zprava-section-definitions";
import {
  SECTION03_INCOMPLETE_DRAFT_PREFIX,
  generateSection03Draft,
} from "./vyrocni-zprava-section03-local-generator";
import { buildSection03GeneratorInput } from "./vyrocni-zprava-section03-generator-input";
import { getAnnualReportCalculatorData } from "./vyrocni-zprava-calculator-data-bridge";
import { createDefaultPersonnelData } from "./vyrocni-zprava-personnel-logic";
import {
  VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER,
} from "./vyrocni-zprava-types";
import {
  VYROCNI_ZPRAVA_LS_KEY,
  clearVyrocniZpravaStorage,
  loadVyrocniZpravaStorage,
  saveVyrocniZpravaStorage,
} from "./vyrocni-zprava-storage";

function sectionById(id: string) {
  const definition = ANNUAL_REPORT_SECTION_DEFINITIONS.find((item) => item.id === id);
  if (!definition) throw new Error(`Missing section ${id}`);
  return createSectionFromDefinition(definition);
}

describe("vyrocni-zprava-generated-text-logic", () => {
  const profile = createDefaultSchoolProfile();

  it("uloží vygenerovaný návrh do originalGeneratedText i generatedText", () => {
    const section = sectionById("05");
    const next = applyGeneratedDraft(section, VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER);
    expect(next.generatedText).toBe(VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER);
    expect(next.originalGeneratedText).toBe(VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER);
    expect(next.editedByUser).toBe(false);
    expect(computeSectionStatus(next, profile)).toBe("VYGENEROVANO");
  });

  it("ruční úprava nastaví stav UPRAVENO_UZIVATELEM", () => {
    const generated = applyGeneratedDraft(sectionById("05"), "Původní návrh kapitoly.");
    const edited = saveGeneratedTextEdits(generated, "Upravený návrh kapitoly.");
    expect(edited.editedByUser).toBe(true);
    expect(edited.originalGeneratedText).toBe("Původní návrh kapitoly.");
    expect(computeSectionStatus(edited, profile)).toBe("UPRAVENO_UZIVATELEM");
  });

  it("schválení upraveného textu nastaví SCHVALENO", () => {
    const edited = saveGeneratedTextEdits(
      applyGeneratedDraft(sectionById("05"), "Návrh kapitoly."),
      "Návrh po úpravě.",
    );
    const approved = approveSectionDraft(edited);
    expect(approved.approved).toBe(true);
    expect(approved.approvedAt).toBeTruthy();
    expect(computeSectionStatus(approved, profile)).toBe("SCHVALENO");
  });

  it("úprava schválené kapitoly zruší schválení", () => {
    const approved = approveSectionDraft(
      applyGeneratedDraft(sectionById("05"), "Schválený návrh."),
    );
    const edited = saveGeneratedTextEdits(approved, "Nová verze po schválení.");
    expect(edited.approved).toBe(false);
    expect(edited.approvedAt).toBeNull();
    expect(computeSectionStatus(edited, profile)).toBe("UPRAVENO_UZIVATELEM");
  });

  it("obnoví poslední generovaný návrh z originalGeneratedText", () => {
    const generated = applyGeneratedDraft(sectionById("05"), "Původní generovaný text.");
    const edited = saveGeneratedTextEdits(generated, "Ručně upravený text.");
    const restored = restoreOriginalGeneratedDraft(edited);
    expect(restored?.generatedText).toBe("Původní generovaný text.");
    expect(restored?.editedByUser).toBe(false);
    expect(computeSectionStatus(restored!, profile)).toBe("VYGENEROVANO");
  });

  it("regenerace upravené kapitoly vyžaduje potvrzení", () => {
    const edited = saveGeneratedTextEdits(
      applyGeneratedDraft(sectionById("03"), "Původní kapitola 03."),
      "Upravená kapitola 03.",
    );
    expect(shouldConfirmRegenerate(edited)).toBe(true);
    expect(REGENERATE_EDITED_SECTION_CONFIRM).toContain("ručně upraven");
  });

  it("nové vygenerování resetuje editedByUser", () => {
    const edited = saveGeneratedTextEdits(
      applyGeneratedDraft(sectionById("05"), "Starý návrh."),
      "Upravený návrh.",
    );
    const regenerated = applyGeneratedDraft(edited, "Nový generovaný návrh.");
    expect(regenerated.editedByUser).toBe(false);
    expect(regenerated.originalGeneratedText).toBe("Nový generovaný návrh.");
    expect(regenerated.generatedText).toBe("Nový generovaný návrh.");
    expect(shouldConfirmRegenerate(regenerated)).toBe(false);
  });
});

describe("vyrocni-zprava-generated-text persistence", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
    });
    clearVyrocniZpravaStorage();
  });

  it("po reloadu zachová ručně upravený text", () => {
    const profile = createDefaultSchoolProfile();
    const report = refreshAllSections(createDefaultAnnualReport(), profile);
    const section = report.sections.find((item) => item.id === "05");
    expect(section).toBeDefined();

    const edited = saveGeneratedTextEdits(
      applyGeneratedDraft(section!, "Generovaný návrh."),
      "Finální verze po úpravě ředitele.",
    );
    const sections = report.sections.map((item) => (item.id === "05" ? edited : item));
    const nextReport = refreshAllSections({ ...report, sections }, profile);

    saveVyrocniZpravaStorage({
      version: 1,
      report: nextReport,
      selectedSectionId: "05",
    });

    const loaded = loadVyrocniZpravaStorage();
    const loadedSection = loaded.report.sections.find((item) => item.id === "05");
    expect(loadedSection?.generatedText).toBe("Finální verze po úpravě ředitele.");
    expect(loadedSection?.originalGeneratedText).toBe("Generovaný návrh.");
    expect(loadedSection?.editedByUser).toBe(true);
    expect(loadedSection?.status).toBe("UPRAVENO_UZIVATELEM");
    expect(VYROCNI_ZPRAVA_LS_KEY).toBe("vyrocni-zprava-state-v1");
  });
});

describe("section 03 generation with editable workflow", () => {
  const profile = {
    ...createDefaultSchoolProfile(),
    name: "ZŠ Ukázková",
  };

  it("neúplná kapitola 03 zůstane CHYBI_UDAJE i po vygenerování", () => {
    const input = buildSection03GeneratorInput({
      schoolProfile: profile,
      schoolYear: "2024/2025",
      personnelData: createDefaultPersonnelData(),
      calculatorData: getAnnualReportCalculatorData(),
    });
    const draft = generateSection03Draft(input);
    const section = applyGeneratedDraft(sectionById("03"), draft.text);
    expect(section.generatedText.startsWith(SECTION03_INCOMPLETE_DRAFT_PREFIX)).toBe(true);
    expect(computeSectionStatus(section, profile)).toBe("CHYBI_UDAJE");
  });

  it("generování mimo kapitolu 03 zůstává placeholder", () => {
    const section = applyGeneratedDraft(sectionById("05"), VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER);
    expect(section.generatedText).toBe(VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER);
    expect(computeSectionStatus(section, profile)).toBe("VYGENEROVANO");
  });
});
