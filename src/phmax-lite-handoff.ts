import { getPvSec2MinimumChildrenTotal } from "./phmax-pv-logic";
import { suggestedDepartmentsFromPupils } from "./phmax-sd-logic";
import type { PvLiteInput } from "./pv/phmax-pv-lite-logic";
import type { SdLiteInput } from "./sd/phmax-sd-lite-logic";
import type { PvWorkplaceRowState } from "./pv/pv-workplace-shared";
import type { ZsLiteInput } from "./zs/phmax-zs-lite-logic";
import { invalidateZsAutosavePeekCache, ZS_AUTOSAVE_STORAGE_KEY } from "./zs/zs-form-snapshot";

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

function resolveZsLiteHandoffMode(input: ZsLiteInput): "phmax_full_zs" | "phmax_first_stage_only" | "phmax_full_zs_sec16" {
  const isFull = input.basicType === "full_more_than_2" || input.basicType === "full_max_2";
  const hasSec16 = input.incl1Classes > 0 || input.incl2Classes > 0;
  if (hasSec16 && isFull) return "phmax_full_zs_sec16";
  if (isFull) return "phmax_full_zs";
  return "phmax_first_stage_only";
}

export function buildZsFullSnapshotFromLite(input: ZsLiteInput): Record<string, unknown> {
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
    exportLabel: "Z rychlého PHmax",
    zsWizardStep: 2,
    dataMode: "own",
  };
}

export function writeZsLiteHandoffToFullStorage(input: ZsLiteInput): boolean {
  if (input.basic1Classes < 1 || input.basic1Pupils < 1) return false;
  const isFull = input.basicType === "full_more_than_2" || input.basicType === "full_max_2";
  if (isFull && (input.basic2Classes < 1 || input.basic2Pupils < 1)) return false;
  try {
    invalidateZsAutosavePeekCache();
    localStorage.setItem(
      ZS_AUTOSAVE_STORAGE_KEY,
      JSON.stringify({
        ...buildZsFullSnapshotFromLite(input),
        _phmaxLiteHandoff: true,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
