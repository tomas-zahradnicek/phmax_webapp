export type Band = { label: string; test: (x: number) => boolean; value: number };
export type BasicType =
  | "full_more_than_2"
  | "full_max_2"
  | "first_only_1"
  | "first_only_2"
  | "first_only_3"
  | "first_only_4";

export type MixedRow = {
  id: number;
  stage: "first" | "second";
  majority: "zs" | "special";
  classes: number;
  pupils: number;
};

export type PhaRow = {
  id: number;
  kind: keyof typeof PHA_TABLE;
  classes: number;
  pupils: number;
};

export type PsychRow = {
  id: number;
  kind: keyof typeof B14_B16;
  mode: "higher_of_two" | "current_only";
  currentPupils: number;
  currentClasses: number;
  prevPupils: number;
  prevClasses: number;
};

export type GymRow = {
  id: number;
  kind: keyof typeof B22_B25;
  classes: number;
  pupils: number;
};

export const round2 = (x: number) => Math.round(x * 100) / 100;
export const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export function pickBand(avg: number, bands: readonly Band[]) {
  const found = bands.find((b) => b.test(avg));
  return found ?? { label: "–", value: 0, test: () => false };
}

export const B13_MORE_THAN_2 = {
  first: [
    { label: "8 a méně", test: (x: number) => x <= 8, value: 10 },
    { label: "více než 8 – 12", test: (x: number) => x > 8 && x <= 12, value: 16 },
    { label: "více než 12 – 14", test: (x: number) => x > 12 && x <= 14, value: 19 },
    { label: "více než 14 – méně než 17", test: (x: number) => x > 14 && x < 17, value: 22 },
    { label: "17 – 20", test: (x: number) => x >= 17 && x <= 20, value: 25 },
    { label: "více než 20 – 24", test: (x: number) => x > 20 && x <= 24, value: 27 },
    { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 30 },
    { label: "více než 27", test: (x: number) => x > 27, value: 32 },
  ],
  second: [
    { label: "8 a méně", test: (x: number) => x <= 8, value: 13 },
    { label: "více než 8 – 12", test: (x: number) => x > 8 && x <= 12, value: 21 },
    { label: "více než 12 – 14", test: (x: number) => x > 12 && x <= 14, value: 25 },
    { label: "více než 14 – méně než 17", test: (x: number) => x > 14 && x < 17, value: 28 },
    { label: "17 – 20", test: (x: number) => x >= 17 && x <= 20, value: 33 },
    { label: "více než 20 – 24", test: (x: number) => x > 20 && x <= 24, value: 39 },
    { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 42 },
    { label: "více než 27", test: (x: number) => x > 27, value: 46 },
  ],
} as const;

export const B34_MAX_2 = {
  first: [
    { label: "8 a méně", test: (x: number) => x <= 8, value: 10 },
    { label: "více než 8 – 10", test: (x: number) => x > 8 && x <= 10, value: 15 },
    { label: "více než 10 – méně než 15", test: (x: number) => x > 10 && x < 15, value: 22 },
    { label: "15 – 20", test: (x: number) => x >= 15 && x <= 20, value: 25 },
    { label: "více než 20 – 24", test: (x: number) => x > 20 && x <= 24, value: 27 },
    { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 30 },
    { label: "více než 27", test: (x: number) => x > 27, value: 32 },
  ],
  second: [
    { label: "8 a méně", test: (x: number) => x <= 8, value: 13 },
    { label: "více než 8 – 10", test: (x: number) => x > 8 && x <= 10, value: 20 },
    { label: "více než 10 – méně než 15", test: (x: number) => x > 10 && x < 15, value: 28 },
    { label: "15 – 20", test: (x: number) => x >= 15 && x <= 20, value: 33 },
    { label: "více než 20 – 24", test: (x: number) => x > 20 && x <= 24, value: 39 },
    { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 42 },
    { label: "více než 27", test: (x: number) => x > 27, value: 46 },
  ],
} as const;

export const B5 = [
  { label: "5 a méně", test: (x: number) => x <= 5, value: 12 },
  { label: "6 – 9", test: (x: number) => x >= 6 && x <= 9, value: 22 },
  { label: "10 – 16", test: (x: number) => x >= 10 && x <= 16, value: 27 },
  { label: "17 – 23", test: (x: number) => x >= 17 && x <= 23, value: 30 },
  { label: "24 – 27", test: (x: number) => x >= 24 && x <= 27, value: 33 },
  { label: "více než 27", test: (x: number) => x > 27, value: 35 },
] as const;

