import {
  computeZsPha1r,
  EMPTY_PHA1R_SCHOOL_FLAGS,
  PHA1R_MIN_RELEVANT_GRADE1_PUPILS,
  type Pha1rClassRow,
  type Pha1rSchoolFlags,
} from "./zs-pha1r";

/** Ilustrační příklady aplikace. Nejsou číselné příklady z metodiky. */
export const ZS_PHA1R_HERO_EXAMPLE_KEYS = [
  "pha1r_14_pod_hranici",
  "pha1r_15_zpusobila",
  "pha1r_dve_tridy",
  "pha1r_odecty_38_41",
] as const;

export type ZsPha1rHeroExampleKey = (typeof ZS_PHA1R_HERO_EXAMPLE_KEYS)[number];

export type ZsPha1rHeroExample = {
  label: string;
  classes: readonly Pha1rClassRow[];
};

function classRow(id: number, grade1Pupils: number, grade1Par38 = 0, grade1Par41 = 0): Pha1rClassRow {
  return {
    id,
    grade1Pupils,
    grade1Par38,
    grade1Par41,
    establishedSec16_9: false,
  };
}

export const ZS_PHA1R_HERO_EXAMPLES: Record<ZsPha1rHeroExampleKey, ZsPha1rHeroExample> = {
  pha1r_14_pod_hranici: {
    label: "14 prvňáků – pod hranicí (0 h)",
    classes: [classRow(1, 14)],
  },
  pha1r_15_zpusobila: {
    label: "15 prvňáků – způsobilá třída (20 h)",
    classes: [classRow(1, 15)],
  },
  pha1r_dve_tridy: {
    label: "Dvě způsobilé třídy (40 h)",
    classes: [classRow(1, 15), classRow(2, 16)],
  },
  pha1r_odecty_38_41: {
    label: "Odečty § 38 a § 41 (20 h)",
    classes: [classRow(1, 18, 2, 1)],
  },
};

export function isZsPha1rHeroExample(value: string): value is ZsPha1rHeroExampleKey {
  return (ZS_PHA1R_HERO_EXAMPLE_KEYS as readonly string[]).includes(value);
}

function deductionText(row: Pha1rClassRow): string {
  if (row.grade1Par38 === 0 && row.grade1Par41 === 0) return "žádné";
  return `§ 38 = ${row.grade1Par38}, § 41 = ${row.grade1Par41}`;
}

/** Text příkladu. Hodiny, práh a relevantní žáci jdou z computeZsPha1r. */
export function formatZsPha1rExampleExplanation(
  classes: readonly Pha1rClassRow[],
  flags: Pha1rSchoolFlags = EMPTY_PHA1R_SCHOOL_FLAGS,
): string {
  const result = computeZsPha1r({ classes, flags });
  const numbered = classes.length > 1;
  const sentences = classes
    .map((row, index) => {
      const relevant = result.classes[index]?.relevantGrade1Pupils ?? 0;
      const prefix = numbered ? `Třída ${index + 1}: žáci` : "Žáci";
      return `${prefix} 1. ročníku: ${row.grade1Pupils}. Odečty: ${deductionText(row)}. Relevantní žáci: ${relevant}.`;
    })
    .join(" ");
  const body = sentences ? `${sentences} ` : "";
  return `Ilustrační příklad PHA1Rmax, ne úplný výpočet školy. ${body}Práh: ${PHA1R_MIN_RELEVANT_GRADE1_PUPILS}. Způsobilé třídy: ${result.eligibleClassCount}. PHA1Rmax: ${result.totalPha1r} hodin týdně.`;
}

export function zsPha1rHeroExampleExplanation(value: string): string | undefined {
  if (!isZsPha1rHeroExample(value)) return undefined;
  return formatZsPha1rExampleExplanation(ZS_PHA1R_HERO_EXAMPLES[value].classes);
}
