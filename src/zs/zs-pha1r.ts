/** B47 PHA1Rmax. Hodiny se počítají po třídách, odděleně od PHAmax. */

export const PHA1R_ELIGIBLE_HOURS = 20;
export const PHA1R_MIN_RELEVANT_GRADE1_PUPILS = 15;

export type Pha1rClassRow = {
  id: number;
  grade1Pupils: number;
  grade1Par38: number;
  grade1Par41: number;
  establishedSec16_9: boolean;
};

export type Pha1rSchoolFlags = {
  schoolEstablishedSec16_9: boolean;
  schoolAtInstitutionalOrProtectiveCare: boolean;
  schoolAtHealthcareFacility: boolean;
};

export const EMPTY_PHA1R_SCHOOL_FLAGS: Pha1rSchoolFlags = {
  schoolEstablishedSec16_9: false,
  schoolAtInstitutionalOrProtectiveCare: false,
  schoolAtHealthcareFacility: false,
};

export type Pha1rExclusionReason =
  | "schoolEstablishedSec16_9"
  | "schoolAtInstitutionalOrProtectiveCare"
  | "schoolAtHealthcareFacility";

export type Pha1rClassComputation = {
  id: number;
  relevantGrade1Pupils: number;
  eligible: boolean;
  hours: number;
};

export type Pha1rComputation = {
  totalPha1r: number;
  eligibleClassCount: number;
  schoolExcluded: boolean;
  exclusionReasons: Pha1rExclusionReason[];
  classes: Pha1rClassComputation[];
};

export type Pha1rValidationCode =
  | "negative_grade1_pupils"
  | "negative_par38"
  | "negative_par41"
  | "par38_exceeds_grade1"
  | "par41_exceeds_grade1"
  | "par_sum_exceeds_grade1";

export type Pha1rValidationIssue = {
  section: "pha1r";
  classId: number;
  code: Pha1rValidationCode;
  label: string;
};

const EXCLUSION_ORDER: readonly Pha1rExclusionReason[] = [
  "schoolEstablishedSec16_9",
  "schoolAtInstitutionalOrProtectiveCare",
  "schoolAtHealthcareFacility",
];

function finiteNumber(value: number): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function classInputsInvalid(row: Pha1rClassRow): boolean {
  return (
    !finiteNumber(row.grade1Pupils) ||
    row.grade1Pupils < 0 ||
    !finiteNumber(row.grade1Par38) ||
    row.grade1Par38 < 0 ||
    !finiteNumber(row.grade1Par41) ||
    row.grade1Par41 < 0
  );
}

export function relevantGrade1Pupils(row: Pha1rClassRow): number {
  if (classInputsInvalid(row)) return 0;
  return Math.max(0, row.grade1Pupils - row.grade1Par38 - row.grade1Par41);
}

export function pha1rExclusionReasons(flags: Pha1rSchoolFlags): Pha1rExclusionReason[] {
  return EXCLUSION_ORDER.filter((reason) => flags[reason] === true);
}

export function computeZsPha1r(input: {
  classes: readonly Pha1rClassRow[];
  flags: Pha1rSchoolFlags;
}): Pha1rComputation {
  const exclusionReasons = pha1rExclusionReasons(input.flags);
  const schoolExcluded = exclusionReasons.length > 0;
  const classes = input.classes.map((row) => {
    const relevant = relevantGrade1Pupils(row);
    const eligible =
      !schoolExcluded &&
      row.establishedSec16_9 !== true &&
      !classInputsInvalid(row) &&
      relevant >= PHA1R_MIN_RELEVANT_GRADE1_PUPILS;
    return {
      id: row.id,
      relevantGrade1Pupils: relevant,
      eligible,
      hours: eligible ? PHA1R_ELIGIBLE_HOURS : 0,
    };
  });
  const eligibleClassCount = classes.filter((row) => row.eligible).length;
  return {
    totalPha1r: eligibleClassCount * PHA1R_ELIGIBLE_HOURS,
    eligibleClassCount,
    schoolExcluded,
    exclusionReasons,
    classes,
  };
}

function issue(classId: number, code: Pha1rValidationCode, label: string): Pha1rValidationIssue {
  return { section: "pha1r", classId, code, label: `Třída ${classId}: ${label}` };
}

export function validateZsPha1rClasses(classes: readonly Pha1rClassRow[]): Pha1rValidationIssue[] {
  const issues: Pha1rValidationIssue[] = [];
  for (const row of classes) {
    const grade1Invalid = !finiteNumber(row.grade1Pupils) || row.grade1Pupils < 0;
    const par38Invalid = !finiteNumber(row.grade1Par38) || row.grade1Par38 < 0;
    const par41Invalid = !finiteNumber(row.grade1Par41) || row.grade1Par41 < 0;
    if (grade1Invalid) {
      issues.push(issue(row.id, "negative_grade1_pupils", "počet žáků 1. ročníku nesmí být záporný."));
    }
    if (par38Invalid) {
      issues.push(issue(row.id, "negative_par38", "počet žáků 1. ročníku podle § 38 nesmí být záporný."));
    }
    if (par41Invalid) {
      issues.push(issue(row.id, "negative_par41", "počet žáků 1. ročníku podle § 41 nesmí být záporný."));
    }
    if (grade1Invalid || par38Invalid || par41Invalid) continue;
    if (row.grade1Par38 > row.grade1Pupils) {
      issues.push(
        issue(row.id, "par38_exceeds_grade1", "žáci podle § 38 převyšují počet žáků 1. ročníku ve třídě."),
      );
    }
    if (row.grade1Par41 > row.grade1Pupils) {
      issues.push(
        issue(row.id, "par41_exceeds_grade1", "žáci podle § 41 převyšují počet žáků 1. ročníku ve třídě."),
      );
    }
    if (row.grade1Par38 + row.grade1Par41 > row.grade1Pupils) {
      issues.push(
        issue(
          row.id,
          "par_sum_exceeds_grade1",
          "součet žáků podle § 38 a § 41 převyšuje počet žáků 1. ročníku ve třídě.",
        ),
      );
    }
  }
  return issues;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function sanitizePha1rClasses(raw: unknown): Pha1rClassRow[] {
  if (!Array.isArray(raw)) return [];
  const out: Pha1rClassRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    out.push({
      id: num(row.id, i + 1),
      grade1Pupils: num(row.grade1Pupils),
      grade1Par38: num(row.grade1Par38),
      grade1Par41: num(row.grade1Par41),
      establishedSec16_9: row.establishedSec16_9 === true,
    });
  }
  return out;
}

export function sanitizePha1rSchoolFlags(raw: Record<string, unknown>): Pha1rSchoolFlags {
  return {
    schoolEstablishedSec16_9: raw.schoolEstablishedSec16_9 === true,
    schoolAtInstitutionalOrProtectiveCare: raw.schoolAtInstitutionalOrProtectiveCare === true,
    schoolAtHealthcareFacility: raw.schoolAtHealthcareFacility === true,
  };
}
