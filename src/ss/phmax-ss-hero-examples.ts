import type { PhmaxSsUnitRow } from "./phmax-ss-types";

export type SsHeroExampleKey =
  | ""
  | "ill_ss_jednoobor_agregat"
  | "ill_ss_jednoobor_momv"
  | "ill_ss_maturita_autotronik"
  | "ill_ss_maturita_provoz_dopravy"
  | "ill_ss_gymnazium_ctyrleta"
  | "ill_ss_dvouobor_stavba"
  | "ill_ss_tri_obor_auto"
  | "ill_ss_prijimaci_obory_mix"
  | "ill_ss_kuchar_cisnik_rvp"
  | "ill_ss_srovnani_denni_vecerni"
  | "ill_ss_dalkova_jednoobor"
  | "ill_ss_auto_dvoubor_eh"
  | "ill_ss_82_talent_dvouobor"
  | "ill_ss_prakticka_skola"
  | "ill_ss_sec16_trida";

type SsHeroExampleSnapshot = {
  rows: Partial<PhmaxSsUnitRow>[];
};

/** Pořadí ve všech skupinách dohromady (pro testy / stabilní UI). */
export const SS_HERO_EXAMPLE_ORDER: readonly Exclude<SsHeroExampleKey, "">[] = [
  "ill_ss_jednoobor_agregat",
  "ill_ss_jednoobor_momv",
  "ill_ss_maturita_autotronik",
  "ill_ss_maturita_provoz_dopravy",
  "ill_ss_gymnazium_ctyrleta",
  "ill_ss_dvouobor_stavba",
  "ill_ss_tri_obor_auto",
  "ill_ss_prijimaci_obory_mix",
  "ill_ss_kuchar_cisnik_rvp",
  "ill_ss_srovnani_denni_vecerni",
  "ill_ss_dalkova_jednoobor",
  "ill_ss_auto_dvoubor_eh",
  "ill_ss_82_talent_dvouobor",
  "ill_ss_prakticka_skola",
  "ill_ss_sec16_trida",
];

export const SS_HERO_EXAMPLE_GROUP_AGGREGAT_JEDNO: readonly Exclude<SsHeroExampleKey, "">[] = [
  "ill_ss_jednoobor_agregat",
  "ill_ss_jednoobor_momv",
];

export const SS_HERO_EXAMPLE_GROUP_MATURITNI: readonly Exclude<SsHeroExampleKey, "">[] = [
  "ill_ss_maturita_autotronik",
  "ill_ss_maturita_provoz_dopravy",
];

/** Čtyřleté gymnázium (všeobecný obor) — odděleně od odborných maturitních kmenů. */
export const SS_HERO_EXAMPLE_GROUP_GYMNAZIUM: readonly Exclude<SsHeroExampleKey, "">[] = [
  "ill_ss_gymnazium_ctyrleta",
];

export const SS_HERO_EXAMPLE_GROUP_VICEOBOR: readonly Exclude<SsHeroExampleKey, "">[] = [
  "ill_ss_dvouobor_stavba",
  "ill_ss_tri_obor_auto",
];

/** Obory často uváděné u přijímacího řízení / ve výkazu (denní studium) — ilustrace, ne závazná evidence konkrétní školy. */
export const SS_HERO_EXAMPLE_GROUP_PRIJIMACI: readonly Exclude<SsHeroExampleKey, "">[] = [
  "ill_ss_prijimaci_obory_mix",
  "ill_ss_kuchar_cisnik_rvp",
];

/** Forma studia, koeficienty a automatický výběr režimu PHmax (bez překryvu s přijímacím mixem). */
export const SS_HERO_EXAMPLE_GROUP_FORMA_REGIME: readonly Exclude<SsHeroExampleKey, "">[] = [
  "ill_ss_srovnani_denni_vecerni",
  "ill_ss_dalkova_jednoobor",
  "ill_ss_auto_dvoubor_eh",
];

/** Skupina oborů 82 + příznak talentové třídy. */
export const SS_HERO_EXAMPLE_GROUP_82_TALENT: readonly Exclude<SsHeroExampleKey, "">[] = [
  "ill_ss_82_talent_dvouobor",
];

