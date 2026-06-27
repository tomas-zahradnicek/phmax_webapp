export type AnnualReportSection02EducationField = {
  code?: string;
  name: string;
  form?: string;
  level?: string;
  note?: string;
};

export type AnnualReportSection02Data = {
  educationFields: AnnualReportSection02EducationField[];
  registrySource?: string;
  registryVerifiedAt?: string;
  notes?: string;
};

export type Section02StorageEnvelope = {
  version: 1;
  data: AnnualReportSection02Data;
  savedAt: string | null;
};
