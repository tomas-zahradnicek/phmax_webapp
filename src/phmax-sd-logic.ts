import { round2 } from "./phmax-zs-logic";

/**
 * Týdenní PHmax školní družiny (součet přímé pedagogické činnosti všech vychovatelů)
 * podle celkového počtu oddělení – tabulka v příloze k vyhlášce č. 74/2005 Sb., o zájmovém vzdělávání.
 * Hodnoty ověřte vždy proti aktuálnímu konsolidovanému znění (např. zakonyprolidi.cz).
 */
export const PHMAX_SD_BY_DEPARTMENTS: readonly number[] = [
  32.5, 57.5, 80, 97.5, 130, 155, 177.5, 195, 227.5, 252.5, 275, 292.5, 325, 350, 372.5, 390, 412.5, 435, 457.5,
  480, 502.5,
];

export const SD_MAX_DEPARTMENTS_IN_TABLE = PHMAX_SD_BY_DEPARTMENTS.length;

/**
 * Hodiny PHmax připadající na i-té oddělení podle pořadí v příloze vyhl. č. 74/2005 Sb.
 * Pro oddělení 1–16 se opakuje cyklus 32,5 → 25 → 22,5 → 17,5 h. Pro 17. až 21. oddělení dává tabulka
 * v metodice u každého dalšího oddělení konstantně 22,5 h (cyklus se už neopakuje).
 */
export const SD_DEPARTMENT_HOUR_CYCLE: readonly number[] = [32.5, 25, 22.5, 17.5];

export function getPhmaxSdHourForDepartmentOrder(order1Based: number): number {
  if (order1Based >= 17 && order1Based <= 21) {
    return 22.5;
  }
  const i = (order1Based - 1) % SD_DEPARTMENT_HOUR_CYCLE.length;
  return SD_DEPARTMENT_HOUR_CYCLE[i];
}

/** Rozpad celkového PHmax na jednotlivá oddělení (řádek tabulky pro daný počet oddělení). */
export function getPhmaxSdBreakdown(departmentCount: number): readonly number[] | null {
  if (departmentCount < 1 || departmentCount > PHMAX_SD_BY_DEPARTMENTS.length) return null;
  return Array.from({ length: departmentCount }, (_, k) => getPhmaxSdHourForDepartmentOrder(k + 1));
}

export function getPhmaxSdBase(departmentCount: number): number | null {
  if (departmentCount < 1 || departmentCount > PHMAX_SD_BY_DEPARTMENTS.length) return null;
  return PHMAX_SD_BY_DEPARTMENTS[departmentCount - 1];
}

/** Počet „běžných“ oddělení dle pravidla: účastníci ÷ 27, zaokrouhleno nahoru (metodika ŠD). */
export function suggestedDepartmentsFromPupils(pupils: number): number {
  if (pupils <= 0) return 0;
  return Math.ceil(pupils / 27);
}

/**
 * Krácení PHmax, pokud není splněn průměr min. 20 účastníků 1. stupně na oddělení (§ 10 odst. 2 vyhl. 74/2005).
 * Koeficient = skutečný počet ÷ (počet oddělení × 20).
 */
export function reducedPhmaxIfUnderStaffed(params: {
  pupilsFirstGrade: number;
  departmentCount: number;
  basePhmax: number;
}): { adjusted: number; factor: number; applied: boolean } {
  const { pupilsFirstGrade, departmentCount, basePhmax } = params;
  if (departmentCount < 1 || basePhmax <= 0) {
    return { adjusted: basePhmax, factor: 1, applied: false };
  }
  const minPupils = departmentCount * 20;
  if (pupilsFirstGrade <= 0) {
    return { adjusted: basePhmax, factor: 1, applied: false };
  }
  if (pupilsFirstGrade >= minPupils) {
    return { adjusted: basePhmax, factor: 1, applied: false };
  }
  const factor = pupilsFirstGrade / minPupils;
  return { adjusted: round2(basePhmax * factor), factor, applied: true };
}

export type SdDepartmentInput = {
  kind: "regular" | "special";
  participants: number;
  participantsFirstStage?: number;
  specialExceptionGranted?: boolean;
};

