import { formatCsNumber } from "./cs-format";
import type { Band } from "./phmax-zs-logic";
import { pickBand } from "./phmax-zs-logic";

export type BandUpgradeHint = {
  sectionLabel: string;
  currentAvg: number;
  currentBandLabel: string;
  currentPerClass: number;
  nextBandLabel: string;
  nextPerClass: number;
  minAvgForNextBand: number;
  pupilsDeltaAtCurrentClasses: number;
};

const MAX_AVG_PROBE = 60;
const AVG_PROBE_STEP = 0.01;

/** Najde nejnižší průměr, při kterém platí vyšší pásmo (vyšší value). */
export function findMinAvgForHigherBand(avg: number, bands: readonly Band[]): number | null {
  if (!bands.length) return null;
  const current = pickBand(avg, bands);
  const targetValue = bands
    .filter((b) => b.value > current.value)
    .reduce((min, b) => (b.value < min ? b.value : min), Number.POSITIVE_INFINITY);
  if (!Number.isFinite(targetValue)) return null;

  const start = Math.max(0, avg);
  for (let probe = start; probe <= MAX_AVG_PROBE; probe += AVG_PROBE_STEP) {
    if (pickBand(probe, bands).value >= targetValue) {
      return Math.round((probe + Number.EPSILON) * 100) / 100;
    }
  }
  return null;
}

export function buildBandUpgradeHint(
  sectionLabel: string,
  classes: number,
  pupils: number,
  bands: readonly Band[],
): BandUpgradeHint | null {
  if (classes <= 0 || pupils < 0) return null;
  const avg = pupils / classes;
  const current = pickBand(avg, bands);
  const minAvg = findMinAvgForHigherBand(avg, bands);
  if (minAvg == null) return null;

  const next = pickBand(minAvg, bands);
  if (next.value <= current.value) return null;

  const pupilsNeeded = Math.ceil(classes * minAvg - Number.EPSILON);
  const delta = Math.max(0, pupilsNeeded - pupils);
  if (delta === 0 && minAvg <= avg) return null;

  return {
    sectionLabel,
    currentAvg: round2(avg),
    currentBandLabel: current.label,
    currentPerClass: current.value,
    nextBandLabel: next.label,
    nextPerClass: next.value,
    minAvgForNextBand: minAvg,
    pupilsDeltaAtCurrentClasses: delta,
  };
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

export function formatBandUpgradeHint(h: BandUpgradeHint): string {
  const phDelta = h.nextPerClass - h.currentPerClass;
  return (
    `${h.sectionLabel}: průměr ${formatCsNumber(h.currentAvg)} → pásmo „${h.currentBandLabel}“ (${h.currentPerClass} h./třída). ` +
    `Vyšší pásmo „${h.nextBandLabel}“ (${h.nextPerClass} h./třída, +${formatCsNumber(phDelta)}): orientačně +${h.pupilsDeltaAtCurrentClasses} žáků ` +
    `(průměr od ${formatCsNumber(h.minAvgForNextBand)} při stejném počtu tříd).`
  );
}
