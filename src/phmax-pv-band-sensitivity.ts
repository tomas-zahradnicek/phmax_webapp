import { formatCsNumber } from "./cs-format";
import {
  celodenniDurationColumnIndex,
  getPhmaxPvBase,
  getPvDurationBandLabel,
  internatDurationColumnIndex,
  polodenniDurationColumnIndex,
  type PvProvozKind,
} from "./phmax-pv-logic";
import { round2 } from "./phmax-zs-logic";

const POLODENNI_MIN_HOURS = [4, 4.5, 5, 5.5, 6] as const;
const CELODENNI_MIN_HOURS = [6.75, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12] as const;
const INTERNAT_MIN_HOURS = [20, 20.5, 21, 21.5, 22] as const;

function durationColumnCount(provoz: PvProvozKind): number {
  if (provoz === "polodenni") return POLODENNI_MIN_HOURS.length;
  if (provoz === "celodenni") return CELODENNI_MIN_HOURS.length;
  if (provoz === "internat") return INTERNAT_MIN_HOURS.length;
  return 0;
}

function minHoursForColumn(provoz: PvProvozKind, col: number): number | null {
  const table =
    provoz === "polodenni" ? POLODENNI_MIN_HOURS : provoz === "celodenni" ? CELODENNI_MIN_HOURS : INTERNAT_MIN_HOURS;
  return table[col] ?? null;
}

function currentDurationColumn(provoz: PvProvozKind, avg: number): number | null {
  if (provoz === "polodenni") return polodenniDurationColumnIndex(avg);
  if (provoz === "celodenni") return celodenniDurationColumnIndex(avg);
  if (provoz === "internat") return internatDurationColumnIndex(avg);
  return null;
}

export function buildPvDurationUpgradeHint(params: {
  workplaceLabel: string;
  provoz: PvProvozKind;
  classCount: number;
  avgHoursPerDay: number;
}): string | null {
  const { workplaceLabel, provoz, classCount, avgHoursPerDay } = params;
  if (provoz === "zdravotnicke" || classCount < 1) return null;

  const col = currentDurationColumn(provoz, avgHoursPerDay);
  if (col === null) return null;

  const nextCol = col + 1;
  if (nextCol >= durationColumnCount(provoz)) return null;

  const minNext = minHoursForColumn(provoz, nextCol);
  if (minNext == null) return null;

  const current = getPhmaxPvBase({ provoz, classCount, avgHoursPerDay });
  const atNext = getPhmaxPvBase({ provoz, classCount, avgHoursPerDay: minNext });
  if (!current.data || !atNext.data || atNext.data.basePhmax <= current.data.basePhmax) return null;

  const delta = round2(atNext.data.basePhmax - current.data.basePhmax);
  const hoursDelta = round2(Math.max(0, minNext - avgHoursPerDay));
  const label = workplaceLabel.trim() || "Pracoviště";
  const nextBand = getPvDurationBandLabel(provoz, nextCol);

  return (
    `${label} (${provoz}): průměrná doba ${formatCsNumber(avgHoursPerDay)} h/den → pásmo „${current.data.durationColumnLabel}“ ` +
    `(${formatCsNumber(current.data.basePhmax)} h./týd. na pracoviště). Vyšší pásmo „${nextBand}“: +${formatCsNumber(hoursDelta)} h/den ` +
    `(od ${formatCsNumber(minNext)} h/den) → +${formatCsNumber(delta)} h./týd. na pracoviště (orientačně).`
  );
}
