import { APP_AUTHOR_EXPORT_ROWS } from "./calculator-ui-constants";
import type { SdVychovatelPpcFullHours, SdStaffingSplitNv75 } from "./phmax-sd-staffing-nv75";
import { round2 } from "./phmax-zs-logic";

export type PhmaxSdExportRow = readonly [string, string | number];

function formatSdHours(value: number) {
  return value.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSdFactor(value: number) {
  return value.toLocaleString("cs-CZ", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
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
  detailed?: {
    finalPhmax: number;
    finalPhaMax: number;
    regularSharePhmax: number;
    specialSharePhmax: number;
    breakdown: readonly {
      index1Based: number;
      kind: "regular" | "special";
      participants: number;
      basePhmax: number;
      reductionFactor: number;
      finalPhmax: number;
      finalPhaMax: number;
    }[];
  } | null;
  /** Orientační model PPV dle NV 75/2005 (tab. 7.1 / 7.2), stejné uplatnění jako v UI. */
  staffingNv75?: {
    vychovatelPpc: SdVychovatelPpcFullHours;
    model: SdStaffingSplitNv75;
  } | null;
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
    detailed,
    staffingNv75,
  } = input;

  const rows: PhmaxSdExportRow[] = [
    ["=== PHmax školní družina – export ===", ""],
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

  if (detailed) {
    rows.push(["=== Detailní model (běžná + speciální oddělení) ===", ""]);
    rows.push(["PHmax běžná oddělení (h/týden)", detailed.regularSharePhmax]);
    rows.push(["PHmax speciální oddělení (h/týden)", detailed.specialSharePhmax]);
    rows.push(["PHmax celkem (detailní model)", detailed.finalPhmax]);
    rows.push(["PHAmax speciální oddělení (orientačně, h/týden)", detailed.finalPhaMax]);
    detailed.breakdown.forEach((r) => {
      rows.push([`Oddělení ${r.index1Based} (${r.kind}) účastníci`, formatSdHours(r.participants)]);
      rows.push([`Oddělení ${r.index1Based} (${r.kind}) PHmax základ`, formatSdHours(r.basePhmax)]);
      rows.push([`Oddělení ${r.index1Based} (${r.kind}) koeficient`, formatSdFactor(r.reductionFactor)]);
      rows.push([`Oddělení ${r.index1Based} (${r.kind}) PHmax po krácení`, formatSdHours(r.finalPhmax)]);
      if (r.kind === "special") {
        rows.push([`Oddělení ${r.index1Based} (${r.kind}) PHAmax`, formatSdHours(r.finalPhaMax)]);
      }
    });
  }

  if (breakdown != null && breakdown.length > 0 && basePhmax != null) {
    rows.push(["--- Rozpad podle oddělení ---", ""]);
    breakdown.forEach((hours, index) => {
      rows.push([`Oddělení ${index + 1} – PHmax tabulkové (h)`, formatSdHours(hours)]);
      if (reduction.applied) {
        rows.push([`Oddělení ${index + 1} – po krácení orient. (h)`, formatSdHours(round2(hours * reduction.factor))]);
      }
    });
    rows.push(["Celkem tabulkové PHmax (h)", formatSdHours(basePhmax)]);
    if (reduction.applied) rows.push(["Celkem po krácení (h)", formatSdHours(reduction.adjusted)]);
  }

  if (staffingNv75) {
    const m = staffingNv75.model;
    const slot = staffingNv75.vychovatelPpc;
    rows.push(["=== Model úvazků (nařízení vlády č. 75/2005 Sb., orientačně) ===", ""]);
    rows.push([
      "Vedoucí vychovatel: samostatný slot dle tab. 7.2 (před dělením PPV ostatních, tab. 7.1)",
      m.separateVedoucihoDleT72 ? "ano" : "ne",
    ]);
    rows.push(["Zvolený plný týdenní rozsah PPV vychovatele (příl. 1, tab. 7.1, h/týd.)", slot]);
    if (m.headNote) {
      rows.push(["Poznámka k modelu (tab. 7.1 / 7.2)", m.headNote]);
    }
    rows.push(["Vedoucí vychovatel (příl. 1, tab. 7.2, h/týd.)", m.headVedouciHours]);
    rows.push(["PHmax pro ostatní vychovatele (h/týd., zbývá z PHmax)", formatSdHours(m.forOthersPhmax)]);
    rows.push([`Ostatní: plné úvazky (počet ×${slot} h, tab. 7.1)`, m.fullTimeSlots]);
    rows.push(["Ostatní: zkrácený úvazek, dopočet (h/týd.)", formatSdHours(m.partialHours)]);
    rows.push([`Ostatní: zkrácený úvazek v % vůči plnému ${slot} h`, m.partialPercentOfFull]);
    if (m.inconsistent) {
      rows.push(["Konzistence modelu", m.inconsistencyMessage ?? "nesoulad (viz upozornění v aplikaci)"]);
    }
  }

  if (tableWarning) rows.push(["Upozornění", tableWarning]);
  rows.push(...APP_AUTHOR_EXPORT_ROWS);
  return rows;
}
