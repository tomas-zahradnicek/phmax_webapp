import type { SchoolProfile } from "../school-profile/school-profile-types";
import type {
  AnnualReportSection08Data,
  AnnualReportSection08NonTeachingStaffDevelopment,
  AnnualReportSection08ProfessionalDevelopmentTraining,
  AnnualReportSection08QualificationStudy,
  Section08StudyCompleted,
} from "./vyrocni-zprava-section08-types";

export const VYROCNI_ZPRAVA_SECTION08_LS_KEY = "vyrocni-zprava-section08-data-v1";

export type Section08Readiness = {
  status: "CHYBI_UDAJE" | "PRIPRAVENO";
  missingData: string[];
  recommendedData: string[];
  availableData: string[];
  warnings: string[];
};

function pickFilledString(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeOptionalText(value: unknown): string | undefined {
  return typeof value === "string" ? pickFilledString(value) : undefined;
}

function sanitizeOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return value;
}

function sanitizeCompleted(value: unknown): Section08StudyCompleted | undefined {
  return value === "ANO" || value === "NE" || value === "PROBIHA" ? value : undefined;
}

function normalizeQualificationStudy(raw: unknown): AnnualReportSection08QualificationStudy | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    title: sanitizeOptionalText(item.title) ?? "",
    participantGroup: sanitizeOptionalText(item.participantGroup),
    provider: sanitizeOptionalText(item.provider),
    period: sanitizeOptionalText(item.period),
    completed: sanitizeCompleted(item.completed),
    note: sanitizeOptionalText(item.note),
  };
}

function normalizeProfessionalDevelopmentTraining(raw: unknown): AnnualReportSection08ProfessionalDevelopmentTraining | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    title: sanitizeOptionalText(item.title) ?? "",
    topic: sanitizeOptionalText(item.topic),
    participantGroup: sanitizeOptionalText(item.participantGroup),
    provider: sanitizeOptionalText(item.provider),
    period: sanitizeOptionalText(item.period),
    hours: sanitizeOptionalNumber(item.hours),
    note: sanitizeOptionalText(item.note),
  };
}

function normalizeNonTeachingStaffDevelopment(raw: unknown): AnnualReportSection08NonTeachingStaffDevelopment | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  return {
    title: sanitizeOptionalText(item.title) ?? "",
    staffGroup: sanitizeOptionalText(item.staffGroup),
    provider: sanitizeOptionalText(item.provider),
    period: sanitizeOptionalText(item.period),
    hours: sanitizeOptionalNumber(item.hours),
    note: sanitizeOptionalText(item.note),
  };
}

function qualificationRowHasAnyValue(row: AnnualReportSection08QualificationStudy): boolean {
  return Boolean(
    pickFilledString(row.title) ||
      pickFilledString(row.participantGroup) ||
      pickFilledString(row.provider) ||
      pickFilledString(row.period) ||
      row.completed ||
      pickFilledString(row.note),
  );
}

function professionalTrainingRowHasAnyValue(row: AnnualReportSection08ProfessionalDevelopmentTraining): boolean {
  return Boolean(
    pickFilledString(row.title) ||
      pickFilledString(row.topic) ||
      pickFilledString(row.participantGroup) ||
      pickFilledString(row.provider) ||
      pickFilledString(row.period) ||
      row.hours !== undefined ||
      pickFilledString(row.note),
  );
}

function nonTeachingRowHasAnyValue(row: AnnualReportSection08NonTeachingStaffDevelopment): boolean {
  return Boolean(
    pickFilledString(row.title) ||
      pickFilledString(row.staffGroup) ||
      pickFilledString(row.provider) ||
      pickFilledString(row.period) ||
      row.hours !== undefined ||
      pickFilledString(row.note),
  );
}

function hasAnyListedActivity(data: AnnualReportSection08Data): boolean {
  return (
    data.qualificationStudies.some(qualificationRowHasAnyValue) ||
    data.additionalQualificationStudies.some(qualificationRowHasAnyValue) ||
    data.professionalDevelopmentTrainings.some(professionalTrainingRowHasAnyValue) ||
    data.nonTeachingStaffDevelopment.some(nonTeachingRowHasAnyValue)
  );
}

function summaryClaimsDevelopment(summaryEvaluation: string | undefined): boolean {
  const summary = pickFilledString(summaryEvaluation);
  if (!summary) return false;
  return /(prob[eě]h|realiz|uskutečn|absolv|zajištěn|zajišt|rozvoj)/i.test(summary);
}

export function createDefaultSection08QualificationStudy(): AnnualReportSection08QualificationStudy {
  return {
    title: "",
    participantGroup: "",
    provider: "",
    period: "",
    completed: undefined,
    note: "",
  };
}

