import type { SchoolProfile } from "../school-profile/school-profile-types";
import type { AnnualReportCalculatorData } from "./vyrocni-zprava-calculator-data-bridge";
import { getSection03Readiness, type Section03Readiness } from "./vyrocni-zprava-calculator-data-bridge";
import {
  calculateAgeGenderTotals,
  calculateEducationGenderTotals,
  calculatePersonnelStaffTotals,
  calculateQualificationTotals,
  isPersonnelCountFilled,
} from "./vyrocni-zprava-personnel-logic";
import type { AnnualReportPersonnelData } from "./vyrocni-zprava-personnel-types";

export type Section03SchoolIdentification = {
  name?: string;
  ico?: string;
  redIzo?: string;
  izo?: string;
  schoolType?: string;
  municipality?: string;
  region?: string;
};

export type Section03StaffCountsInput = {
  teachersPersons?: number;
  teachersFte?: number;
  educatorsPersons?: number;
  educatorsFte?: number;
  specialPedagoguesPersons?: number;
  specialPedagoguesFte?: number;
  teachingAssistantsPersons?: number;
  teachingAssistantsFte?: number;
  nonTeachingStaffPersons?: number;
  nonTeachingStaffFte?: number;
  totalPedagogicalPersons: number;
  totalPedagogicalFte: number;
  totalPersons: number;
  totalFte: number;
};

export type Section03GenderRowInput = {
  label: string;
  men?: number;
  women?: number;
  total: number;
};

export type Section03QualificationRowInput = {
  label: string;
  qualified?: number;
  notQualified?: number;
  total: number;
};

export type Section03CalculatorSupportInput = {
  available: boolean;
  sources: string[];
  phmax?: number;
  phamax?: number;
  phpmax?: number;
  moduleLines: string[];
};

export type Section03GeneratorInput = {
  schoolIdentification: Section03SchoolIdentification;
  schoolYear: string;
  staffCounts: Section03StaffCountsInput;
  ageAndGender: {
    rows: Section03GenderRowInput[];
    totalMen: number;
    totalWomen: number;
    grandTotal: number;
  };
  educationAndGender: {
    rows: Section03GenderRowInput[];
    totalMen: number;
    totalWomen: number;
    grandTotal: number;
  };
  qualification: {
    rows: Section03QualificationRowInput[];
    totalQualified: number;
    totalNotQualified: number;
    grandTotal: number;
  };
  calculatorSupport: Section03CalculatorSupportInput;
  missingData: string[];
  warnings: string[];
  readiness: Section03Readiness["status"];
};

function pickFilledString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildSchoolIdentification(profile: SchoolProfile): Section03SchoolIdentification {
  const identification: Section03SchoolIdentification = {};
  const name = pickFilledString(profile.name);
  const ico = pickFilledString(profile.ico);
  const redIzo = pickFilledString(profile.redIzo);
  const izo = pickFilledString(profile.izo);
  const schoolType = pickFilledString(profile.schoolType);
  const municipality = pickFilledString(profile.municipality);
  const region = pickFilledString(profile.region);

  if (name) identification.name = name;
  if (ico) identification.ico = ico;
  if (redIzo) identification.redIzo = redIzo;
  if (izo) identification.izo = izo;
  if (schoolType) identification.schoolType = schoolType;
  if (municipality) identification.municipality = municipality;
  if (region) identification.region = region;

  return identification;
}

function buildStaffCountsInput(data: AnnualReportPersonnelData): Section03StaffCountsInput {
  const s = data.staffCounts;
  const totals = calculatePersonnelStaffTotals(data);
  const input: Section03StaffCountsInput = {
    totalPedagogicalPersons: totals.totalPedagogicalPersons,
    totalPedagogicalFte: totals.totalPedagogicalFte,
    totalPersons: totals.totalPersons,
    totalFte: totals.totalFte,
  };

  if (isPersonnelCountFilled(s.teachersPersons)) input.teachersPersons = s.teachersPersons;
  if (isPersonnelCountFilled(s.teachersFte)) input.teachersFte = s.teachersFte;
  if (isPersonnelCountFilled(s.educatorsPersons)) input.educatorsPersons = s.educatorsPersons;
  if (isPersonnelCountFilled(s.educatorsFte)) input.educatorsFte = s.educatorsFte;
  if (isPersonnelCountFilled(s.specialPedagoguesPersons)) input.specialPedagoguesPersons = s.specialPedagoguesPersons;
  if (isPersonnelCountFilled(s.specialPedagoguesFte)) input.specialPedagoguesFte = s.specialPedagoguesFte;
  if (isPersonnelCountFilled(s.teachingAssistantsPersons)) input.teachingAssistantsPersons = s.teachingAssistantsPersons;
  if (isPersonnelCountFilled(s.teachingAssistantsFte)) input.teachingAssistantsFte = s.teachingAssistantsFte;
  if (isPersonnelCountFilled(s.nonTeachingStaffPersons)) input.nonTeachingStaffPersons = s.nonTeachingStaffPersons;
  if (isPersonnelCountFilled(s.nonTeachingStaffFte)) input.nonTeachingStaffFte = s.nonTeachingStaffFte;

  return input;
}

