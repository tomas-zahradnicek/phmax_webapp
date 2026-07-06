import type { SchoolProfile } from "../school-profile/school-profile-types";
import type {
  AnnualReportSection04AdmissionSummary,
  AnnualReportSection04Data,
  AnnualReportSection04GradeCount,
  AnnualReportSection04PupilCountRow,
  AnnualReportSection04SecondaryAdmission,
} from "./vyrocni-zprava-section04-types";

export const VYROCNI_ZPRAVA_SECTION04_LS_KEY = "vyrocni-zprava-section04-data-v1";

export type Section04Readiness = {
  status: "CHYBI_UDAJE" | "PRIPRAVENO";
  missingData: string[];
  recommendedData: string[];
  availableData: string[];
  warnings: string[];
};

const ADMISSION_FIELDS: { key: keyof AnnualReportSection04AdmissionSummary; label: string }[] = [
  { key: "firstTimeTotal", label: "Poprvé u zápisu celkem" },
  { key: "firstTimeGirls", label: "Poprvé u zápisu dívky" },
  { key: "afterDeferralTotal", label: "Po odkladu celkem" },
  { key: "afterDeferralGirls", label: "Po odkladu dívky" },
  { key: "enrolledTotal", label: "Zapsaní celkem" },
  { key: "enrolledGirls", label: "Zapsaní dívky" },
  { key: "deferralRequestsTotal", label: "Žádosti o odklad celkem" },
  { key: "deferralRequestsGirls", label: "Žádosti o odklad dívky" },
];

const SECONDARY_SCHOOL_TYPES = [
  "víceleté gymnázium",
  "úplné střední všeobecné vzdělání",
  "úplné střední odborné vzdělání s maturitou",
  "úplné střední odborné vzdělání s vyučením i maturitou",
  "střední odborné vzdělání s výučním listem",
  "nehlásí se nikam",
] as const;

export function normalizeSecondarySchoolTypeKey(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function matchKnownSecondarySchoolType(value: string | undefined): string | undefined {
  const normalized = normalizeSecondarySchoolTypeKey(value);
  if (!normalized) return undefined;
  return SECONDARY_SCHOOL_TYPES.find(
    (item) => normalizeSecondarySchoolTypeKey(item) === normalized,
  );
}

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

function normalizeAdmissionSummary(raw: unknown): AnnualReportSection04AdmissionSummary {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  return {
    firstTimeTotal: sanitizeOptionalNumber(o.firstTimeTotal),
    firstTimeGirls: sanitizeOptionalNumber(o.firstTimeGirls),
    afterDeferralTotal: sanitizeOptionalNumber(o.afterDeferralTotal),
    afterDeferralGirls: sanitizeOptionalNumber(o.afterDeferralGirls),
    enrolledTotal: sanitizeOptionalNumber(o.enrolledTotal),
    enrolledGirls: sanitizeOptionalNumber(o.enrolledGirls),
    deferralRequestsTotal: sanitizeOptionalNumber(o.deferralRequestsTotal),
    deferralRequestsGirls: sanitizeOptionalNumber(o.deferralRequestsGirls),
  };
}

function normalizeGradeCount(raw: unknown): AnnualReportSection04GradeCount | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    grade: sanitizeOptionalText(o.grade) ?? "",
    count: sanitizeOptionalNumber(o.count),
  };
}

function normalizeSecondaryAdmission(raw: unknown): AnnualReportSection04SecondaryAdmission | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    schoolType: sanitizeOptionalText(o.schoolType) ?? "",
    count: sanitizeOptionalNumber(o.count),
  };
}

function normalizePupilCountRow(raw: unknown): AnnualReportSection04PupilCountRow | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    className: sanitizeOptionalText(o.className) ?? "",
    boys: sanitizeOptionalNumber(o.boys),
    girls: sanitizeOptionalNumber(o.girls),
    total: sanitizeOptionalNumber(o.total),
    classTeacher: sanitizeOptionalText(o.classTeacher),
  };
}

function sumRows(rows: AnnualReportSection04PupilCountRow[]): number {
  return rows.reduce((sum, row) => sum + (row.total ?? 0), 0);
}

function countFilledRows(rows: AnnualReportSection04PupilCountRow[]): number {
  return rows.filter((row) => pickFilledString(row.className)).length;
}

