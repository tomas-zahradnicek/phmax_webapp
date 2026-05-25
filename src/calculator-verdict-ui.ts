/** Sdílený text verdiktu pro banner, sticky lištu a dock (jedna formulace). */

export type CalculatorVerdictTone = "ok" | "warning" | "danger" | "neutral";

export type CalculatorVerdictCopy = {
  tone: CalculatorVerdictTone;
  label: string;
  detail: string;
};

export function calculatorInputIssueBannerFromVerdict(
  verdict: CalculatorVerdictCopy,
  onFix?: () => void,
): { label: string; detail: string; onFix?: () => void } {
  return {
    label: verdict.label,
    detail: verdict.detail,
    onFix,
  };
}