const AGE_ROW_LABELS: { key: keyof AnnualReportPersonnelData["ageAndGender"]; label: string }[] = [
  { key: "under35", label: "do 35 let" },
  { key: "age36to45", label: "36–45 let" },
  { key: "age46to55", label: "46–55 let" },
  { key: "over55", label: "nad 55 let" },
  { key: "retirementAge", label: "v důchodovém věku" },
];

const EDUCATION_ROW_LABELS: { key: keyof AnnualReportPersonnelData["educationAndGender"]; label: string }[] = [
  { key: "belowMaturita", label: "nižší než maturita" },
  { key: "maturita", label: "maturita" },
  { key: "higherVocational", label: "vyšší odborné vzdělání" },
  { key: "university", label: "vysokoškolské vzdělání" },
];

const QUALIFICATION_ROW_LABELS: { key: keyof AnnualReportPersonnelData["qualification"]; label: string }[] = [
  { key: "primaryTeachers", label: "učitel prvního stupně základní školy" },
  { key: "lowerSecondaryTeachers", label: "učitel druhého stupně základní školy" },
  { key: "educators", label: "vychovatel" },
  { key: "teachingAssistants", label: "asistent pedagoga" },
  { key: "specialPedagogues", label: "speciální pedagog" },
];

function buildGenderRowsFromGroup<T extends Record<string, { men?: number; women?: number }>>(
  groups: T,
  labels: readonly { key: keyof T & string; label: string }[],
  totals: { rows: Record<keyof T, { men: number; women: number; total: number }> },
): Section03GenderRowInput[] {
  return labels.map(({ key, label }) => {
    const pair = groups[key];
    const row: Section03GenderRowInput = {
      label,
      total: totals.rows[key].total,
    };
    if (isPersonnelCountFilled(pair.men)) row.men = pair.men;
    if (isPersonnelCountFilled(pair.women)) row.women = pair.women;
    return row;
  });
}

function buildQualificationRows(
  data: AnnualReportPersonnelData,
  totals: ReturnType<typeof calculateQualificationTotals>,
): Section03QualificationRowInput[] {
  return QUALIFICATION_ROW_LABELS.map(({ key, label }) => {
    const pair = data.qualification[key];
    const row: Section03QualificationRowInput = {
      label,
      total: totals.rows[key].total,
    };
    if (isPersonnelCountFilled(pair.qualified)) row.qualified = pair.qualified;
    if (isPersonnelCountFilled(pair.notQualified)) row.notQualified = pair.notQualified;
    return row;
  });
}

function buildCalculatorSupport(calculatorData: AnnualReportCalculatorData, readiness: Section03Readiness): Section03CalculatorSupportInput {
  const { personnel } = calculatorData;
  const support: Section03CalculatorSupportInput = {
    available: personnel.available,
    sources: [...personnel.sources],
    moduleLines: readiness.availableData.filter(
      (line) => line.includes("PHmax") || line.includes("PHAmax") || line.includes("PHPmax"),
    ),
  };

  if (personnel.values.phmax != null) support.phmax = personnel.values.phmax;
  if (personnel.values.phamax != null) support.phamax = personnel.values.phamax;
  if (personnel.values.phpmax != null) support.phpmax = personnel.values.phpmax;

  return support;
}

/** Sestaví validovaný vstup pro generování kapitoly 03 – bez vymýšlení chybějících hodnot. */
export function buildSection03GeneratorInput(params: {
  schoolProfile: SchoolProfile;
  schoolYear: string;
  personnelData: AnnualReportPersonnelData;
  calculatorData: AnnualReportCalculatorData;
}): Section03GeneratorInput {
  const readiness = getSection03Readiness({
    calculatorData: params.calculatorData,
    personnelData: params.personnelData,
  });

  const ageTotals = calculateAgeGenderTotals(params.personnelData);
  const educationTotals = calculateEducationGenderTotals(params.personnelData);
  const qualificationTotals = calculateQualificationTotals(params.personnelData);

  return {
    schoolIdentification: buildSchoolIdentification(params.schoolProfile),
    schoolYear: params.schoolYear.trim(),
    staffCounts: buildStaffCountsInput(params.personnelData),
    ageAndGender: {
      rows: buildGenderRowsFromGroup(params.personnelData.ageAndGender, AGE_ROW_LABELS, ageTotals),
      totalMen: ageTotals.totalMen,
      totalWomen: ageTotals.totalWomen,
      grandTotal: ageTotals.grandTotal,
    },
    educationAndGender: {
      rows: buildGenderRowsFromGroup(params.personnelData.educationAndGender, EDUCATION_ROW_LABELS, educationTotals),
      totalMen: educationTotals.totalMen,
      totalWomen: educationTotals.totalWomen,
      grandTotal: educationTotals.grandTotal,
    },
    qualification: {
      rows: buildQualificationRows(params.personnelData, qualificationTotals),
      totalQualified: qualificationTotals.totalQualified,
      totalNotQualified: qualificationTotals.totalNotQualified,
      grandTotal: qualificationTotals.grandTotal,
    },
    calculatorSupport: buildCalculatorSupport(params.calculatorData, readiness),
    missingData: readiness.missingData,
    warnings: readiness.warnings,
    readiness: readiness.status,
  };
}
