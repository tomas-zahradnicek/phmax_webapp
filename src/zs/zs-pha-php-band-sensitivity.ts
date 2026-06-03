import { PHA_TABLE, PHP_TABLE, type PhaRow } from "../phmax-zs-logic";
import { buildBandUpgradeHint, buildScalarBandUpgradeHint, formatBandUpgradeHint } from "../phmax-band-sensitivity";

const PHA_SECTION: Record<keyof typeof PHA_TABLE, string> = {
  zs1: "PHAmax – ZŠ 1. stupeň",
  zs1Heavy: "PHAmax – ZŠ 1. st., těžší postižení",
  zs2: "PHAmax – ZŠ 2. stupeň",
  zs2Heavy: "PHAmax – ZŠ 2. st., těžší postižení",
  zss1: "PHAmax – ZŠ spec. I. díl, 1. stupeň",
  zss1Heavy: "PHAmax – ZŠ spec. I., 1. st., těžší",
  zss2: "PHAmax – ZŠ spec. I. díl, 2. stupeň",
  zss2Heavy: "PHAmax – ZŠ spec. I., 2. st., těžší",
  zssII: "PHAmax – ZŠ spec. II. díl",
  zssIIHeavy: "PHAmax – ZŠ spec. II., těžší",
  zssPrep: "PHAmax – přípravný stupeň ZŠ spec.",
};

export function buildZsPhaBandUpgradeHints(phaRows: readonly PhaRow[], maxHints = 6): string[] {
  const out: string[] = [];
  for (const row of phaRows) {
    if (row.classes <= 0) continue;
    const hint = buildBandUpgradeHint(PHA_SECTION[row.kind], row.classes, row.pupils, PHA_TABLE[row.kind]);
    if (hint) out.push(formatBandUpgradeHint(hint));
    if (out.length >= maxHints) break;
  }
  return out;
}

export function buildZsPhpBandUpgradeHints(input: {
  phpExcludedSchool: boolean;
  phpAdjustedValue: number;
}): string[] {
  if (input.phpExcludedSchool || input.phpAdjustedValue <= 0) return [];
  const hint = buildScalarBandUpgradeHint("PHPmax (upravená hodnota školy)", input.phpAdjustedValue, PHP_TABLE);
  return hint ? [hint] : [];
}
