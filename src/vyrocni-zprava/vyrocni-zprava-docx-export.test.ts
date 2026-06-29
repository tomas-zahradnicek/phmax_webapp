import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { createDefaultAnnualReport } from "./vyrocni-zprava-logic";
import { VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER } from "./vyrocni-zprava-types";
import { buildAnnualReportPreview } from "./vyrocni-zprava-report-preview-builder";
import { createDefaultSection06Data } from "./vyrocni-zprava-section06-data-logic";
import {
  buildDocxExportModel,
  createAnnualReportDocxFileName,
  detectDocxHeadingLevel,
  getDocxExportSections,
  parseGeneratedTextForDocx,
  stripDuplicateDocxSectionHeading,
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

  it("model může nést structured data bez mutace generatedText", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = setSection(report, "06", {
      generatedText: "06 Nadpis\n6.1 Souhrnná statistika tříd 1. pololetí školního roku\nText.",
      status: "VYGENEROVANO",
      approved: false,
    });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: createDefaultSchoolProfile(),
    });
    const section06 = createDefaultSection06Data();
    section06.firstTermClassResults = [{ className: "1.A", pupilsTotal: 20, averageGrade: 1.18 }];
    const model = buildDocxExportModel(preview, "visible-generated", { structuredData: { section06Data: section06 } });
    expect(model.structuredData?.section06Data?.firstTermClassResults[0]?.averageGrade).toBe(1.18);
    expect(preview.sections.find((item) => item.number === "06")?.generatedText).toContain("6.1 Souhrnná statistika tříd 1. pololetí školního roku");
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

  it("detekce tabulky vyžaduje validní markdown tabulku", () => {
    expect(shouldRenderAsTable(["Název | Částka", "--- | ---", "Grant A | 120 000 Kč"])).toBe(true);
    expect(shouldRenderAsTable(["- Název: grant", "- Částka: 120 000 Kč"])).toBe(false);
    expect(shouldRenderAsTable(["- Akce (partner: obec)", "- Soutěž (výsledek: postup)"])).toBe(false);
    expect(shouldRenderAsTable(["Název | Částka", "--- | ---", "Grant A | 120 000 Kč | navíc"])).toBe(false);
    expect(shouldRenderAsTable(["Název | Částka", "Grant A | 120 000 Kč"])).toBe(false);
  });

  it("parser generovaného textu vrací heading, table i paragraph bloky", () => {
    const blocks = parseGeneratedTextForDocx([
      "9.1 Přehled",
      "Název | Částka",
      "--- | ---",
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

  it("v DOCX renderingu se odstraní duplicitní první řádek nadpisu kapitoly", () => {
    const section = {
      number: "01",
      title: "Základní údaje o škole",
      text: "01 Základní údaje o škole\n\nObsah kapitoly.",
      approved: false,
    } as const;
    const result = stripDuplicateDocxSectionHeading(section);
    expect(result).toBe("Obsah kapitoly.");
  });

  it("odstraní i variantní nadpis začínající stejným číslem kapitoly", () => {
    const section = {
      number: "06",
      title: "Údaje o výsledcích vzdělávání žáků podle cílů stanovených vzdělávacími programy",
      text:
        "06 Údaje o výsledcích vzdělávání žáků podle cílů stanovených vzdělávacími programy a podle poskytovaného stupně vzdělání\n\nObsah kapitoly.",
      approved: false,
    } as const;
    const result = stripDuplicateDocxSectionHeading(section);
    expect(result).toBe("Obsah kapitoly.");
  });

  it("jiný první řádek zůstane zachován", () => {
    const section = {
      number: "01",
      title: "Základní údaje o škole",
      text: "Úvodní shrnutí\n01 Základní údaje o škole",
      approved: false,
    } as const;
    const result = stripDuplicateDocxSectionHeading(section);
    expect(result).toBe("Úvodní shrnutí\n01 Základní údaje o škole");
  });

  it("uložený generatedText se při odstraňování duplicity nemění", () => {
    const section = {
      number: "01",
      title: "Základní údaje o škole",
      text: "01 Základní údaje o škole\nObsah.",
      approved: false,
    } as const;
    const original = section.text;
    stripDuplicateDocxSectionHeading(section);
    expect(section.text).toBe(original);
  });

  it("detekuje třístupňové podkapitoly jako H3", () => {
    expect(detectDocxHeadingLevel("8.1.1 Studium ke splnění kvalifikačních předpokladů")).toBe("H3");
    expect(detectDocxHeadingLevel("8.1.2 Studium ke splnění dalších kvalifikačních předpokladů")).toBe("H3");
    expect(detectDocxHeadingLevel("8.1.3 Studium k prohlubování odborné kvalifikace")).toBe("H3");
  });

  it("parseGeneratedTextForDocx rozpozná 8.1.1–8.1.3 jako nadpisy", () => {
    const blocks = parseGeneratedTextForDocx(
      [
        "8.1 Další vzdělávání pedagogických pracovníků",
        "Popis DVPP.",
        "8.1.1 Studium ke splnění kvalifikačních předpokladů",
        "- Studium A",
        "8.1.2 Studium ke splnění dalších kvalifikačních předpokladů",
        "- Studium B",
        "8.1.3 Studium k prohlubování odborné kvalifikace",
        "- Workshop",
      ].join("\n"),
    );
    expect(blocks.filter((block) => block.type === "heading").map((block) => (block.type === "heading" ? block.text : ""))).toEqual([
      "8.1 Další vzdělávání pedagogických pracovníků",
      "8.1.1 Studium ke splnění kvalifikačních předpokladů",
      "8.1.2 Studium ke splnění dalších kvalifikačních předpokladů",
      "8.1.3 Studium k prohlubování odborné kvalifikace",
    ]);
  });

  it("model exportu předá volitelný blok schválení včetně podpisu předsedy školské rady", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = {
      ...report,
      publicationBlock: {
        discussedByPedagogicalCouncilDate: "10. 6. 2025",
        approvedBySchoolCouncilDate: "18. 6. 2025",
        placeAndDate: "Praha 4, dne 20. 6. 2025",
        principalSignature: "Mgr. Eva Králová",
        schoolCouncilChairSignature: "Ing. Petr Novotný",
      },
    };
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: createDefaultSchoolProfile(),
    });
    const model = buildDocxExportModel(preview, "visible-generated");
    expect(model.publicationBlock?.discussedByPedagogicalCouncilDate).toBe("10. 6. 2025");
    expect(model.publicationBlock?.approvedBySchoolCouncilDate).toBe("18. 6. 2025");
    expect(model.publicationBlock?.placeAndDate).toBe("Praha 4, dne 20. 6. 2025");
    expect(model.publicationBlock?.principalSignature).toBe("Mgr. Eva Králová");
    expect(model.publicationBlock?.schoolCouncilChairSignature).toBe("Ing. Petr Novotný");
  });
});
