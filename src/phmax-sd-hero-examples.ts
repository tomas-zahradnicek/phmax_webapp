import type { SdDepartmentInput } from "./phmax-sd-logic";

/** Stejný tvar jako uložený stav / `parseSdSnapshot` ve stránce ŠD. */
export type SdHeroExampleSnapshot = {
  pupils: number;
  manualDepts: boolean;
  departments: number;
  inputMode: "summary" | "detail";
  summarySpecialDepartments: { participants: number; specialExceptionGranted?: boolean }[];
  regularExceptionGranted: boolean;
  specialExceptionGranted: boolean;
  detailDepartments: SdDepartmentInput[];
  schoolFirstStageClassCount: 1 | 2 | 3 | null;
};

/** Klíče ukázek z metodiky MŠMT / vyhl. 74/2005 Sb. (školská družina). */
export type SdHeroExampleKey =
  | ""
  | "meth_1_100"
  | "meth_2_35"
  | "meth_3_one_class_3"
  | "meth_4_two_classes_11"
  | "meth_5_eleven_depts"
  | "meth_6_mixed_special"
  | "meth_7_special_pha";

export const SD_HERO_EXAMPLE_ORDER: readonly Exclude<SdHeroExampleKey, "">[] = [
  "meth_1_100",
  "meth_2_35",
  "meth_3_one_class_3",
  "meth_4_two_classes_11",
  "meth_5_eleven_depts",
  "meth_6_mixed_special",
  "meth_7_special_pha",
];

/** Krátký popis v seznamu; očekávaný výsledek v tooltipu (`title`). */
export const SD_HERO_EXAMPLE_META: Record<
  Exclude<SdHeroExampleKey, "">,
  { label: string; title: string }
> = {
  meth_1_100: {
    label: "Př. 1 — 100 žáků 1. st., bez § 16/9 (÷ 27 → 4 oddělení)",
    title:
      "100 účastníků prvního stupně, bez speciálních oddělení. Počet oddělení: 100 ÷ 27 → zaokrouhlení nahoru = 4. Očekávaný PHmax (tabulka): 97,50 h (bez krácení § 10 odst. 2, pokud je součet ≥ 4×20).",
  },
  meth_2_35: {
    label: "Př. 2 — 35 žáků, škola se 4 třídami 1. st., 2 oddělení",
    title:
      "35 účastníků, 2 běžná oddělení (35 ÷ 27 → 2). Metodika zmiňuje též výjimku § 10 odst. 6 (např. 21 žáků celkem); tato aplikace krátí orientačně dle § 10 odst. 2 (min. 20 na oddělení) při zapnuté výjimce — PHmax cca 50,31 h (57,5 × 35/40).",
  },
  meth_3_one_class_3: {
    label: "Př. 3 — 1 třída 1. st., 1 oddělení, výjimka min. 5 → 3 žáci",
    title:
      "Minimum 5 žáků 1. st. na 1 běžné oddělení, výjimka na 3. PHmax = (3 : 5) × 32,5 = 19,50 h.",
  },
  meth_4_two_classes_11: {
    label: "Př. 4 — 2 třídy 1. st., 1 oddělení, výjimka min. 15 → 11 žáků",
    title:
      "Minimum 15 žáků 1. st., výjimka na 11. PHmax = (11 : 15) × 32,5 = 23,83 h (zaokrouhleno na 2 desetinná místa).",
  },
  meth_5_eleven_depts: {
    label: "Př. 5 — 11 běžných oddělení, průměr 19 (209 žáků), výjimka z 20",
    title:
      "11 oddělení, PHmax tabulkový 275. Minimální součet 11×20 = 220, skutečně 209. pk = 209/220 = 0,95 → PHmaxk = 275 × 0,95 = 261,25 h.",
  },
  meth_6_mixed_special: {
    label: "Př. 6 — 1 běžné + 1 speciální (5), výjimka odst. 7",
    title:
      "Dva oddělení, jedno speciální s 5 účastníky a výjimkou (0,95). Aplikace: přesné mezikroky → PHmax celkem cca 56,06 h; metodika často uvádí 56,2 po zaokrouhlení mezikroků.",
  },
  meth_7_special_pha: {
    label: "Př. 7 — jen speciální oddělení (5), výjimka → PHAmax",
    title:
      "Jedno speciální oddělení, 5 účastníků, výjimka. PHAmax = 15 × 0,95 = 14,25 h týdně (PHmax provozu zvlášť dle poměrné části tabulky).",
  },
};

const DEFAULT_DETAIL: SdDepartmentInput[] = [{ kind: "regular", participants: 0 }];

export function sdHeroExampleSnapshot(key: Exclude<SdHeroExampleKey, "">): SdHeroExampleSnapshot {
  switch (key) {
    case "meth_1_100":
      return {
        pupils: 100,
        manualDepts: false,
        departments: 4,
        inputMode: "summary",
        summarySpecialDepartments: [],
        regularExceptionGranted: false,
        specialExceptionGranted: false,
        detailDepartments: [...DEFAULT_DETAIL],
        schoolFirstStageClassCount: null,
      };
    case "meth_2_35":
      return {
        pupils: 35,
        manualDepts: true,
        departments: 2,
        inputMode: "summary",
        summarySpecialDepartments: [],
        regularExceptionGranted: true,
        specialExceptionGranted: false,
        detailDepartments: [...DEFAULT_DETAIL],
        schoolFirstStageClassCount: null,
      };
    case "meth_3_one_class_3":
      return {
        pupils: 3,
        manualDepts: true,
        departments: 1,
        inputMode: "summary",
        summarySpecialDepartments: [],
        regularExceptionGranted: true,
        specialExceptionGranted: false,
        detailDepartments: [...DEFAULT_DETAIL],
        schoolFirstStageClassCount: 1,
      };
    case "meth_4_two_classes_11":
      return {
        pupils: 11,
        manualDepts: true,
        departments: 1,
        inputMode: "summary",
        summarySpecialDepartments: [],
        regularExceptionGranted: true,
        specialExceptionGranted: false,
        detailDepartments: [...DEFAULT_DETAIL],
        schoolFirstStageClassCount: 2,
      };
    case "meth_5_eleven_depts":
      return {
        pupils: 209,
        manualDepts: true,
        departments: 11,
        inputMode: "summary",
        summarySpecialDepartments: [],
        regularExceptionGranted: true,
        specialExceptionGranted: false,
        detailDepartments: [...DEFAULT_DETAIL],
        schoolFirstStageClassCount: null,
      };
    case "meth_6_mixed_special":
      return {
        pupils: 0,
        manualDepts: false,
        departments: 1,
        inputMode: "detail",
        summarySpecialDepartments: [],
        regularExceptionGranted: false,
        specialExceptionGranted: false,
        detailDepartments: [
          { kind: "regular", participants: 20 },
          { kind: "special", participants: 5, specialExceptionGranted: true },
        ],
        schoolFirstStageClassCount: null,
      };
    case "meth_7_special_pha":
      return {
        pupils: 0,
        manualDepts: false,
        departments: 1,
        inputMode: "detail",
        summarySpecialDepartments: [],
        regularExceptionGranted: false,
        specialExceptionGranted: false,
        detailDepartments: [{ kind: "special", participants: 5, specialExceptionGranted: true }],
        schoolFirstStageClassCount: null,
      };
    default:
      throw new Error(`Neznámý příklad ŠD: ${String(key)}`);
  }
}
