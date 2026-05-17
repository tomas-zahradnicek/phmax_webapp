export type CalculatorViewMode = "basic" | "expert";

export function isExpertViewMode(mode: CalculatorViewMode): boolean {
  return mode === "expert";
}

export function calculatorShellClassName(mode: CalculatorViewMode): string {
  return `calculator-shell calculator-shell--${mode}`;
}