export const B6 = [
  { label: "6 a méně", test: (x: number) => x <= 6, value: 12 },
  { label: "více než 6 – méně než 12", test: (x: number) => x > 6 && x < 12, value: 22 },
  { label: "12 – 18", test: (x: number) => x >= 12 && x <= 18, value: 27 },
  { label: "více než 18 – 24", test: (x: number) => x > 18 && x <= 24, value: 29 },
  { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 32 },
  { label: "více než 27", test: (x: number) => x > 27, value: 34 },
] as const;

export const B7 = [
  { label: "7 a méně", test: (x: number) => x <= 7, value: 12 },
  { label: "více než 7 – méně než 14", test: (x: number) => x > 7 && x < 14, value: 22 },
  { label: "14 – 19", test: (x: number) => x >= 14 && x <= 19, value: 26 },
  { label: "více než 19 – 24", test: (x: number) => x > 19 && x <= 24, value: 29 },
  { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 32 },
  { label: "více než 27", test: (x: number) => x > 27, value: 34 },
] as const;

export const B8 = [
  { label: "5 a méně", test: (x: number) => x <= 5, value: 8 },
  { label: "více než 5 – 10", test: (x: number) => x > 5 && x <= 10, value: 15 },
  { label: "více než 10 – méně než 15", test: (x: number) => x > 10 && x < 15, value: 22 },
  { label: "15 – 20", test: (x: number) => x >= 15 && x <= 20, value: 25 },
  { label: "více než 20 – 24", test: (x: number) => x > 20 && x <= 24, value: 27 },
  { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 30 },
  { label: "více než 27", test: (x: number) => x > 27, value: 32 },
] as const;

export const B9_B10 = {
  first: [
    { label: "méně než 6", test: (x: number) => x < 6, value: 19 },
    { label: "6 – 10", test: (x: number) => x >= 6 && x <= 10, value: 26 },
    { label: "více než 10", test: (x: number) => x > 10, value: 31 },
  ],
  second: [
    { label: "méně než 6", test: (x: number) => x < 6, value: 25 },
    { label: "6 – 10", test: (x: number) => x >= 6 && x <= 10, value: 34 },
    { label: "více než 10", test: (x: number) => x > 10, value: 43 },
  ],
} as const;

/** ZŠ při zdravotnickém zařízení mimo psychiatrickou nemocnici – řádky B11–B13 (metodika ZV v5). */
export const B11_B13 = {
  health1: [
    { label: "3 a méně", test: (x: number) => x <= 3, value: 9 },
    { label: "více než 3 – méně než 6", test: (x: number) => x > 3 && x < 6, value: 15 },
    { label: "6 – méně než 10", test: (x: number) => x >= 6 && x < 10, value: 19 },
    { label: "10 a více", test: (x: number) => x >= 10, value: 22 },
  ],
  health2: [
    { label: "3 a méně", test: (x: number) => x <= 3, value: 12 },
    { label: "více než 3 – méně než 6", test: (x: number) => x > 3 && x < 6, value: 20 },
    { label: "6 – méně než 10", test: (x: number) => x >= 6 && x < 10, value: 24 },
    { label: "10 a více", test: (x: number) => x >= 10, value: 28 },
  ],
  healthMix: [
    { label: "3 a méně", test: (x: number) => x <= 3, value: 12 },
    { label: "více než 3 – méně než 6", test: (x: number) => x > 3 && x < 6, value: 20 },
    { label: "6 – méně než 10", test: (x: number) => x >= 6 && x < 10, value: 24 },
    { label: "10 a více", test: (x: number) => x >= 10, value: 28 },
  ],
} as const;

export type HealthRow = {
  id: number;
  kind: keyof typeof B11_B13;
  mode: "higher_of_two" | "current_only";
  currentPupils: number;
  currentClasses: number;
  prevPupils: number;
  prevClasses: number;
};

