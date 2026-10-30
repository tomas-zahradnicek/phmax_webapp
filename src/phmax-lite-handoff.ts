import { getPvSec2MinimumChildrenTotal } from "./phmax-pv-logic";
import { suggestedDepartmentsFromPupils } from "./phmax-sd-logic";
import type { PvLiteInput } from "./pv/phmax-pv-lite-logic";
import type { SdLiteInput } from "./sd/phmax-sd-lite-logic";
import type { PvWorkplaceRowState } from "./pv/pv-workplace-shared";
import type { ZsLiteInput } from "./zs/phmax-zs-lite-logic";
import { invalidateZsAutosavePeekCache, ZS_AUTOSAVE_STORAGE_KEY } from "./zs/zs-form-snapshot";
import {
  validateZsPha1rClasses,
  type Pha1rClassRow,
  type Pha1rSchoolFlags,
  type Pha1rValidationIssue,
} from "./zs/zs-pha1r";

export const PV_FULL_STORAGE_KEY = "edu-cz-pv-calculator-state";
export const SD_FULL_STORAGE_KEY = "edu-cz-sd-calculator-state";

export type PvLiteHandoffInput = PvLiteInput & {
  sec16ClassCount: number;
};

function newPvRowId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pv-lite-${Date.now().toString(36)}`;
}

export function buildPvFullSnapshotFromLite(input: PvLiteHandoffInput): { rows: PvWorkplaceRowState[] } {
  const classCount = Math.max(0, Math.floor(input.classCount));
  const minimumChildren = getPvSec2MinimumChildrenTotal({
    soleMsInMunicipality: input.soleMsInMunicipality,
    classCount,
  });

  const row: PvWorkplaceRowState = {
    id: newPvRowId(),
    label: "Z rychlého PHmax",
    provoz: input.provoz,
    classCount,
    avgHours: input.provoz === "zdravotnicke" ? 0 : Math.max(0, input.avgHours),
    sec16Count: Math.max(0, Math.floor(input.sec16ClassCount)),
    languageGroups: 0,
    pv1dActualChildren: Math.max(0, Math.floor(input.actualChildren)),
    pv1dMinimumChildren: minimumChildren ?? 0,
    pv1dKuPhmaxCap: 0,
    pv1dKuDecisionRef: "",
    pv1dExemption: false,
  };

  return { rows: [row] };
}

export function buildSdFullSnapshotFromLite(input: SdLiteInput) {
  const pupils = Math.max(0, Math.floor(input.pupils));
  const suggested = suggestedDepartmentsFromPupils(pupils);
  const effectiveDepartments =
    input.manualDepartments && input.departments > 0
      ? Math.max(1, Math.floor(input.departments))
      : Math.max(1, suggested);
  const avgParticipantsPerDept = pupils / effectiveDepartments;

  return {
    pupils,
    manualDepts: input.manualDepartments,
    departments: effectiveDepartments,
    inputMode: "summary" as const,
    summarySpecialDepartments: [] as { participants: number; specialExceptionGranted?: boolean }[],
    regularExceptionGranted: avgParticipantsPerDept < 20,
    specialExceptionGranted: false,
    detailDepartments: [{ kind: "regular" as const, participants: 0 }],
    schoolFirstStageClassCount:
      effectiveDepartments === 1 ? input.schoolFirstStageClassCount : null,
  };
}

export function writePvLiteHandoffToFullStorage(input: PvLiteHandoffInput): boolean {
  if (input.classCount < 1) return false;
  try {
    const snapshot = buildPvFullSnapshotFromLite(input);
    localStorage.setItem(
      PV_FULL_STORAGE_KEY,
      JSON.stringify({
        ...snapshot,
        _phmaxLiteHandoff: true,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function writeSdLiteHandoffToFullStorage(input: SdLiteInput): boolean {
  if (input.pupils < 1) return false;
  try {
    localStorage.setItem(
      SD_FULL_STORAGE_KEY,
      JSON.stringify({
        ...buildSdFullSnapshotFromLite(input),
        _phmaxLiteHandoff: true,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export type ZsLiteHandoffInput = ZsLiteInput & {
  pha1rClasses?: readonly unknown[];
  schoolEstablishedSec16_9?: unknown;
  schoolAtInstitutionalOrProtectiveCare?: unknown;
  schoolAtHealthcareFacility?: unknown;
};

export type ZsLiteHandoffWriteResult =
  | { ok: true }
  | { ok: false; reason: "incomplete_phmax" }
  | { ok: false; reason: "invalid_pha1r"; issues: readonly Pha1rValidationIssue[] }
  | { ok: false; reason: "storage_unavailable" };

function phmaxHandoffReady(input: ZsLiteInput): boolean {
  if (input.basic1Classes < 1 || input.basic1Pupils < 1) return false;
  const isFull = input.basicType === "full_more_than_2" || input.basicType === "full_max_2";
  if (isFull && (input.basic2Classes < 1 || input.basic2Pupils < 1)) return false;
  return true;
}

function optionalBoolean(value: unknown): boolean | null {
  if (value == null) return false;
  if (typeof value === "boolean") return value;
  return null;
}

function optionalClassRow(raw: unknown, index: number): Pha1rClassRow | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.grade1Pupils !== "number" || !Number.isFinite(row.grade1Pupils)) return null;
  if (typeof row.grade1Par38 !== "number" || !Number.isFinite(row.grade1Par38)) return null;
  if (typeof row.grade1Par41 !== "number" || !Number.isFinite(row.grade1Par41)) return null;
  if (row.id != null && (typeof row.id !== "number" || !Number.isFinite(row.id))) return null;
  if (row.establishedSec16_9 != null && typeof row.establishedSec16_9 !== "boolean") return null;
  return {
    id: typeof row.id === "number" ? row.id : index + 1,
    grade1Pupils: row.grade1Pupils,
    grade1Par38: row.grade1Par38,
    grade1Par41: row.grade1Par41,
    establishedSec16_9: row.establishedSec16_9 === true,
  };
}

export function resolveZsLiteHandoffPha1r(input: ZsLiteHandoffInput):
  | { ok: true; classes: Pha1rClassRow[]; flags: Pha1rSchoolFlags }
  | { ok: false; issues: Pha1rValidationIssue[] } {
  const flags = {
    schoolEstablishedSec16_9: optionalBoolean(input.schoolEstablishedSec16_9),
    schoolAtInstitutionalOrProtectiveCare: optionalBoolean(input.schoolAtInstitutionalOrProtectiveCare),
    schoolAtHealthcareFacility: optionalBoolean(input.schoolAtHealthcareFacility),
  };
  if (
    flags.schoolEstablishedSec16_9 == null ||
    flags.schoolAtInstitutionalOrProtectiveCare == null ||
    flags.schoolAtHealthcareFacility == null
  ) {
    return { ok: false, issues: [] };
  }
  if (input.pha1rClasses == null) {
    return {
      ok: true,
      classes: [],
      flags: {
        schoolEstablishedSec16_9: flags.schoolEstablishedSec16_9,
        schoolAtInstitutionalOrProtectiveCare: flags.schoolAtInstitutionalOrProtectiveCare,
        schoolAtHealthcareFacility: flags.schoolAtHealthcareFacility,
      },
    };
  }
  if (!Array.isArray(input.pha1rClasses)) return { ok: false, issues: [] };
  const classes: Pha1rClassRow[] = [];
  for (let i = 0; i < input.pha1rClasses.length; i++) {
    const row = optionalClassRow(input.pha1rClasses[i], i);
    if (!row) return { ok: false, issues: [] };
    classes.push(row);
  }
  const issues = validateZsPha1rClasses(classes);
  if (issues.length > 0) return { ok: false, issues };
  return {
    ok: true,
    classes,
    flags: {
      schoolEstablishedSec16_9: flags.schoolEstablishedSec16_9,
      schoolAtInstitutionalOrProtectiveCare: flags.schoolAtInstitutionalOrProtectiveCare,
      schoolAtHealthcareFacility: flags.schoolAtHealthcareFacility,
    },
  };
}

function resolveZsLiteHandoffMode(input: ZsLiteInput): "phmax_full_zs" | "phmax_first_stage_only" | "phmax_full_zs_sec16" {
  const isFull = input.basicType === "full_more_than_2" || input.basicType === "full_max_2";
  const hasSec16 = input.incl1Classes > 0 || input.incl2Classes > 0;
  if (hasSec16 && isFull) return "phmax_full_zs_sec16";
  if (isFull) return "phmax_full_zs";
  return "phmax_first_stage_only";
}

export function buildZsFullSnapshotFromLite(input: ZsLiteHandoffInput): Record<string, unknown> {
  const pha1r = resolveZsLiteHandoffPha1r(input);
  if (!pha1r.ok) {
    throw new Error("Neplatné vstupy PHA1Rmax nelze přenést do plné kalkulačky.");
  }
  const isFull = input.basicType === "full_more_than_2" || input.basicType === "full_max_2";
  return {
    tab: "phmax",
    mode: resolveZsLiteHandoffMode(input),
    basicType: input.basicType,
    basic1Classes: Math.max(0, Math.floor(input.basic1Classes)),
    basic1Pupils: Math.max(0, Math.floor(input.basic1Pupils)),
    basic2Classes: isFull ? Math.max(0, Math.floor(input.basic2Classes)) : 0,
    basic2Pupils: isFull ? Math.max(0, Math.floor(input.basic2Pupils)) : 0,
    incl1Classes: Math.max(0, Math.floor(input.incl1Classes)),
    incl1Pupils: Math.max(0, Math.floor(input.incl1Pupils)),
    incl2Classes: isFull ? Math.max(0, Math.floor(input.incl2Classes)) : 0,
    incl2Pupils: isFull ? Math.max(0, Math.floor(input.incl2Pupils)) : 0,
    pha1rClasses: pha1r.classes,
    schoolEstablishedSec16_9: pha1r.flags.schoolEstablishedSec16_9,
    schoolAtInstitutionalOrProtectiveCare: pha1r.flags.schoolAtInstitutionalOrProtectiveCare,
    schoolAtHealthcareFacility: pha1r.flags.schoolAtHealthcareFacility,
    exportLabel: "Z rychlého PHmax",
    zsWizardStep: 2,
    dataMode: "own",
  };
}

const ZS_FULL_AUTOSAVE_COUNT_KEYS = [
  "basic1Classes",
  "basic1Pupils",
  "basic2Classes",
  "basic2Pupils",
  "incl1Classes",
  "incl1Pupils",
  "incl2Classes",
  "incl2Pupils",
  "minority1Classes",
  "minority1Pupils",
  "minority2Classes",
  "minority2Pupils",
  "special1Classes",
  "special1Pupils",
  "special2Classes",
  "special2Pupils",
  "specialIIClasses",
  "specialIIPupils",
  "prepClasses",
  "prepChildren",
  "prepSpecialClasses",
  "prepSpecialChildren",
  "p38First",
  "p38Second",
  "p41First",
  "p41Second",
  "phpYear1",
  "phpYear2",
  "phpYear3",
  "phpExcludedAbroad",
  "phpExcludedForeignSchoolCz",
  "phpExcludedIndividual",
] as const;

const ZS_FULL_AUTOSAVE_ROW_KEYS = [
  "psychRows",
  "healthRows",
  "gymRows",
  "mixedRows",
  "phaRows",
  "pha1rClasses",
] as const;

/** Uložený snímek plné ZŠ obsahuje údaje, které by přenos nahradil. */
export function zsFullAutosaveHasMeaningfulData(raw: Record<string, unknown>): boolean {
  for (const key of ZS_FULL_AUTOSAVE_COUNT_KEYS) {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value) && value !== 0) return true;
  }
  for (const key of ZS_FULL_AUTOSAVE_ROW_KEYS) {
    const value = raw[key];
    if (Array.isArray(value) && value.length > 0) return true;
  }
  if (
    raw.schoolEstablishedSec16_9 === true ||
    raw.schoolAtInstitutionalOrProtectiveCare === true ||
    raw.schoolAtHealthcareFacility === true ||
    raw.phpExcludedSchool === true
  ) {
    return true;
  }
  if (typeof raw.selectedExample === "string" && raw.selectedExample.trim() !== "") return true;
  if (typeof raw.exportLabel === "string" && raw.exportLabel.trim() !== "") return true;
  return false;
}

export type ZsFullAutosaveHandoffGuard = "absent" | "replace" | "unreadable";

/** Čte kanonický klíč plné ZŠ. Nečitelný záznam nesmí být tiše přepsán. */
export function inspectZsFullAutosaveForLiteHandoff(): ZsFullAutosaveHandoffGuard {
  try {
    const raw = localStorage.getItem(ZS_AUTOSAVE_STORAGE_KEY);
    if (raw == null || raw.trim() === "") return "absent";
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "unreadable";
    return zsFullAutosaveHasMeaningfulData(parsed as Record<string, unknown>) ? "replace" : "absent";
  } catch {
    return "unreadable";
  }
}

export function evaluateZsLiteHandoff(input: ZsLiteHandoffInput): ZsLiteHandoffWriteResult {
  if (!phmaxHandoffReady(input)) return { ok: false, reason: "incomplete_phmax" };
  const pha1r = resolveZsLiteHandoffPha1r(input);
  if (!pha1r.ok) return { ok: false, reason: "invalid_pha1r", issues: pha1r.issues };
  return { ok: true };
}

export function writeZsLiteHandoffToFullStorage(input: ZsLiteHandoffInput): ZsLiteHandoffWriteResult {
  const evaluated = evaluateZsLiteHandoff(input);
  if (!evaluated.ok) return evaluated;
  try {
    invalidateZsAutosavePeekCache();
    localStorage.setItem(
      ZS_AUTOSAVE_STORAGE_KEY,
      JSON.stringify({
        ...buildZsFullSnapshotFromLite(input),
        _phmaxLiteHandoff: true,
      }),
    );
    return { ok: true };
  } catch {
    return { ok: false, reason: "storage_unavailable" };
  }
}
