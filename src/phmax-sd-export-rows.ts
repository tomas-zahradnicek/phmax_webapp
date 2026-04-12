import { round2 } from "./phmax-zs-logic";

export type PhmaxSdExportRow = readonly [string, string | number];

function formatSdHours(value: number) {
  return value.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildPhmaxSdExportRows(input: {
  pupils: number;
  effectiveDepts: number;
  manualDepts: boolean;
  suggested: number;
  avgPerDept: number;
  basePhmax: number | null;
  reduction: { adjusted: number; factor: number; applied: boolean };
  breakdown: readonly number[] | null;
  tableWarning: string | null;
}): PhmaxSdExportRow[] {
  const {
    pupils,
    effectiveDepts,
    manualDepts,
    suggested,
    avgPerDept,
    basePhmax,
    reduction,
    breakdown,
    tableWarning,
  } = input;

  const rows: PhmaxSdExportRow[] = [
    ["=== PHmax školní družina — export ===", ""],
    ["Počet přihlášených účastníků (žáci 1. st., pravidelná docházka)", pupils],
    ["Počet oddělení (výpočet)", effectiveDepts],
    ["Způsob určení oddělení", manualDepts ? "ruční zadání" : "automaticky ÷ 27 (nahoru)"],
    ["Navržený počet oddělení (÷ 27)", suggested],
    ["Průměr účastníků na oddělení", avgPerDept],
  ];

  if (basePhmax != null) {
    rows.push(["PHmax základ z tabulky vyhl. 74/2005 (h/týden)", basePhmax]);
    rows.push(["Krácení PHmax dle § 10 odst. 2 vyhl.", reduction.applied ? "ano" : "ne"]);
    if (reduction.applied) {
      rows.push(["Koeficient krácení", reduction.factor]);
      rows.push(["PHmax po krácení (h/týden)", reduction.adjusted]);
    }
  }

  if (breakdown != null && breakdown.length > 0 && basePhmax != null) {
    rows.push(["--- Rozpad podle oddělení ---", ""]);
    breakdown.forEach((hours, index) => {
      rows.push([`Oddělení ${index + 1} — PHmax tabulkové (h)`, formatSdHours(hours)]);
      if (reduction.applied) {
        rows.push([`Oddělení ${index + 1} — po krácení orient. (h)`, formatSdHours(round2(hours * reduction.factor))]);
      }
    });
    rows.push(["Celkem tabulkové PHmax (h)", formatSdHours(basePhmax)]);
    if (reduction.applied) rows.push(["Celkem po krácení (h)", formatSdHours(reduction.adjusted)]);
  }

  if (tableWarning) rows.push(["Upozornění", tableWarning]);
  return rows;
}
