export type SchoolShdDepartment = {
  kind: "regular" | "special";
  participants: number;
  /**
   * U speciálních oddělení lze výjimku evidovat po odděleních (pokud se liší).
   * Když není zadáno, použije se globální `specialExceptionGranted` z detailního vstupu.
   */
  specialExceptionGranted?: boolean;
};

export type SchoolShdSummaryInput = {
  mode: "summary";
  regularDepartments: number;
  regularParticipantsTotal: number;
  /**
   * Speciální oddělení po jednom (umožňuje různý počet účastníků).
   * Počet speciálních oddělení = délka pole.
   */
  specialDepartments?: readonly { participants: number; exceptionGranted?: boolean }[];
  regularExceptionGranted?: boolean;
  specialExceptionGranted?: boolean;
  schoolFirstStageClassCount?: 1 | 2 | 3 | null;
};

export type SchoolShdDetailInput = {
  mode: "detail";
  departments: readonly SchoolShdDepartment[];
  regularExceptionGranted?: boolean;
  specialExceptionGranted?: boolean;
  schoolFirstStageClassCount?: 1 | 2 | 3 | null;
};

export type SchoolShdInput = SchoolShdSummaryInput | SchoolShdDetailInput;

export type SchoolShdDepartmentResult = {
  index1Based: number;
  kind: "regular" | "special";
  participants: number;
  basePhmax: number;
  reductionFactor: number;
  finalPhmax: number;
  note?: string;
};

export type SchoolShdResult = {
  mode: "summary" | "detail";
  totalDepartments: number;
  regularDepartments: number;
  specialDepartments: number;
  basePhmax: number;
  regularSharePhmax: number;
  specialSharePhmax: number;
  regularReductionFactor: number;
  /** Vážený koeficient speciálních oddělení (součet po krácení / součet bez krácení). */
  specialReductionFactor: number;
  finalPhmax: number;
  departments: SchoolShdDepartmentResult[];
  notes: string[];
};

const BASE_PHMAX_TABLE: Record<number, number> = {
  1: 32.5,
  2: 57.5,
  3: 80.0,
  4: 97.5,
  5: 130.0,
  6: 155.0,
  7: 177.5,
  8: 195.0,
  9: 227.5,
  10: 252.5,
  11: 275.0,
  12: 292.5,
  13: 325.0,
  14: 350.0,
  15: 372.5,
  16: 390.0,
};

const PHMAX_SD_DEPARTMENT_CYCLE = [32.5, 25, 22.5, 17.5] as const;