function hasAnyAdmissionSummaryData(summary: AnnualReportSection04AdmissionSummary): boolean {
  return ADMISSION_FIELDS.some((field) => summary[field.key] !== undefined);
}

function hasAnyRowData(rows: AnnualReportSection04GradeCount[]): boolean {
  return rows.some((row) => pickFilledString(row.grade) || row.count !== undefined);
}

function hasAnySecondaryData(rows: AnnualReportSection04SecondaryAdmission[]): boolean {
  return rows.some((row) => pickFilledString(row.schoolType) || row.count !== undefined);
}

function _hasAnyPupilCountData(rows: AnnualReportSection04PupilCountRow[]): boolean {
  return rows.some(
    (row) =>
      pickFilledString(row.className) ||
      row.boys !== undefined ||
      row.girls !== undefined ||
      row.total !== undefined ||
      pickFilledString(row.classTeacher),
  );
}

function findMissingAdmissionSummaryFields(summary: AnnualReportSection04AdmissionSummary, prefix: string): string[] {
  const missing: string[] = [];
  for (const field of ADMISSION_FIELDS) {
    if (summary[field.key] === undefined) {
      missing.push(`${prefix}: ${field.label}`);
    }
  }
  return missing;
}

function validatePupilCountRows(rows: AnnualReportSection04PupilCountRow[], prefix: string): string[] {
  const warnings: string[] = [];
  rows.forEach((row, index) => {
    const rowLabel = `${prefix} – řádek ${index + 1}`;
    if (!pickFilledString(row.className)) {
      warnings.push(`${rowLabel}: chybí označení třídy.`);
      return;
    }
    const boys = row.boys;
    const girls = row.girls;
    const total = row.total;
    if (boys !== undefined && boys < 0) warnings.push(`${rowLabel}: počet chlapců nesmí být záporný.`);
    if (girls !== undefined && girls < 0) warnings.push(`${rowLabel}: počet děvčat nesmí být záporný.`);
    if (total !== undefined && total < 0) warnings.push(`${rowLabel}: celkový počet nesmí být záporný.`);
    if (girls !== undefined && total !== undefined && girls > total) {
      warnings.push(`${rowLabel}: počet děvčat je vyšší než celkový počet.`);
    }
    if (boys !== undefined && girls !== undefined && total !== undefined && boys + girls !== total) {
      warnings.push(`${rowLabel}: součet chlapců a děvčat neodpovídá celkovému počtu.`);
    }
  });
  return warnings;
}

function validateNonNegativeRows(
  rows: AnnualReportSection04GradeCount[] | AnnualReportSection04SecondaryAdmission[],
  prefix: string,
): string[] {
  const warnings: string[] = [];
  rows.forEach((row, index) => {
    if (row.count !== undefined && row.count < 0) {
      warnings.push(`${prefix} – řádek ${index + 1}: počet nesmí být záporný.`);
    }
  });
  return warnings;
}

function validateAdmissionSummary(summary: AnnualReportSection04AdmissionSummary, prefix: string): string[] {
  const warnings: string[] = [];
  ADMISSION_FIELDS.forEach((field) => {
    const value = summary[field.key];
    if (value !== undefined && value < 0) {
      warnings.push(`${prefix}: ${field.label} nesmí být záporný údaj.`);
    }
  });

  const pairs: { total: keyof AnnualReportSection04AdmissionSummary; girls: keyof AnnualReportSection04AdmissionSummary; label: string }[] = [
    { total: "firstTimeTotal", girls: "firstTimeGirls", label: "Poprvé u zápisu" },
    { total: "afterDeferralTotal", girls: "afterDeferralGirls", label: "Po odkladu" },
    { total: "enrolledTotal", girls: "enrolledGirls", label: "Zapsaní" },
    { total: "deferralRequestsTotal", girls: "deferralRequestsGirls", label: "Žádosti o odklad" },
  ];

  pairs.forEach((pair) => {
    const total = summary[pair.total];
    const girls = summary[pair.girls];
    if (total !== undefined && girls !== undefined && girls > total) {
      warnings.push(`${prefix}: ${pair.label} – počet dívek je vyšší než celkový počet.`);
    }
  });
  return warnings;
}

