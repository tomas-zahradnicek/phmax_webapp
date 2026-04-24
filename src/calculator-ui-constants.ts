/** Kódy produktů v aplikaci (URL `?view=`, záložky) – jeden zdroj pro typ `ProductView`. */
export const PRODUCT_VIEW_CODES = ["pv", "sd", "zs", "ss"] as const;
export type ProductViewCode = (typeof PRODUCT_VIEW_CODES)[number];

/** Plné názvy produktů – zápatí a přístupnost u kompaktních záložek v hero. */
export const PRODUCT_CALCULATOR_TITLES = {
  pv: "Kalkulačka pro předškolní vzdělávání",
  sd: "Kalkulačka pro školní družiny",
  zs: "Kalkulačka pro základní školy",
  ss: "Kalkulačka pro střední školy",
} as const satisfies Record<ProductViewCode, string>;

/** Sjednocené texty pro panel akcí (PV, ŠD, ZŠ na úzkém displeji). */
export const HERO_ACTIONS_TRIGGER_LABEL = "Akce, tisk, uložení a export…";
export const HERO_ACTIONS_DRAWER_TITLE = "Akce a export";

/** Pod tlačítkem panelu akcí na úzkém displeji (ikony v hero nejsou; nápověda k otevření panelu). */
export const HERO_ACTIONS_NARROW_FOOTER =
  "Tisk, uložení, export a kopírování shrnutí otevřete tlačítkem výše – v panelu uvidíte popisky u každé akce.";

/** Upozornění k ukládání v prohlížeči – PV a ŠD (jeden slot). */
export const BROWSER_STORAGE_HINT_SIMPLE =
  "Údaje se ukládají jen v tomto prohlížeči (jedna rozpracovaná situace). Na sdíleném počítači je po práci smažte nebo použijte anonymní režim.";

/** ZŠ: navíc pojmenované zálohy. */
export const BROWSER_STORAGE_HINT_ZS =
  "Údaje se ukládají jen v tomto prohlížeči. Na sdíleném počítači je po práci smažte nebo použijte anonymní režim. U této kalkulačky můžete mít více pojmenovaných záloh v seznamu v panelu akcí.";

/** Krátká poznámka k horizontálnímu posuvu širokých tabulek (ZŠ, sdílené oblasti). */
export const TABLE_SCROLL_HINT =
  "Na užším displeji tabulku posuňte do stran (posuvník, tažení myší mimo pole a tlačítka, případně Shift + kolečko myši). Když je oblast tabulky aktivní (Tab), posunou ji také šipky vlevo a vpravo.";

/** Věta do nápovědy k exportům – CSV / Excel / shrnutí. */
export const EXPORT_ORIENTACNI_NOTE =
  "Soubory CSV a Excel i text kopírovaného shrnutí obsahují zadané údaje a dopočtené hodnoty z této aplikace; slouží k orientaci a předávání, nejsou náhradou oficiálního výstupu školy nebo zřizovatele.";

/** Legenda k ikonám v horní liště (široké okno = tooltip; úzké = panel s popisky). */
export const HERO_ACTIONS_ICON_LEGEND =
  "Ikony v liště akcí znamenají: tisk stránky, tisk textového shrnutí, rychlé uložení a obnovení stavu v prohlížeči, vymazání jen uložených dat, úplné vymazání formuláře, export CSV, stažení Excelu (.xlsx), kopírování shrnutí do schránky. Na širokém zobrazení najedete myší na ikonu pro krátký popisek; na úzkém displeji otevřete „Akce…“ – u každé akce je plný text.";

/** Doplněk legendy jen u ZŠ (pojmenované zálohy). */
export const HERO_ACTIONS_ICON_LEGEND_ZS_EXTRA =
  " U této kalkulačky jsou v panelu navíc pole pro pojmenované zálohy (název, výběr ze seznamu, obnovení a smazání).";

/** Sjednocená věta do nápověd: co kalkulačka záměrně nedělá. */
export const CALCULATOR_LIMITS_NOTE =
  "Kalkulačka nenahrazuje oficiální vykazování školy ani závazný výstup pro zřizovatele; neřeší plné napojení na výkazové systémy ani všechny individuální výjimky metodiky.";

/** Krátký průvodce pro neodborné uživatele (PV, ŠD, ZŠ) — tři jasné kroky. */
export const LAY_USER_QUICK_START_PV =
  "Rychlý start: (1) Přidejte řádek pro každé pracoviště (nebo kombinaci místo + druh provozu), (2) vyplňte třídy a průměrnou denní dobu, (3) sledujte součet PHmax v přehledu. Krácení dle § 1d/3 a další hraniční případy vždy ověřte v předpisech a metodice.";

