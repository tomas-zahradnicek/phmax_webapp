import type { ModeKey } from "./phmax-ss-helpers";

/** Metodika SŠ – texty pro UI (odkazy a poznámky; výpočty v `phmax-ss-logic.ts`). */
export const PHMAX_SS_METHODOLOGY_LABEL =
  "Metodika stanovení PHmax a PHAmax pro střední vzdělávání, verze 3 (2026)";

/** Oficiální vstupní stránka MŠMT k metodice SŠ (soubory i popis). */
export const PHMAX_SS_MSMT_PAGE_URL =
  "https://msmt.gov.cz/vzdelavani/skolstvi-v-cr/ekonomika-skolstvi/metodika-vypoctu-phmax-pro-ss-2026";

/** Doplňující metodické doporučení (řazení školy). */
export const PHMAX_SS_RIZENI_SKOLY_URL =
  "https://www.rizeniskoly.cz/metodicke-pokyny/709/metodicke-doporuceni-jednotneho-postupu-pri-vypoctu-phmax-a-phamax-pro-stredni-vzdelavani";

export const PHMAX_SS_LOCAL_DOC_EXAMPLE_NAMES = [
  "Metodika_vypoctu_PHmax_pro_SS_2026_final_verze_3.docx",
] as const;

/** Legislativní vrstva (Markdown v repozitáři) – pravidla mapovaná na NV / vyhlášky / metodiku. */
export const PHMAX_SS_LEGISLATIVE_MD_REL_PATH = "docs/zdroje/phmax_ss_cursor/legislativa_phmax.md";

export const PHMAX_SS_SOURCE_FOLDER_HINT =
  "Lokální kopii metodiky (.docx / .pdf) můžete držet ve složce projektu docs/zdroje (viz docs/zdroje/README.md).";

/** localStorage: volitelné poznámky uživatele u sekce „1. fáze“ SŠ (neovlivňují výpočet). */
export const PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY = "phmax-ss-framework-phase1-notes";

/**
 * První fáze produktu: co z metodiky plyne pro návrh formuláře (vstupy uživatele × výstupy výpočtu).
 * Znění je shrnutí pravidel z metodiky v3/2026 a souvisejících NV; podrobnosti vždy ověřte v plném znění metodiky.
 */
export const PHMAX_SS_FRAMEWORK_FIRST_PHASE = {
  heading: "1. fáze: rámec vstupů a výstupů",
  phase1NotesFieldLabel: "Poznámky k rámci (volitelně)",
  phase1NotesFieldHint: `Vlastní záznamy; nezasahují do výpočtu. Ukládají se jen v tomto prohlížeči (localStorage, klíč ${PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY}).`,
  lead:
    "U středního vzdělávání se podle metodiky pracuje s dílčími jednotkami (typicky třída nebo skupina) zvlášť podle kombinace oboru, formy a typu. PHmax a PHAmax jsou dva oddělené rámce – přebytky z jednoho nelze přelévat do druhého.",
  implementationNote:
    "Sekce 2 eviduje dílčí jednotky (řádky), počítá orientační PHmax z datasetu NV podle zvoleného režimu a formy, kontrolu pravidel pro víceoborové třídy (sloupce Další obory / žáci) a součet PHAmax pro Praktickou školu (kódy 78-62-C/01 a 78-62-C/02, denní forma) podle tabulky z metodiky. Další dílčí výpočty PHAmax dle metodiky mimo PrŠ zatím v aplikaci nejsou.",
  inputs: [
    "Evidence dílčích jednotek výpočtu: vždy zvlášť podle oboru vzdělání, formy a typu třídy (jak metodika vyžaduje rozlišovat).",
    "Údaje pro stanovení povinného minima přímé pedagogické činnosti dle nařízení vlády a metodiky.",
    "Tam, kde metodika ukládá dělení výuky: vstupy k odbornému výcviku a k teoretickým předmětům (počty skupin, hodin apod. podle tabulek v metodice).",
    "U víceoborových tříd rozlišení všeobecných a odborných složek podle pravidel metodiky.",
  ],
  outputs: [
    "PHmax: týdenní rozsah přímé pedagogické činnosti učitelů hrazený ze státního rozpočtu (rámcově NV č. 123/2018 Sb., podrobně metodika).",
    "PHAmax: pouze u Praktické školy jednoleté a dvouleté; samostatný rámec hodin oproti PHmax, bez vzájemného přenosu přebytků.",
    "Navaznost na rozsah přímé výuky a režim asistentů pedagoga podle NV č. 75/2005 Sb., v mezích stanovených metodikou pro SŠ.",
  ],
} as const;

