import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  PageOrientation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import type { AnnualReportPreviewData } from "./vyrocni-zprava-report-preview-builder";
import { hasPublicationBlockContent } from "./vyrocni-zprava-report-preview-builder";
import {
  getStructuredDocxBlocksForSection,
  type AnnualReportDocxStructuredData,
  type DocxStructuredBlock,
} from "./docx/vyrocni-zprava-docx-structured-tables";
import {
  buildDocxExportModel,
  createAnnualReportDocxFileName,
  getDocxExportGuard,
  parseGeneratedTextForDocx,
  stripDuplicateDocxSectionHeading,
  type AnnualReportDocxExportModel,
  type DocxParsedBlock,
  type DocxExportMode,
} from "./vyrocni-zprava-docx-export-logic";
import type { AnnualReportPublicationBlock } from "./vyrocni-zprava-types";

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

function buildTable(
  rows: string[][],
  options?: {
    layout?: "default" | "wide";
    columnWidthsPercent?: number[];
    boldBodyRowIndices?: number[];
  },
): Table {
  const isWide = options?.layout === "wide";
  const fontSize = isWide ? 16 : 22;
  const columnWidths = options?.columnWidthsPercent;
  const boldBodyRows = new Set(options?.boldBodyRowIndices ?? []);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: rows.map(
      (row, rowIndex) =>
        new TableRow({
          children: row.map(
            (cell, cellIndex) =>
              new TableCell({
                width:
                  columnWidths && columnWidths[cellIndex] !== undefined
                    ? { size: columnWidths[cellIndex], type: WidthType.PERCENTAGE }
                    : undefined,
                margins: isWide ? { top: 60, bottom: 60, left: 60, right: 60 } : undefined,
                children: [
                  new Paragraph({
                    spacing: { after: isWide ? 60 : 120 },
                    children: [
                      new TextRun({
                        text: cell || " ",
                        bold: rowIndex === 0 || boldBodyRows.has(rowIndex - 1),
                        size: fontSize,
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
    return buildTable(block.rows, {
      layout: block.layout,
      columnWidthsPercent: block.columnWidthsPercent,
      boldBodyRowIndices: block.boldBodyRowIndices,
    });
  }
  return paragraphFromLine(block.text);
}

type DocxPageOrientation = "portrait" | "landscape";

type DocxDocumentSectionChunk = {
  orientation: DocxPageOrientation;
  children: Array<Paragraph | Table>;
};

function getBlockPageOrientation(block: DocxParsedBlock): DocxPageOrientation {
  if (block.type === "table" && block.pageOrientation === "landscape") return "landscape";
  return "portrait";
}

function appendToDocumentSection(
  sections: DocxDocumentSectionChunk[],
  block: DocxParsedBlock,
): void {
  const orientation = getBlockPageOrientation(block);
  const current = sections[sections.length - 1];
  if (!current || current.orientation !== orientation) {
    sections.push({ orientation, children: [renderParsedBlock(block)] });
    return;
  }
  current.children.push(renderParsedBlock(block));
}

function buildApprovalBlockEndParagraphs(
  block: AnnualReportPublicationBlock | undefined,
  schoolYear?: string,
): Paragraph[] {
  if (!hasPublicationBlockContent(block) || !block) return [];
  const paragraphs: Paragraph[] = [
    new Paragraph({ pageBreakBefore: true, text: " " }),
    headingParagraph("Schválení výroční zprávy", HeadingLevel.HEADING_2),
  ];

  if (schoolYear && block.discussedByPedagogicalCouncilDate) {
    paragraphs.push(
      paragraphFromLine(
        `Výroční zpráva o činnosti školy za školní rok ${schoolYear} byla projednána pedagogickou radou dne ${block.discussedByPedagogicalCouncilDate}.`,
      ),
    );
  } else if (block.discussedByPedagogicalCouncilDate) {
    paragraphs.push(
      paragraphFromLine(`Výroční zpráva byla projednána pedagogickou radou dne ${block.discussedByPedagogicalCouncilDate}.`),
    );
  }

  if (block.approvedBySchoolCouncilDate) {
    paragraphs.push(
      paragraphFromLine(`Školská rada výroční zprávu schválila dne ${block.approvedBySchoolCouncilDate}.`),
    );
  }

  if (block.placeAndDate) {
    paragraphs.push(paragraphFromLine(block.placeAndDate));
  }

  paragraphs.push(paragraphFromLine(""));

  if (block.principalSignature) {
    paragraphs.push(paragraphFromLine(block.principalSignature));
    paragraphs.push(paragraphFromLine("ředitel/ka školy"));
  }

  paragraphs.push(paragraphFromLine(""));
  paragraphs.push(paragraphFromLine(""));

  if (block.schoolCouncilChairSignature) {
    paragraphs.push(paragraphFromLine(block.schoolCouncilChairSignature));
    paragraphs.push(paragraphFromLine("předseda/předsedkyně školské rady"));
  }

  return paragraphs;
}

function normalizeHeading(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function toParsedBlocksFromStructured(blocks: DocxStructuredBlock[]): DocxParsedBlock[] {
  return blocks.map((block) => {
    if (block.type === "heading") {
      return { type: "heading", text: block.text, level: block.level === 3 ? "H3" : "H2" };
    }
    if (block.type === "table") {
      return {
        type: "table",
        rows: [block.headers, ...block.rows],
        layout: block.layout,
        columnWidthsPercent: block.columnWidthsPercent,
        boldBodyRowIndices: block.boldBodyRowIndices,
        pageOrientation: block.pageOrientation,
      };
    }
    return { type: "paragraph", text: block.text };
  });
}

function mergeStructuredSubsectionsIntoParsedBlocks(
  parsedBlocks: DocxParsedBlock[],
  structuredBlocks: DocxStructuredBlock[],
): DocxParsedBlock[] {
  if (structuredBlocks.length === 0) return parsedBlocks;
  const structuredParsed = toParsedBlocksFromStructured(structuredBlocks);
  const byHeading = new Map<string, DocxParsedBlock[]>();

  for (let index = 0; index < structuredParsed.length; index += 1) {
    const block = structuredParsed[index]!;
    if (block.type !== "heading" || block.level !== "H3") continue;
    const headingKey = normalizeHeading(block.text);
    const collected: DocxParsedBlock[] = [block];
    for (let i = index + 1; i < structuredParsed.length; i += 1) {
      const next = structuredParsed[i]!;
      if (next.type === "heading" && next.level === "H3") break;
      collected.push(next);
    }
    byHeading.set(headingKey, collected);
  }

  if (byHeading.size === 0) return parsedBlocks;

  const usedHeadings = new Set<string>();
  const merged: DocxParsedBlock[] = [];
  for (let i = 0; i < parsedBlocks.length; i += 1) {
    const block = parsedBlocks[i]!;
    if (block.type === "heading" && block.level === "H3") {
      const headingKey = normalizeHeading(block.text);
      const replacement = byHeading.get(headingKey);
      if (replacement) {
        usedHeadings.add(headingKey);
        merged.push(...replacement);
        for (let skip = i + 1; skip < parsedBlocks.length; skip += 1) {
          const next = parsedBlocks[skip]!;
          if (next.type === "heading") {
            i = skip - 1;
            break;
          }
          if (skip === parsedBlocks.length - 1) i = parsedBlocks.length;
        }
        continue;
      }
    }
    merged.push(block);
  }

  for (const [headingKey, replacement] of byHeading) {
    if (!usedHeadings.has(headingKey)) {
      merged.push(...replacement);
    }
  }

  return merged;
}

function appendParagraphToDocumentSection(
  sections: DocxDocumentSectionChunk[],
  paragraph: Paragraph,
  orientation: DocxPageOrientation = "portrait",
): void {
  const current = sections[sections.length - 1];
  if (!current || current.orientation !== orientation) {
    sections.push({ orientation, children: [paragraph] });
    return;
  }
  current.children.push(paragraph);
}

function buildDocxDocumentSections(model: AnnualReportDocxExportModel): DocxDocumentSectionChunk[] {
  const sections: DocxDocumentSectionChunk[] = [];

  appendParagraphToDocumentSection(sections, headingParagraph(model.title, HeadingLevel.HEADING_1));
  if (model.schoolName) appendParagraphToDocumentSection(sections, paragraphFromLine(`Škola: ${model.schoolName}`));
  if (model.schoolYear) appendParagraphToDocumentSection(sections, paragraphFromLine(`Školní rok: ${model.schoolYear}`));
  appendParagraphToDocumentSection(sections, paragraphFromLine("Dokument byl vytvořen v aplikaci Ředitelský průvodce."));
  appendParagraphToDocumentSection(sections, new Paragraph({ pageBreakBefore: true, text: " " }));

  model.sections.forEach((section, index) => {
    appendParagraphToDocumentSection(
      sections,
      headingParagraph(`${section.number} ${section.title}`, HeadingLevel.HEADING_2, index > 0),
    );

    const sectionTextForRendering = stripDuplicateDocxSectionHeading(section);
    const parsedBlocks = parseGeneratedTextForDocx(sectionTextForRendering);
    const structuredBlocks = getStructuredDocxBlocksForSection(section.number, model.structuredData);
    const mergedBlocks = mergeStructuredSubsectionsIntoParsedBlocks(parsedBlocks, structuredBlocks);
    for (const block of mergedBlocks) {
      appendToDocumentSection(sections, block);
    }
  });

  for (const paragraph of buildApprovalBlockEndParagraphs(model.publicationBlock, model.schoolYear)) {
    appendParagraphToDocumentSection(sections, paragraph);
  }

  return sections.filter((section) => section.children.length > 0);
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
  options?: { mode?: DocxExportMode; structuredData?: AnnualReportDocxStructuredData },
): Promise<{ exported: boolean; reason?: "NO_SECTIONS" | "STALE_GENERATED_TEXT"; staleSections?: string[] }> {
  const built = await buildAnnualReportDocxBlob(preview, options);
  if (!built.exported) return built;
  triggerDocxDownload(built.blob, built.filename);
  return { exported: true };
}

export async function buildAnnualReportDocxBlob(
  preview: AnnualReportPreviewData,
  options?: { mode?: DocxExportMode; structuredData?: AnnualReportDocxStructuredData },
): Promise<
  | { exported: boolean; reason?: "NO_SECTIONS" | "STALE_GENERATED_TEXT"; staleSections?: string[]; blob: Blob; filename: string }
  | { exported: false; reason: "NO_SECTIONS" | "STALE_GENERATED_TEXT"; staleSections?: string[] }
> {
  const mode = options?.mode ?? "visible-generated";
  const guard = getDocxExportGuard(preview, mode);
  if (!guard.ok) {
    return { exported: false, reason: "STALE_GENERATED_TEXT", staleSections: guard.staleSections };
  }
  const model = buildDocxExportModel(preview, mode, { structuredData: options?.structuredData });
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
    sections: buildDocxDocumentSections(model).map((section) => ({
      properties: {
        page: {
          size: {
            orientation: section.orientation === "landscape" ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
          },
        },
      },
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
      children: section.children,
    })),
  });
  const blob = await Packer.toBlob(doc);
  const filename = createAnnualReportDocxFileName({
    schoolName: model.schoolName,
    schoolYear: model.schoolYear,
  });
  return { exported: true, blob, filename };
}
