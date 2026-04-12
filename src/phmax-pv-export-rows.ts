import type { PvProvozKind } from "./phmax-pv-logic";

export type PhmaxPvExportRow = readonly [string, string | number];

export type PvExportComputed = ReturnType<
  typeof import("./phmax-pv-logic").computePvPhmaxTotal
>;

export function buildPhmaxPvExportRows(input: {
  provozLabel: string;
  provoz: PvProvozKind;
  classCount: number;
  avgHoursPerDay: number;
  sec16Count: number;
  languageGroups: number;
  computed: PvExportComputed;
  phaMax: number | null;
}): PhmaxPvExportRow[] {
  const { provozLabel, provoz, classCount, avgHoursPerDay, sec16Count, languageGroups, computed, phaMax } = input;

  const rows: PhmaxPvExportRow[] = [
    ["=== PHmax / PHAmax předškolní vzdělávání — export ===", ""],
    ["Druh provozu", provozLabel],
    ["Počet tříd pracoviště MŠ (v daném druhu provozu)", classCount],
    [
      "Průměrná doba provozu pracoviště v hodinách za den (vstup dle přílohy)",
      provoz === "zdravotnicke" ? "— (31 h/třídu, tabulky 1–3 se nepoužívají)" : avgHoursPerDay,
    ],
    ["Počet tříd § 16 odst. 9 školského zákona", sec16Count],
    ["Počet skupin jazykové přípravy", languageGroups],
  ];

  computed.issues.forEach((issue, i) => {
    rows.push([`Upozornění / chyba ${i + 1}`, issue.message]);
  });

  if (computed.base) {
    rows.push(["PHmax ze základní tabulky (h/týden, toto pracoviště)", computed.base.basePhmax]);
    rows.push(["Pásmo / sloupec doby provozu", computed.base.durationColumnLabel]);
  }

  rows.push(["Příplatek § 16 odst. 9 (5 h × třídy)", computed.sec16Bonus]);
  rows.push(["Příplatek jazyková příprava (1 h × skupiny)", computed.languageBonus]);

  if (computed.totalPhmax != null) rows.push(["PHmax celkem (h/týden, toto pracoviště)", computed.totalPhmax]);
  if (phaMax != null) rows.push(["PHAmax § 16 třídy (h/týden, toto pracoviště)", phaMax]);

  return rows;
}

export type PvMultiExportItem = {
  index: number;
  label: string;
  provozLabel: string;
  provoz: PvProvozKind;
  classCount: number;
  avgHoursPerDay: number;
  sec16Count: number;
  languageGroups: number;
  computed: PvExportComputed;
  phaMax: number | null;
};

/** Export více pracovišť výpočtu (kombinace místo / druh provozu) a součty. */
export function buildPhmaxPvMultiExportRows(
  items: ReadonlyArray<PvMultiExportItem>,
  totals: { phmaxSum: number; phaSum: number; incomplete: boolean }
): PhmaxPvExportRow[] {
  const out: PhmaxPvExportRow[] = [
    ["=== PHmax / PHAmax předškolní vzdělávání — export (více pracovišť) ===", ""],
    ["Počet pracovišť ve výpočtu", items.length],
    ["", ""],
  ];

  for (const item of items) {
    const header =
      item.label.trim() !== ""
        ? `--- Pracoviště ${item.index} — ${item.label.trim()} ---`
        : `--- Pracoviště ${item.index} ---`;
    out.push([header, ""]);
    const block = buildPhmaxPvExportRows({
      provozLabel: item.provozLabel,
      provoz: item.provoz,
      classCount: item.classCount,
      avgHoursPerDay: item.avgHoursPerDay,
      sec16Count: item.sec16Count,
      languageGroups: item.languageGroups,
      computed: item.computed,
      phaMax: item.phaMax,
    });
    out.push(...block.slice(1));
    out.push(["", ""]);
  }

  out.push(["=== SOUČET (právnická osoba / všechna pracoviště) ===", ""]);
  if (totals.incomplete) {
    out.push([
      "Poznámka k součtu PHmax",
      "Do součtu nejsou započítána pracoviště s chybou vstupu — opravte je nebo je vynechte.",
    ]);
  }
  out.push(["PHmax celkem (součet dílčích PHmax, h/týden)", totals.phmaxSum]);
  if (totals.phaSum > 0) {
    out.push(["PHAmax celkem (součet pracovišť s § 16 třídami, h/týden)", totals.phaSum]);
  }

  return out;
}
