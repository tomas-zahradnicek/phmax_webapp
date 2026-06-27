import { VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER } from "./vyrocni-zprava-types";
import type { AnnualReportPreviewData, AnnualReportPreviewSection } from "./vyrocni-zprava-report-preview-builder";

export type DocxExportMode = "visible-generated" | "approved-only";

export type AnnualReportDocxExportSection = {
  number: string;
  title: string;
  text: string;
  approved: boolean;
};

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

export function getExportablePreviewSections(
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

export function buildDocxExportModel(
  preview: AnnualReportPreviewData,
  mode: DocxExportMode,
): AnnualReportDocxExportModel {
  const sections = getExportablePreviewSections(preview.sections, mode);
  return {
    title: "Výroční zpráva o činnosti školy",
    schoolName: pickFilledString(preview.schoolName),
    schoolYear: pickFilledString(preview.schoolYear),
    sections,
    fullText: sections.map((section) => section.text).join("\n\n\n"),
  };
}