/** Druhá sekce – evidence řádků + orientační PHmax z datasetu; PHAmax pro PrŠ z tabulky metodiky. */
export const PHMAX_SS_UNITS_SECTION = {
  heading: "2. fáze: evidence tříd a skupin",
  /** Krátký souhrn nad rozbalovačem – stejná role jako u 1. fáze. */
  compactLead:
    "Jeden řádek = dílčí jednotka (kód RVP, průměr, třídy, forma). Režim PHmax lze nechat na Automaticky nebo vynutit ručně; u více oborů ve třídě doplňte další obory a volitelně žáky/obor. PHAmax v horním přehledu jen pro PrŠ 78-62-C/01 a 78-62-C/02 v denní formě — jinak plný postup MŠMT.",
  methodologyDetailsSummary: "Rozbalit podrobný popis evidence řádků a úložiště v prohlížeči",
  lead:
    "Každý řádek je jedna dílčí jednotka. „Kód oboru“ = přesný kód z RVP (např. 82-51-L/51). Sloupec „Režim PHmax“ může zůstat Automaticky (výběr podle „Oborů ve třídě“ a příznaku „Talent 82“) nebo režim ručně vynutit. U více oborů v jedné třídě vyplňte „Další obory“ a volitelně „Žáci / obor“ — níže proběhne kontrola pravidel. PHAmax v horním přehledu se pro tuto verzi aplikace počítá jen u Praktické školy (78-62-C/01, 78-62-C/02) v denní formě podle tabulky metodiky; u ostatních oborů použijte plný postup MŠMT.",
  tableCaption: "Dílčí jednotky výpočtu (třída / skupina)",
  colLabel: "Třída / skupina",
  colEducationField: "Kód oboru",
  colAvgStudents: "Průměr žáků",
  colClassCount: "Počet tříd",
  colStudyForm: "Forma studia",
  colPhmaxMode: "Režim PHmax",
  colOborCountInClass: "Oborů ve třídě",
  colArt82Talent: "Talent 82",
  colAdditionalObors: "Další obory (třída)",
  colOborStudentCounts: "Žáci / obor (volitelně)",
  colClassType: "Typ třídy",
  colNote: "Poznámka",
  addRow: "Přidat řádek",
  /** Lišta nad formulářem — odstraní poslední řádek (stejná logika jako u jediného řádku). */
  removeLastRowHeroLabel: "Odstranit poslední řádek",
  removeLastRowHeroTitle:
    "Odstraní poslední řádek v tabulce evidence. Vždy zůstane alespoň jeden řádek; byl-li to poslední vyplněný řádek, vloží se prázdný řádek.",
  removeRow: "Odstranit",
  emptyHint: "Vyplňte kód oboru, průměr žáků a počet tříd – níže se zobrazí orientační PHmax.",
  storageNote: "Řádky se ukládají jen v tomto prohlížeči (localStorage, klíč phmax-ss-units-draft).",
  previewHeading: "Orientační výpočet PHmax (řádek po řádku)",
  previewHint:
    "Řádky bez platného kódu oboru nebo bez kladného průměru a počtu tříd se přeskakují. Chyba u jednoho řádku neblokuje ostatní. Režim „Automaticky“ vybere pásmo podle počtu oborů ve třídě a příznaku talentové 82; jinak lze režim vynutit.",
  brulesHeading: "Kontrola pravidel (více oborů v jedné třídě)",
  brulesHint:
    "Sloupce „Další obory“ a „Žáci / obor“ popisují všechny obory v jedné třídě. Počty ve formátu KÓD:počet (např. 31-41-E/01:14); bez nich se u všech oborů použije „Průměr žáků“ z řádku. Výstup vychází z evaluateBusinessRules – nejde o právní závěr.",
} as const;

/** Prázdná hodnota = automatický výběr (`chooseDefaultMode`). */
export const PHMAX_SS_MODE_OPTIONS: { value: "" | ModeKey; label: string }[] = [
  { value: "", label: "Automaticky" },
  { value: "oneObor", label: "Jednooborově" },
  { value: "twoObory", label: "Dva obory (E/H)" },
  { value: "threeObory", label: "Tři obory (E/H)" },
  { value: "twoObory82", label: "Dva obory (82)" },
  { value: "threePlusObory82", label: "Tři+ obory (82)" },
];

export const PHMAX_SS_UNITS_STORAGE_KEY = "phmax-ss-units-draft";

export const PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY = "phmax-ss-named-snapshots-v1";
export const PHMAX_SS_MAX_NAMED_SNAPSHOTS = 10;

/** Metodické texty a tabulky § 4 / § 16 / PrŠ — sdílený modul kvůli přehledným diffům a stabilnímu buildu. */
export {
  PHMAX_SS_CALCULATION_BRANCH_GUIDE,
  PHMAX_SS_NV123_FORM_COEFFICIENTS,
  PHMAX_SS_PAR16_AVERAGE_PUPILS_GUIDE,
  PHMAX_SS_PRACTICAL_SCHOOL_PHAMAX_TABLE,
  PHMAX_SS_PRACTICAL_SCHOOL_PHMAX_TABLE,
  PHMAX_SS_SECTION4_PHMAX_GUIDE,
} from "./phmax-ss-methodology-guides";
