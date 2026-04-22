import { APP_VERSION } from "./app-version";

export type ExportProductKind = "pv" | "sd" | "zs" | "ss";

/** Oddělovač mezi blokem metadat a daty v CSV (správný tuple typ pro TypeScript). */
export const EXPORT_CSV_SEPARATOR_ROW: readonly [string, string] = ["", ""];

const METHODOLOGY: Record<ExportProductKind, string> = {
  pv: "Metodika PHmax/PHAmax pro PV v4 (2026), vyhl. č. 14/2005 Sb. – orientační výpočet v aplikaci.",
  sd: "Příloha k vyhl. č. 74/2005 Sb. (zájmové vzdělávání / školní družina) – orientační výpočet v aplikaci.",
  zs: "Metodika PHmax, PHAmax a PHPmax pro ZV (typicky v5 / 2026), NV č. 123/2018 Sb., související vyhlášky – orientační výpočet v aplikaci.",
  ss: "Metodika PHmax a PHAmax pro střední vzdělávání (typicky v3 / 2026) – orientační výpočet dílčích jednotek v aplikaci.",
};

/** Společné řádky na začátek CSV / doplnění kontextu XLSX. */
export function buildExportMetaRows(kind: ExportProductKind): readonly [string, string | number][] {
  const when = new Date().toLocaleString("cs-CZ");
  return [
    ["Verze aplikace", APP_VERSION],
    ["Export vytvořen (místní čas)", when],
    ["Metodický rámec (orientační)", METHODOLOGY[kind]],
  ];
}