export function createDefaultSection08ProfessionalDevelopmentTraining(): AnnualReportSection08ProfessionalDevelopmentTraining {
  return {
    title: "",
    topic: "",
    participantGroup: "",
    provider: "",
    period: "",
    hours: undefined,
    note: "",
  };
}

export function createDefaultSection08NonTeachingStaffDevelopment(): AnnualReportSection08NonTeachingStaffDevelopment {
  return {
    title: "",
    staffGroup: "",
    provider: "",
    period: "",
    hours: undefined,
    note: "",
  };
}

export function createDefaultSection08Data(): AnnualReportSection08Data {
  return {
    dvppOverview: {
      description: "",
      priorities: "",
      evaluation: "",
    },
    qualificationStudies: [],
    additionalQualificationStudies: [],
    professionalDevelopmentTrainings: [],
    nonTeachingStaffDevelopment: [],
    selfStudy: {
      description: "",
      topics: "",
      note: "",
    },
    summaryEvaluation: "",
    notes: "",
  };
}

export function normalizeSection08Data(raw: unknown): AnnualReportSection08Data | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const dvppOverview =
    item.dvppOverview && typeof item.dvppOverview === "object" ? (item.dvppOverview as Record<string, unknown>) : {};
  const selfStudy = item.selfStudy && typeof item.selfStudy === "object" ? (item.selfStudy as Record<string, unknown>) : {};

  return {
    dvppOverview: {
      description: sanitizeOptionalText(dvppOverview.description) ?? "",
      priorities: sanitizeOptionalText(dvppOverview.priorities) ?? "",
      evaluation: sanitizeOptionalText(dvppOverview.evaluation) ?? "",
    },
    qualificationStudies: Array.isArray(item.qualificationStudies)
      ? item.qualificationStudies
          .map(normalizeQualificationStudy)
          .filter((study): study is AnnualReportSection08QualificationStudy => study !== null)
      : [],
    additionalQualificationStudies: Array.isArray(item.additionalQualificationStudies)
      ? item.additionalQualificationStudies
          .map(normalizeQualificationStudy)
          .filter((study): study is AnnualReportSection08QualificationStudy => study !== null)
      : [],
    professionalDevelopmentTrainings: Array.isArray(item.professionalDevelopmentTrainings)
      ? item.professionalDevelopmentTrainings
          .map(normalizeProfessionalDevelopmentTraining)
          .filter((training): training is AnnualReportSection08ProfessionalDevelopmentTraining => training !== null)
      : [],
    nonTeachingStaffDevelopment: Array.isArray(item.nonTeachingStaffDevelopment)
      ? item.nonTeachingStaffDevelopment
          .map(normalizeNonTeachingStaffDevelopment)
          .filter((itemRow): itemRow is AnnualReportSection08NonTeachingStaffDevelopment => itemRow !== null)
      : [],
    selfStudy: {
      description: sanitizeOptionalText(selfStudy.description) ?? "",
      topics: sanitizeOptionalText(selfStudy.topics) ?? "",
      note: sanitizeOptionalText(selfStudy.note) ?? "",
    },
    summaryEvaluation: sanitizeOptionalText(item.summaryEvaluation) ?? "",
    notes: sanitizeOptionalText(item.notes) ?? "",
  };
}

