import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getSection04Readiness, type Section04Readiness } from "./vyrocni-zprava-section04-data-logic";
import type {
  AnnualReportSection04AdmissionSummary,
  AnnualReportSection04Data,
  AnnualReportSection04GradeCount,
  AnnualReportSection04PupilCountRow,
  AnnualReportSection04SecondaryAdmission,
} from "./vyrocni-zprava-section04-types";

export type Section04GeneratorInput = {
  schoolYear: string;
  school: {
    name?: string;
    schoolType?: string;
  };
  firstGradeAdmissionCurrentYear: AnnualReportSection04AdmissionSummary;
  pupilsAdmittedDuringYear: AnnualReportSection04GradeCount[];
  pupilsLeftDuringYear: AnnualReportSection04GradeCount[];
  firstGradeEnrollmentNextYear: AnnualReportSection04AdmissionSummary;
  specialEnrollment: {
    admittedTotal?: number;
    admittedGirls?: number;
  };
  secondarySchoolAdmissions: AnnualReportSection04SecondaryAdmission[];
  pupilCountsSeptember: AnnualReportSection04PupilCountRow[];
  pupilCountsJune: AnnualReportSection04PupilCountRow[];
  notes?: string;
  missingData: string[];
  recommendedData: string[];
  warnings: string[];
  readiness: Section04Readiness["status"];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeAdmissionSummary(summary: AnnualReportSection04AdmissionSummary): AnnualReportSection04AdmissionSummary {
  return {
    firstTimeTotal: summary.firstTimeTotal,
    firstTimeGirls: summary.firstTimeGirls,
    afterDeferralTotal: summary.afterDeferralTotal,
    afterDeferralGirls: summary.afterDeferralGirls,
    enrolledTotal: summary.enrolledTotal,
    enrolledGirls: summary.enrolledGirls,
    deferralRequestsTotal: summary.deferralRequestsTotal,
    deferralRequestsGirls: summary.deferralRequestsGirls,
  };
}

function sanitizeGradeRows(rows: AnnualReportSection04GradeCount[]): AnnualReportSection04GradeCount[] {
  return rows.map((row) => ({
    grade: pickFilledString(row.grade) ?? "",
    count: row.count,
  }));
}

function sanitizeSecondaryRows(rows: AnnualReportSection04SecondaryAdmission[]): AnnualReportSection04SecondaryAdmission[] {
  return rows.map((row) => ({
    schoolType: pickFilledString(row.schoolType) ?? "",
    count: row.count,
  }));
}

function sanitizePupilRows(rows: AnnualReportSection04PupilCountRow[]): AnnualReportSection04PupilCountRow[] {
  return rows.map((row) => ({
    className: pickFilledString(row.className) ?? "",
    boys: row.boys,
    girls: row.girls,
    total: row.total,
    classTeacher: pickFilledString(row.classTeacher),
  }));
}

/** Sestaví validovaný vstup pro generování kapitoly 04 – bez vymýšlení chybějících hodnot. */
export function buildSection04GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section04Data: AnnualReportSection04Data;
}): Section04GeneratorInput {
  const readiness = getSection04Readiness({
    section04Data: params.section04Data,
    schoolProfile: params.schoolProfile,
  });

  return {
    schoolYear: params.schoolYear.trim(),
    school: {
      name: pickFilledString(params.schoolProfile.name),
      schoolType: pickFilledString(params.schoolProfile.schoolType),
    },
    firstGradeAdmissionCurrentYear: sanitizeAdmissionSummary(params.section04Data.firstGradeAdmissionCurrentYear),
    pupilsAdmittedDuringYear: sanitizeGradeRows(params.section04Data.pupilsAdmittedDuringYear),
    pupilsLeftDuringYear: sanitizeGradeRows(params.section04Data.pupilsLeftDuringYear),
    firstGradeEnrollmentNextYear: sanitizeAdmissionSummary(params.section04Data.firstGradeEnrollmentNextYear),
    specialEnrollment: {
      admittedTotal: params.section04Data.specialEnrollment.admittedTotal,
      admittedGirls: params.section04Data.specialEnrollment.admittedGirls,
    },
    secondarySchoolAdmissions: sanitizeSecondaryRows(params.section04Data.secondarySchoolAdmissions),
    pupilCountsSeptember: sanitizePupilRows(params.section04Data.pupilCountsSeptember),
    pupilCountsJune: sanitizePupilRows(params.section04Data.pupilCountsJune),
    notes: pickFilledString(params.section04Data.notes),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    warnings: readiness.warnings,
    readiness: readiness.status,
  };
}

export { getSection04Readiness };
