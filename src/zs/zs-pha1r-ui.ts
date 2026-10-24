import { round2 } from "../phmax-zs-logic";
import {
  computeZsPha1r,
  PHA1R_ELIGIBLE_HOURS,
  PHA1R_MIN_RELEVANT_GRADE1_PUPILS,
  type Pha1rClassRow,
  type Pha1rExclusionReason,
  type Pha1rSchoolFlags,
  type Pha1rValidationIssue,
  validateZsPha1rClasses,
} from "./zs-pha1r";

export const PHA1R_SECTION_ID = "pha1r";
export const PHA1R_SECTION_TITLE = "PHA1Rmax – asistent pedagoga v 1. ročníku";
export const PHA1R_SECTION_LEAD =
  "Hodnota se stanoví podle počtu žáků 1. ročníku v jednotlivých třídách. Hodiny se nezadávají, aplikace je dopočítá.";
export const PHA1R_ROWS_TITLE = "Žáci 1. ročníku po třídách";
export const PHA1R_DEDUCTION_NOTE =
  "Žáci podle § 38 a § 41 zůstávají žáky školy. Do rozhodného počtu pro PHA1Rmax se nezapočítávají.";
export const PHA1R_EMPTY_NOTICE = "Údaje o žácích 1. ročníku po třídách nejsou vyplněné.";
export const PHA1R_SEC16_CLASS_NOTE = "Třída zřízená podle § 16 odst. 9 — PHA1Rmax se neuplatní.";

export const PHA1R_SCHOOL_FLAGS = [
  {
    key: "schoolEstablishedSec16_9",
    label: "Základní škola zřízená podle § 16 odst. 9",
  },
  {
    key: "schoolAtInstitutionalOrProtectiveCare",
    label: "Základní škola při školském zařízení pro výkon ústavní nebo ochranné výchovy",
  },
  {
    key: "schoolAtHealthcareFacility",
    label: "Základní škola při zdravotnickém zařízení",
  },
] as const satisfies readonly { key: keyof Pha1rSchoolFlags; label: string }[];

const EXCLUSION_LABEL: Record<Pha1rExclusionReason, string> = {
  schoolEstablishedSec16_9: "základní škola zřízená podle § 16 odst. 9",
  schoolAtInstitutionalOrProtectiveCare:
    "základní škola při školském zařízení pro výkon ústavní nebo ochranné výchovy",
  schoolAtHealthcareFacility: "základní škola při zdravotnickém zařízení",
};

export function createEmptyPha1rRow(id: number): Pha1rClassRow {
  return {
    id,
    grade1Pupils: 0,
    grade1Par38: 0,
    grade1Par41: 0,
    establishedSec16_9: false,
  };
}

export function pha1rRowNumber(index: number): number {
  return index + 1;
}

export function pha1rGrade1Label(rowNumber: number): string {
  return `Třída ${rowNumber}: počet žáků 1. ročníku`;
}

export function pha1rPar38Label(rowNumber: number): string {
  return `Třída ${rowNumber}: z toho žáci podle § 38`;
}

export function pha1rPar41Label(rowNumber: number): string {
  return `Třída ${rowNumber}: z toho žáci podle § 41`;
}

export function pha1rSec16Label(rowNumber: number): string {
  return `Třída ${rowNumber}: třída zřízená podle § 16 odst. 9`;
}

export function pha1rRemoveAriaLabel(rowNumber: number): string {
  return `Odebrat třídu ${rowNumber}`;
}

export function pha1rExclusionMessage(reasons: readonly Pha1rExclusionReason[]): string {
  if (reasons.length === 0) return "";
  const listed = reasons.map((reason) => EXCLUSION_LABEL[reason]).join("; ");
  return `PHA1Rmax se pro tento typ školy neuplatní: ${listed}.`;
}

export type Pha1rResultKind = "empty" | "excluded" | "computed";

export type Pha1rResultPresentation = {
  kind: Pha1rResultKind;
  hoursText: string;
  eligibleClassCount: number;
  detail: string;
  isError: boolean;
};

export function buildPha1rResultPresentation(input: {
  classes: readonly Pha1rClassRow[];
  flags: Pha1rSchoolFlags;
}): Pha1rResultPresentation {
  const result = computeZsPha1r(input);
  const hoursText = `${result.totalPha1r} hodin týdně`;
  if (result.schoolExcluded) {
    return {
      kind: "excluded",
      hoursText,
      eligibleClassCount: 0,
      detail: pha1rExclusionMessage(result.exclusionReasons),
      isError: false,
    };
  }
  if (input.classes.length === 0) {
    return {
      kind: "empty",
      hoursText,
      eligibleClassCount: 0,
      detail: PHA1R_EMPTY_NOTICE,
      isError: false,
    };
  }
  return {
    kind: "computed",
    hoursText,
    eligibleClassCount: result.eligibleClassCount,
    detail: `Počet způsobilých tříd: ${result.eligibleClassCount}. Práh je ${PHA1R_MIN_RELEVANT_GRADE1_PUPILS} relevantních žáků 1. ročníku v jedné třídě, ${PHA1R_ELIGIBLE_HOURS} hodin na každou způsobilou třídu.`,
    isError: false,
  };
}

export type Pha1rRowView = {
  id: number;
  rowNumber: number;
  relevantGrade1Pupils: number;
  hours: number;
  statusText: string;
  issues: Pha1rValidationIssue[];
  errorId: string;
};

export function buildPha1rRowViews(input: {
  classes: readonly Pha1rClassRow[];
  flags: Pha1rSchoolFlags;
}): Pha1rRowView[] {
  const result = computeZsPha1r(input);
  const issues = validateZsPha1rClasses(input.classes);
  return input.classes.map((row, index) => {
    const computed = result.classes[index];
    const rowIssues = issues.filter((issue) => issue.classId === row.id);
    let statusText = `${computed.relevantGrade1Pupils} relevantních žáků → ${computed.hours} h`;
    if (row.establishedSec16_9) statusText = PHA1R_SEC16_CLASS_NOTE;
    return {
      id: row.id,
      rowNumber: pha1rRowNumber(index),
      relevantGrade1Pupils: computed.relevantGrade1Pupils,
      hours: computed.hours,
      statusText,
      issues: rowIssues,
      errorId: `pha1r-row-${row.id}-error`,
    };
  });
}

/** Orientační součet přehledu. PHA1Rmax do něj nepatří. */
export function zsOverviewOrientationTotal(totalPhmax: number, totalPha: number, totalPhp: number): number {
  return round2(totalPhmax + totalPha + totalPhp);
}