export type SdSummaryInput = {
  regularDepartments: number;
  regularParticipantsTotal: number;
  regularExceptionGranted?: boolean;
  specialExceptionGranted?: boolean;
  schoolFirstStageClassCount?: 1 | 2 | 3 | null;
  specialDepartments?: readonly { participants: number; specialExceptionGranted?: boolean }[];
};

export type SdDetailedInput = {
  departments: readonly SdDepartmentInput[];
  regularExceptionGranted?: boolean;
  specialExceptionGranted?: boolean;
  schoolFirstStageClassCount?: 1 | 2 | 3 | null;
};

export type SdNormalizedModel = {
  departments: SdDepartmentInput[];
  regularExceptionGranted: boolean;
  specialExceptionGranted: boolean;
  schoolFirstStageClassCount: 1 | 2 | 3 | null;
  sourceMode: "summary" | "detail";
};

export type SdBreakdownRow = {
  index1Based: number;
  kind: "regular" | "special";
  participants: number;
  basePhmax: number;
  reductionFactor: number;
  finalPhmax: number;
  /** PHAmax je zde veden pro speciální oddělení orientačně stejným koeficientem. */
  finalPhaMax: number;
};

export type SdDetailedResult = {
  totalDepartments: number;
  regularDepartments: number;
  specialDepartments: number;
  basePhmax: number;
  regularSharePhmax: number;
  specialSharePhmax: number;
  finalPhmax: number;
  specialSharePhaMax: number;
  finalPhaMax: number;
  regularReductionFactor: number;
  specialReductionFactor: number;
  breakdown: SdBreakdownRow[];
  notes: string[];
  sourceMode: "summary" | "detail";
};

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function getRegularMinimumPerDept(params: {
  regularDepartments: number;
  schoolFirstStageClassCount: 1 | 2 | 3 | null;
}): number {
  if (params.regularDepartments === 1 && params.schoolFirstStageClassCount != null) {
    if (params.schoolFirstStageClassCount === 1) return 5;
    if (params.schoolFirstStageClassCount === 2) return 15;
    return 18;
  }
  return 20;
}

function getSpecialExceptionFactor(participants: number, exceptionGranted: boolean): number {
  if (!exceptionGranted) return 1;
  if (participants >= 5 && participants < 6) return 0.95;
  if (participants >= 4 && participants < 5) return 0.9;
  if (participants < 4) return 0.4;
  return 1;
}

export function normalizeSchoolDruzinaInput(input: SdSummaryInput | SdDetailedInput): SdNormalizedModel {
  if ("departments" in input) {
    if (!Array.isArray(input.departments) || input.departments.length === 0) {
      throw new Error("Detailní režim vyžaduje alespoň jedno oddělení.");
    }
    return {
      departments: [...input.departments],
      regularExceptionGranted: Boolean(input.regularExceptionGranted),
      specialExceptionGranted: Boolean(input.specialExceptionGranted),
      schoolFirstStageClassCount: input.schoolFirstStageClassCount ?? null,
      sourceMode: "detail",
    };
  }

  const regularDepartments = input.regularDepartments;
  if (!Number.isInteger(regularDepartments) || regularDepartments < 0) {
    throw new Error("Počet běžných oddělení musí být nezáporné celé číslo.");
  }
  if (input.regularParticipantsTotal < 0) {
    throw new Error("Celkový počet účastníků v běžných odděleních nemůže být záporný.");
  }

  const departments: SdDepartmentInput[] = [];
  const regularPerDept = regularDepartments > 0 ? input.regularParticipantsTotal / regularDepartments : 0;
  for (let i = 0; i < regularDepartments; i++) {
    departments.push({ kind: "regular", participants: regularPerDept });
  }
  for (const dep of input.specialDepartments ?? []) {
    if (dep.participants < 0) throw new Error("Počet účastníků speciálního oddělení nemůže být záporný.");
    departments.push({
      kind: "special",
      participants: dep.participants,
      specialExceptionGranted: dep.specialExceptionGranted,
    });
  }
  if (departments.length === 0) throw new Error("Souhrnný režim vyžaduje alespoň jedno oddělení.");

  return {
    departments,
    regularExceptionGranted: Boolean(input.regularExceptionGranted),
    specialExceptionGranted: Boolean(input.specialExceptionGranted),
    schoolFirstStageClassCount: input.schoolFirstStageClassCount ?? null,
    sourceMode: "summary",
  };
}

