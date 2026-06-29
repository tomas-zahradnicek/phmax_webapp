import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getSection13Readiness, type Section13Readiness } from "./vyrocni-zprava-section13-data-logic";
import type { AnnualReportSection13Data } from "./vyrocni-zprava-section13-types";

export type Section13GeneratorInput = {
  schoolYear: string;
  parentCooperation?: string;
  founderCooperation?: string;
  partners?: string;
  summaryEvaluation?: string;
  notes?: string;
  missingData: string[];
  recommendedData: string[];
  warnings: string[];
  readiness: Section13Readiness["status"];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function buildSection13GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section13Data: AnnualReportSection13Data;
}): Section13GeneratorInput {
  const readiness = getSection13Readiness({
    section13Data: params.section13Data,
    schoolProfile: params.schoolProfile,
  });

  return {
    schoolYear: params.schoolYear.trim(),
    parentCooperation: pickFilledString(params.section13Data.parentCooperation),
    founderCooperation: pickFilledString(params.section13Data.founderCooperation),
    partners: pickFilledString(params.section13Data.partners),
    summaryEvaluation: pickFilledString(params.section13Data.summaryEvaluation),
    notes: pickFilledString(params.section13Data.notes),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    warnings: readiness.warnings,
    readiness: readiness.status,
  };
}

export { getSection13Readiness };
