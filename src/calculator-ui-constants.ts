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