/** Vyhodnotí připravenost kapitoly 08 pouze z ručně zadaných údajů (bez inferencí z jiných kapitol). */
export function getSection08Readiness(params: {
  section08Data: AnnualReportSection08Data;
  schoolProfile: SchoolProfile;
}): Section08Readiness {
  const d = params.section08Data;
  const missingData: string[] = [];
  const recommendedData: string[] = [];
  const availableData: string[] = [];
  const warnings: string[] = [];

  const schoolName = pickFilledString(params.schoolProfile.name);
  const schoolType = pickFilledString(params.schoolProfile.schoolType);
  if (schoolName) availableData.push(`Škola: ${schoolName}`);
  if (schoolType) availableData.push(`Typ školy: ${schoolType}`);

  const dvppDescription = pickFilledString(d.dvppOverview.description);
  if (!dvppDescription) {
    missingData.push("Popis DVPP ve školním roce");
  } else {
    availableData.push("Popis DVPP ve školním roce");
  }

  const hasActivities = hasAnyListedActivity(d);
  const hasSelfStudyDescription = Boolean(pickFilledString(d.selfStudy.description));
  if (!hasActivities && !hasSelfStudyDescription) {
    missingData.push(
      "Alespoň jedna aktivita (studium / vzdělávání / rozvoj nepedagogických pracovníků) nebo popis samostudia",
    );
  } else {
    if (hasActivities) availableData.push("Evidované vzdělávací aktivity");
    if (hasSelfStudyDescription) availableData.push("Popis samostudia");
  }

  const summaryEvaluation = pickFilledString(d.summaryEvaluation);
  if (!summaryEvaluation) {
    missingData.push("Souhrnné vyhodnocení kapitoly");
  } else {
    availableData.push("Souhrnné vyhodnocení kapitoly");
    if (summaryEvaluation.length < 80) {
      warnings.push("Souhrnné vyhodnocení je velmi stručné. Zvažte doplnění konkrétních zjištění.");
    }
  }

  if (!pickFilledString(d.dvppOverview.priorities)) {
    recommendedData.push("Priority DVPP");
  } else {
    availableData.push("Priority DVPP");
  }
  if (!pickFilledString(d.dvppOverview.evaluation)) {
    recommendedData.push("Vyhodnocení DVPP");
  } else {
    availableData.push("Vyhodnocení DVPP");
  }

  d.qualificationStudies.forEach((row, index) => {
    if (!qualificationRowHasAnyValue(row)) return;
    if (!pickFilledString(row.title)) warnings.push(`Studium kvalifikačních předpokladů ${index + 1}: chybí název studia.`);
    if (!row.completed) warnings.push(`Studium kvalifikačních předpokladů ${index + 1}: chybí údaj „Dokončeno“.`);
    if (!pickFilledString(row.provider)) recommendedData.push(`Poskytovatel (studium kvalifikačních předpokladů ${index + 1})`);
    if (!pickFilledString(row.period)) recommendedData.push(`Období (studium kvalifikačních předpokladů ${index + 1})`);
  });

  d.additionalQualificationStudies.forEach((row, index) => {
    if (!qualificationRowHasAnyValue(row)) return;
    if (!pickFilledString(row.title)) {
      warnings.push(`Studium dalších kvalifikačních předpokladů ${index + 1}: chybí název studia.`);
    }
    if (!row.completed) warnings.push(`Studium dalších kvalifikačních předpokladů ${index + 1}: chybí údaj „Dokončeno“.`);
    if (!pickFilledString(row.provider)) {
      recommendedData.push(`Poskytovatel (studium dalších kvalifikačních předpokladů ${index + 1})`);
    }
    if (!pickFilledString(row.period)) recommendedData.push(`Období (studium dalších kvalifikačních předpokladů ${index + 1})`);
  });

  d.professionalDevelopmentTrainings.forEach((row, index) => {
    if (!professionalTrainingRowHasAnyValue(row)) return;
    if (!pickFilledString(row.title)) {
      warnings.push(`Prohlubování odborné kvalifikace ${index + 1}: chybí název vzdělávání.`);
    }
    if (row.hours !== undefined && row.hours < 0) {
      warnings.push(`Prohlubování odborné kvalifikace ${index + 1}: počet hodin nesmí být záporný.`);
    }
    if (!pickFilledString(row.provider)) recommendedData.push(`Poskytovatel (prohlubování odborné kvalifikace ${index + 1})`);
    if (!pickFilledString(row.period)) recommendedData.push(`Období (prohlubování odborné kvalifikace ${index + 1})`);
    if (row.hours === undefined) recommendedData.push(`Počet hodin (prohlubování odborné kvalifikace ${index + 1})`);
  });

  if (d.nonTeachingStaffDevelopment.length === 0) {
    warnings.push("Odborný rozvoj nepedagogických pracovníků není vyplněn.");
  }
  d.nonTeachingStaffDevelopment.forEach((row, index) => {
    if (!nonTeachingRowHasAnyValue(row)) return;
    if (!pickFilledString(row.title)) warnings.push(`Rozvoj nepedagogických pracovníků ${index + 1}: chybí název aktivity.`);
    if (row.hours !== undefined && row.hours < 0) {
      warnings.push(`Rozvoj nepedagogických pracovníků ${index + 1}: počet hodin nesmí být záporný.`);
    }
    if (!pickFilledString(row.provider)) recommendedData.push(`Poskytovatel (rozvoj nepedagogických pracovníků ${index + 1})`);
    if (!pickFilledString(row.period)) recommendedData.push(`Období (rozvoj nepedagogických pracovníků ${index + 1})`);
    if (row.hours === undefined) recommendedData.push(`Počet hodin (rozvoj nepedagogických pracovníků ${index + 1})`);
  });

  if (!pickFilledString(d.selfStudy.topics)) {
    recommendedData.push("Témata samostudia");
  } else {
    availableData.push("Témata samostudia");
  }

  if (!pickFilledString(d.notes)) {
    recommendedData.push("Poznámky");
  } else {
    availableData.push("Poznámky");
  }

  if (!hasActivities && summaryClaimsDevelopment(summaryEvaluation)) {
    warnings.push("Souhrnné vyhodnocení uvádí realizaci rozvoje, ale v aktivitách nejsou uvedeny konkrétní položky.");
  }

  return {
    status: missingData.length === 0 ? "PRIPRAVENO" : "CHYBI_UDAJE",
    missingData,
    recommendedData,
    availableData,
    warnings,
  };
}
