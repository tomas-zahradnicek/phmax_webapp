import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { createDefaultAnnualReport } from "./vyrocni-zprava-logic";
import { VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER } from "./vyrocni-zprava-types";
import { buildAnnualReportPreview } from "./vyrocni-zprava-report-preview-builder";
import {
  buildDocxExportModel,
  createAnnualReportDocxFileName,
  detectDocxHeadingLevel,
  getDocxExportSections,
  parseGeneratedTextForDocx,
  shouldRenderAsTable,
} from "./vyrocni-zprava-docx-export-logic";

function setSection(
  report: ReturnType<typeof createDefaultAnnualReport>,
  sectionId: string,
  patch: Record<string, unknown>,
) {
  return {
    ...report,
    sections: report.sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)),
  };
}

describe("vyrocni-zprava-docx-export-logic", () => {
  it("model exportu používá generatedText, nikoli originalGeneratedText", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = setSection(report, "01", {
      generatedText: "Aktuální upravený text.",
      originalGeneratedText: "Původní text.",
      status: "UPRAVENO_UZIVATELEM",
      approved: false,
    });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: { ...createDefaultSchoolProfile(), name: "ZŠ Ukázková" },
    });
    const model = buildDocxExportModel(preview, "visible-generated");
    expect(model.fullText).toContain("Aktuální upravený text.");
    expect(model.fullText).not.toContain("Původní text.");
  });

  it("generování názvu souboru funguje pro české znaky", () => {
    const filename = createAnnualReportDocxFileName({
      schoolName: "ZŠ a MŠ Příklad",
      schoolYear: "2024/2025",
    });
    expect(filename).toBe("vyrocni-zprava-zs-a-ms-priklad-2024-2025.docx");
  });

  it("prázdný náhled nemá exportovatelné kapitoly", () => {
    const preview = buildAnnualReportPreview({
      report: createDefaultAnnualReport("2024/2025"),
      schoolProfile: createDefaultSchoolProfile(),
    });
    const sections = getDocxExportSections(preview.sections, "visible-generated");
    expect(sections).toEqual([]);
  });

  it("režim approved-only filtruje pouze schválené kapitoly", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = setSection(report, "01", {
      generatedText: "Text schválené kapitoly.",
      status: "SCHVALENO",
      approved: true,
    });
    report = setSection(report, "02", {
      generatedText: "Text neschválené kapitoly.",
      status: "VYGENEROVANO",
      approved: false,
    });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: createDefaultSchoolProfile(),
    });
    const model = buildDocxExportModel(preview, "approved-only");
    expect(model.sections).toHaveLength(1);
    expect(model.sections[0]?.number).toBe("01");
  });

  it("placeholder text se neexportuje", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = setSection(report, "06", {
      generatedText: VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER,
      status: "VYGENEROVANO",
      approved: false,
    });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: createDefaultSchoolProfile(),
    });
    const model = buildDocxExportModel(preview, "visible-generated");
    expect(model.sections.find((item) => item.number === "06")).toBeUndefined();
  });

  it("ručně upravený generatedText je exportován", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = setSection(report, "03", {
      generatedText: "Ručně upravená verze kapitoly 03.",
      originalGeneratedText: "Původní verze kapitoly 03.",
      editedByUser: true,
      status: "UPRAVENO_UZIVATELEM",
    });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: createDefaultSchoolProfile(),
    });
    const model = buildDocxExportModel(preview, "visible-generated");
    expect(model.fullText).toContain("Ručně upravená verze kapitoly 03.");
  });

  it("pořadí exportovaných kapitol odpovídá pořadí náhledu", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = setSection(report, "02", { generatedText: "Text 02", status: "VYGENEROVANO" });
    report = setSection(report, "01", { generatedText: "Text 01", status: "VYGENEROVANO" });
    report = setSection(report, "04", { generatedText: "Text 04", status: "VYGENEROVANO" });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: createDefaultSchoolProfile(),
    });
    const sections = getDocxExportSections(preview.sections, "visible-generated");
    expect(sections.map((section) => section.number)).toEqual(["01", "02", "04"]);
  });

  it("detekce nadpisu rozlišuje kapitolu a podkapitolu", () => {
    expect(detectDocxHeadingLevel("09 Údaje o aktivitách školy")).toBe("H2");
    expect(detectDocxHeadingLevel("9.1 Akce školy")).toBe("H3");
    expect(detectDocxHeadingLevel("Běžný odstavec textu")).toBeUndefined();
  });

  it("detekce tabulky je konzervativní a vyžaduje konzistentní sloupce", () => {
    expect(shouldRenderAsTable(["Název | Částka", "Grant A | 120 000 Kč"])).toBe(true);
    expect(shouldRenderAsTable(["Název | Částka", "Nejasný řádek bez oddělovače"])).toBe(false);
    expect(shouldRenderAsTable(["Pouze jeden řádek | 1"])).toBe(false);
  });

  it("parser generovaného textu vrací heading, table i paragraph bloky", () => {
    const blocks = parseGeneratedTextForDocx([
      "9.1 Přehled",
      "Název | Částka",
      "Grant A | 120 000 Kč",
      "",
      "Souhrnný komentář.",
    ].join("\n"));

    expect(blocks[0]).toEqual({
      type: "heading",
      level: "H3",
      text: "9.1 Přehled",
    });
    expect(blocks[1]).toEqual({
      type: "table",
      rows: [
        ["Název", "Částka"],
        ["Grant A", "120 000 Kč"],
      ],
    });
    expect(blocks[2]).toEqual({
      type: "paragraph",
      text: "Souhrnný komentář.",
    });
  });
});
