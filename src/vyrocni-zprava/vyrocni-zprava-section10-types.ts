export type Section10InspectionActivityStatus = "PROBEHLA" | "NEPROBEHLA" | "NEUVEDENO";

export type AnnualReportSection10InspectionRecord = {
  dateOrPeriod?: string;
  inspectionType?: string;
  subject?: string;
  reportReference?: string;
  reportUrl?: string;
  mainFindings?: string;
  conclusions?: string;
  adoptedMeasures?: string;
  note?: string;
};

export type AnnualReportSection10Data = {
  inspectionActivityStatus?: Section10InspectionActivityStatus;
  inspections: AnnualReportSection10InspectionRecord[];
  noInspectionStatement?: string;
  summaryEvaluation?: string;
  notes?: string;
};

export type Section10StorageEnvelope = {
  version: 1;
  data: AnnualReportSection10Data;
  savedAt: string | null;
};
