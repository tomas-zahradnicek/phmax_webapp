/** Plné názvy produktů — zápatí a přístupnost u kompaktních záložek v hero. */
export const PRODUCT_CALCULATOR_TITLES = {
  pv: "Kalkulačka pro předškolní vzdělávání",
  sd: "Kalkulačka pro školní družiny",
  zs: "Kalkulačka pro základní školy",
} as const;

/** Sjednocené texty pro panel akcí (PV, ŠD, ZŠ na úzkém displeji). */
export const HERO_ACTIONS_TRIGGER_LABEL = "Akce, tisk, uložení a export…";
export const HERO_ACTIONS_DRAWER_TITLE = "Akce a export";

/** Upozornění k ukládání v prohlížeči – PV a ŠD (jeden slot). */
export const BROWSER_STORAGE_HINT_SIMPLE =
  "Údaje se ukládají jen v tomto prohlížeči (jedna rozpracovaná situace). Na sdíleném počítači je po práci smažte nebo použijte anonymní režim.";

/** ZŠ: navíc pojmenované zálohy. */
export const BROWSER_STORAGE_HINT_ZS =
  "Údaje se ukládají jen v tomto prohlížeči. Na sdíleném počítači je po práci smažte nebo použijte anonymní režim. U této kalkulačky můžete mít více pojmenovaných záloh v seznamu v panelu akcí.";

/** Krátká poznámka k horizontálnímu posuvu širokých tabulek (ZŠ). */
export const TABLE_SCROLL_HINT =
  "Na užším displeji tabulku posuňte do stran nebo použijte vodorovný posuvník.";

/** Autor aplikace — e-mail a texty do exportů / shrnutí. */
export const APP_AUTHOR_EMAIL = "tomas.zahradnicek.hradec@gmail.com";

/** Řádka pro kopírování shrnutí a textový tisk. */
export const APP_AUTHOR_CREDIT_LINE = `Vytvořil Mgr. Tomáš Zahradníček (${APP_AUTHOR_EMAIL})`;

/** Stejné znění jako v zápatí stránky (bez HTML; pro případné textové výstupy). */
export const APP_AUTHOR_PRINT_FOOTER = `Vytvořil: Mgr. Tomáš Zahradníček [${APP_AUTHOR_EMAIL}]`;

/** Dva řádky na konec CSV a listu „Hodnoty“ v XLSX. */
export const APP_AUTHOR_EXPORT_ROWS: readonly (readonly [string, string | number])[] = [
  ["", ""],
  ["Vytvořil", `Mgr. Tomáš Zahradníček (${APP_AUTHOR_EMAIL})`],
];
