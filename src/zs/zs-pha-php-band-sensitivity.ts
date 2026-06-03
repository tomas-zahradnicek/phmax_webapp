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

function snapshotNum(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function snapshotRound2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** PHA/PHP nápovědy z autosave ZŠ (dashboard – nezávislé na záložce phmax). */
export function buildZsPhaPhpHintsFromSnapshot(snapshot: unknown, maxHints = 4): string[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const s = snapshot as Record<string, unknown>;
  const phaRows = Array.isArray(s.phaRows) ? (s.phaRows as PhaRow[]) : [];
  const out = [...buildZsPhaBandUpgradeHints(phaRows, maxHints)];

  const phpMethodMode = s.phpMethodMode === "short_period" ? "short_period" : "average";
  const phpYear1 = snapshotNum(s.phpYear1);
  const phpYear2 = snapshotNum(s.phpYear2);
  const phpYear3 = snapshotNum(s.phpYear3);
  const phpBaseValue = snapshotRound2(
    phpMethodMode === "short_period" ? Math.max(phpYear1, phpYear2, phpYear3) : (phpYear1 + phpYear2 + phpYear3) / 3,
  );
  const phpExcludedTotal = snapshotRound2(
    Math.max(0, snapshotNum(s.phpExcludedAbroad)) +
      Math.max(0, snapshotNum(s.phpExcludedForeignSchoolCz)) +
      Math.max(0, snapshotNum(s.phpExcludedIndividual)),
  );
  const phpAdjustedValue = snapshotRound2(Math.max(0, phpBaseValue - phpExcludedTotal));
  const phpHints = buildZsPhpBandUpgradeHints({
    phpExcludedSchool: s.phpExcludedSchool === true,
    phpAdjustedValue,
  });
  for (const h of phpHints) {
    if (out.length >= maxHints) break;
    out.push(h);
  }
  return out.slice(0, maxHints);
}
