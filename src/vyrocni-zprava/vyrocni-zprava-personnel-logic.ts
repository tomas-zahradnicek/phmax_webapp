import type {
  AnnualReportPersonnelData,
  GenderCountPair,
  QualificationCountPair,
} from "./vyrocni-zprava-personnel-types";

export const VYROCNI_ZPRAVA_PERSONNEL_LS_KEY = "vyrocni-zprava-personnel-data-v1";

function emptyGenderPair(): GenderCountPair {
  return {};
}

function emptyQualificationPair(): QualificationCountPair {
  return {};
}

export function createDefaultPersonnelData(): AnnualReportPersonnelData {
  return {
    staffCounts: {},
    ageAndGender: {
      under35: emptyGenderPair(),
      age36to45: emptyGenderPair(),
      age46to55: emptyGenderPair(),
      over55: emptyGenderPair(),
      retirementAge: emptyGenderPair(),
    },
    educationAndGender: {
      belowMaturita: emptyGenderPair(),
      maturita: emptyGenderPair(),
      higherVocational: emptyGenderPair(),
      university: emptyGenderPair(),
    },
    qualification: {
      primaryTeachers: emptyQualificationPair(),
      lowerSecondaryTeachers: emptyQualificationPair(),
      educators: emptyQualificationPair(),
      teachingAssistants: emptyQualificationPair(),
      specialPedagogues: emptyQualificationPair(),
    },
    notes: "",
  };
}

function sanitizeCount(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return undefined;
  return value;
}

function sanitizeGenderPair(raw: unknown): GenderCountPair {
  if (!raw || typeof raw !== "object") return emptyGenderPair();
  const o = raw as Record<string, unknown>;
  return {
    men: sanitizeCount(o.men),
    women: sanitizeCount(o.women),
  };
}

function sanitizeQualificationPair(raw: unknown): QualificationCountPair {
  if (!raw || typeof raw !== "object") return emptyQualificationPair();
  const o = raw as Record<string, unknown>;
  return {
    qualified: sanitizeCount(o.qualified),
    notQualified: sanitizeCount(o.notQualified),
  };
}

export function normalizePersonnelData(raw: unknown): AnnualReportPersonnelData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const staffRaw = o.staffCounts;
  const staff =
    staffRaw && typeof staffRaw === "object" ? (staffRaw as Record<string, unknown>) : {};
  const ageRaw = o.ageAndGender;
  const age = ageRaw && typeof ageRaw === "object" ? (ageRaw as Record<string, unknown>) : {};
  const eduRaw = o.educationAndGender;
  const edu = eduRaw && typeof eduRaw === "object" ? (eduRaw as Record<string, unknown>) : {};
  const qualRaw = o.qualification;
  const qual = qualRaw && typeof qualRaw === "object" ? (qualRaw as Record<string, unknown>) : {};

  return {
    staffCounts: {
      teachersPersons: sanitizeCount(staff.teachersPersons),
      teachersFte: sanitizeCount(staff.teachersFte),
      educatorsPersons: sanitizeCount(staff.educatorsPersons),
      educatorsFte: sanitizeCount(staff.educatorsFte),
      specialPedagoguesPersons: sanitizeCount(staff.specialPedagoguesPersons),
      specialPedagoguesFte: sanitizeCount(staff.specialPedagoguesFte),
      teachingAssistantsPersons: sanitizeCount(staff.teachingAssistantsPersons),
      teachingAssistantsFte: sanitizeCount(staff.teachingAssistantsFte),
      nonTeachingStaffPersons: sanitizeCount(staff.nonTeachingStaffPersons),
      nonTeachingStaffFte: sanitizeCount(staff.nonTeachingStaffFte),
    },
    ageAndGender: {
      under35: sanitizeGenderPair(age.under35),
      age36to45: sanitizeGenderPair(age.age36to45),
      age46to55: sanitizeGenderPair(age.age46to55),
      over55: sanitizeGenderPair(age.over55),
      retirementAge: sanitizeGenderPair(age.retirementAge),
    },
    educationAndGender: {
      belowMaturita: sanitizeGenderPair(edu.belowMaturita),
      maturita: sanitizeGenderPair(edu.maturita),
      higherVocational: sanitizeGenderPair(edu.higherVocational),
      university: sanitizeGenderPair(edu.university),
    },
    qualification: {
      primaryTeachers: sanitizeQualificationPair(qual.primaryTeachers),
      lowerSecondaryTeachers: sanitizeQualificationPair(qual.lowerSecondaryTeachers),
      educators: sanitizeQualificationPair(qual.educators),
      teachingAssistants: sanitizeQualificationPair(qual.teachingAssistants),
      specialPedagogues: sanitizeQualificationPair(qual.specialPedagogues),
    },
    notes: typeof o.notes === "string" ? o.notes : "",
  };
}