export const LAY_USER_QUICK_START_SD =
  "Rychlý start: (1) Zvolte souhrnný nebo detailní režim, (2) zadejte účastníky a oddělení, (3) prohlédněte si PHmax a případné krácení. U § 10 odst. 2 a speciálních oddělení může být potřeba ruční kontrola dle metodiky.";

export const LAY_USER_QUICK_START_ZS =
  "Rychlý start: (1) V horní části zvolte typ školy (režim výpočtu), (2) přepněte záložku PHmax / PHAmax / PHPmax podle toho, co zrovna počítáte, (3) vyplňte tabulky v příslušných sekcích a čtěte souhrn vlevo dole. Moduly se nepropojují do jednoho společného výpočtu — každý má svá pole.";

export const LAY_USER_QUICK_START_SS =
  "Rychlý start: (1) Přidejte řádek pro každou třídu nebo skupinu, kterou počítáte zvlášť, (2) vyplňte kód oboru z RVP, průměr žáků, počet tříd a formu studia, (3) u víceoborové třídy doplňte další obory a podívejte se na blok „Kontrola pravidel“ pod tabulkou. PHAmax v horním přehledu jen pro Praktickou školu (78-62-C/01, 78-62-C/02) v denní formě — ostatní dopočtěte dle metodiky MŠMT.";

/** Jednořádek kontextu v přehledu (PV) — srozumitelná orientace mimo odbornou terminologii. */
export function formatPvLayContextLine(workplaceCount: number, aggregateIncomplete: boolean): string {
  const base = `PV · pracovišť: ${workplaceCount} · orientační součet PHmax`;
  return aggregateIncomplete ? `${base} · část řádků je neúplná nebo neplatná` : base;
}

export function formatSdLayContextLine(inputMode: "summary" | "detail", departmentCount: number): string {
  const mode = inputMode === "summary" ? "souhrnný režim" : "detailní režim po odděleních";
  return `ŠD · ${mode} · oddělení: ${departmentCount} · orientační PHmax`;
}

export function formatZsLayContextLine(
  modeLabel: string,
  tab: "phmax" | "pha" | "php",
  incompleteSections: number,
): string {
  const tabLabel = tab === "phmax" ? "PHmax" : tab === "pha" ? "PHAmax" : "PHPmax";
  const state =
    incompleteSections > 0
      ? incompleteSections === 1
        ? "zbývá doplnit údaje v 1 části"
        : `zbývá doplnit údaje v ${incompleteSections} částech`
      : "hlavní části jsou vyplněné";
  return `Základní škola · ${modeLabel} · aktivní záložka ${tabLabel} · ${state}`;
}

/** Jednořádek kontextu v přehledu (SŠ) — evidence dílčích jednotek. */
export function formatSsLayContextLine(rowCount: number, contributingPhmaxRows: number): string {
  const base = `SŠ · evidence dílčích jednotek · řádků: ${rowCount} · orientační součet PHmax`;
  if (contributingPhmaxRows < rowCount) {
    return `${base} · část řádků zatím nepočítá PHmax (doplňte kód oboru z RVP, průměr žáků a počet tříd, případně opravte chybu na řádku)`;
  }
  return base;
}

/** Obnova / import — JSON nebo záloha nemá očekávanou strukturu (PV, ŠD, SŠ). */
export const MSG_DATA_UNEXPECTED_SHAPE =
  "Data nelze načíst: soubor nebo záloha nemá očekávanou strukturu. Použijte export z této kalkulačky nebo zkontrolujte JSON.";

/** SŠ — audit JSON bez platného řádku tabulky. */
export const MSG_SS_AUDIT_NEEDS_VALID_ROW =
  "Audit nelze stáhnout: v tabulce chybí aspoň jeden kompletní řádek (kód oboru z RVP, průměr žáků, počet tříd).";

/** SŠ — porovnání se zálohou, aktuální stav bez platného PHmax. */
export const MSG_SS_COMPARE_CURRENT_INVALID =
  "Srovnání nelze: v aktuální tabulce není řádek s platným výpočtem PHmax — zkontrolujte kód oboru, průměr žáků a počet tříd.";

/** SŠ — porovnání, záloha bez platných řádků. */
export const MSG_SS_COMPARE_NAMED_INVALID =
  "Srovnání nelze: ve vybrané záloze nejsou uložené platné řádky pro výpočet PHmax.";

/** Pojmenované zálohy — uživatel nevybral položku v seznamu (napříč produkty). */
export const MSG_NAMED_BACKUP_PICK_FIRST =
  "Nejprve v rozevíracím seznamu vyberte pojmenovanou zálohu.";