export const B14_B16 = {
  psych1: [
    { label: "méně než 6", test: (x: number) => x < 6, value: 15 },
    { label: "6 – 10", test: (x: number) => x >= 6 && x <= 10, value: 23 },
    { label: "více než 10", test: (x: number) => x > 10, value: 29 },
  ],
  psych2: [
    { label: "méně než 6", test: (x: number) => x < 6, value: 20 },
    { label: "6 – 10", test: (x: number) => x >= 6 && x <= 10, value: 30 },
    { label: "více než 10", test: (x: number) => x > 10, value: 38 },
  ],
  psychMix: [
    { label: "méně než 6", test: (x: number) => x < 6, value: 20 },
    { label: "6 – 10", test: (x: number) => x >= 6 && x <= 10, value: 30 },
    { label: "více než 10", test: (x: number) => x > 10, value: 38 },
  ],
} as const;

export const B17_B21 = {
  minority1: [
    { label: "4 a méně", test: (x: number) => x <= 4, value: 13 },
    { label: "5 – 7", test: (x: number) => x >= 5 && x <= 7, value: 23 },
    { label: "8 – 16", test: (x: number) => x >= 8 && x <= 16, value: 45 },
    { label: "17 – 23", test: (x: number) => x >= 17 && x <= 23, value: 48 },
    { label: "24 – 27", test: (x: number) => x >= 24 && x <= 27, value: 50 },
    { label: "více než 27", test: (x: number) => x > 27, value: 52 },
  ],
  minority2: [
    { label: "5 a méně", test: (x: number) => x <= 5, value: 13 },
    { label: "více než 5 – méně než 10", test: (x: number) => x > 5 && x < 10, value: 23 },
    { label: "10 – 18", test: (x: number) => x >= 10 && x <= 18, value: 29 },
    { label: "více než 18 – 24", test: (x: number) => x > 18 && x <= 24, value: 36 },
    { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 41 },
    { label: "více než 27", test: (x: number) => x > 27, value: 46 },
  ],
  minority3: [
    { label: "5 a méně", test: (x: number) => x <= 5, value: 13 },
    { label: "více než 5 – méně než 10", test: (x: number) => x > 5 && x < 10, value: 22 },
    { label: "10 – 19", test: (x: number) => x >= 10 && x <= 19, value: 26 },
    { label: "více než 19 – 24", test: (x: number) => x > 19 && x <= 24, value: 33 },
    { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 38 },
    { label: "více než 27", test: (x: number) => x > 27, value: 43 },
  ],
  minorityFull1: [
    { label: "5 a méně", test: (x: number) => x <= 5, value: 12 },
    { label: "více než 5 – méně než 10", test: (x: number) => x > 5 && x < 10, value: 22 },
    { label: "10 – 20", test: (x: number) => x >= 10 && x <= 20, value: 27 },
    { label: "více než 20 – 24", test: (x: number) => x > 20 && x <= 24, value: 32 },
    { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 37 },
    { label: "více než 27", test: (x: number) => x > 27, value: 42 },
  ],
  minorityFull2: [
    { label: "5 a méně", test: (x: number) => x <= 5, value: 18 },
    { label: "více než 5 – méně než 10", test: (x: number) => x > 5 && x < 10, value: 30 },
    { label: "10 – 20", test: (x: number) => x >= 10 && x <= 20, value: 34 },
    { label: "více než 20 – 24", test: (x: number) => x > 20 && x <= 24, value: 42 },
    { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 48 },
    { label: "více než 27", test: (x: number) => x > 27, value: 53 },
  ],
} as const;

