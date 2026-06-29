import { readFileSync } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../../school-profile/school-profile-logic";
import { createDefaultAnnualReport } from "../vyrocni-zprava-logic";
import { buildAnnualReportPreview } from "../vyrocni-zprava-report-preview-builder";
import { buildAnnualReportDocxBlob } from "../vyrocni-zprava-docx-export";
import { parseVyrocniZpravaImportArrayBuffer } from "./vyrocni-zprava-xlsx-import-logic";

function setSectionText(report: ReturnType<typeof createDefaultAnnualReport>, sectionId: string, text: string) {
  return {
    ...report,
    sections: report.sections.map((section) =>
      section.id === sectionId
        ? { ...section, generatedText: text, status: "SCHVALENO", approved: true }
        : section,
    ),
  };
}

describe("vyrocni-zprava real-file import + DOCX export", () => {
  it("Komenského filled XLSX projde bez warningů a exportuje DOCX se schválením", async () => {
    const fixturePath = path.resolve(process.cwd(), "demo-vyrocni-zprava-import-komenskeho-filled.xlsx");
    const buffer = readFileSync(fixturePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const parsed = await parseVyrocniZpravaImportArrayBuffer(arrayBuffer, {
      currentProfile: createDefaultSchoolProfile(),
      sourceFileName: "demo-vyrocni-zprava-import-komenskeho-filled.xlsx",
    });

    expect(parsed.valid).toBe(true);
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.warnings).toHaveLength(0);
    expect(parsed.ignored).toHaveLength(0);
    expect(parsed.section12Data).toBeDefined();
    expect(parsed.section13Data).toBeDefined();
    expect(parsed.section14Data).toBeDefined();
    expect(parsed.publicationBlockPatch?.approvedBySchoolCouncilDate).toBeDefined();

    let report = createDefaultAnnualReport("2024/2025");
    report = {
      ...report,
      publicationBlock: {
        ...(report.publicationBlock ?? {}),
        ...(parsed.publicationBlockPatch ?? {}),
      },
    };
    report = setSectionText(report, "01", "01 Základní údaje o škole\nObsah importované kapitoly 01.");
    report = setSectionText(report, "12", "12 Projekty a granty\nObsah importované kapitoly 12.");
    report = setSectionText(report, "13", "13 Spolupráce s rodiči a partnery\nObsah importované kapitoly 13.");
    report = setSectionText(report, "14", "14 Závěr\nObsah importované kapitoly 14.");

    const schoolProfile = { ...createDefaultSchoolProfile(), ...(parsed.profilePatch ?? {}) };
    const preview = buildAnnualReportPreview({ report, schoolProfile });
    const docx = await buildAnnualReportDocxBlob(preview, { mode: "visible-generated" });
    expect(docx.exported).toBe(true);
    if (!docx.exported) return;

    const zip = await JSZip.loadAsync(await docx.blob.arrayBuffer());
    const xml = await zip.file("word/document.xml")?.async("string");
    expect(xml).toBeDefined();
    expect(xml).toContain("12 Projekty a granty");
    expect(xml).toContain("13 Spolupráce s rodiči a partnery");
    expect(xml).toContain("14 Závěr");
    expect(xml).toContain("Schválení výroční zprávy");
    if (parsed.publicationBlockPatch?.approvedBySchoolCouncilDate) {
      expect(xml).toContain(parsed.publicationBlockPatch.approvedBySchoolCouncilDate);
    }
  }, 20000);
});
