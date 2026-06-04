import type { ImportCsvRow } from "./phmax-import-pv-zs";
import {
  IMPORT_BASIC_TYPE_ALIASES,
  IMPORT_HEALTH_KIND_ALIASES,
  IMPORT_PROVOZ_ALIASES,
  IMPORT_PSYCH_KIND_ALIASES,
  IMPORT_ROW_MODE_ALIASES,
  IMPORT_SD_MODE_ALIASES,
  IMPORT_SS_STUDY_FORM_ALIASES,
} from "./phmax-import-czech-values";

/** České popisky sloupců ve šabloně Excel (řádek 1). Interní klíč je v závorce nebo mapování níže. */
export const IMPORT_META_LABELS = {
  school_id: "ID školy",
  school_name: "Název školy",
  school_year: "Školní rok",
  scenario_label: "Název scénáře",
  schema_version: "Verze šablony",
} as const;

export const IMPORT_PV_LABELS = {
  school_id: "ID školy",
  scenario_label: "Název scénáře",
  row_key: "Klíč řádku",
  label: "Označení pracoviště",
  provoz: "Druh provozu",
  class_count: "Počet tříd",
  avg_hours: "Průměrná denní doba (h)",
  sec16_count: "Třídy § 16",
  language_groups: "Jazykové skupiny",
} as const;

export const IMPORT_ZS_SUMMARY_LABELS = {
  school_id: "ID školy",
  scenario_label: "Název scénáře",
  basic_type: "Typ základního vzdělávání",
  basic1_classes: "Třídy 1. stupeň",
  basic1_pupils: "Žáci 1. stupeň",
  basic2_classes: "Třídy 2. stupeň",
  basic2_pupils: "Žáci 2. stupeň",
  incl1_classes: "Inkluzivní 1. st.",
  incl1_pupils: "Žáci inkl. 1. st.",
  incl2_classes: "Inkluzivní 2. st.",
  incl2_pupils: "Žáci inkl. 2. st.",
  prep_classes: "Přípravné třídy ZŠ",
  prep_children: "Děti v přípravce",
  export_label: "Popisek exportu",
} as const;

export const IMPORT_SD_LABELS = {
  school_id: "ID školy",
  scenario_label: "Název scénáře",
  pupils: "Počet účastníků",
  departments: "Počet oddělení",
  input_mode: "Režim ŠD",
} as const;

export const IMPORT_SS_LABELS = {
  school_id: "ID školy",
  scenario_label: "Název scénáře",
  row_key: "Klíč řádku",
  label: "Označení třídy",
  education_field: "Kód oboru",
  study_form: "Forma studia",
  class_count: "Počet tříd",
  average_students: "Průměr žáků",
} as const;

export const IMPORT_ZS_PSYCH_LABELS = {
  school_id: "ID školy",
  scenario_label: "Název scénáře",
  row_id: "Č. řádku",
  kind: "Stupeň (psychiatrie)",
  mode: "Režim výpočtu",
  current_pupils: "Žáci aktuálně",
  current_classes: "Třídy aktuálně",
  prev_pupils: "Žáci předchozí",
  prev_classes: "Třídy předchozí",
} as const;

export const IMPORT_ZS_HEALTH_LABELS = {
  school_id: "ID školy",
  scenario_label: "Název scénáře",
  row_id: "Č. řádku",
  kind: "Stupeň (zdravotní třída)",
  mode: "Režim výpočtu",
  current_pupils: "Žáci aktuálně",
  current_classes: "Třídy aktuálně",
  prev_pupils: "Žáci předchozí",
  prev_classes: "Třídy předchozí",
} as const;

function invertLabels(labels: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, label] of Object.entries(labels)) {
    out[label] = key;
    out[key] = key;
    out[label.toLowerCase()] = key;
    out[key.toLowerCase()] = key;
  }
  return out;
}

const HEADER_MAPS = {
  meta: invertLabels(IMPORT_META_LABELS),
  pv: invertLabels(IMPORT_PV_LABELS),
  zs: invertLabels(IMPORT_ZS_SUMMARY_LABELS),
  sd: invertLabels(IMPORT_SD_LABELS),
  ss: invertLabels(IMPORT_SS_LABELS),
  zsPsych: invertLabels(IMPORT_ZS_PSYCH_LABELS),
  zsHealth: invertLabels(IMPORT_ZS_HEALTH_LABELS),
} as const;

export type ImportSheetKind = keyof typeof HEADER_MAPS;

export function normalizeImportHeader(header: string): string {
  const h = header.trim();
  if (!h) return "";
  const lower = h.toLowerCase();
  for (const map of Object.values(HEADER_MAPS)) {
    if (map[h]) return map[h];
    if (map[lower]) return map[lower];
  }
  return lower.replace(/\s+/g, "_");
}

export function normalizeImportRows(rows: ImportCsvRow[], kind: ImportSheetKind): ImportCsvRow[] {
  return rows.map((row) => {
    const out: ImportCsvRow = {};
    for (const [header, value] of Object.entries(row)) {
      const key = normalizeImportHeader(header);
      if (key) out[key] = value;
    }
    return normalizeImportValues(out, kind);
  });
}

function normKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function normalizeImportValues(row: ImportCsvRow, kind: ImportSheetKind): ImportCsvRow {
  const out = { ...row };
  if (kind === "pv" && out.provoz) {
    out.provoz = IMPORT_PROVOZ_ALIASES[normKey(out.provoz)] ?? normKey(out.provoz).replace(/\s+/g, "_");
  }
  if (kind === "zs" && out.basic_type) {
    const k = normKey(out.basic_type);
    out.basic_type = IMPORT_BASIC_TYPE_ALIASES[k] ?? out.basic_type.trim();
  }
  if (kind === "sd" && out.input_mode) {
    out.input_mode = (IMPORT_SD_MODE_ALIASES[normKey(out.input_mode)] as "summary" | "detail" | undefined) ?? "summary";
  }
  if ((kind === "zsPsych" || kind === "zsHealth") && out.mode) {
    out.mode =
      (IMPORT_ROW_MODE_ALIASES[normKey(out.mode)] as "higher_of_two" | "current_only" | undefined) ?? "current_only";
  }
  if (kind === "zsPsych" && out.kind) {
    out.kind = IMPORT_PSYCH_KIND_ALIASES[normKey(out.kind)] ?? out.kind.trim();
  }
  if (kind === "zsHealth" && out.kind) {
    out.kind = IMPORT_HEALTH_KIND_ALIASES[normKey(out.kind)] ?? out.kind.trim();
  }
  if (kind === "ss" && out.study_form) {
    out.study_form = IMPORT_SS_STUDY_FORM_ALIASES[normKey(out.study_form)] ?? out.study_form.trim();
  }
  return out;
}
