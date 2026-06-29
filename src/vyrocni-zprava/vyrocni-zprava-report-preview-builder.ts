import type { SchoolProfile } from "../school-profile/school-profile-types";
import type { AnnualReport, AnnualReportSectionStatus, AnnualReportPublicationBlock } from "./vyrocni-zprava-types";
import { VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER } from "./vyrocni-zprava-types";

export type AnnualReportPreviewSection = {
  number: string;
  title: string;
  status: AnnualReportSectionStatus;
  approved: boolean;
  generatedText?: string;
  missingText: boolean;
};

export type AnnualReportPreviewData = {
  title: string;
  schoolName?: string;
  schoolYear?: string;
  publicationBlock?: AnnualReportPublicationBlock;
  sections: AnnualReportPreviewSection[];
  fullText: string;
  missingSections: string[];
  unapprovedSections: string[];
  generatedSectionsCount: number;
  approvedSectionsCount: number;
  totalSectionsCount: number;
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isTopLevelSection(number: string): boolean {
  return /^\d{2}$/.test(number);
}

function isFinalGeneratedText(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  return text !== VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER.trim();
}

function sectionLabel(number: string, title: string): string {
  return `${number} ${title}`;
}

function normalizePublicationBlock(raw: AnnualReportPublicationBlock | undefined): AnnualReportPublicationBlock | undefined {
  if (!raw) return undefined;
  const normalized: AnnualReportPublicationBlock = {
    discussedByPedagogicalCouncilDate: pickFilledString(raw.discussedByPedagogicalCouncilDate),
    approvedBySchoolCouncilDate: pickFilledString(raw.approvedBySchoolCouncilDate),
    sentToFounderDate: pickFilledString(raw.sentToFounderDate),
    publishedRemotelyDate: pickFilledString(raw.publishedRemotelyDate),
    placeAndDate: pickFilledString(raw.placeAndDate),
    principalSignature: pickFilledString(raw.principalSignature),
    schoolCouncilChairSignature: pickFilledString(raw.schoolCouncilChairSignature),
  };
  return Object.values(normalized).some(Boolean) ? normalized : undefined;
}

export function hasPublicationBlockContent(block: AnnualReportPublicationBlock | undefined): boolean {
  return normalizePublicationBlock(block) !== undefined;
}

/** Sestaví náhled výroční zprávy ze současných generatedText kapitol. */
export function buildAnnualReportPreview(params: {
  report: AnnualReport;
  schoolProfile: SchoolProfile;
}): AnnualReportPreviewData {
  const topLevelSections = [...params.report.sections]
    .filter((section) => isTopLevelSection(section.number))
    .sort((a, b) => a.order - b.order);

  const sections: AnnualReportPreviewSection[] = topLevelSections.map((section) => {
    const generatedText = pickFilledString(section.generatedText);
    const hasFinalText = generatedText ? isFinalGeneratedText(generatedText) : false;
    return {
      number: section.number,
      title: section.title,
      status: section.status,
      approved: section.approved,
      generatedText: hasFinalText ? generatedText : undefined,
      missingText: !hasFinalText,
    };
  });

  const missingSections = sections.filter((section) => section.missingText).map((section) => sectionLabel(section.number, section.title));
  const unapprovedSections = sections
    .filter((section) => section.status !== "SCHVALENO")
    .map((section) => sectionLabel(section.number, section.title));

  const fullText = sections
    .filter((section) => !section.missingText && section.generatedText)
    .map((section) => section.generatedText as string)
    .join("\n\n\n");

  return {
    title: "Výroční zpráva školy",
    schoolName: pickFilledString(params.schoolProfile.name),
    schoolYear: pickFilledString(params.report.schoolYear),
    publicationBlock: normalizePublicationBlock(params.report.publicationBlock),
    sections,
    fullText,
    missingSections,
    unapprovedSections,
    generatedSectionsCount: sections.filter((section) => !section.missingText).length,
    approvedSectionsCount: sections.filter((section) => section.status === "SCHVALENO").length,
    totalSectionsCount: sections.length,
  };
}
