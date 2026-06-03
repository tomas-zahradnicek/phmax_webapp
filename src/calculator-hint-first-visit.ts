export const CALCULATOR_HINT_FIRST_VISIT_LS_KEY = "phmax-calculator-hint-first-visit-v1";

export function shouldShowCalculatorHintCoachmark(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(CALCULATOR_HINT_FIRST_VISIT_LS_KEY) !== "1";
}

export function dismissCalculatorHintCoachmark(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CALCULATOR_HINT_FIRST_VISIT_LS_KEY, "1");
}
