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
