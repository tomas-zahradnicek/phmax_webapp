import { round2 } from "./phmax-zs-logic";

/**
 * Týdenní PHmax školní družiny (součet přímé pedagogické činnosti všech vychovatelů)
 * podle celkového počtu oddělení — tabulka v příloze k vyhlášce č. 74/2005 Sb., o zájmovém vzdělávání.
 * Hodnoty ověřte vždy proti aktuálnímu konsolidovanému znění (např. zakonyprolidi.cz).
 */
export const PHMAX_SD_BY_DEPARTMENTS: readonly number[] = [
  32.5, 57.5, 80, 97.5, 130, 155, 177.5, 195, 227.5, 252.5, 275, 292.5, 325, 350, 372.5, 390, 412.5, 435, 457.5,
  480, 502.5,
];

export const SD_MAX_DEPARTMENTS_IN_TABLE = PHMAX_SD_BY_DEPARTMENTS.length;

export function getPhmaxSdBase(departmentCount: number): number | null {
  if (departmentCount < 1 || departmentCount > PHMAX_SD_BY_DEPARTMENTS.length) return null;
  return PHMAX_SD_BY_DEPARTMENTS[departmentCount - 1];
}

/** Počet „běžných“ oddělení dle pravidla: účastníci ÷ 27, zaokrouhleno nahoru (metodika ŠD). */
export function suggestedDepartmentsFromPupils(pupils: number): number {
  if (pupils <= 0) return 1;
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
