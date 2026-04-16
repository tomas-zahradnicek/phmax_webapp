import type { PvProvozKind } from "./phmax-pv-logic";

/** Jedno pracoviště — stejný tvar jako řádek ve `PhmaxPvPage` / localStorage. */
export type PvHeroExampleRow = {
  id: string;
  label: string;
  provoz: PvProvozKind;
  classCount: number;
  avgHours: number;
  sec16Count: number;
  languageGroups: number;
};

export type PvHeroExampleSnapshot = {
  rows: PvHeroExampleRow[];
};

export type PvHeroExampleKey =
  | ""
  | "meth_pv_1_240"
  | "meth_pv_2_245"
  | "meth_pv_3_pha27"
  | "ill_pv_1_single_10"
  | "ill_pv_2_two_105"
  | "ill_pv_3_three_105"
  | "ill_pv_4_six_11"
  | "ill_pv_5_mixed_1625"
  | "ill_pv_6_two_95";

/** Pouze výkladové příklady z textu metodiky (PHmax / PHAmax). */
export const PV_HERO_EXAMPLE_METH_KEYS: readonly Exclude<PvHeroExampleKey, "">[] = [
  "meth_pv_1_240",
  "meth_pv_2_245",
  "meth_pv_3_pha27",
];

/** Ilustrace z obrazové přílohy (MŠ bez tříd § 16/9). */
export const PV_HERO_EXAMPLE_ILL_KEYS: readonly Exclude<PvHeroExampleKey, "">[] = [
  "ill_pv_1_single_10",
  "ill_pv_2_two_105",
  "ill_pv_3_three_105",
  "ill_pv_4_six_11",
  "ill_pv_5_mixed_1625",
  "ill_pv_6_two_95",
];

export const PV_HERO_EXAMPLE_ORDER: readonly Exclude<PvHeroExampleKey, "">[] = [
  ...PV_HERO_EXAMPLE_METH_KEYS,
  ...PV_HERO_EXAMPLE_ILL_KEYS,
];

export const PV_HERO_EXAMPLE_SELECT_LEGEND =
  "PHmax a PHAmax se stanovují odděleně: přebytky PHmax nelze použít na asistenty pedagoga (PHAmax) a naopak. U příkladů z přílohy jde o orientační hodnoty PHmax z tabulek 1–2; smíšený provoz (2 celodenní + 1 polodenní) je v aplikaci rozložen na dva řádky pracoviště se stejným součtem jako v metodice.";

export const PV_HERO_EXAMPLE_META: Record<Exclude<PvHeroExampleKey, "">, { label: string; title: string }> = {
  meth_pv_1_240: {
    label: "Př. 1 — 4 třídy, 1× § 16/9, celodenně 10 h → PHmax 240",
    title:
      "4 třídy celodenně 10 h/den: tabulka 2 → základ 235 h + 5 h za 1 třídu § 16/9 = 240 h PHmax. PHAmax pro 1 třídu § 16/9 při ≥ 8 h provozu: 36 h (počítá se zvlášť, nelze „převést“ z PHmax).",
  },
  meth_pv_2_245: {
    label: "Př. 2 — MŠ § 16/9, 4 třídy, celodenně 9,5 h → PHmax 245",
    title:
      "4 třídy celodenně 9,5 h/den: tabulka 2 → základ 225 h + 5 h za každou ze 4 tříd § 16/9 (+20 h) = 245 h.",
  },
  meth_pv_3_pha27: {
    label: "Př. 3 — Polodenně 6 h, 1× § 16/9 → PHAmax 27",
    title:
      "Polodenní provoz 6 h/den, 1 třída § 16/9: PHAmax = 36 × (6/8) = 27 h (metodika). PHmax z tabulky 1 zvlášť; přebytky PHmax nelze převést na PHAmax.",
  },
  ill_pv_1_single_10: {
    label: "Příloha: jednotřídní, celodenně 10 h → PHmax 62,5",
    title:
      "Ilustrace MŠ bez tříd § 16/9: 1 třída, průměr 10 h/den, celodenní provoz — PHmax 62,5 h/týd. (tabulka 2).",
  },
  ill_pv_2_two_105: {
    label: "Příloha: dvoutřídní, celodenně 10,5 h → PHmax 125",
    title: "2 třídy, 10,5 h/den, celodenně — PHmax 125 h/týd.",
  },
  ill_pv_3_three_105: {
    label: "Příloha: trojtřídní, celodenně 10,5 h → PHmax 185",
    title: "3 třídy, 10,5 h/den, celodenně — PHmax 185 h/týd.",
  },
  ill_pv_4_six_11: {
    label: "Příloha: šestitřídní, celodenně 11 h → PHmax 380",
    title: "6 tříd, 11 h/den, celodenně — PHmax 380 h/týd.",
  },
  ill_pv_5_mixed_1625: {
    label: "Příloha: 2 celodenní + 1 polodenní (2 řádky) → součet 162,5",
    title:
      "Jedno místo s kombinací provozů modelováno jako 2 řádky: 2 třídy celodenně 10 h (120 h PHmax z tab. 2) + 1 třída polodenně 6 h (42,5 h z tab. 1) = 162,5 h (odpovídá metodické ilustraci).",
  },
  ill_pv_6_two_95: {
    label: "Příloha: dvoutřídní, celodenně 9,5 h → PHmax 115",
    title:
      "2 třídy, 9,5 h/den, celodenně — PHmax 115 h/týd. (metodika uvádí, že hodnota nemusí stačit na organizaci výchovy).",
  },
};

