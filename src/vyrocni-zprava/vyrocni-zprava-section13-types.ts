export type AnnualReportSection13Data = {
  parentCooperation?: string;
  founderCooperation?: string;
  partners?: string;
  summaryEvaluation?: string;
  notes?: string;
};

export type Section13StorageEnvelope = {
  version: 1;
  data: AnnualReportSection13Data;
  savedAt: string | null;
};
