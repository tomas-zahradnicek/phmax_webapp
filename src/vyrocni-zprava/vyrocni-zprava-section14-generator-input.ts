import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getSection14Readiness, type Section14Readiness } from "./vyrocni-zprava-section14-data-logic";
import type { AnnualReportSection14Data } from "./vyrocni-zprava-section14-types";

export type Section14GeneratorInput = {
  schoolYear: string;
  overallEvaluation?: string;
  futurePlans?: string;
  notes?: string;
  missingData: string[];
  recommendedData: string[];
  warnings: string[];
  readiness: Section14Readiness["status"];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function buildSection14GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section14Data: AnnualReportSection14Data;
}): Section14GeneratorInput {
  const readiness = getSection14Readiness({
    section14Data: params.section14Data,
    schoolProfile: params.schoolProfile,
  });

  return {
    schoolYear: params.schoolYear.trim(),
    overallEvaluation: pickFilledString(params.section14Data.overallEvaluation),
    futurePlans: pickFilledString(params.section14Data.futurePlans),
    notes: pickFilledString(params.section14Data.notes),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    warnings: readiness.warnings,
    readiness: readiness.status,
  };
}

export { getSection14Readiness };
