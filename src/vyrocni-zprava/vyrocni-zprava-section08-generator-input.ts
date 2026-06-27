import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getSection08Readiness, type Section08Readiness } from "./vyrocni-zprava-section08-data-logic";
import type { AnnualReportSection08Data } from "./vyrocni-zprava-section08-types";

export type Section08GeneratorInput = {
  schoolYear: string;
  school: {
    name?: string;
    schoolType?: string;
  };
  dvppOverview: AnnualReportSection08Data["dvppOverview"];
  qualificationStudies: AnnualReportSection08Data["qualificationStudies"];
  additionalQualificationStudies: AnnualReportSection08Data["additionalQualificationStudies"];
  professionalDevelopmentTrainings: AnnualReportSection08Data["professionalDevelopmentTrainings"];
  nonTeachingStaffDevelopment: AnnualReportSection08Data["nonTeachingStaffDevelopment"];
  selfStudy: AnnualReportSection08Data["selfStudy"];
  summaryEvaluation?: string;
  notes?: string;
  missingData: string[];
  recommendedData: string[];
  warnings: string[];
  readiness: Section08Readiness["status"];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Sestaví validovaný vstup pro generování kapitoly 08 – bez doplňování chybějících faktů. */
export function buildSection08GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section08Data: AnnualReportSection08Data;
}): Section08GeneratorInput {
  const readiness = getSection08Readiness({
    section08Data: params.section08Data,
    schoolProfile: params.schoolProfile,
  });

  return {
    schoolYear: params.schoolYear.trim(),
    school: {
      name: pickFilledString(params.schoolProfile.name),
      schoolType: pickFilledString(params.schoolProfile.schoolType),
    },
    dvppOverview: {
      description: pickFilledString(params.section08Data.dvppOverview.description),
      priorities: pickFilledString(params.section08Data.dvppOverview.priorities),
      evaluation: pickFilledString(params.section08Data.dvppOverview.evaluation),
    },
    qualificationStudies: params.section08Data.qualificationStudies.map((item) => ({
      title: pickFilledString(item.title) ?? "",
      participantGroup: pickFilledString(item.participantGroup),
      provider: pickFilledString(item.provider),
      period: pickFilledString(item.period),
      completed: item.completed,
      note: pickFilledString(item.note),
    })),
    additionalQualificationStudies: params.section08Data.additionalQualificationStudies.map((item) => ({
      title: pickFilledString(item.title) ?? "",
      participantGroup: pickFilledString(item.participantGroup),
      provider: pickFilledString(item.provider),
      period: pickFilledString(item.period),
      completed: item.completed,
      note: pickFilledString(item.note),
    })),
    professionalDevelopmentTrainings: params.section08Data.professionalDevelopmentTrainings.map((item) => ({
      title: pickFilledString(item.title) ?? "",
      topic: pickFilledString(item.topic),
      participantGroup: pickFilledString(item.participantGroup),
      provider: pickFilledString(item.provider),
      period: pickFilledString(item.period),
      hours: item.hours,
      note: pickFilledString(item.note),
    })),
    nonTeachingStaffDevelopment: params.section08Data.nonTeachingStaffDevelopment.map((item) => ({
      title: pickFilledString(item.title) ?? "",
      staffGroup: pickFilledString(item.staffGroup),
      provider: pickFilledString(item.provider),
      period: pickFilledString(item.period),
      hours: item.hours,
      note: pickFilledString(item.note),
    })),
    selfStudy: {
      description: pickFilledString(params.section08Data.selfStudy.description),
      topics: pickFilledString(params.section08Data.selfStudy.topics),
      note: pickFilledString(params.section08Data.selfStudy.note),
    },
    summaryEvaluation: pickFilledString(params.section08Data.summaryEvaluation),
    notes: pickFilledString(params.section08Data.notes),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    warnings: readiness.warnings,
    readiness: readiness.status,
  };
}

export { getSection08Readiness };
