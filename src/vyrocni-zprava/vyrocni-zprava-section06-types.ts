export type AnnualReportSection06ClassResultRow = {
  className: string;
  pupilsTotal?: number;
  classTeacher?: string;
  passedWithHonours?: number;
  passed?: number;
  failed?: number;
  notAssessed?: number;
  reducedConductGrade?: number;
  averageGrade?: number;
  excusedAbsencePerPupil?: number;
  unexcusedAbsencePerPupil?: number;
};

export type AnnualReportSection06EducationalMeasuresTerm = {
  classTeacherPraise?: number;
  principalPraise?: number;
  classTeacherWarning?: number;
  classTeacherReprimand?: number;
  principalReprimand?: number;
  secondConductGrade?: number;
  thirdConductGrade?: number;
};

export type AnnualReportSection06ExamData = {
  description?: string;
  pupilsTotal?: number;
  passed?: number;
  failed?: number;
  note?: string;
};

export type AnnualReportSection06Data = {
  firstTermClassResults: AnnualReportSection06ClassResultRow[];
  secondTermClassResults: AnnualReportSection06ClassResultRow[];
  educationalMeasures: {
    firstTerm?: AnnualReportSection06EducationalMeasuresTerm;
    secondTerm?: AnnualReportSection06EducationalMeasuresTerm;
  };
  finalExams?: AnnualReportSection06ExamData;
  maturitaExams?: AnnualReportSection06ExamData;
  absolutorium?: AnnualReportSection06ExamData;
  summaryEvaluation?: string;
  notes?: string;
};

export type Section06StorageEnvelope = {
  version: 1;
  data: AnnualReportSection06Data;
  savedAt: string | null;
};
