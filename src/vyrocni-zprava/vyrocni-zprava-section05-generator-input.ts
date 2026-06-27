import type { SchoolProfile } from "../school-profile/school-profile-types";
import { getSection05Readiness, type Section05Readiness } from "./vyrocni-zprava-section05-data-logic";
import type {
  AnnualReportSection05Data,
  AnnualReportSection05GoalEvaluation,
  AnnualReportSection05WeeklyHourRow,
} from "./vyrocni-zprava-section05-types";

export type Section05GeneratorInput = {
  schoolYear: string;
  school: {
    name?: string;
    schoolType?: string;
  };
  educationProgram: AnnualReportSection05Data["educationProgram"];
  schoolCurriculumPlan: {
    description?: string;
    weeklyHourPlan: AnnualReportSection05WeeklyHourRow[];
    note?: string;
  };
  goalsEvaluation: AnnualReportSection05GoalEvaluation[];
  overallEvaluation?: string;
  strengths?: string;
  areasForImprovement?: string;
  measuresForNextYear?: string;
  notes?: string;
  missingData: string[];
  recommendedData: string[];
  warnings: string[];
  readiness: Section05Readiness["status"];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Sestaví validovaný vstup pro generování kapitoly 05 – bez vymýšlení chybějících hodnot. */
export function buildSection05GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section05Data: AnnualReportSection05Data;
}): Section05GeneratorInput {
  const readiness = getSection05Readiness({
    section05Data: params.section05Data,
    schoolProfile: params.schoolProfile,
  });

  return {
    schoolYear: params.schoolYear.trim(),
    school: {
      name: pickFilledString(params.schoolProfile.name),
      schoolType: pickFilledString(params.schoolProfile.schoolType),
    },
    educationProgram: {
      name: pickFilledString(params.section05Data.educationProgram.name),
      applicableClasses: pickFilledString(params.section05Data.educationProgram.applicableClasses),
      note: pickFilledString(params.section05Data.educationProgram.note),
    },
    schoolCurriculumPlan: {
      description: pickFilledString(params.section05Data.schoolCurriculumPlan.description),
      weeklyHourPlan: (params.section05Data.schoolCurriculumPlan.weeklyHourPlan ?? []).map((row) => ({
        subject: pickFilledString(row.subject) ?? "",
        grade1: row.grade1,
        grade2: row.grade2,
        grade3: row.grade3,
        grade4: row.grade4,
        grade5: row.grade5,
        grade6: row.grade6,
        grade7: row.grade7,
        grade8: row.grade8,
        grade9: row.grade9,
      })),
      note: pickFilledString(params.section05Data.schoolCurriculumPlan.note),
    },
    goalsEvaluation: params.section05Data.goalsEvaluation.map((row) => ({
      goal: pickFilledString(row.goal) ?? "",
      level: row.level,
      evidence: pickFilledString(row.evidence),
      note: pickFilledString(row.note),
    })),
    overallEvaluation: pickFilledString(params.section05Data.overallEvaluation),
    strengths: pickFilledString(params.section05Data.strengths),
    areasForImprovement: pickFilledString(params.section05Data.areasForImprovement),
    measuresForNextYear: pickFilledString(params.section05Data.measuresForNextYear),
    notes: pickFilledString(params.section05Data.notes),
    missingData: readiness.missingData,
    recommendedData: readiness.recommendedData,
    warnings: readiness.warnings,
    readiness: readiness.status,
  };
}

export { getSection05Readiness };
