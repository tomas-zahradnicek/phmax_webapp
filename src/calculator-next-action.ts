import type { CalculatorVerdictCopy, CalculatorVerdictTone } from "./calculator-verdict-ui";

export type CalculatorNextAction = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone: CalculatorVerdictTone;
};

/** Jedna věta „co teď“ – stejný tón jako lead ve školním profilu na Přehledu. */
export function formatWhatNowMessage(issue: string, remedy: string): string {
  return `${issue} → ${remedy}`;
}

export function buildCalculatorNextAction(input: {
  verdict: CalculatorVerdictCopy;
  hasData: boolean;
  incomplete?: boolean;
  incompleteDetail?: string;
  onFix?: () => void;
  onExport?: () => void;
  onOpenExamples?: () => void;
}): CalculatorNextAction {
  const { verdict, hasData, incomplete, incompleteDetail, onFix, onExport, onOpenExamples } = input;

  if (!hasData) {
    return {
      tone: "neutral",
      message: formatWhatNowMessage(
        "Formulář je prázdný",
        onOpenExamples ? "zvolte ukázku v Akcích nahoře nebo vyplňte vlastní údaje" : "začněte vyplněním vstupů níže",
      ),
      actionLabel: onOpenExamples ? "Přejít k ukázkám" : undefined,
      onAction: onOpenExamples,
    };
  }

  if (incomplete) {
    return {
      tone: "warning",
      message:
        incompleteDetail ??
        formatWhatNowMessage("Chybí povinné údaje", "doplňte označená pole – součet může být neúplný"),
      actionLabel: onFix ? "Přejít k chybě" : undefined,
      onAction: onFix,
    };
  }

  if (verdict.tone === "danger" || verdict.tone === "warning") {
    const message =
      verdict.detail && verdict.detail.includes("→")
        ? verdict.detail
        : formatWhatNowMessage(verdict.label, verdict.detail || "doplňte označená pole");
    return {
      tone: verdict.tone,
      message,
      actionLabel: onFix ? "Přejít k chybě" : undefined,
      onAction: onFix,
    };
  }

  if (verdict.tone === "ok" && onExport) {
    return {
      tone: "ok",
      message: formatWhatNowMessage("Vstupy jsou v pořádku", "můžete exportovat nebo pokračovat v úpravách"),
      actionLabel: "Export",
      onAction: onExport,
    };
  }

  return {
    tone: verdict.tone,
    message: verdict.detail || verdict.label,
  };
}