function validateSeptemberJuneDifference(
  septemberRows: AnnualReportSection04PupilCountRow[],
  juneRows: AnnualReportSection04PupilCountRow[],
): string[] {
  const warnings: string[] = [];
  const septemberTotal = sumRows(septemberRows);
  const juneTotal = sumRows(juneRows);
  const difference = Math.abs(septemberTotal - juneTotal);
  if (difference >= 20) {
    warnings.push(
      `Počet žáků k 1. září (${septemberTotal}) a k 30. červnu (${juneTotal}) se výrazně liší. Ověřte prosím správnost údajů.`,
    );
  }
  return warnings;
}

export function createDefaultSection04Data(): AnnualReportSection04Data {
  return {
    firstGradeAdmissionCurrentYear: {},
    pupilsAdmittedDuringYear: [],
    pupilsLeftDuringYear: [],
    firstGradeEnrollmentNextYear: {},
    specialEnrollment: {},
    secondarySchoolAdmissions: SECONDARY_SCHOOL_TYPES.map((schoolType) => ({ schoolType, count: undefined })),
    pupilCountsSeptember: [],
    pupilCountsJune: [],
    notes: "",
  };
}

export function createDefaultSection04GradeCountRow(): AnnualReportSection04GradeCount {
  return { grade: "", count: undefined };
}

export function createDefaultSection04PupilCountRow(): AnnualReportSection04PupilCountRow {
  return { className: "", boys: undefined, girls: undefined, total: undefined, classTeacher: "" };
}

export function normalizeSection04Data(raw: unknown): AnnualReportSection04Data | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    firstGradeAdmissionCurrentYear: normalizeAdmissionSummary(o.firstGradeAdmissionCurrentYear),
    pupilsAdmittedDuringYear: Array.isArray(o.pupilsAdmittedDuringYear)
      ? o.pupilsAdmittedDuringYear
          .map(normalizeGradeCount)
          .filter((row): row is AnnualReportSection04GradeCount => row !== null)
      : [],
    pupilsLeftDuringYear: Array.isArray(o.pupilsLeftDuringYear)
      ? o.pupilsLeftDuringYear
          .map(normalizeGradeCount)
          .filter((row): row is AnnualReportSection04GradeCount => row !== null)
      : [],
    firstGradeEnrollmentNextYear: normalizeAdmissionSummary(o.firstGradeEnrollmentNextYear),
    specialEnrollment: (() => {
      const s = o.specialEnrollment;
      if (!s || typeof s !== "object") return {};
      const so = s as Record<string, unknown>;
      return {
        admittedTotal: sanitizeOptionalNumber(so.admittedTotal),
        admittedGirls: sanitizeOptionalNumber(so.admittedGirls),
      };
    })(),
    secondarySchoolAdmissions: Array.isArray(o.secondarySchoolAdmissions)
      ? o.secondarySchoolAdmissions
          .map(normalizeSecondaryAdmission)
          .filter((row): row is AnnualReportSection04SecondaryAdmission => row !== null)
      : SECONDARY_SCHOOL_TYPES.map((schoolType) => ({ schoolType, count: undefined })),
    pupilCountsSeptember: Array.isArray(o.pupilCountsSeptember)
      ? o.pupilCountsSeptember
          .map(normalizePupilCountRow)
          .filter((row): row is AnnualReportSection04PupilCountRow => row !== null)
      : [],
    pupilCountsJune: Array.isArray(o.pupilCountsJune)
      ? o.pupilCountsJune
          .map(normalizePupilCountRow)
          .filter((row): row is AnnualReportSection04PupilCountRow => row !== null)
      : [],
    notes: sanitizeOptionalText(o.notes) ?? "",
  };
}

