import type { BasicType } from "./phmax-zs-logic";
import { PV_PROVOZ_OPTIONS } from "./pv/pv-workplace-shared";

/** České popisky hodnot ve šabloně importu (stejné texty jako v kalkulačce). */
export const IMPORT_BASIC_TYPE_LABELS: Record<BasicType, string> = {
  full_more_than_2: "Úplná ZŠ – více než 2 třídy v některém ročníku",
  full_max_2: "Úplná ZŠ – nejvýše 2 třídy v každém ročníku",
  first_only_1: "Neúplná ZŠ – 1 třída 1. stupně",
  first_only_2: "Neúplná ZŠ – 2 třídy 1. stupně",
  first_only_3: "Neúplná ZŠ – 3 třídy 1. stupně",
  first_only_4: "Neúplná ZŠ – 4 a více tříd 1. stupně",
};

export const IMPORT_PSYCH_KIND_LABELS = {
  psych1: "1. stupeň",
  psych2: "2. stupeň",
  psychMix: "1. a 2. stupeň společně",
} as const;

export const IMPORT_HEALTH_KIND_LABELS = {
  health1: "1. stupeň (ř. B11)",
  health2: "2. stupeň (ř. B12)",
  healthMix: "1. a 2. stupeň společně (ř. B13)",
} as const;

export const IMPORT_ROW_MODE_LABELS = {
  higher_of_two: "Vyšší z obou údajů",
  current_only: "Jen aktuální rok",
} as const;

export const IMPORT_SD_MODE_LABELS = {
  summary: "Souhrn",
  detail: "Detail",
} as const;

function normKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function buildValueAliases(codes: readonly string[], labels: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const code of codes) {
    const label = labels[code];
    if (!label) continue;
    out[code] = code;
    out[normKey(code)] = code;
    out[label] = code;
    out[normKey(label)] = code;
  }
  return out;
}

const BASIC_CODES = Object.keys(IMPORT_BASIC_TYPE_LABELS) as BasicType[];

export const IMPORT_BASIC_TYPE_ALIASES = buildValueAliases(
  BASIC_CODES,
  IMPORT_BASIC_TYPE_LABELS as Record<string, string>,
);

/** Kratší zápisy pro školy (kromě plných popisků z kalkulačky). */
const BASIC_SHORT_ALIASES: Record<string, BasicType> = {
  "plny rozsah nad 2h": "full_more_than_2",
  "plný rozsah nad 2h": "full_more_than_2",
  "plny rozsah max 2h": "full_max_2",
  "plný rozsah max 2h": "full_max_2",
  "neuplna zs 1 trida": "first_only_1",
  "neúplná zs 1 třída": "first_only_1",
};

for (const [k, v] of Object.entries(BASIC_SHORT_ALIASES)) {
  IMPORT_BASIC_TYPE_ALIASES[k] = v;
  IMPORT_BASIC_TYPE_ALIASES[normKey(k)] = v;
}

export const IMPORT_PROVOZ_ALIASES: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const { value, label } of PV_PROVOZ_OPTIONS) {
    out[value] = value;
    out[normKey(value)] = value;
    out[label] = value;
    out[normKey(label)] = value;
  }
  const short: Record<string, string> = {
    polodenni: "polodenni",
    polodenní: "polodenni",
    celodenni: "celodenni",
    celodenní: "celodenni",
    internat: "internat",
    internátní: "internat",
    zdravotnicke: "zdravotnicke",
    zdravotnické: "zdravotnicke",
  };
  for (const [k, v] of Object.entries(short)) {
    out[k] = v;
    out[normKey(k)] = v;
  }
  return out;
})();

export const IMPORT_PSYCH_KIND_ALIASES = buildValueAliases(
  Object.keys(IMPORT_PSYCH_KIND_LABELS),
  IMPORT_PSYCH_KIND_LABELS as Record<string, string>,
);

export const IMPORT_HEALTH_KIND_ALIASES = buildValueAliases(
  Object.keys(IMPORT_HEALTH_KIND_LABELS),
  IMPORT_HEALTH_KIND_LABELS as Record<string, string>,
);

export const IMPORT_ROW_MODE_ALIASES = buildValueAliases(
  Object.keys(IMPORT_ROW_MODE_LABELS),
  IMPORT_ROW_MODE_LABELS as Record<string, string>,
);

export const IMPORT_SD_MODE_ALIASES = buildValueAliases(
  Object.keys(IMPORT_SD_MODE_LABELS),
  IMPORT_SD_MODE_LABELS as Record<string, string>,
);

/** Řádky listu Návod ve šabloně Excel v2. */
export const IMPORT_TEMPLATE_NAVOD_VALUE_LINES: readonly string[] = [
  "PV – druh provozu (vyplňte jeden z textů):",
  `  ${PV_PROVOZ_OPTIONS.map((o) => o.label).join(" | ")}`,
  "",
  "ZŠ souhrn – typ základního vzdělávání:",
  `  ${Object.values(IMPORT_BASIC_TYPE_LABELS).join(" | ")}`,
  "",
  "ZŠ psycholog – stupeň:",
  `  ${Object.values(IMPORT_PSYCH_KIND_LABELS).join(" | ")}`,
  "Režim výpočtu: Vyšší z obou údajů | Jen aktuální rok",
  "",
  "ZŠ zdravotní – stupeň:",
  `  ${Object.values(IMPORT_HEALTH_KIND_LABELS).join(" | ")}`,
  "Režim výpočtu: Vyšší z obou údajů | Jen aktuální rok",
  "",
  "ŠD – režim: Souhrn | Detail",
  "",
  "Technické kódy (full_more_than_2, psych1, …) import stále přijme – pro IT a starší soubory.",
];
