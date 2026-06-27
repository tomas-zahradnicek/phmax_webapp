import { Document, HeadingLevel, Packer, Paragraph } from "docx";

import type { AnnualReportPreviewData } from "./vyrocni-zprava-report-preview-builder";
import {
  buildDocxExportModel,
  createAnnualReportDocxFileName,
  type AnnualReportDocxExportModel,
  type DocxExportMode,
} from "./vyrocni-zprava-docx-export-logic";

function paragraphFromLine(line: string): Paragraph {
  return new Paragraph({
    text: line.length > 0 ? line : " ",
  });
}

function buildDocxParagraphs(model: AnnualReportDocxExportModel): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({ text: model.title, heading: HeadingLevel.HEADING_1 }),
  ];

  if (model.schoolName) paragraphs.push(new Paragraph({ text: `Škola: ${model.schoolName}` }));
  if (model.schoolYear) paragraphs.push(new Paragraph({ text: `Školní rok: ${model.schoolYear}` }));

  paragraphs.push(new Paragraph({ text: "Dokument byl vytvořen v aplikaci Ředitelský průvodce." }));
  paragraphs.push(new Paragraph({ text: " " }));

  for (const section of model.sections) {
    paragraphs.push(new Paragraph({ text: `${section.number} ${section.title}`, heading: HeadingLevel.HEADING_2 }));
    for (const line of section.text.split(/\r?\n/)) {
      paragraphs.push(paragraphFromLine(line));
    }
    paragraphs.push(new Paragraph({ text: " " }));
  }

  return paragraphs;
}

function triggerDocxDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportAnnualReportPreviewToDocx(
  preview: AnnualReportPreviewData,
  options?: { mode?: DocxExportMode },
): Promise<{ exported: boolean; reason?: "NO_SECTIONS" }> {
  const mode = options?.mode ?? "visible-generated";
  const model = buildDocxExportModel(preview, mode);
  if (model.sections.length === 0) {
    return { exported: false, reason: "NO_SECTIONS" };
  }

  const doc = new Document({
    sections: [
      {
        children: buildDocxParagraphs(model),
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  const filename = createAnnualReportDocxFileName({
    schoolName: model.schoolName,
    schoolYear: model.schoolYear,
  });
  triggerDocxDownload(blob, filename);
  return { exported: true };
}