export function getSection04Readiness(params: {
  section04Data: AnnualReportSection04Data;
  schoolProfile: SchoolProfile;
}): Section04Readiness {
  const missingData: string[] = [];
  const recommendedData: string[] = [];
  const availableData: string[] = [];
  const warnings: string[] = [];

  const d = params.section04Data;
  const schoolName = pickFilledString(params.schoolProfile.name);
  const schoolType = pickFilledString(params.schoolProfile.schoolType);
  if (schoolName) availableData.push(`Škola: ${schoolName}`);
  if (schoolType) availableData.push(`Typ školy: ${schoolType}`);

  if (hasAnyAdmissionSummaryData(d.firstGradeAdmissionCurrentYear)) {
    availableData.push("Vyplněny údaje 4.1 (přijetí do 1. ročníku)");
  }
  missingData.push(...findMissingAdmissionSummaryFields(d.firstGradeAdmissionCurrentYear, "4.1 Přijetí do 1. ročníku"));

  if (hasAnyAdmissionSummaryData(d.firstGradeEnrollmentNextYear)) {
    availableData.push("Vyplněny údaje 4.4 (zápis pro následující rok)");
  }
  missingData.push(...findMissingAdmissionSummaryFields(d.firstGradeEnrollmentNextYear, "4.4 Zápis pro následující školní rok"));

  if (countFilledRows(d.pupilCountsSeptember) === 0) {
    missingData.push("4.7 Počty žáků k 1. září – alespoň jedna třída");
  } else {
    availableData.push(`Počty žáků k 1. září: ${countFilledRows(d.pupilCountsSeptember)} tříd`);
  }

  if (countFilledRows(d.pupilCountsJune) === 0) {
    missingData.push("4.7 Počty žáků k 30. červnu – alespoň jedna třída");
  } else {
    availableData.push(`Počty žáků k 30. červnu: ${countFilledRows(d.pupilCountsJune)} tříd`);
  }

  if (hasAnyRowData(d.pupilsAdmittedDuringYear)) {
    availableData.push("Vyplněna tabulka 4.2 (přijatí v průběhu roku)");
  } else {
    recommendedData.push("4.2 Žáci přijati v průběhu školního roku");
  }

  if (hasAnyRowData(d.pupilsLeftDuringYear)) {
    availableData.push("Vyplněna tabulka 4.3 (odhlášení v průběhu roku)");
  } else {
    recommendedData.push("4.3 Žáci v průběhu školního roku odhlášeni");
  }

  if (d.specialEnrollment.admittedTotal !== undefined || d.specialEnrollment.admittedGirls !== undefined) {
    availableData.push("Vyplněny údaje 4.5 (zvláštní zápis)");
  } else {
    recommendedData.push("4.5 Zvláštní zápis");
  }

  if (hasAnySecondaryData(d.secondarySchoolAdmissions)) {
    availableData.push("Vyplněna tabulka 4.6 (přijetí do středních škol)");
  } else {
    recommendedData.push("4.6 Žáci přijati ke vzdělávání do střední školy");
  }

  if (pickFilledString(d.notes)) {
    availableData.push("Doplňující poznámky k sekci 04");
  } else {
    recommendedData.push("Doplňující poznámky k sekci 04");
  }

  warnings.push(...validateAdmissionSummary(d.firstGradeAdmissionCurrentYear, "4.1 Přijetí do 1. ročníku"));
  warnings.push(...validateAdmissionSummary(d.firstGradeEnrollmentNextYear, "4.4 Zápis pro následující rok"));
  warnings.push(...validatePupilCountRows(d.pupilCountsSeptember, "4.7 Počty žáků k 1. září"));
  warnings.push(...validatePupilCountRows(d.pupilCountsJune, "4.7 Počty žáků k 30. červnu"));
  warnings.push(...validateNonNegativeRows(d.pupilsAdmittedDuringYear, "4.2 Přijatí v průběhu roku"));
  warnings.push(...validateNonNegativeRows(d.pupilsLeftDuringYear, "4.3 Odhlášení v průběhu roku"));
  warnings.push(...validateNonNegativeRows(d.secondarySchoolAdmissions, "4.6 Přijatí do střední školy"));
  if (d.specialEnrollment.admittedGirls !== undefined && d.specialEnrollment.admittedTotal !== undefined) {
    if (d.specialEnrollment.admittedGirls > d.specialEnrollment.admittedTotal) {
      warnings.push("4.5 Zvláštní zápis: počet dívek je vyšší než celkový počet přijatých.");
    }
  }
  if (d.specialEnrollment.admittedGirls !== undefined && d.specialEnrollment.admittedGirls < 0) {
    warnings.push("4.5 Zvláštní zápis: počet dívek nesmí být záporný.");
  }
  if (d.specialEnrollment.admittedTotal !== undefined && d.specialEnrollment.admittedTotal < 0) {
    warnings.push("4.5 Zvláštní zápis: celkový počet nesmí být záporný.");
  }
  warnings.push(...validateSeptemberJuneDifference(d.pupilCountsSeptember, d.pupilCountsJune));

  return {
    status: missingData.length === 0 ? "PRIPRAVENO" : "CHYBI_UDAJE",
    missingData,
    recommendedData,
    availableData,
    warnings,
  };
}