function round1(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function getBasePhmax(totalDepartments: number): number {
  if (!Number.isInteger(totalDepartments) || totalDepartments <= 0) {
    throw new Error("Počet oddělení musí být kladné celé číslo.");
  }
  if (totalDepartments <= 16) return BASE_PHMAX_TABLE[totalDepartments];
  return 390 + (totalDepartments - 16) * 22.5;
}

function getDepartmentBasePhmax(order1Based: number): number {
  if (!Number.isInteger(order1Based) || order1Based <= 0) {
    throw new Error("Pořadí oddělení musí být kladné celé číslo.");
  }
  // V souladu s tabulkou: od 17. oddělení dál je přírůstek 22,5.
  if (order1Based >= 17) return 22.5;
  return PHMAX_SD_DEPARTMENT_CYCLE[(order1Based - 1) % PHMAX_SD_DEPARTMENT_CYCLE.length];
}

function getRegularMinimumParticipantsPerDepartment(params: {
  regularDepartments: number;
  schoolFirstStageClassCount?: 1 | 2 | 3 | null;
}): number {
  if (
    params.regularDepartments === 1 &&
    params.schoolFirstStageClassCount &&
    [1, 2, 3].includes(params.schoolFirstStageClassCount)
  ) {
    if (params.schoolFirstStageClassCount === 1) return 5;
    if (params.schoolFirstStageClassCount === 2) return 15;
    return 18;
  }
  return 20;
}

function getSpecialReductionFactor(participants: number, exceptionGranted: boolean): number {
  if (!exceptionGranted) return 1;
  if (participants < 0) {
    throw new Error("Počet účastníků ve speciálním oddělení nemůže být záporný.");
  }
  if (participants >= 5 && participants < 6) return 0.95;
  if (participants >= 4 && participants < 5) return 0.9;
  if (participants < 4) return 0.4;
  return 1;
}

function toInternalDetail(input: SchoolShdInput): {
  mode: "summary" | "detail";
  departments: SchoolShdDepartment[];
  regularExceptionGranted: boolean;
  specialExceptionGranted: boolean;
  schoolFirstStageClassCount?: 1 | 2 | 3 | null;
} {
  if (input.mode === "detail") {
    if (!Array.isArray(input.departments) || input.departments.length === 0) {
      throw new Error("Detailní režim vyžaduje alespoň jedno oddělení.");
    }
    return {
      mode: "detail",
      departments: [...input.departments],
      regularExceptionGranted: Boolean(input.regularExceptionGranted),
      specialExceptionGranted: Boolean(input.specialExceptionGranted),
      schoolFirstStageClassCount: input.schoolFirstStageClassCount ?? null,
    };
  }

  if (!Number.isInteger(input.regularDepartments) || input.regularDepartments < 0) {
    throw new Error("Počet běžných oddělení musí být nezáporné celé číslo.");
  }
  if (input.regularParticipantsTotal < 0) {
    throw new Error("Celkový počet účastníků v běžných odděleních nemůže být záporný.");
  }

  const special = input.specialDepartments ?? [];
  const departments: SchoolShdDepartment[] = [];

  // Souhrnný vstup -> detail: běžná oddělení rozpočítáme rovnoměrně (včetně desetinných podílů).
  const regularPerDept = input.regularDepartments > 0 ? input.regularParticipantsTotal / input.regularDepartments : 0;
  for (let i = 0; i < input.regularDepartments; i++) {
    departments.push({ kind: "regular", participants: regularPerDept });
  }
  for (const dep of special) {
    if (dep.participants < 0) {
      throw new Error("Počet účastníků ve speciálním oddělení nemůže být záporný.");
    }
    departments.push({
      kind: "special",
      participants: dep.participants,
      specialExceptionGranted: dep.exceptionGranted,
    });
  }

  if (departments.length === 0) {
    throw new Error("Souhrnný režim vyžaduje alespoň jedno oddělení.");
  }

  return {
    mode: "summary",
    departments,
    regularExceptionGranted: Boolean(input.regularExceptionGranted),
    specialExceptionGranted: Boolean(input.specialExceptionGranted),
    schoolFirstStageClassCount: input.schoolFirstStageClassCount ?? null,
  };
}

/**
 * Helper požadovaný zadáním: převod souhrnného vstupu na detailní interní model.
 */
export function summaryToDetailModel(input: SchoolShdSummaryInput): SchoolShdDetailInput {
  const internal = toInternalDetail(input);
  return {
    mode: "detail",
    departments: internal.departments,
    regularExceptionGranted: internal.regularExceptionGranted,
    specialExceptionGranted: internal.specialExceptionGranted,
    schoolFirstStageClassCount: internal.schoolFirstStageClassCount ?? null,
  };
}

export function calculateSchoolDruzinaPhmax(input: SchoolShdInput): SchoolShdResult {
  const internal = toInternalDetail(input);
  const notes: string[] = [];
  const departments = internal.departments;

  const regularDepartments = departments.filter((d) => d.kind === "regular");
  const specialDepartments = departments.filter((d) => d.kind === "special");
  const totalDepartments = departments.length;
  const basePhmax = getBasePhmax(totalDepartments);

  const regularParticipantsTotal = regularDepartments.reduce((sum, d) => sum + d.participants, 0);
  const regularMinPerDept = getRegularMinimumParticipantsPerDepartment({
    regularDepartments: regularDepartments.length,
    schoolFirstStageClassCount: internal.schoolFirstStageClassCount ?? null,
  });
  const regularRequiredTotal = regularDepartments.length * regularMinPerDept;
  const regularReductionFactor =
    internal.regularExceptionGranted && regularDepartments.length > 0 && regularRequiredTotal > 0
      ? clamp01(regularParticipantsTotal / regularRequiredTotal)
      : 1;

  if (internal.regularExceptionGranted && regularDepartments.length > 0) {
    notes.push(
      `Běžná oddělení: koeficient ${regularReductionFactor.toFixed(4)} ` +
        `(${round1(regularParticipantsTotal)} / ${round1(regularRequiredTotal)}).`,
    );
  }

  const departmentResults: SchoolShdDepartmentResult[] = departments.map((dep, idx) => {
    const order = idx + 1;
    const base = getDepartmentBasePhmax(order);

    if (dep.kind === "regular") {
      const reduced = base * regularReductionFactor;
      return {
        index1Based: order,
        kind: dep.kind,
        participants: round1(dep.participants),
        basePhmax: round1(base),
        reductionFactor: regularReductionFactor,
        finalPhmax: round1(reduced),
        note: internal.regularExceptionGranted ? "Poměrné krácení běžného oddělení." : undefined,
      };
    }

    const specialExceptionGranted =
      typeof dep.specialExceptionGranted === "boolean"
        ? dep.specialExceptionGranted
        : internal.specialExceptionGranted;
    const specialFactor = getSpecialReductionFactor(dep.participants, specialExceptionGranted);
    const reduced = base * specialFactor;
    return {
      index1Based: order,
      kind: dep.kind,
      participants: round1(dep.participants),
      basePhmax: round1(base),
      reductionFactor: specialFactor,
      finalPhmax: round1(reduced),
      note: specialExceptionGranted ? "Krácení speciálního oddělení dle počtu účastníků." : undefined,
    };
  });

  const regularSharePhmax = departmentResults
    .filter((d) => d.kind === "regular")
    .reduce((sum, d) => sum + d.finalPhmax, 0);
  const specialSharePhmax = departmentResults
    .filter((d) => d.kind === "special")
    .reduce((sum, d) => sum + d.finalPhmax, 0);

  const specialBaseSum = departmentResults
    .filter((d) => d.kind === "special")
    .reduce((sum, d) => sum + d.basePhmax, 0);
  const specialReductionFactor = specialBaseSum > 0 ? clamp01(specialSharePhmax / specialBaseSum) : 1;

  if (specialDepartments.length > 0) {
    notes.push(
      "Speciální oddělení: každé oddělení je kráceno samostatně podle vlastního počtu účastníků " +
        "a nastavení výjimky.",
    );
  }

  const finalPhmax = round1(regularSharePhmax + specialSharePhmax);

  return {
    mode: input.mode,
    totalDepartments,
    regularDepartments: regularDepartments.length,
    specialDepartments: specialDepartments.length,
    basePhmax: round1(basePhmax),
    regularSharePhmax: round1(regularSharePhmax),
    specialSharePhmax: round1(specialSharePhmax),
    regularReductionFactor,
    specialReductionFactor,
    finalPhmax,
    departments: departmentResults,
    notes,
  };
}