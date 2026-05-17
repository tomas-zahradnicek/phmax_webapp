import type { DisplayDensity } from "./display-density";
import type { CalculatorFocusMode } from "./calculator-focus-mode";

export type CalculatorViewMode = "basic" | "expert";

export function isExpertViewMode(mode: CalculatorViewMode): boolean {
  return mode === "expert";
}

export function calculatorShellClassName(
  mode: CalculatorViewMode,
  density: DisplayDensity = "comfortable",
  focus: CalculatorFocusMode = "off",
): string {
  const focusClass = focus === "on" ? " calculator-shell--focus" : "";
  return `calculator-shell calculator-shell--${mode} calculator-shell--density-${density}${focusClass}`;
}
