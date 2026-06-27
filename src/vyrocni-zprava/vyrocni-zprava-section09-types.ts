export type Section09PublicEventFlag = "ANO" | "NE" | "CASTECNE";

export type AnnualReportSection09SchoolEvent = {
  dateOrPeriod?: string;
  title: string;
  eventType?: string;
  targetGroup?: string;
  description?: string;
  location?: string;
  partner?: string;
  publicEvent?: Section09PublicEventFlag;
  note?: string;
};

export type AnnualReportSection09Competition = {
  dateOrPeriod?: string;
  title: string;
  subjectOrArea?: string;
  participants?: string;
  result?: string;
  level?: string;
  note?: string;
};

export type AnnualReportSection09ProjectOrCooperation = {
  title: string;
  type?: string;
  partner?: string;
  period?: string;
  description?: string;
  output?: string;
  note?: string;
};

export type AnnualReportSection09Data = {
  publicPresentation: {
    description?: string;
    website?: string;
    socialMedia?: string;
    mediaOutputs?: string;
    cooperationWithCommunity?: string;
    note?: string;
  };
  schoolEvents: AnnualReportSection09SchoolEvent[];
  competitions: AnnualReportSection09Competition[];
  projectsAndCooperation: AnnualReportSection09ProjectOrCooperation[];
  extraordinaryAchievements?: string;
  summaryEvaluation?: string;
  notes?: string;
};

export type Section09StorageEnvelope = {
  version: 1;
  data: AnnualReportSection09Data;
  savedAt: string | null;
};