/** Praktická škola a třída zřízená podle § 16 odst. 9 (metodický kontext ve vstupech). */
export const SS_HERO_EXAMPLE_GROUP_SPECIAL_TYP: readonly Exclude<SsHeroExampleKey, "">[] = [
  "ill_ss_prakticka_skola",
  "ill_ss_sec16_trida",
];

export const SS_HERO_EXAMPLE_META: Record<Exclude<SsHeroExampleKey, "">, { label: string; title: string }> = {
  ill_ss_jednoobor_agregat: {
    label: "Jednoobor — agregát více tříd (stejný kód)",
    title:
      "Jeden řádek se součtem tříd u jednoho kódu oboru a průměrem žáků (typické pro rychlý odhad). Pro přesný výpočet rozložte na jednotlivé třídy.",
  },
  ill_ss_jednoobor_momv: {
    label: "Jednoobor — mechanik opravář motorových vozidel (3 r.)",
    title:
      "Denní forma, jednooborová třída podle vyhl. č. 13/2005 Sb. Dva paralelní „výkonové“ celky (např. 1. A a 1. B) jako dva řádky se stejným kódem.",
  },
  ill_ss_maturita_autotronik: {
    label: "Maturitní obor — Autotronik (4 r., skupina L)",
    title:
      "Čtyřletý maturitní obor skupiny L; denní forma. Slouží jako šablona pro elektro/automatizační kmen s maturitou.",
  },
  ill_ss_maturita_provoz_dopravy: {
    label: "Maturitní obor — Provoz a ekonomika dopravy (4 r., skupina M)",
    title:
      "Čtyřletý maturitní obor skupiny M; denní forma. Typický pro dopravně-ekonomický profil.",
  },
  ill_ss_gymnazium_ctyrleta: {
    label: "Gymnázium — 79-41-K/41 (4 ročníky × 5 tříd)",
    title:
      "Čtyřleté gymnázium, všeobecný obor; čtyři řádky podle ročníku (5 paralelek v každém). Průměr žáků odpovídá typickému rozvržení (~613 žáků / 20 tříd). Součet PHmax v aplikaci slouží k orientačnímu srovnání s výkazem (PHmax / úvazky), ne jako právní závěr.",
  },
  ill_ss_dvouobor_stavba: {
    label: "Dvouoborová třída — dva obory řemesla (H + H)",
    title:
      "Jedna třída, dva kódy stavebních oborů; počty žáků podle oboru. Vhodné k ověření režimu dvouoborové třídy a kontroly pravidel (sloupce Další obory / žáci).",
  },
  ill_ss_tri_obor_auto: {
    label: "Tříoborová třída — autoservis (tři obory H)",
    title:
      "Jedna třída se třemi obory vzdělání dle vyhl. č. 13/2005 Sb.; orientační rozložení žáků. Kontrola pravidel pro tří obory (E/H) je v sekci brules.",
  },
  ill_ss_prijimaci_obory_mix: {
    label: "Soubor oborů — IT, gastronomie, podnikání, kuchař-číšník, cukrář, prodavač",
    title:
      "Šest samostatných řádků (jednooborově) pro kódy typické u přijímacího řízení denního studia: 18-20-M/01, 65-41-L/01, 64-41-L/51, 65-51-H/01, 29-54-H/01, 66-51-H/01. Průměry a počty tříd jsou orientační (řádově podle běžného výkazu SŠ); upravte podle skutečné evidence.",
  },
  ill_ss_kuchar_cisnik_rvp: {
    label: "65-51-H/01 — tři zápisy zaměření (kuchař / číšník / obecně)",
    title:
      "Jeden kód RVP 65-51-H/01 pro obor Kuchař-číšník; zaměření kuchař nebo číšník se v rejstříku školy rozlišuje názvem oboru, ne jiným kódem. Tři řádky ilustrují zápis z přijímacího řízení (kuchař / číšník / obecný název) — PHmax se počítá z kódu a vstupů na řádku.",
  },
  ill_ss_srovnani_denni_vecerni: {
    label: "Srovnání — denní vs večerní (stejný kód oboru)",
    title:
      "Dva řádky se stejným kódem 39-41-L/01 (Autotronik); liší se jen forma studia. Ukázka dopadu koeficientu formy na upravený PHmax. Čísla jsou orientační.",
  },
  ill_ss_dalkova_jednoobor: {
    label: "Dálková forma — jednoobor (IT)",
    title:
      "Jeden řádek, jednooborově, dálková forma studia. Slouží k ověření koeficientu oproti dennímu studiu u stejného RVP kódu.",
  },
  ill_ss_auto_dvoubor_eh: {
    label: "Automaticky — dvouobor E + H (jedna třída)",
    title:
      "Režim PHmax necháte prázdný (Automaticky); počet oborů ve třídě = 2, hlavní kód E (23-51-E/01), druhý obor H (36-67-H/01). Aplikace zvolí režim „dva obory (E/H)“. Sloupce Další obory / žáci doplňte podle evidence.",
  },
  ill_ss_82_talent_dvouobor: {
    label: "Skupina 82 — talentová třída, dva obory (umělecký kmen)",
    title:
      "Obory skupiny 82 (82-41-M/01 + 82-41-M/02), zapnutý příznak Talent 82, Automaticky — očekává se režim „dva obory (82)“. Ilustrace kombinace skupiny 82 a talentové třídy.",
  },
  ill_ss_prakticka_skola: {
    label: "Praktická škola — jednoletý obor (78-62-C/01)",
    title:
      "Jednooborová třída s kódem praktické školy z RVP; denní forma. Slouží jako oddělená šablona od běžného maturitního kmene.",
  },
  ill_ss_sec16_trida: {
    label: "Třída podle § 16 odst. 9 — metodická poznámka u řádku",
    title:
      "Stejný vstup jako běžná třída (79-41-K/41), ale v poznámce a typu třídy je uvedeno zřízení podle § 16 odst. 9. V aplikaci jde o orientační PHmax z řádku; oddělené účtování dle metodiky MŠMT řeší škola v plném výkazu.",
  },
};