export const B22_B25 = {
  gym6: [
    { label: "8 a méně", test: (x: number) => x <= 8, value: 14 },
    { label: "více než 8 – 12", test: (x: number) => x > 8 && x <= 12, value: 21 },
    { label: "více než 12 – 14", test: (x: number) => x > 12 && x <= 14, value: 25 },
    { label: "více než 14 – méně než 17", test: (x: number) => x > 14 && x < 17, value: 28 },
    { label: "17 – 20", test: (x: number) => x >= 17 && x <= 20, value: 33 },
    { label: "více než 20 – 24", test: (x: number) => x > 20 && x <= 24, value: 39 },
    { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 42 },
    { label: "více než 27", test: (x: number) => x > 27, value: 46 },
  ],
  gym8: [
    { label: "8 a méně", test: (x: number) => x <= 8, value: 14 },
    { label: "více než 8 – 12", test: (x: number) => x > 8 && x <= 12, value: 21 },
    { label: "více než 12 – 14", test: (x: number) => x > 12 && x <= 14, value: 25 },
    { label: "více než 14 – méně než 17", test: (x: number) => x > 14 && x < 17, value: 28 },
    { label: "17 – 20", test: (x: number) => x >= 17 && x <= 20, value: 33 },
    { label: "více než 20 – 24", test: (x: number) => x > 20 && x <= 24, value: 39 },
    { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 42 },
    { label: "více než 27", test: (x: number) => x > 27, value: 46 },
  ],
  sport8: [
    { label: "8 a méně", test: (x: number) => x <= 8, value: 23 },
    { label: "více než 8 – 12", test: (x: number) => x > 8 && x <= 12, value: 34 },
    { label: "více než 12 – 14", test: (x: number) => x > 12 && x <= 14, value: 41 },
    { label: "více než 14 – méně než 17", test: (x: number) => x > 14 && x < 17, value: 57 },
    { label: "17 – 20", test: (x: number) => x >= 17 && x <= 20, value: 61 },
    { label: "více než 20 – 24", test: (x: number) => x > 20 && x <= 24, value: 76 },
    { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 79 },
    { label: "více než 27", test: (x: number) => x > 27, value: 92 },
  ],
  sport6: [
    { label: "8 a méně", test: (x: number) => x <= 8, value: 23 },
    { label: "více než 8 – 12", test: (x: number) => x > 8 && x <= 12, value: 34 },
    { label: "více než 12 – 14", test: (x: number) => x > 12 && x <= 14, value: 41 },
    { label: "více než 14 – méně než 17", test: (x: number) => x > 14 && x < 17, value: 57 },
    { label: "17 – 20", test: (x: number) => x >= 17 && x <= 20, value: 61 },
    { label: "více než 20 – 24", test: (x: number) => x > 20 && x <= 24, value: 76 },
    { label: "více než 24 – 27", test: (x: number) => x > 24 && x <= 27, value: 79 },
    { label: "více než 27", test: (x: number) => x > 27, value: 92 },
  ],
} as const;

export const B26_B28 = {
  special1: [
    { label: "méně než 6", test: (x: number) => x < 6, value: 28 },
    { label: "6 – 10", test: (x: number) => x >= 6 && x <= 10, value: 39 },
    { label: "více než 10", test: (x: number) => x > 10, value: 46 },
  ],
  special2: [
    { label: "méně než 6", test: (x: number) => x < 6, value: 35 },
    { label: "6 – 10", test: (x: number) => x >= 6 && x <= 10, value: 50 },
    { label: "více než 10", test: (x: number) => x > 10, value: 57 },
  ],
  specialII: [
    { label: "méně než 6", test: (x: number) => x < 6, value: 31 },
    { label: "6 – 10", test: (x: number) => x >= 6 && x <= 10, value: 44 },
    { label: "více než 10", test: (x: number) => x > 10, value: 51 },
  ],
} as const;

export const PHA_TABLE = {
  zs1: [
    { label: "méně než 4", test: (x: number) => x < 4, value: 0 },
    { label: "4 – méně než 6", test: (x: number) => x >= 4 && x < 6, value: 20 },
    { label: "6 a více", test: (x: number) => x >= 6, value: 24 },
  ],
  zs1Heavy: [
    { label: "méně než 4", test: (x: number) => x < 4, value: 0 },
    { label: "4 – méně než 6", test: (x: number) => x >= 4 && x < 6, value: 40 },
    { label: "6 a více", test: (x: number) => x >= 6, value: 48 },
  ],
  zs2: [
    { label: "méně než 4", test: (x: number) => x < 4, value: 0 },
    { label: "4 – méně než 6", test: (x: number) => x >= 4 && x < 6, value: 26 },
    { label: "6 a více", test: (x: number) => x >= 6, value: 31 },
  ],
  zs2Heavy: [
    { label: "méně než 4", test: (x: number) => x < 4, value: 0 },
    { label: "4 – méně než 6", test: (x: number) => x >= 4 && x < 6, value: 52 },
    { label: "6 a více", test: (x: number) => x >= 6, value: 62 },
  ],
  zss1: [
    { label: "méně než 4", test: (x: number) => x < 4, value: 0 },
    { label: "4 a více", test: (x: number) => x >= 4, value: 23 },
  ],
  zss1Heavy: [
    { label: "méně než 4", test: (x: number) => x < 4, value: 0 },
    { label: "4 a více", test: (x: number) => x >= 4, value: 69 },
  ],
  zss2: [
    { label: "méně než 4", test: (x: number) => x < 4, value: 0 },
    { label: "4 a více", test: (x: number) => x >= 4, value: 29 },
  ],
  zss2Heavy: [
    { label: "méně než 4", test: (x: number) => x < 4, value: 0 },
    { label: "4 a více", test: (x: number) => x >= 4, value: 87 },
  ],
  zssII: [
    { label: "méně než 4", test: (x: number) => x < 4, value: 0 },
    { label: "4 a více", test: (x: number) => x >= 4, value: 42 },
  ],
  zssIIHeavy: [
    { label: "méně než 4", test: (x: number) => x < 4, value: 0 },
    { label: "4 a více", test: (x: number) => x >= 4, value: 63 },
  ],
  /** Přípravný stupeň základní školy speciální – řádek B45 (metodika ZV v5). */
  zssPrep: [
    { label: "méně než 4", test: (x: number) => x < 4, value: 0 },
    { label: "4 a více", test: (x: number) => x >= 4, value: 20 },
  ],
} as const;

