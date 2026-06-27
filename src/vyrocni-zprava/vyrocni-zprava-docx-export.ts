import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import type { AnnualReportPreviewData } from "./vyrocni-zprava-report-preview-builder";
import {
  buildDocxExportModel,
  createAnnualReportDocxFileName,
  parseGeneratedTextForDocx,
  type AnnualReportDocxExportModel,
  type DocxParsedBlock,
  type DocxExportMode,
} from "./vyrocni-zprava-docx-export-logic";

function paragraphFromLine(line: string): Paragraph {
  return new Paragraph({
    spacing: { after: 180 },
    children: [new TextRun({ text: line.length > 0 ? line : " ", size: 22 })],
  });
}

type DocxHeadingName = "Heading1" | "Heading2" | "Heading3";

function headingParagraph(text: string, heading: DocxHeadingName, pageBreakBefore = false): Paragraph {
  return new Paragraph({
    heading,
    pageBreakBefore,
    spacing: { after: 200 },
    children: [new TextRun({ text, size: heading === HeadingLevel.HEADING_1 ? 36 : heading === HeadingLevel.HEADING_2 ? 30 : 26 })],
  });
}

function buildTable(rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row, rowIndex) =>
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                children: [
                  new Paragraph({
                    spacing: { after: 120 },
                    children: [
                      new TextRun({
                        text: cell || " ",
                        bold: rowIndex === 0,
                        size: 22,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
    ),
  });
}

function renderParsedBlock(block: DocxParsedBlock): Paragraph | Table {
  if (block.type === "heading") {
    return headingParagraph(
      block.text,
      block.level === "H2" ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
      false,
    );
  }
  if (block.type === "table") {
    return buildTable(block.rows);
  }
  return paragraphFromLine(block.text);
}

function buildDocxElements(model: AnnualReportDocxExportModel): Array<Paragraph | Table> {
  const elements: Array<Paragraph | Table> = [
    headingParagraph(model.title, HeadingLevel.HEADING_1),
  ];

  if (model.schoolName) elements.push(paragraphFromLine(`Škola: ${model.schoolName}`));
  if (model.schoolYear) elements.push(paragraphFromLine(`Školní rok: ${model.schoolYear}`));

  elements.push(paragraphFromLine("Dokument byl vytvořen v aplikaci Ředitelský průvodce."));
  elements.push(new Paragraph({ pageBreakBefore: true, text: " " }));

  model.sections.forEach((section, index) => {
    elements.push(headingParagraph(`${section.number} ${section.title}`, HeadingLevel.HEADING_2, index > 0));
    const parsedBlocks = parseGeneratedTextForDocx(section.text);
    for (const block of parsedBlocks) {
      elements.push(renderParsedBlock(block));
    }
    elements.push(new Paragraph({ spacing: { after: 240 }, text: " " }));
  });

  return elements;
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
    styles: {
      default: {
        document: {
          run: {
            size: 22,
            font: "Calibri",
          },
          paragraph: {
            spacing: {
              after: 180,
            },
          },
        },
      },
    },
    sections: [
      {
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Výroční zpráva o činnosti školy", size: 18 })],
              }),
            ],
          }),
        },
        children: buildDocxElements(model),
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