export const SS_HERO_EXAMPLE_SELECT_LEGEND =
  "Příklady jsou anonymní šablony (jednoobor, gymnázium, maturitní obory, víceoborová třída, přijímací řízení, forma studia a režim, skupina 82 / talent, PrŠ, § 16/9). Údaje upravte podle evidence školy; výsledky ověřte vůči metodice MŠMT a oficiálním výstupům.";

export function ssHeroExampleSnapshot(key: Exclude<SsHeroExampleKey, "">): SsHeroExampleSnapshot {
  switch (key) {
    case "ill_ss_jednoobor_agregat":
      return {
        rows: [
          {
            id: 1,
            label: "Agregát — jeden kód oboru, více tříd",
            educationField: "43-41-M/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "29",
            classCount: "13",
            classType: "jednooborová třída, denní, čtyřletý maturitní obor",
            note:
              "Součet tříd u jednoho kódu; průměr žáků odpovídá typické naplněnosti. Zaměření u stejného RVP řeší škola v dokumentaci — vstup zůstává jednooborový.",
          },
        ],
      };

    case "ill_ss_jednoobor_momv":
      return {
        rows: [
          {
            id: 1,
            label: "1. ročník — paralelka A",
            educationField: "23-68-H/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "24",
            classCount: "1",
            classType: "jednooborová třída",
            note: "Výuční obor, denní forma.",
          },
          {
            id: 2,
            label: "1. ročník — paralelka B",
            educationField: "23-68-H/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "23",
            classCount: "1",
            classType: "jednooborová třída",
          },
        ],
      };

    case "ill_ss_maturita_autotronik":
      return {
        rows: [
          {
            id: 1,
            label: "3. ročník — Autotronik",
            educationField: "39-41-L/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "22",
            classCount: "2",
            classType: "jednooborová třída, maturitní",
            note: "Skupina L, čtyřletý obor — ilustrace dvou paralelek.",
          },
        ],
      };

    case "ill_ss_maturita_provoz_dopravy":
      return {
        rows: [
          {
            id: 1,
            label: "2. ročník — Provoz a ekonomika dopravy",
            educationField: "37-41-M/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "25",
            classCount: "1",
            classType: "jednooborová třída, maturitní",
            note: "Skupina M, čtyřletý obor.",
          },
        ],
      };

    case "ill_ss_gymnazium_ctyrleta":
      return {
        rows: [
          {
            id: 1,
            label: "1. ročník — paralelky (5 tříd)",
            educationField: "79-41-K/41",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "30,65",
            classCount: "5",
            classType: "jednooborová třída, gymnázium",
            note: "Kategorie K; čtyřleté gymnázium, všeobecný obor.",
          },
          {
            id: 2,
            label: "2. ročník — paralelky (5 tříd)",
            educationField: "79-41-K/41",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "30,65",
            classCount: "5",
            classType: "jednooborová třída, gymnázium",
          },
          {
            id: 3,
            label: "3. ročník — paralelky (5 tříd)",
            educationField: "79-41-K/41",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "30,65",
            classCount: "5",
            classType: "jednooborová třída, gymnázium",
          },
          {
            id: 4,
            label: "4. ročník — paralelky (5 tříd)",
            educationField: "79-41-K/41",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "30,65",
            classCount: "5",
            classType: "jednooborová třída, gymnázium",
            note: "Součet: 20 tříd, 613 žáků — stejný kód u všech řádků.",
          },
        ],
      };

    case "ill_ss_dvouobor_stavba":
      return {
        rows: [
          {
            id: 1,
            label: "1. ročník — společná třída (zedník + instalatér)",
            educationField: "36-67-H/01",
            studyForm: "denni",
            phmaxMode: "",
            oborCountInClass: "2",
            additionalOborCodes: "36-52-H/01",
            oborStudentCountsRaw: "36-67-H/01:14\n36-52-H/01:10",
            averageStudents: "24",
            classCount: "1",
            classType: "dvouoborová třída dle vyhl. č. 13/2005 Sb.",
            note: "Dva obory řemesla v jedné třídě; součet žáků = 24 (ověřte rozložení vůči realitě).",
          },
        ],
      };

    case "ill_ss_tri_obor_auto":
      return {
        rows: [
          {
            id: 1,
            label: "1. ročník — společná třída (autoservis)",
            educationField: "26-57-H/01",
            studyForm: "denni",
            phmaxMode: "",
            oborCountInClass: "3",
            additionalOborCodes: "23-55-H/02, 23-61-H/01",
            oborStudentCountsRaw: "26-57-H/01:8\n23-55-H/02:8\n23-61-H/01:8",
            averageStudents: "24",
            classCount: "1",
            classType: "tříoborová třída (obory skupiny H)",
            note: "Tři obory v jedné třídě; orientační rovnoměrné rozložení žáků. Slouží k náhledu PHmax a kontrole brules.",
          },
        ],
      };

    case "ill_ss_prijimaci_obory_mix":
      return {
        rows: [
          {
            id: 1,
            label: "18-20-M/01 — Informační technologie",
            educationField: "18-20-M/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "32,75",
            classCount: "4",
            classType: "jednooborová třída, denní, maturitní obor (M)",
            note: "Čtyřletý obor; počty řádově odpovídají typickému členění po ročnících.",
          },
          {
            id: 2,
            label: "65-41-L/01 — Gastronomie",
            educationField: "65-41-L/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "17,75",
            classCount: "4",
            classType: "jednooborová třída, denní, maturitní obor (L)",
            note: "V rejstříku může být název rozšířený (např. gastronomie a hotelnictví) — kód RVP zůstává 65-41-L/01.",
          },
          {
            id: 3,
            label: "64-41-L/51 — Podnikání (nástavbové studium)",
            educationField: "64-41-L/51",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "23",
            classCount: "2",
            classType: "jednooborová třída, denní, nástavba",
          },
          {
            id: 4,
            label: "65-51-H/01 — Kuchař-číšník",
            educationField: "65-51-H/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "29,4",
            classCount: "5",
            classType: "jednooborová třída, denní (H)",
            note: "Zaměření kuchař / číšník se v dokumentaci školy liší názvem; pro výpočet PHmax v aplikaci stačí kód 65-51-H/01.",
          },
          {
            id: 5,
            label: "29-54-H/01 — Cukrář",
            educationField: "29-54-H/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "30,33",
            classCount: "3",
            classType: "jednooborová třída, denní (H)",
          },
          {
            id: 6,
            label: "66-51-H/01 — Prodavač",
            educationField: "66-51-H/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "12,5",
            classCount: "2",
            classType: "jednooborová třída, denní (H)",
          },
        ],
      };

    case "ill_ss_kuchar_cisnik_rvp":
      return {
        rows: [
          {
            id: 1,
            label: "Přijímací řízení — 65-51-H/01, kuchař",
            educationField: "65-51-H/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "26",
            classCount: "1",
            classType: "jednooborová třída, zaměření kuchař",
            note: "Stejný kód 65-51-H/01 jako u číšníka — ilustrace zápisu z přehledu oborů.",
          },
          {
            id: 2,
            label: "Přijímací řízení — 65-51-H/01, číšník",
            educationField: "65-51-H/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "24",
            classCount: "1",
            classType: "jednooborová třída, zaměření číšník",
          },
          {
            id: 3,
            label: "Přijímací řízení — 65-51-H/01 (Kuchař – číšník)",
            educationField: "65-51-H/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "25",
            classCount: "1",
            classType: "jednooborová třída, obecný název oboru",
          },
        ],
      };

    case "ill_ss_srovnani_denni_vecerni":
      return {
        rows: [
          {
            id: 1,
            label: "Autotronik — denní forma",
            educationField: "39-41-L/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "22",
            classCount: "1",
            classType: "jednooborová třída",
            note: "Stejný kód jako řádek níže — pro srovnání koeficientu formy studia.",
          },
          {
            id: 2,
            label: "Autotronik — večerní forma",
            educationField: "39-41-L/01",
            studyForm: "vecerni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "22",
            classCount: "1",
            classType: "jednooborová třída",
          },
        ],
      };

    case "ill_ss_dalkova_jednoobor":
      return {
        rows: [
          {
            id: 1,
            label: "IT — dálkové studium",
            educationField: "18-20-M/01",
            studyForm: "dalkova",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "28",
            classCount: "2",
            classType: "jednooborová třída, dálková forma",
            note: "Ukázka koeficientu u dálkové formy; upravte počty podle evidence.",
          },
        ],
      };

    case "ill_ss_auto_dvoubor_eh":
      return {
        rows: [
          {
            id: 1,
            label: "Společná třída — strojírenské práce (E) + zedník (H)",
            educationField: "23-51-E/01",
            studyForm: "denni",
            phmaxMode: "",
            oborCountInClass: "2",
            additionalOborCodes: "36-67-H/01",
            oborStudentCountsRaw: "23-51-E/01:12\n36-67-H/01:12",
            averageStudents: "24",
            classCount: "1",
            classType: "dvouoborová třída (E + H)",
            note: "Režim PHmax = Automaticky — aplikace zvolí režim pro dva obory (E/H).",
          },
        ],
      };

    case "ill_ss_82_talent_dvouobor":
      return {
        rows: [
          {
            id: 1,
            label: "1. ročník — talentová třída, dva obory skupiny 82",
            educationField: "82-41-M/01",
            studyForm: "denni",
            phmaxMode: "",
            oborCountInClass: "2",
            additionalOborCodes: "82-41-M/02",
            oborStudentCountsRaw: "82-41-M/01:10\n82-41-M/02:10",
            averageStudents: "20",
            classCount: "1",
            classType: "dvouoborová třída, skupina 82",
            isArt82TalentClass: true,
            note: "Zaškrtnutý Talent 82 + dva obory v kmeni 82 — Automaticky → typicky režim „dva obory (82)“.",
          },
        ],
      };

    case "ill_ss_prakticka_skola":
      return {
        rows: [
          {
            id: 1,
            label: "Praktická škola — jednoletá",
            educationField: "78-62-C/01",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "8",
            classCount: "1",
            classType: "jednooborová třída, praktická škola",
            note: "Kód 78-62-C/01 — zvláštní tabulka v metodice; vstup v aplikaci jako u ostatních oborů.",
          },
        ],
      };

    case "ill_ss_sec16_trida":
      return {
        rows: [
          {
            id: 1,
            label: "Třída § 16/9 — ilustrace (gymnázium)",
            educationField: "79-41-K/41",
            studyForm: "denni",
            phmaxMode: "oneObor",
            oborCountInClass: "1",
            averageStudents: "18",
            classCount: "1",
            classType: "třída zřízená podle § 16 odst. 9 školského zákona",
            note: "Metodika stanovuje PHmax/PHAmax pro § 16/9 zvlášť — tento řádek slouží k orientačnímu náhledu; doplňte podle pokynů MŠMT.",
          },
        ],
      };

    default:
      throw new Error(`Neznámý příklad SŠ: ${String(key)}`);
  }
}
