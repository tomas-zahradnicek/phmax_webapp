export type AnnualReportSection12ProjectRecord = {
  title: string;
  provider?: string;
  amount?: string;
  description?: string;
  focusAreas?: string;
};

export type AnnualReportSection12Data = {
  projects: AnnualReportSection12ProjectRecord[];
  otherPrograms?: string;
  summaryEvaluation?: string;
  notes?: string;
};

export type Section12StorageEnvelope = {
  version: 1;
  data: AnnualReportSection12Data;
  savedAt: string | null;
};
