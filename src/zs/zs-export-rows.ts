/** Metadata hlavičky rozšířeného CSV/XLSX exportu ZŠ (acceptance Z5). */
export type ZsExtendedExportMetaInput = {
  appVersion: string;
  methodikaLabel: string;
  modeLabel: string;
  tabLabel: string;
  exportLabel: string;
  wizardChoice: string;
  dataMode: "own" | "example";
  selectedExample: string;
  exportIso: string;
  exportLocal: string;
};

export const ZS_EXTENDED_EXPORT_TITLE = "=== Export kalkulačky ZŠ – rozšířený ===";

export const ZS_EXPORT_ORIENTACNI_UI_DISCLAIMER =
  "Aplikace slouží k orientačnímu výpočtu; nejedná se o oficiální výstup zřizovatele.";

export function buildZsExtendedExportMetaRows(
  input: ZsExtendedExportMetaInput,
): [string, string | number][] {
  return [
    [ZS_EXTENDED_EXPORT_TITLE, ""],
    ["Verze aplikace", input.appVersion],
    ["Datum a čas exportu (ISO)", input.exportIso],
    ["Datum a čas exportu (místní)", input.exportLocal],
    ["Metodický podklad (orientačně)", input.methodikaLabel],
    ["Režim výpočtu (typ školy)", input.modeLabel],
    ["Aktivní záložka při exportu", input.tabLabel],
    ["Označení exportu / škola", input.exportLabel.trim() || "–"],
    ["Průvodce (volba scénáře)", input.wizardChoice || "–"],
    ["Práce s údaji", input.dataMode === "example" ? "ukázkový příklad" : "vlastní škola"],
    ["Identifikátor ukázkového příkladu", input.selectedExample || "–"],
    ["", ""],
  ];
}
