export type Section05GoalLevel = "VETSINA_HODIN" | "NEKTERE_HODINY" | "NEOBJEVUJE_SE";

export type AnnualReportSection05WeeklyHourRow = {
  subject: string;
  grade1?: number;
  grade2?: number;
  grade3?: number;
  grade4?: number;
  grade5?: number;
  grade6?: number;
  grade7?: number;
  grade8?: number;
  grade9?: number;
};

export type AnnualReportSection05GoalEvaluation = {
  goal: string;
  level?: Section05GoalLevel;
  evidence?: string;
  note?: string;
};

export type AnnualReportSection05Data = {
  educationProgram: {
    name?: string;
    applicableClasses?: string;
    note?: string;
  };
  schoolCurriculumPlan: {
    description?: string;
    weeklyHourPlan?: AnnualReportSection05WeeklyHourRow[];
    note?: string;
  };
  goalsEvaluation: AnnualReportSection05GoalEvaluation[];
  overallEvaluation?: string;
  strengths?: string;
  areasForImprovement?: string;
  measuresForNextYear?: string;
  notes?: string;
};

export type Section05StorageEnvelope = {
  version: 1;
  data: AnnualReportSection05Data;
  savedAt: string | null;
};
