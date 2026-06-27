import type { AnnualReportSection } from "./vyrocni-zprava-types";

export const REGENERATE_EDITED_SECTION_CONFIRM =
  "Text kapitoly byl ručně upraven. Nové vygenerování může přepsat vaše úpravy. Chcete pokračovat?";

export function shouldConfirmRegenerate(section: AnnualReportSection): boolean {
  return section.editedByUser === true;
}

export function hasGeneratedDraft(section: AnnualReportSection): boolean {
  return Boolean(section.generatedText.trim() || section.originalGeneratedText?.trim());
}

export function hasRestorableOriginalDraft(section: AnnualReportSection): boolean {
  const original = section.originalGeneratedText?.trim() ?? "";
  if (!original) return false;
  return section.generatedText !== section.originalGeneratedText;
}

export function applyGeneratedDraft(
  section: AnnualReportSection,
  generatedText: string,
  now = new Date().toISOString(),
): AnnualReportSection {
  return {
    ...section,
    generatedText,
    originalGeneratedText: generatedText,
    editedByUser: false,
    approved: false,
    approvedAt: null,
    updatedAt: now,
  };
}

export function saveGeneratedTextEdits(
  section: AnnualReportSection,
  generatedText: string,
  now = new Date().toISOString(),
): AnnualReportSection {
  return {
    ...section,
    generatedText,
    editedByUser: true,
    approved: false,
    approvedAt: null,
    updatedAt: now,
  };
}

export function restoreOriginalGeneratedDraft(
  section: AnnualReportSection,
  now = new Date().toISOString(),
): AnnualReportSection | null {
  const original = section.originalGeneratedText;
  if (!original?.trim()) return null;

  return {
    ...section,
    generatedText: original,
    editedByUser: false,
    approved: false,
    approvedAt: null,
    updatedAt: now,
  };
}

export function approveSectionDraft(
  section: AnnualReportSection,
  now = new Date().toISOString(),
): AnnualReportSection {
  if (!section.generatedText.trim()) return section;

  return {
    ...section,
    approved: true,
    approvedAt: now,
    updatedAt: now,
  };
}

export function mergeSavedSectionFields(
  base: AnnualReportSection,
  saved: Partial<AnnualReportSection>,
): AnnualReportSection {
  return {
    ...base,
    userNotes: saved.userNotes ?? base.userNotes,
    generatedText: saved.generatedText ?? base.generatedText,
    originalGeneratedText: saved.originalGeneratedText ?? base.originalGeneratedText,
    editedByUser: saved.editedByUser ?? base.editedByUser,
    approved: saved.approved ?? base.approved,
    approvedAt: saved.approvedAt ?? base.approvedAt,
    updatedAt: saved.updatedAt ?? base.updatedAt,
  };
}
