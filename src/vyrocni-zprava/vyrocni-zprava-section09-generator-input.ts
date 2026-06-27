import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getSection09Readiness, type Section09Readiness } from "./vyrocni-zprava-section09-data-logic";
import type { AnnualReportSection09Data } from "./vyrocni-zprava-section09-types";

export type Section09GeneratorInput = {
  schoolYear: string;
  school: {
    name?: string;
    schoolType?: string;
  };
  publicPresentation: AnnualReportSection09Data["publicPresentation"];
  schoolEvents: AnnualReportSection09Data["schoolEvents"];
  competitions: AnnualReportSection09Data["competitions"];
  projectsAndCooperation: AnnualReportSection09Data["projectsAndCooperation"];
  extraordinaryAchievements?: string;
  summaryEvaluation?: string;
  notes?: string;
  missingData: string[];
  recommendedData: string[];
  warnings: string[];
  readiness: Section09Readiness["status"];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Sestaví validovaný vstup pro generování kapitoly 09 – bez doplňování chybějících faktů. */
export function buildSection09GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section09Data: AnnualReportSection09Data;
}): Section09GeneratorInput {
  const readiness = getSection09Readiness({
    section09Data: params.section09Data,
    schoolProfile: params.schoolProfile,
  });

  return {
    schoolYear: params.schoolYear.trim(),
    school: {
      name: pickFilledString(params.schoolProfile.name),
      schoolType: pickFilledString(params.schoolProfile.schoolType),
    },
    publicPresentation: {
      description: pickFilledString(params.section09Data.publicPresentation.description),
      website: pickFilledString(params.section09Data.publicPresentation.website),
      socialMedia: pickFilledString(params.section09Data.publicPresentation.socialMedia),
      mediaOutputs: pickFilledString(params.section09Data.publicPresentation.mediaOutputs),
      cooperationWithCommunity: pickFilledString(params.section09Data.publicPresentation.cooperationWithCommunity),
      note: pickFilledString(params.section09Data.publicPresentation.note),
    },
    schoolEvents: params.section09Data.schoolEvents.map((item) => ({
      dateOrPeriod: pickFilledString(item.dateOrPeriod),
      title: pickFilledString(item.title) ?? "",
      eventType: pickFilledString(item.eventType),
      targetGroup: pickFilledString(item.targetGroup),
      description: pickFilledString(item.description),
      location: pickFilledString(item.location),
      partner: pickFilledString(item.partner),
      publicEvent: item.publicEvent,
      note: pickFilledString(item.note),
    })),
    competitions: params.section09Data.competitions.map((item) => ({
      dateOrPeriod: pickFilledString(item.dateOrPeriod),
      title: pickFilledString(item.title) ?? "",
      subjectOrArea: pickFilledString(item.subjectOrArea),
      participants: pickFilledString(item.participants),
      result: pickFilledString(item.result),
      level: pickFilledString(item.level),
      note: pickFilledString(item.note),
    })),
    projectsAndCooperation: params.section09Data.projectsAndCooperation.map((item) => ({
      title: pickFilledString(item.title) ?? "",
      type: pickFilledString(item.type),
      partner: pickFilledString(item.partner),
      period: pickFilledString(item.period),
      description: pickFilledString(item.description),
      output: pickFilledString(item.output),
      note: pickFilledString(item.note),
    })),
    extraordinaryAchievements: pickFilledString(params.section09Data.extraordinaryAchievements),
    summaryEvaluation: pickFilledString(params.section09Data.summaryEvaluation),
    notes: pickFilledString(params.section09Data.notes),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    warnings: readiness.warnings,
    readiness: readiness.status,
  };
}

export { getSection09Readiness };
