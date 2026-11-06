import type { CalculatorVerdictTone } from "../calculator-verdict-ui";

export const ZS_BAND_HINT_BANNER_LABEL = "Orientační nápověda k vyššímu pásmu";

export function zsInputIssueBannerLabel(input: {
  verdictLabel: string;
  verdictTone: CalculatorVerdictTone;
  firstIssueSection: string;
  bandHintCount: number;
}): string {
  if (input.verdictTone === "ok" && input.firstIssueSection === "" && input.bandHintCount > 0) {
    return ZS_BAND_HINT_BANNER_LABEL;
  }
  return input.verdictLabel;
}

export function zsInputIssueBannerDetail(input: {
  verdictDetail: string;
  verdictTone: CalculatorVerdictTone;
  firstIssueSection: string;
  bandHints: readonly string[];
  visibleItemLabels: readonly string[];
}): string {
  const onlyHint = input.bandHints.length === 1 ? input.bandHints[0] : undefined;
  if (
    input.verdictTone === "ok" &&
    input.firstIssueSection === "" &&
    onlyHint != null &&
    input.visibleItemLabels.length === 1 &&
    input.visibleItemLabels[0] === onlyHint
  ) {
    return onlyHint;
  }
  return input.verdictDetail;
}
