import { VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER } from "./vyrocni-zprava-types";
import type { AnnualReportPreviewData, AnnualReportPreviewSection } from "./vyrocni-zprava-report-preview-builder";

export type DocxExportMode = "visible-generated" | "approved-only";

export type AnnualReportDocxExportSection = {
  number: string;
  title: string;
  text: string;
  approved: boolean;
};

export type DocxHeadingLevel = "H2" | "H3";

export type DocxParsedHeadingBlock = {
  type: "heading";
  text: string;
  level: DocxHeadingLevel;
};

export type DocxParsedParagraphBlock = {
  type: "paragraph";
  text: string;
};

export type DocxParsedTableBlock = {
  type: "table";
  rows: string[][];
};

export type DocxParsedBlock = DocxParsedHeadingBlock | DocxParsedParagraphBlock | DocxParsedTableBlock;

export type AnnualReportDocxExportModel = {
  title: string;
  schoolName?: string;
  schoolYear?: string;
  sections: AnnualReportDocxExportSection[];
  fullText: string;
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isFinalText(value: string | undefined): value is string {
  const text = pickFilledString(value);
  if (!text) return false;
  return text !== VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER.trim();
}

function toAsciiSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function createAnnualReportDocxFileName(params: {
  schoolName?: string;
  schoolYear?: string;
}): string {
  const namePart = toAsciiSlug(params.schoolName ?? "") || "skola";
  const yearPart = toAsciiSlug(params.schoolYear ?? "") || "rok";
  return `vyrocni-zprava-${namePart}-${yearPart}.docx`;
}

export function getDocxExportSections(
  sections: AnnualReportPreviewSection[],
  mode: DocxExportMode,
): AnnualReportDocxExportSection[] {
  const withText = sections.filter((section) => isFinalText(section.generatedText));
  const filtered = mode === "approved-only" ? withText.filter((section) => section.status === "SCHVALENO") : withText;
  return filtered.map((section) => ({
    number: section.number,
    title: section.title,
    text: section.generatedText!.trim(),
    approved: section.approved,
  }));
}

function splitTableCellsFromLine(line: string): string[] {
  const source = line.trim();
  if (!source) return [];

  if (source.includes("|")) {
    return source
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
  }

  if (source.includes("\t")) {
    return source
      .split("\t")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
  }

  if (source.includes(";")) {
    return source
      .split(";")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
  }

  return [];
}

export function shouldRenderAsTable(lines: string[]): boolean {
  const cleaned = lines.map((line) => line.trim()).filter((line) => line.length > 0);
  if (cleaned.length < 2) return false;

  const parsedRows = cleaned.map(splitTableCellsFromLine);
  if (parsedRows.some((row) => row.length < 2)) return false;

  const columnCount = parsedRows[0]!.length;
  if (columnCount < 2 || columnCount > 8) return false;
  if (parsedRows.some((row) => row.length !== columnCount)) return false;

  return true;
}

export function detectDocxHeadingLevel(line: string): DocxHeadingLevel | undefined {
  const trimmed = line.trim();
  if (!trimmed) return undefined;

  if (/^\d{1,2}\.\d{1,2}\s+\S+/.test(trimmed)) {
    return "H3";
  }

  if (/^\d{2}\s+\S+/.test(trimmed)) {
    return "H2";
  }

  return undefined;
}

function pushParagraphLines(target: DocxParsedBlock[], lines: string[]): void {
  for (const line of lines) {
    const text = line.trim();
    if (text.length > 0) {
      target.push({ type: "paragraph", text });
    }
  }
}

export function parseGeneratedTextForDocx(text: string): DocxParsedBlock[] {
  const normalizedLines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd());

  const blocks: DocxParsedBlock[] = [];
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const nonEmptyLines = buffer.map((line) => line.trim()).filter((line) => line.length > 0);
    if (nonEmptyLines.length === 0) {
      buffer = [];
      return;
    }

    if (shouldRenderAsTable(nonEmptyLines)) {
      blocks.push({
        type: "table",
        rows: nonEmptyLines.map(splitTableCellsFromLine),
      });
    } else {
      pushParagraphLines(blocks, nonEmptyLines);
    }
    buffer = [];
  };

  for (const line of normalizedLines) {
    const headingLevel = detectDocxHeadingLevel(line);
    if (headingLevel) {
      flushBuffer();
      blocks.push({
        type: "heading",
        text: line.trim(),
        level: headingLevel,
      });
      continue;
    }

    if (line.trim().length === 0) {
      flushBuffer();
      continue;
    }

    buffer.push(line);
  }

  flushBuffer();
  return blocks;
}

export function buildDocxExportModel(
  preview: AnnualReportPreviewData,
  mode: DocxExportMode,
): AnnualReportDocxExportModel {
  const sections = getDocxExportSections(preview.sections, mode);
  return {
    title: "Výroční zpráva o činnosti školy",
    schoolName: pickFilledString(preview.schoolName),
    schoolYear: pickFilledString(preview.schoolYear),
    sections,
    fullText: sections.map((section) => section.text).join("\n\n\n"),
  };
}

export const getExportablePreviewSections = getDocxExportSections;