export function isPersonnelCountFilled(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function sumOptional(values: readonly (number | undefined)[]): number {
  return values.reduce<number>((acc, value) => acc + (isPersonnelCountFilled(value) ? value : 0), 0);
}

export function sumGenderPair(pair: GenderCountPair): number {
  return sumOptional([pair.men, pair.women]);
}

export function sumQualificationPair(pair: QualificationCountPair): number {
  return sumOptional([pair.qualified, pair.notQualified]);
}

export type PersonnelStaffTotals = {
  teachersPersons: number;
  teachersFte: number;
  educatorsPersons: number;
  educatorsFte: number;
  specialPedagoguesPersons: number;
  specialPedagoguesFte: number;
  teachingAssistantsPersons: number;
  teachingAssistantsFte: number;
  nonTeachingStaffPersons: number;
  nonTeachingStaffFte: number;
  totalPersons: number;
  totalFte: number;
  totalPedagogicalPersons: number;
  totalPedagogicalFte: number;
};

export function calculatePersonnelStaffTotals(data: AnnualReportPersonnelData): PersonnelStaffTotals {
  const s = data.staffCounts;
  const teachersPersons = sumOptional([s.teachersPersons]);
  const teachersFte = sumOptional([s.teachersFte]);
  const educatorsPersons = sumOptional([s.educatorsPersons]);
  const educatorsFte = sumOptional([s.educatorsFte]);
  const specialPedagoguesPersons = sumOptional([s.specialPedagoguesPersons]);
  const specialPedagoguesFte = sumOptional([s.specialPedagoguesFte]);
  const teachingAssistantsPersons = sumOptional([s.teachingAssistantsPersons]);
  const teachingAssistantsFte = sumOptional([s.teachingAssistantsFte]);
  const nonTeachingStaffPersons = sumOptional([s.nonTeachingStaffPersons]);
  const nonTeachingStaffFte = sumOptional([s.nonTeachingStaffFte]);

  const totalPedagogicalPersons =
    teachersPersons + educatorsPersons + specialPedagoguesPersons + teachingAssistantsPersons;
  const totalPedagogicalFte = teachersFte + educatorsFte + specialPedagoguesFte + teachingAssistantsFte;

  return {
    teachersPersons,
    teachersFte,
    educatorsPersons,
    educatorsFte,
    specialPedagoguesPersons,
    specialPedagoguesFte,
    teachingAssistantsPersons,
    teachingAssistantsFte,
    nonTeachingStaffPersons,
    nonTeachingStaffFte,
    totalPedagogicalPersons,
    totalPedagogicalFte,
    totalPersons: totalPedagogicalPersons + nonTeachingStaffPersons,
    totalFte: totalPedagogicalFte + nonTeachingStaffFte,
  };
}

function buildGenderTableTotals<T extends Record<string, GenderCountPair>>(groups: T) {
  const rows = {} as Record<keyof T, { men: number; women: number; total: number }>;
  let totalMen = 0;
  let totalWomen = 0;

  for (const key of Object.keys(groups) as (keyof T)[]) {
    const pair = groups[key];
    const men = sumOptional([pair.men]);
    const women = sumOptional([pair.women]);
    rows[key] = { men, women, total: men + women };
    totalMen += men;
    totalWomen += women;
  }

  return {
    rows,
    totalMen,
    totalWomen,
    grandTotal: totalMen + totalWomen,
  };
}

export type GenderTableTotals<T extends Record<string, GenderCountPair>> = ReturnType<typeof buildGenderTableTotals<T>>;

export function calculateAgeGenderTotals(data: AnnualReportPersonnelData) {
  return buildGenderTableTotals(data.ageAndGender);
}

export function calculateEducationGenderTotals(data: AnnualReportPersonnelData) {
  return buildGenderTableTotals(data.educationAndGender);
}

export type QualificationTableTotals = {
  rows: Record<
    keyof AnnualReportPersonnelData["qualification"],
    { qualified: number; notQualified: number; total: number }
  >;
  totalQualified: number;
  totalNotQualified: number;
  grandTotal: number;
};

export function calculateQualificationTotals(data: AnnualReportPersonnelData): QualificationTableTotals {
  const rows = {} as QualificationTableTotals["rows"];
  let totalQualified = 0;
  let totalNotQualified = 0;

  for (const key of Object.keys(data.qualification) as (keyof typeof data.qualification)[]) {
    const pair = data.qualification[key];
    const qualified = sumOptional([pair.qualified]);
    const notQualified = sumOptional([pair.notQualified]);
    rows[key] = { qualified, notQualified, total: qualified + notQualified };
    totalQualified += qualified;
    totalNotQualified += notQualified;
  }

  return {
    rows,
    totalQualified,
    totalNotQualified,
    grandTotal: totalQualified + totalNotQualified,
  };
}

const STAFF_COUNT_REQUIREMENTS: { label: string; key: keyof AnnualReportPersonnelData["staffCounts"] }[] = [
  { label: "Učitelé – fyzické osoby", key: "teachersPersons" },
  { label: "Učitelé – úvazky", key: "teachersFte" },
  { label: "Vychovatelé – fyzické osoby", key: "educatorsPersons" },
  { label: "Vychovatelé – úvazky", key: "educatorsFte" },
  { label: "Speciální pedagogové – fyzické osoby", key: "specialPedagoguesPersons" },
  { label: "Speciální pedagogové – úvazky", key: "specialPedagoguesFte" },
  { label: "Asistenti pedagoga – fyzické osoby", key: "teachingAssistantsPersons" },
  { label: "Asistenti pedagoga – úvazky", key: "teachingAssistantsFte" },
  { label: "Správní / nepedagogičtí zaměstnanci – fyzické osoby", key: "nonTeachingStaffPersons" },
  { label: "Správní / nepedagogičtí zaměstnanci – úvazky", key: "nonTeachingStaffFte" },
];

const AGE_GENDER_REQUIREMENTS: {
  label: string;
  key: keyof AnnualReportPersonnelData["ageAndGender"];
  field: keyof GenderCountPair;
}[] = [
  { label: "Věk do 35 let – muži", key: "under35", field: "men" },
  { label: "Věk do 35 let – ženy", key: "under35", field: "women" },
  { label: "Věk 36–45 let – muži", key: "age36to45", field: "men" },
  { label: "Věk 36–45 let – ženy", key: "age36to45", field: "women" },
  { label: "Věk 46–55 let – muži", key: "age46to55", field: "men" },
  { label: "Věk 46–55 let – ženy", key: "age46to55", field: "women" },
  { label: "Věk nad 55 let – muži", key: "over55", field: "men" },
  { label: "Věk nad 55 let – ženy", key: "over55", field: "women" },
  { label: "V důchodovém věku – muži", key: "retirementAge", field: "men" },
  { label: "V důchodovém věku – ženy", key: "retirementAge", field: "women" },
];

const EDUCATION_REQUIREMENTS: {
  label: string;
  key: keyof AnnualReportPersonnelData["educationAndGender"];
  field: keyof GenderCountPair;
}[] = [
  { label: "Nižší než maturita – muži", key: "belowMaturita", field: "men" },
  { label: "Nižší než maturita – ženy", key: "belowMaturita", field: "women" },
  { label: "Maturita – muži", key: "maturita", field: "men" },
  { label: "Maturita – ženy", key: "maturita", field: "women" },
  { label: "Vyšší odborné – muži", key: "higherVocational", field: "men" },
  { label: "Vyšší odborné – ženy", key: "higherVocational", field: "women" },
  { label: "Vysokoškolské – muži", key: "university", field: "men" },
  { label: "Vysokoškolské – ženy", key: "university", field: "women" },
];

const QUALIFICATION_REQUIREMENTS: {
  label: string;
  key: keyof AnnualReportPersonnelData["qualification"];
  field: keyof QualificationCountPair;
}[] = [
  { label: "Učitel 1. stupně – splňuje kvalifikaci", key: "primaryTeachers", field: "qualified" },
  { label: "Učitel 1. stupně – nesplňuje kvalifikaci", key: "primaryTeachers", field: "notQualified" },
  { label: "Učitel 2. stupně – splňuje kvalifikaci", key: "lowerSecondaryTeachers", field: "qualified" },
  { label: "Učitel 2. stupně – nesplňuje kvalifikaci", key: "lowerSecondaryTeachers", field: "notQualified" },
  { label: "Vychovatel – splňuje kvalifikaci", key: "educators", field: "qualified" },
  { label: "Vychovatel – nesplňuje kvalifikaci", key: "educators", field: "notQualified" },
  { label: "Asistent pedagoga – splňuje kvalifikaci", key: "teachingAssistants", field: "qualified" },
  { label: "Asistent pedagoga – nesplňuje kvalifikaci", key: "teachingAssistants", field: "notQualified" },
  { label: "Speciální pedagog – splňuje kvalifikaci", key: "specialPedagogues", field: "qualified" },
  { label: "Speciální pedagog – nesplňuje kvalifikaci", key: "specialPedagogues", field: "notQualified" },
];

export function detectMissingPersonnelFields(data: AnnualReportPersonnelData): string[] {
  const missing: string[] = [];

  for (const req of STAFF_COUNT_REQUIREMENTS) {
    if (!isPersonnelCountFilled(data.staffCounts[req.key])) missing.push(req.label);
  }

  for (const req of AGE_GENDER_REQUIREMENTS) {
    if (!isPersonnelCountFilled(data.ageAndGender[req.key][req.field])) missing.push(req.label);
  }

  for (const req of EDUCATION_REQUIREMENTS) {
    if (!isPersonnelCountFilled(data.educationAndGender[req.key][req.field])) missing.push(req.label);
  }

  for (const req of QUALIFICATION_REQUIREMENTS) {
    const pair = data.qualification[req.key];
    if (!isPersonnelCountFilled(pair[req.field])) missing.push(req.label);
  }

  return missing;
}

export function hasAnyPersonnelData(data: AnnualReportPersonnelData): boolean {
  return detectMissingPersonnelFields(data).length < STAFF_COUNT_REQUIREMENTS.length + AGE_GENDER_REQUIREMENTS.length;
}

export function detectPersonnelInconsistencies(data: AnnualReportPersonnelData): string[] {
  const warnings: string[] = [];
  const staff = calculatePersonnelStaffTotals(data);
  const ageTotals = calculateAgeGenderTotals(data);
  const eduTotals = calculateEducationGenderTotals(data);
  const qualTotals = calculateQualificationTotals(data);

  if (
    isPersonnelCountFilled(data.staffCounts.teachersPersons) ||
    isPersonnelCountFilled(data.staffCounts.educatorsPersons) ||
    isPersonnelCountFilled(data.staffCounts.specialPedagoguesPersons) ||
    isPersonnelCountFilled(data.staffCounts.teachingAssistantsPersons)
  ) {
    if (ageTotals.grandTotal > 0 && ageTotals.grandTotal !== staff.totalPedagogicalPersons) {
      warnings.push(
        `Členění podle věku (${ageTotals.grandTotal}) neodpovídá součtu pedagogických pracovníků (${staff.totalPedagogicalPersons}).`,
      );
    }
    if (eduTotals.grandTotal > 0 && eduTotals.grandTotal !== staff.totalPedagogicalPersons) {
      warnings.push(
        `Členění podle vzdělání (${eduTotals.grandTotal}) neodpovídá součtu pedagogických pracovníků (${staff.totalPedagogicalPersons}).`,
      );
    }
  }

  const qualChecks: { staffCount: number; qualTotal: number; label: string }[] = [
    {
      staffCount: staff.teachersPersons,
      qualTotal: qualTotals.rows.primaryTeachers.total + qualTotals.rows.lowerSecondaryTeachers.total,
      label: "učitelů",
    },
    {
      staffCount: staff.educatorsPersons,
      qualTotal: qualTotals.rows.educators.total,
      label: "vychovatelů",
    },
    {
      staffCount: staff.teachingAssistantsPersons,
      qualTotal: qualTotals.rows.teachingAssistants.total,
      label: "asistentů pedagoga",
    },
    {
      staffCount: staff.specialPedagoguesPersons,
      qualTotal: qualTotals.rows.specialPedagogues.total,
      label: "speciálních pedagogů",
    },
  ];

  for (const check of qualChecks) {
    if (check.staffCount > 0 && check.qualTotal === 0) {
      warnings.push(`Uvedený počet ${check.label} (${check.staffCount}), ale chybí členění podle kvalifikace.`);
    }
    if (check.staffCount > 0 && check.qualTotal > 0 && check.qualTotal !== check.staffCount) {
      warnings.push(
        `Členění kvalifikace u ${check.label} (${check.qualTotal}) neodpovídá počtu fyzických osob (${check.staffCount}).`,
      );
    }
  }

  return warnings;
}

export function buildPersonnelAvailableDataLines(data: AnnualReportPersonnelData): string[] {
  const missing = detectMissingPersonnelFields(data);
  if (missing.length > 0) return [];

  const staff = calculatePersonnelStaffTotals(data);
  return [
    `Pedagogičtí pracovníci celkem: ${staff.totalPedagogicalPersons} osob / ${staff.totalPedagogicalFte.toLocaleString("cs-CZ")} úvazků`,
    `Pracovníci celkem: ${staff.totalPersons} osob / ${staff.totalFte.toLocaleString("cs-CZ")} úvazků`,
  ];
}

export function isPersonnelDataComplete(data: AnnualReportPersonnelData): boolean {
  return detectMissingPersonnelFields(data).length === 0 && detectPersonnelInconsistencies(data).length === 0;
}