export const MSG_NAMED_BACKUP_PICK_TO_DELETE =
  "Nejprve v seznamu vyberte zálohu, kterou chcete smazat.";

export const MSG_NAMED_BACKUP_PICK_TO_COMPARE =
  "Nejprve v seznamu vyberte zálohu, kterou chcete porovnat s aktuálním výpočtem.";

/** Obnova rozpracovaného stavu — v úložišti prohlížeče nic není (PV, ŠD, ZŠ). */
export const MSG_NO_LOCAL_AUTOSAVE_DATA =
  "V prohlížeči nejsou žádná uložená rozpracovaná data k obnovení — buď ještě nebyla uložena, nebo je někdo smazal (např. akcí „vymazat uložená data“).";

/** ZŠ — pojmenovaná záloha bez uložených součtů pro JSON srovnání. */
export const MSG_ZS_NAMED_BACKUP_NO_AUDIT_TOTALS =
  "Vybraná záloha neobsahuje uložené součty PHmax / PHAmax / PHPmax pro srovnání. Načtěte ji ve formuláři, přepněte potřebné záložky, nechte spočíst souhrn a uložte znovu jako pojmenovanou zálohu.";

/** Krátké inline validace pro vstupní pole (sjednocené napříč moduly). */
export const INLINE_VALIDATION_MSG_REQUIRED_FIELD =
  "Toto pole je povinné pro výpočet.";
export const INLINE_VALIDATION_MSG_POSITIVE_INTEGER =
  "Zadejte celé číslo alespoň 1.";
export const INLINE_VALIDATION_MSG_POSITIVE_NUMBER =
  "Zadejte číslo větší než 0.";

/** Datum poslední redakční kontroly textů v UI (nikoli datum legislativní účinnosti). */
export const UI_TEXTS_LAST_REVIEW_DATE = "22. 4. 2026";

/** Doplňková nápověda pro chybové hlášky úložiště/exportu. */
export const BROWSER_ERROR_NEXT_STEP_HINT =
  "Zkuste jiný prohlížeč nebo ověřte, že pro tento web není blokované localStorage/stahování souborů.";

/** Sjednocené popisky pro pojmenované zálohy napříč produkty. */
export const NAMED_BACKUPS_NAME_LABEL = "Název zálohy";
export const NAMED_BACKUPS_SAVE_LABEL = "Uložit zálohu";
export const NAMED_BACKUPS_SELECT_PLACEHOLDER = "Vyberte pojmenovanou zálohu…";
export const NAMED_BACKUPS_RESTORE_LABEL = "Obnovit vybranou";
export const NAMED_BACKUPS_DELETE_LABEL = "Smazat vybranou";
export const NAMED_BACKUPS_COMPARE_JSON_LABEL = "Porovnat aktuální stav se zálohou (JSON)…";
export const ADVANCED_AUDIT_GROUP_LABEL = "Pokročilé: audit a srovnání";

/** Jednotný mikrotext pod pojmenovanými zálohami (max + co se ukládá). */
export function namedBackupsMicrocopy(maxCount: number, savedScopeLabel: string): string {
  return `V tomto prohlížeči můžete uložit až ${maxCount} pojmenovaných záloh; ukládá se ${savedScopeLabel}.`;
}

/** Sjednocená notifikace po uložení pojmenované zálohy napříč produkty. */
export function namedBackupSavedNotice(name: string, maxCount: number): string {
  return `Pojmenovaná záloha „${name}“ uložena (max. ${maxCount}).`;
}

/** Autor aplikace – e-mail a texty do exportů / shrnutí. */
export const APP_AUTHOR_EMAIL = "tomas.zahradnicek.hradec@gmail.com";

export const APP_AUTHOR_DISPLAY_NAME = "Mgr. Tomáš Zahradníček";

/** Řádka pro kopírování shrnutí, CSV a čistě textové výstupy (e-mail v závorce). */
export const APP_AUTHOR_CREDIT_LINE = `Vytvořil: ${APP_AUTHOR_DISPLAY_NAME} (${APP_AUTHOR_EMAIL})`;

/** Textová varianta bez HTML (archivní název). */
export const APP_AUTHOR_PRINT_FOOTER = APP_AUTHOR_CREDIT_LINE;

/** Dva řádky na konec CSV a listu „Hodnoty“ v XLSX. */
export const APP_AUTHOR_EXPORT_ROWS: readonly (readonly [string, string | number])[] = [
  ["", ""],
  ["Vytvořil:", `${APP_AUTHOR_DISPLAY_NAME} (${APP_AUTHOR_EMAIL})`],
];
