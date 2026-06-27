export type Section08StudyCompleted = "ANO" | "NE" | "PROBIHA";

export type AnnualReportSection08QualificationStudy = {
  title: string;
  participantGroup?: string;
  provider?: string;
  period?: string;
  completed?: Section08StudyCompleted;
  note?: string;
};

export type AnnualReportSection08ProfessionalDevelopmentTraining = {
  title: string;
  topic?: string;
  participantGroup?: string;
  provider?: string;
  period?: string;
  hours?: number;
  note?: string;
};

export type AnnualReportSection08NonTeachingStaffDevelopment = {
  title: string;
  staffGroup?: string;
  provider?: string;
  period?: string;
  hours?: number;
  note?: string;
};

export type AnnualReportSection08Data = {
  dvppOverview: {
    description?: string;
    priorities?: string;
    evaluation?: string;
  };
  qualificationStudies: AnnualReportSection08QualificationStudy[];
  additionalQualificationStudies: AnnualReportSection08QualificationStudy[];
  professionalDevelopmentTrainings: AnnualReportSection08ProfessionalDevelopmentTraining[];
  nonTeachingStaffDevelopment: AnnualReportSection08NonTeachingStaffDevelopment[];
  selfStudy: {
    description?: string;
    topics?: string;
    note?: string;
  };
  summaryEvaluation?: string;
  notes?: string;
};

export type Section08StorageEnvelope = {
  version: 1;
  data: AnnualReportSection08Data;
  savedAt: string | null;
};
