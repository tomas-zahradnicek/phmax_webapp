import type { CalculatorFocusMode } from "../calculator-focus-mode";
import type { CalculatorViewMode } from "../calculator-view-mode";
import { calculatorShellClassName } from "../calculator-view-mode";
import type { DisplayDensity } from "../display-density";

/** Uživatelské názvy. Interní hodnoty zůstávají `basic` a `expert`. */
export const ZS_DISPLAY_MODE_LABELS = {
  basic: "Průvodce",
  expert: "Všechna pole",
} as const;

export const ZS_DISPLAY_MODE_TITLES = {
  basic:
    "Průvodce vede tímto výpočtem ZŠ krok za krokem. Nezobrazuje kalkulačky PV, ŠD, SŠ ani NV75.",
  expert:
    "Všechna pole otevře vstupní pole aktuálního výpočtu ZŠ najednou: běžné třídy, výjimky, PHAmax, PHA1Rmax a PHPmax. Ostatní kalkulačky se nezobrazují.",
} as const;

export const ZS_DISPLAY_MODE_HINT = `${ZS_DISPLAY_MODE_TITLES.basic}\n\n${ZS_DISPLAY_MODE_TITLES.expert}`;

export const ZS_ALL_FIELDS_NOTICE =
  "Všechna pole: vstupní pole tohoto výpočtu ZŠ jsou najednou. Kalkulačky PV, ŠD, SŠ a NV75 zůstávají samostatně. Ukázku zvolíte v Akcích, nebo rovnou vyplňte formulář.";

/**
 * ZŠ používá jedno rozložení. Uložené `phmax-display-density` a `phmax-calculator-focus`
 * se nečtou do vzhledu a nemění se, protože je dál používají ostatní kalkulačky.
 */
export function zsCalculatorShellClassName(
  viewMode: CalculatorViewMode,
  _storedDensity?: DisplayDensity,
  _storedFocus?: CalculatorFocusMode,
): string {
  return calculatorShellClassName(viewMode, "comfortable", "off");
}
