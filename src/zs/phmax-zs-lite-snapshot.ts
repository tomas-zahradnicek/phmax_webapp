import type { BasicType } from "../phmax-zs-logic";
import {
  sanitizePha1rClasses,
  sanitizePha1rSchoolFlags,
  type Pha1rClassRow,
  type Pha1rSchoolFlags,
} from "./zs-pha1r";

export const ZS_LITE_LS_KEY = "phmax-zs-lite-v2";

const BASIC_TYPES: readonly BasicType[] = [
  "full_more_than_2",
  "full_max_2",
  "first_only_1",
  "first_only_2",
  "first_only_3",
  "first_only_4",
];

export type ZsLiteSnapshot = {
  basicType: BasicType;
  basic1Classes: number;
  basic1Pupils: number;
  basic2Classes: number;
  basic2Pupils: number;
  hasSec16: boolean;
  incl1Classes: number;
  incl1Pupils: number;
  incl2Classes: number;
  incl2Pupils: number;
  pha1rClasses: Pha1rClassRow[];
  schoolEstablishedSec16_9: boolean;
  schoolAtInstitutionalOrProtectiveCare: boolean;
  schoolAtHealthcareFacility: boolean;
};

function isBasicType(value: unknown): value is BasicType {
  return typeof value === "string" && (BASIC_TYPES as readonly string[]).includes(value);
}

function nonNegativeInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

export function emptyZsLiteSnapshot(): ZsLiteSnapshot {
  return {
    basicType: "full_more_than_2",
    basic1Classes: 0,
    basic1Pupils: 0,
    basic2Classes: 0,
    basic2Pupils: 0,
    hasSec16: false,
    incl1Classes: 0,
    incl1Pupils: 0,
    incl2Classes: 0,
    incl2Pupils: 0,
    pha1rClasses: [],
    schoolEstablishedSec16_9: false,
    schoolAtInstitutionalOrProtectiveCare: false,
    schoolAtHealthcareFacility: false,
  };
}

/** Obnova Lite záznamu. Chybějící PHA1R pole jsou prázdné řádky a false příznaky. */
export function parseZsLiteSnapshot(raw: unknown): ZsLiteSnapshot {
  if (!raw || typeof raw !== "object") return emptyZsLiteSnapshot();
  const record = raw as Record<string, unknown>;
  const flags: Pha1rSchoolFlags = sanitizePha1rSchoolFlags(record);
  return {
    basicType: isBasicType(record.basicType) ? record.basicType : "full_more_than_2",
    basic1Classes: nonNegativeInt(record.basic1Classes),
    basic1Pupils: nonNegativeInt(record.basic1Pupils),
    basic2Classes: nonNegativeInt(record.basic2Classes),
    basic2Pupils: nonNegativeInt(record.basic2Pupils),
    hasSec16: record.hasSec16 === true,
    incl1Classes: nonNegativeInt(record.incl1Classes),
    incl1Pupils: nonNegativeInt(record.incl1Pupils),
    incl2Classes: nonNegativeInt(record.incl2Classes),
    incl2Pupils: nonNegativeInt(record.incl2Pupils),
    pha1rClasses: sanitizePha1rClasses(record.pha1rClasses),
    schoolEstablishedSec16_9: flags.schoolEstablishedSec16_9,
    schoolAtInstitutionalOrProtectiveCare: flags.schoolAtInstitutionalOrProtectiveCare,
    schoolAtHealthcareFacility: flags.schoolAtHealthcareFacility,
  };
}

export function readZsLiteSnapshot(): ZsLiteSnapshot {
  try {
    const raw = localStorage.getItem(ZS_LITE_LS_KEY);
    if (!raw) return emptyZsLiteSnapshot();
    return parseZsLiteSnapshot(JSON.parse(raw));
  } catch {
    return emptyZsLiteSnapshot();
  }
}
