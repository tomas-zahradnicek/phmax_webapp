import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getSection12Readiness, type Section12Readiness } from "./vyrocni-zprava-section12-data-logic";
import type { AnnualReportSection12Data } from "./vyrocni-zprava-section12-types";

export type Section12GeneratorInput = {
  schoolYear: string;
  projects: AnnualReportSection12Data["projects"];
  otherPrograms?: string;
  summaryEvaluation?: string;
  notes?: string;
  missingData: string[];
  recommendedData: string[];
  warnings: string[];
  readiness: Section12Readiness["status"];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function buildSection12GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section12Data: AnnualReportSection12Data;
}): Section12GeneratorInput {
  const readiness = getSection12Readiness({
    section12Data: params.section12Data,
    schoolProfile: params.schoolProfile,
  });

  return {
    schoolYear: params.schoolYear.trim(),
    projects: params.section12Data.projects.filter((row) => pickFilledString(row.title)),
    otherPrograms: pickFilledString(params.section12Data.otherPrograms),
    summaryEvaluation: pickFilledString(params.section12Data.summaryEvaluation),
    notes: pickFilledString(params.section12Data.notes),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    warnings: readiness.warnings,
    readiness: readiness.status,
  };
}

export { getSection12Readiness };
