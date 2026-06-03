import { formatCsNumber } from "./cs-format";
import { getNv75ReductionForUnits, type Nv75DeputyKind } from "./nv75-deputy-bank";

const MAX_UNITS_PROBE = 400;

export function buildNv75UnitsUpgradeHint(
  kind: Nv75DeputyKind,
  units: number,
  rowLabel = "Řádek NV75",
): string | null {
  if (units <= 0) return null;
  const current = getNv75ReductionForUnits(kind, units);
  if (current.hours <= 0) return null;

  for (let probe = units + 1; probe <= MAX_UNITS_PROBE; probe++) {
    const next = getNv75ReductionForUnits(kind, probe);
    if (next.hours > current.hours) {
      const hoursDelta = next.hours - current.hours;
      return (
        `${rowLabel}: ${units} jednotek → §4b pásmo ${current.bandLabel} (${formatCsNumber(current.hours)} h./týd. na řádek). ` +
        `Vyšší pásmo ${next.bandLabel}: orientačně +${probe - units} jednotek ` +
        `(od ${probe} jednotek, +${formatCsNumber(hoursDelta)} h./týd. na řádek – ověřte v metodice NV 75).`
      );
    }
  }
  return null;
}

export function buildNv75UnitsUpgradeHints(
  rows: readonly { kind: Nv75DeputyKind; units: number; label?: string }[],
  maxHints = 4,
): string[] {
  const out: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const label = row.label?.trim() || `Řádek ${i + 1}`;
    const hint = buildNv75UnitsUpgradeHint(row.kind, row.units, label);
    if (hint) out.push(hint);
    if (out.length >= maxHints) break;
  }
  return out;
}
