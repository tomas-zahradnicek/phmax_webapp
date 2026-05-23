/** Spodní mezera plovoucího souhrnu (shodná s CSS u `.calculator-mobile-scroll-results`). */
export const MOBILE_RESULTS_BOTTOM_GAP = "max(12px, 3vh)";

export const MOBILE_RESULTS_HEIGHT_CSS_VAR = "--calculator-mobile-results-height";
export const MOBILE_RESULTS_CHIP_HEIGHT_CSS_VAR = "--calculator-mobile-results-chip-height";

const MOBILE_SUMMARY_DISMISSED_LS_KEY = "phmax-mobile-summary-dismissed";

export function readMobileSummaryDismissed(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(MOBILE_SUMMARY_DISMISSED_LS_KEY) === "1";
}

export function writeMobileSummaryDismissed(dismissed: boolean): void {
  if (typeof sessionStorage === "undefined") return;
  if (dismissed) sessionStorage.setItem(MOBILE_SUMMARY_DISMISSED_LS_KEY, "1");
  else sessionStorage.removeItem(MOBILE_SUMMARY_DISMISSED_LS_KEY);
}

export function publishMobileResultsHeight(heightPx: number, chipOnly = false): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty(MOBILE_RESULTS_HEIGHT_CSS_VAR, `${Math.max(0, Math.round(heightPx))}px`);
  root.style.setProperty(MOBILE_RESULTS_CHIP_HEIGHT_CSS_VAR, chipOnly ? `${Math.max(0, Math.round(heightPx))}px` : "0px");
  root.classList.toggle("calculator-mobile-summary-collapsed", chipOnly && heightPx > 0);
}

export function clearMobileResultsHeight(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.removeProperty(MOBILE_RESULTS_HEIGHT_CSS_VAR);
  root.style.removeProperty(MOBILE_RESULTS_CHIP_HEIGHT_CSS_VAR);
  root.classList.remove("calculator-mobile-summary-collapsed");
}
