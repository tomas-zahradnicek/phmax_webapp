export type AnnualReportSection04AdmissionSummary = {
  firstTimeTotal?: number;
  firstTimeGirls?: number;
  afterDeferralTotal?: number;
  afterDeferralGirls?: number;
  enrolledTotal?: number;
  enrolledGirls?: number;
  deferralRequestsTotal?: number;
  deferralRequestsGirls?: number;
};

export type AnnualReportSection04GradeCount = {
  grade: string;
  count?: number;
};

export type AnnualReportSection04SecondaryAdmission = {
  schoolType: string;
  count?: number;
};

export type AnnualReportSection04PupilCountRow = {
  className: string;
  boys?: number;
  girls?: number;
  total?: number;
  classTeacher?: string;
};

export type AnnualReportSection04Data = {
  firstGradeAdmissionCurrentYear: AnnualReportSection04AdmissionSummary;
  pupilsAdmittedDuringYear: AnnualReportSection04GradeCount[];
  pupilsLeftDuringYear: AnnualReportSection04GradeCount[];
  firstGradeEnrollmentNextYear: AnnualReportSection04AdmissionSummary;
  specialEnrollment: {
    admittedTotal?: number;
    admittedGirls?: number;
  };
  secondarySchoolAdmissions: AnnualReportSection04SecondaryAdmission[];
  pupilCountsSeptember: AnnualReportSection04PupilCountRow[];
  pupilCountsJune: AnnualReportSection04PupilCountRow[];
  notes?: string;
};

export type Section04StorageEnvelope = {
  version: 1;
  data: AnnualReportSection04Data;
  savedAt: string | null;
};
