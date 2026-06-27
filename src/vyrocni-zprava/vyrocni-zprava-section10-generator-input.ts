import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getSection10Readiness, type Section10Readiness } from "./vyrocni-zprava-section10-data-logic";
import type { AnnualReportSection10Data } from "./vyrocni-zprava-section10-types";

export type Section10GeneratorInput = {
  schoolYear: string;
  school: {
    name?: string;
    schoolType?: string;
  };
  inspectionActivityStatus?: AnnualReportSection10Data["inspectionActivityStatus"];
  inspections: AnnualReportSection10Data["inspections"];
  noInspectionStatement?: string;
  summaryEvaluation?: string;
  notes?: string;
  missingData: string[];
  recommendedData: string[];
  warnings: string[];
  readiness: Section10Readiness["status"];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Sestaví validovaný vstup pro generování kapitoly 10 – bez doplňování chybějících faktů. */
export function buildSection10GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section10Data: AnnualReportSection10Data;
}): Section10GeneratorInput {
  const readiness = getSection10Readiness({
    section10Data: params.section10Data,
    schoolProfile: params.schoolProfile,
  });

  return {
    schoolYear: params.schoolYear.trim(),
    school: {
      name: pickFilledString(params.schoolProfile.name),
      schoolType: pickFilledString(params.schoolProfile.schoolType),
    },
    inspectionActivityStatus: params.section10Data.inspectionActivityStatus,
    inspections: params.section10Data.inspections.map((item) => ({
      dateOrPeriod: pickFilledString(item.dateOrPeriod),
      inspectionType: pickFilledString(item.inspectionType),
      subject: pickFilledString(item.subject),
      reportReference: pickFilledString(item.reportReference),
      reportUrl: pickFilledString(item.reportUrl),
      mainFindings: pickFilledString(item.mainFindings),
      conclusions: pickFilledString(item.conclusions),
      adoptedMeasures: pickFilledString(item.adoptedMeasures),
      note: pickFilledString(item.note),
    })),
    noInspectionStatement: pickFilledString(params.section10Data.noInspectionStatement),
    summaryEvaluation: pickFilledString(params.section10Data.summaryEvaluation),
    notes: pickFilledString(params.section10Data.notes),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    warnings: readiness.warnings,
    readiness: readiness.status,
  };
}

export { getSection10Readiness };