export function calculateSchoolDruzinaPhmaxDetailed(model: SdNormalizedModel): SdDetailedResult {
  const totalDepartments = model.departments.length;
  const basePhmax = getPhmaxSdBase(totalDepartments);
  if (basePhmax == null) {
    throw new Error(`Počet oddělení musí být v intervalu 1-${SD_MAX_DEPARTMENTS_IN_TABLE}.`);
  }

  const regularDepartments = model.departments.filter((d) => d.kind === "regular");
  const regularParticipantsTotal = regularDepartments.reduce((sum, d) => sum + d.participants, 0);
  const regularMinPerDept = getRegularMinimumPerDept({
    regularDepartments: regularDepartments.length,
    schoolFirstStageClassCount: model.schoolFirstStageClassCount,
  });
  const regularRequiredTotal = regularDepartments.length * regularMinPerDept;
  const regularReductionFactor =
    model.regularExceptionGranted && regularRequiredTotal > 0
      ? clamp01(regularParticipantsTotal / regularRequiredTotal)
      : 1;

  const breakdown = model.departments.map((dep, idx): SdBreakdownRow => {
    const base = getPhmaxSdHourForDepartmentOrder(idx + 1);
    if (dep.kind === "regular") {
      const final = round2(base * regularReductionFactor);
      return {
        index1Based: idx + 1,
        kind: dep.kind,
        participants: dep.participants,
        basePhmax: base,
        reductionFactor: regularReductionFactor,
        finalPhmax: final,
        finalPhaMax: 0,
      };
    }
    const specialExceptionGranted =
      typeof dep.specialExceptionGranted === "boolean" ? dep.specialExceptionGranted : model.specialExceptionGranted;
    const specialFactor = getSpecialExceptionFactor(dep.participants, specialExceptionGranted);
    const final = round2(base * specialFactor);
    return {
      index1Based: idx + 1,
      kind: dep.kind,
      participants: dep.participants,
      basePhmax: base,
      reductionFactor: specialFactor,
      finalPhmax: final,
      finalPhaMax: final,
    };
  });

  const regularSharePhmax = round2(breakdown.filter((r) => r.kind === "regular").reduce((s, r) => s + r.finalPhmax, 0));
  const specialRows = breakdown.filter((r) => r.kind === "special");
  const specialSharePhmax = round2(specialRows.reduce((s, r) => s + r.finalPhmax, 0));
  const finalPhmax = round2(regularSharePhmax + specialSharePhmax);
  const specialSharePhaMax = round2(specialRows.reduce((s, r) => s + r.finalPhaMax, 0));
  const finalPhaMax = specialSharePhaMax;
  const specialBase = specialRows.reduce((s, r) => s + r.basePhmax, 0);
  const specialReductionFactor = specialBase > 0 ? clamp01(specialSharePhmax / specialBase) : 1;

  const notes: string[] = [];
  if (model.regularExceptionGranted && regularDepartments.length > 0) {
    notes.push(
      `Běžná oddělení: poměrné krácení ${regularReductionFactor.toFixed(4)} (${round2(
        regularParticipantsTotal,
      )}/${round2(regularRequiredTotal)}).`,
    );
  }
  if (specialRows.length > 0) {
    notes.push("Speciální oddělení: krácení se aplikuje samostatně po odděleních dle počtu účastníků.");
  }

  return {
    totalDepartments,
    regularDepartments: regularDepartments.length,
    specialDepartments: specialRows.length,
    basePhmax,
    regularSharePhmax,
    specialSharePhmax,
    finalPhmax,
    specialSharePhaMax,
    finalPhaMax,
    regularReductionFactor,
    specialReductionFactor,
    breakdown,
    notes,
    sourceMode: model.sourceMode,
  };
}

export function calculateSchoolDruzinaPhmaxFromSummary(input: SdSummaryInput): SdDetailedResult {
  return calculateSchoolDruzinaPhmaxDetailed(normalizeSchoolDruzinaInput(input));
}
