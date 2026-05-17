export type CalculatorFocusMode = "off" | "on";

const STORAGE_KEY = "phmax-calculator-focus";

export function readCalculatorFocusMode(): CalculatorFocusMode {
  if (typeof window === "undefined") return "off";
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "on" ? "on" : "off";
  } catch {
    return "off";
  }
}

export function writeCalculatorFocusMode(mode: CalculatorFocusMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
