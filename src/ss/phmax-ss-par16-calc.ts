import type { Dataset } from "./phmax-ss-validator";
import {
  applyStudyFormCoefficient,
  getIntervalForAverage,
  type ModeKey,
  type StudyForm,
} from "./phmax-ss-helpers";
import type { ServiceRowInput, ServiceResolvedRow, SingleCalculationResult } from "./phmax-ss-service";
import { chooseDefaultMode } from "./phmax-ss-service";

export type Par16BandRule = "under6_scaled" | "band_6_10_as_17_20" | "band_10_14_as_20_24" | "standard";

export type Par16Lookup = {
  rule: Par16BandRule;
  lookupAverage: number;
  scale: number;
  ruleLabel: string;
};

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Mapování průměru žáků ve třídě § 16/9 na pásmo v datasetu NV (metodika § 4 bod 4).
 * 6–10 → pásmo 17–20; >10–14 → pásmo více než 20–24; <6 → 70 % hodnoty z pásma 17–20; >14 → běžné pásmo dle průměru.
 */
export function resolvePar16NvLookup(averageStudents: number): Par16Lookup {
  if (!Number.isFinite(averageStudents) || averageStudents < 0) {
    throw new Error("Průměrný počet žáků musí být nezáporné konečné číslo.");
  }
  if (averageStudents < 6) {
    return {
      rule: "under6_scaled",
      lookupAverage: 17,
      scale: 0.7,
      ruleLabel: "§ 16: méně než 6 žáků → 70 % hodnoty pásma 17–20",
    };
  }
  if (averageStudents <= 10) {
    return {
      rule: "band_6_10_as_17_20",
      lookupAverage: 17,
      scale: 1,
      ruleLabel: "§ 16: 6–10 žáků → pásmo 17–20",
    };
  }
  if (averageStudents <= 14) {
    return {
      rule: "band_10_14_as_20_24",
      lookupAverage: 21,
      scale: 1,
      ruleLabel: "§ 16: více než 10–14 žáků → pásmo více než 20–24",
    };
  }
  return {
    rule: "standard",
    lookupAverage: averageStudents,
    scale: 1,
    ruleLabel: "§ 16: více než 14 žáků → běžné pásmo dle průměru",
  };
}

/** PHmax řádku označeného jako třída podle § 16 odst. 9 (jednoobor, mapování pásem metodiky). */
export function calculatePar16PhmaxRow(dataset: Dataset, input: ServiceRowInput): SingleCalculationResult {
  const form: StudyForm = input.form ?? "denni";
  if (!Number.isFinite(input.averageStudents) || input.averageStudents < 0) {
    throw new Error("Průměrný počet žáků musí být nezáporné konečné číslo.");
  }
  if (!Number.isInteger(input.classCount) || input.classCount <= 0) {
    throw new Error("Počet tříd musí být kladné celé číslo.");
  }

  const mode: ModeKey =
    input.mode ??
    chooseDefaultMode(dataset, {
      code: input.code,
      oborCountInClass: 1,
      isArt82TalentClass: input.isArt82TalentClass ?? false,
    });

  const par16 = resolvePar16NvLookup(input.averageStudents);
  const interval = getIntervalForAverage(dataset, {
    code: input.code,
    averageStudents: par16.lookupAverage,
    mode: "oneObor",
  });

  const tablePhmax = interval.value;
  const scaledBase = round2(tablePhmax * par16.scale);
  const withForm = applyStudyFormCoefficient(dataset, scaledBase, form);
  const adjustedPhmaxPerClass = round2(withForm);
  const totalPhmax = round2(adjustedPhmaxPerClass * input.classCount);
  const coefficient =
    tablePhmax > 0 ? round2(adjustedPhmaxPerClass / tablePhmax) : 1;

  const intervalLabel =
    par16.rule === "standard"
      ? `${interval.label} (${par16.ruleLabel})`
      : `${interval.label} · ${par16.ruleLabel}`;

  const row: ServiceResolvedRow = {
    code: interval.code,
    name: interval.name,
    category: interval.category,
    modeKey: mode,
    form,
    averageStudents: input.averageStudents,
    classCount: input.classCount,
    intervalLabel,
    phmaxPerClass: tablePhmax,
    coefficient,
    adjustedPhmaxPerClass,
    totalPhmax,
    note: input.note,
  };

  return { input, row };
}
