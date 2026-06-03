import type { CalculatorVerdictCopy, CalculatorVerdictTone } from "./calculator-verdict-ui";

export type CalculatorNextAction = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone: CalculatorVerdictTone;
};

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
      message: "Začněte vyplněním formuláře, nebo zvolte volitelnou ukázku v Akcích nahoře.",
      actionLabel: onOpenExamples ? "Přejít k ukázkám" : undefined,
      onAction: onOpenExamples,
    };
  }

  if (incomplete) {
    return {
      tone: "warning",
      message: incompleteDetail ?? "Některé povinné údaje chybí – součet může být neúplný.",
      actionLabel: onFix ? "Přejít k chybě" : undefined,
      onAction: onFix,
    };
  }

  if (verdict.tone === "danger" || verdict.tone === "warning") {
    return {
      tone: verdict.tone,
      message: verdict.detail || verdict.label,
      actionLabel: onFix ? "Přejít k chybě" : undefined,
      onAction: onFix,
    };
  }

  if (verdict.tone === "ok" && onExport) {
    return {
      tone: "ok",
      message: "PHmax je v pořádku – můžete exportovat nebo pokračovat v úpravách.",
      actionLabel: "Export",
      onAction: onExport,
    };
  }

  return {
    tone: verdict.tone,
    message: verdict.detail || verdict.label,
  };
}