export function pvHeroExampleSnapshot(key: Exclude<PvHeroExampleKey, "">): PvHeroExampleSnapshot {
  switch (key) {
    case "meth_pv_1_240":
      return {
        rows: [
          {
            id: "pv-hero-m1",
            label: "Příklad 1 (metodika)",
            provoz: "celodenni",
            classCount: 4,
            avgHours: 10,
            sec16Count: 1,
            languageGroups: 0,
          },
        ],
      };
    case "meth_pv_2_245":
      return {
        rows: [
          {
            id: "pv-hero-m2",
            label: "Příklad 2 (metodika)",
            provoz: "celodenni",
            classCount: 4,
            avgHours: 9.5,
            sec16Count: 4,
            languageGroups: 0,
          },
        ],
      };
    case "meth_pv_3_pha27":
      return {
        rows: [
          {
            id: "pv-hero-m3",
            label: "Příklad 3 (metodika — PHAmax)",
            provoz: "polodenni",
            classCount: 1,
            avgHours: 6,
            sec16Count: 1,
            languageGroups: 0,
          },
        ],
      };
    case "ill_pv_1_single_10":
      return {
        rows: [
          {
            id: "pv-hero-i1",
            label: "Jednotřídní MŠ (příloha)",
            provoz: "celodenni",
            classCount: 1,
            avgHours: 10,
            sec16Count: 0,
            languageGroups: 0,
          },
        ],
      };
    case "ill_pv_2_two_105":
      return {
        rows: [
          {
            id: "pv-hero-i2",
            label: "Dvoutřídní MŠ (příloha)",
            provoz: "celodenni",
            classCount: 2,
            avgHours: 10.5,
            sec16Count: 0,
            languageGroups: 0,
          },
        ],
      };
    case "ill_pv_3_three_105":
      return {
        rows: [
          {
            id: "pv-hero-i3",
            label: "Trojtřídní MŠ (příloha)",
            provoz: "celodenni",
            classCount: 3,
            avgHours: 10.5,
            sec16Count: 0,
            languageGroups: 0,
          },
        ],
      };
    case "ill_pv_4_six_11":
      return {
        rows: [
          {
            id: "pv-hero-i4",
            label: "Šestitřídní MŠ (příloha)",
            provoz: "celodenni",
            classCount: 6,
            avgHours: 11,
            sec16Count: 0,
            languageGroups: 0,
          },
        ],
      };
    case "ill_pv_5_mixed_1625":
      return {
        rows: [
          {
            id: "pv-hero-i5a",
            label: "Kombinace provozů — celodenní část (příloha)",
            provoz: "celodenni",
            classCount: 2,
            avgHours: 10,
            sec16Count: 0,
            languageGroups: 0,
          },
          {
            id: "pv-hero-i5b",
            label: "Kombinace provozů — polodenní část (příloha)",
            provoz: "polodenni",
            classCount: 1,
            avgHours: 6,
            sec16Count: 0,
            languageGroups: 0,
          },
        ],
      };
    case "ill_pv_6_two_95":
      return {
        rows: [
          {
            id: "pv-hero-i6",
            label: "Dvoutřídní MŠ, 9,5 h (příloha)",
            provoz: "celodenni",
            classCount: 2,
            avgHours: 9.5,
            sec16Count: 0,
            languageGroups: 0,
          },
        ],
      };
    default:
      throw new Error(`Neznámý příklad PV: ${String(key)}`);
  }
}
