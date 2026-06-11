import {
  calculateSchoolDruzinaPhmaxFromSummary,
  SD_MAX_DEPARTMENTS_IN_TABLE,
  suggestedDepartmentsFromPupils,
} from "../phmax-sd-logic";
import { buildSdPlainNarrativeText } from "../phmax-sd-narrative";
import { computeSdStaffingSplitNv75 } from "../phmax-sd-staffing-nv75";

export type SdLiteSchoolFirstStageClassCount = 1 | 2 | 3 | null;

export type SdLiteInput = {
  pupils: number;
  manualDepartments: boolean;
  departments: number;
  /** Platí jen při 1 běžném oddělení – mění minimum účastníků (5 / 15 / 18 místo 20). */
  schoolFirstStageClassCount: SdLiteSchoolFirstStageClassCount;
};

export type SdLiteResult = {
  ok: true;
  pupils: number;
  suggestedDepartments: number;
  effectiveDepartments: number;
  phmaxHours: number;
  reductionApplied: boolean;
  reductionFactor: number;
  tableWarning: string | null;
  narrative: { p1: string; p2: string; disclaimer: string };
  staffing: ReturnType<typeof computeSdStaffingSplitNv75>;
};

export type SdLiteError = {
  ok: false;
  message: string;
};

export function computeSdLitePhmax(input: SdLiteInput): SdLiteResult | SdLiteError {
  const pupils = Math.max(0, Math.floor(input.pupils));
  if (pupils <= 0) {
    return { ok: false, message: "Zadejte počet přihlášených účastníků (žáci 1. stupně ZŠ)." };
  }

  const suggested = suggestedDepartmentsFromPupils(pupils);
  const effectiveDepartments =
    input.manualDepartments && input.departments > 0 ? Math.floor(input.departments) : suggested;

  if (effectiveDepartments < 1) {
    return { ok: false, message: "Počet oddělení musí být alespoň 1." };
  }

  const tableWarning =
    effectiveDepartments > SD_MAX_DEPARTMENTS_IN_TABLE
      ? `Tabulka v aplikaci končí u ${SD_MAX_DEPARTMENTS_IN_TABLE} oddělení – u vyššího počtu ověřte přílohu vyhlášky.`
      : null;

  const schoolFirstStageClassCount =
    effectiveDepartments === 1 ? input.schoolFirstStageClassCount : null;

  const avgParticipantsPerDept = pupils / effectiveDepartments;
  const regularExceptionGranted = avgParticipantsPerDept < 20;

  let result;
  try {
    result = calculateSchoolDruzinaPhmaxFromSummary({
      regularDepartments: effectiveDepartments,
      regularParticipantsTotal: pupils,
      regularExceptionGranted,
      specialExceptionGranted: false,
      schoolFirstStageClassCount,
      specialDepartments: [],
    });
  } catch {
    return { ok: false, message: "Výpočet se nepodařil – zkontrolujte počet oddělení." };
  }

  const phmaxHours = result.finalPhmax;
  const narrative =
    buildSdPlainNarrativeText({
      pupils,
      hasSpecialDepartments: false,
      totalDepartments: effectiveDepartments,
      phmaxHours,
    }) ?? {
      p1: "",
      p2: `PHmax činí ${phmaxHours.toLocaleString("cs-CZ")} h týdně.`,
      disclaimer: "Orientační výpočet.",
    };

  const staffing = computeSdStaffingSplitNv75({
    totalPhmax: phmaxHours,
    departmentCount: effectiveDepartments,
    vychovatelFullPpc: 28,
    separateVedoucihoDleT72: true,
  });

  return {
    ok: true,
    pupils,
    suggestedDepartments: suggested,
    effectiveDepartments,
    phmaxHours,
    reductionApplied: result.regularReductionFactor < 1,
    reductionFactor: result.regularReductionFactor,
    tableWarning,
    narrative,
    staffing,
  };
}
