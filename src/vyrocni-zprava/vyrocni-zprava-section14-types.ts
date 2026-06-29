export type AnnualReportSection14Data = {
  overallEvaluation?: string;
  futurePlans?: string;
  notes?: string;
};

export type Section14StorageEnvelope = {
  version: 1;
  data: AnnualReportSection14Data;
  savedAt: string | null;
};
