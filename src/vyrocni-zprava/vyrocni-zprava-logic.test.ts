import { describe, expect, it } from "vitest";
import { createDefaultAnnualReport, computeSectionStatus, refreshAllSections } from "./vyrocni-zprava-logic";
import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER } from "./vyrocni-zprava-types";

describe("vyrocni-zprava-logic", () => {
  it("0G-0: createDefaultAnnualReport() má prázdný schoolYear", () => {
    expect(createDefaultAnnualReport().schoolYear).toBe("");
  });

  it("0G-0: explicitní schoolYear argument zůstává beze změny", () => {
    expect(createDefaultAnnualReport("2024/2025").schoolYear).toBe("2024/2025");
    expect(createDefaultAnnualReport("2025/2026").schoolYear).toBe("2025/2026");
  });

  it("vrátí NEVYPLNENO pro prázdnou kapitolu", () => {
    const profile = createDefaultSchoolProfile();
    const report = createDefaultAnnualReport();
    const section = report.sections.find((item) => item.id === "1.3");
    expect(section).toBeDefined();
    expect(computeSectionStatus(section!, profile)).toBe("NEVYPLNENO");
  });

  it("vrátí CHYBI_UDAJE při částečně vyplněných údajích", () => {
    const profile = {
      ...createDefaultSchoolProfile(),
      address: "Hlavní 1",
    };
    const report = refreshAllSections(createDefaultAnnualReport(), profile);
    const section = report.sections.find((item) => item.id === "1.2");
    expect(section).toBeDefined();
    expect(computeSectionStatus(section!, profile)).toBe("CHYBI_UDAJE");
    expect(section!.missingFields).toContain("Obec");
  });

  it("vrátí PRIPRAVENO při vyplněných požadovaných údajích", () => {
    const profile = {
      ...createDefaultSchoolProfile(),
      name: "ZŠ Ukázková",
    };
    const report = refreshAllSections(createDefaultAnnualReport(), profile);
    const section = report.sections.find((item) => item.id === "1.1");
    expect(section).toBeDefined();
    expect(computeSectionStatus(section!, profile)).toBe("PRIPRAVENO");
  });

  it("vrátí VYGENEROVANO při neprázdném generatedText", () => {
    const profile = createDefaultSchoolProfile();
    const report = createDefaultAnnualReport();
    const section = report.sections.find((item) => item.id === "05");
    expect(section).toBeDefined();
    const withDraft = {
      ...section!,
      generatedText: VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER,
      editedByUser: false,
    };
    expect(computeSectionStatus(withDraft, profile)).toBe("VYGENEROVANO");
  });

  it("vrátí UPRAVENO_UZIVATELEM po ruční úpravě", () => {
    const profile = createDefaultSchoolProfile();
    const section = createDefaultAnnualReport().sections.find((item) => item.id === "05");
    expect(section).toBeDefined();
    const edited = {
      ...section!,
      generatedText: "Upravený text kapitoly.",
      editedByUser: true,
    };
    expect(computeSectionStatus(edited, profile)).toBe("UPRAVENO_UZIVATELEM");
  });

  it("vrátí SCHVALENO při approved", () => {
    const profile = createDefaultSchoolProfile();
    const report = createDefaultAnnualReport();
    const section = report.sections.find((item) => item.id === "08");
    expect(section).toBeDefined();
    const approved = { ...section!, approved: true };
    expect(computeSectionStatus(approved, profile)).toBe("SCHVALENO");
  });
});