/** Přípravná třída základní školy — řádek B29 (PHmax). */
export const B29_PREP_CLASS = [
  { label: "méně než 10", test: (x: number) => x < 10, value: 14 },
  { label: "10 a více", test: (x: number) => x >= 10, value: 22 },
] as const;

/** Třídy přípravného stupně základní školy speciální — řádek B30 (PHmax). */
export const B30_PREP_SPECIAL = [
  { label: "méně než 4", test: (x: number) => x < 4, value: 10 },
  { label: "4 a více", test: (x: number) => x >= 4, value: 40 },
] as const;

/** Odpovídá tabulce kombinací ZŠSp (NV 123/2018) — který řádek B26–B28 určuje PHmax. */
export function resolveZssSpecialComboTargetRow(
  hasPart1First: boolean,
  hasPart1Second: boolean,
  hasPart2: boolean,
): "B26" | "B27" | "B28" | null {
  if (!hasPart1First && !hasPart1Second && !hasPart2) return null;
  if (hasPart1Second) return "B27";
  if (hasPart2 && !hasPart1First && !hasPart1Second) return "B28";
  if (hasPart2 && hasPart1First && !hasPart1Second) return "B26";
  if (hasPart1First && !hasPart1Second && !hasPart2) return "B26";
  return "B26";
}

/** Řádek přílohy PHAmax ↔ interní klíč `PHA_TABLE`. */
export const PHA_TABLE_ROW_IDS: { [K in keyof typeof PHA_TABLE]: string } = {
  zs1: "B35",
  zs1Heavy: "B36",
  zs2: "B37",
  zs2Heavy: "B38",
  zss1: "B39",
  zss1Heavy: "B40",
  zss2: "B41",
  zss2Heavy: "B42",
  zssII: "B43",
  zssIIHeavy: "B44",
  zssPrep: "B45",
};

/** Řádek přílohy PHmax (gymnázia) ↔ interní klíč `B22_B25`. */
export const GYM_KIND_TO_ROW: { [K in keyof typeof B22_B25]: string } = {
  gym6: "B22",
  gym8: "B23",
  sport8: "B24",
  sport6: "B25",
};

export const PHP_TABLE = [
  { label: "méně než 180", test: (x: number) => x < 180, value: 0 },
  { label: "180 – méně než 300", test: (x: number) => x >= 180 && x < 300, value: 12 },
  { label: "300 – méně než 400", test: (x: number) => x >= 300 && x < 400, value: 19 },
  { label: "400 – méně než 750", test: (x: number) => x >= 400 && x < 750, value: 24 },
  { label: "750 – méně než 1000", test: (x: number) => x >= 750 && x < 1000, value: 48 },
  { label: "1000 a více", test: (x: number) => x >= 1000, value: 60 },
] as const;

export function exportCsv(summaryRows: readonly (readonly [string, number])[]) {
  return [
    ["Položka", "Hodnota"],
    ...summaryRows.map(([label, value]) => [label, String(value)]),
  ]
    .map((row) => row.map((cell) => JSON.stringify(String(cell))).join(";"))
    .join(String.fromCharCode(10));
}
