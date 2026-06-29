import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getSection06Readiness, type Section06Readiness } from "./vyrocni-zprava-section06-data-logic";
import type {
  AnnualReportSection06ClassResultRow,
  AnnualReportSection06Data,
  AnnualReportSection06ExamData,
} from "./vyrocni-zprava-section06-types";

export type Section06GeneratorInput = {
  schoolYear: string;
  school: {
    name?: string;
    schoolType?: string;
  };
  firstTermClassResults: AnnualReportSection06ClassResultRow[];
  secondTermClassResults: AnnualReportSection06ClassResultRow[];
  educationalMeasures: AnnualReportSection06Data["educationalMeasures"];
  finalExams?: AnnualReportSection06ExamData;
  maturitaExams?: AnnualReportSection06ExamData;
  absolutorium?: AnnualReportSection06ExamData;
  summaryEvaluation?: string;
  notes?: string;
  missingData: string[];
  recommendedData: string[];
  warnings: string[];
  readiness: Section06Readiness["status"];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isMeaningfulExamText(value: string | undefined): boolean {
  const text = pickFilledString(value);
  if (!text) return false;
  const normalized = text.toLowerCase();
  return normalized !== "0" && normalized !== "—" && normalized !== "-" && normalized !== "neuvedeno";
}

function sanitizeClassRows(rows: AnnualReportSection06ClassResultRow[]): AnnualReportSection06ClassResultRow[] {
  return rows.map((row) => ({
    className: pickFilledString(row.className) ?? "",
    pupilsTotal: row.pupilsTotal,
    classTeacher: pickFilledString(row.classTeacher),
    passedWithHonours: row.passedWithHonours,
    passed: row.passed,
    failed: row.failed,
    notAssessed: row.notAssessed,
    reducedConductGrade: row.reducedConductGrade,
    averageGrade: row.averageGrade,
    excusedAbsencePerPupil: row.excusedAbsencePerPupil,
    unexcusedAbsencePerPupil: row.unexcusedAbsencePerPupil,
  }));
}

function sanitizeExam(exam?: AnnualReportSection06ExamData): AnnualReportSection06ExamData | undefined {
  if (!exam) return undefined;
  const sanitized: AnnualReportSection06ExamData = {
    description: pickFilledString(exam.description),
    pupilsTotal: exam.pupilsTotal,
    passed: exam.passed,
    failed: exam.failed,
    note: pickFilledString(exam.note),
  };
  const hasMeaningfulNumericValue =
    (sanitized.pupilsTotal !== undefined && sanitized.pupilsTotal !== 0) ||
    (sanitized.passed !== undefined && sanitized.passed !== 0) ||
    (sanitized.failed !== undefined && sanitized.failed !== 0);
  const hasMeaningfulTextValue = isMeaningfulExamText(sanitized.description) || isMeaningfulExamText(sanitized.note);
  if (
    !hasMeaningfulTextValue &&
    !hasMeaningfulNumericValue
  ) {
    return undefined;
  }
  if (!isMeaningfulExamText(sanitized.description)) {
    sanitized.description = undefined;
  }
  if (!isMeaningfulExamText(sanitized.note)) {
    sanitized.note = undefined;
  }
  return sanitized;
}

/** Sestaví validovaný vstup pro generování kapitoly 06 – bez vymýšlení chybějících hodnot. */
export function buildSection06GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section06Data: AnnualReportSection06Data;
}): Section06GeneratorInput {
  const readiness = getSection06Readiness({
    section06Data: params.section06Data,
    schoolProfile: params.schoolProfile,
  });
  return {
    schoolYear: params.schoolYear.trim(),
    school: {
      name: pickFilledString(params.schoolProfile.name),
      schoolType: pickFilledString(params.schoolProfile.schoolType),
    },
    firstTermClassResults: sanitizeClassRows(params.section06Data.firstTermClassResults),
    secondTermClassResults: sanitizeClassRows(params.section06Data.secondTermClassResults),
    educationalMeasures: params.section06Data.educationalMeasures,
    finalExams: sanitizeExam(params.section06Data.finalExams),
    maturitaExams: sanitizeExam(params.section06Data.maturitaExams),
    absolutorium: sanitizeExam(params.section06Data.absolutorium),
    summaryEvaluation: pickFilledString(params.section06Data.summaryEvaluation),
    notes: pickFilledString(params.section06Data.notes),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    warnings: readiness.warnings,
    readiness: readiness.status,
  };
}

export { getSection06Readiness };
