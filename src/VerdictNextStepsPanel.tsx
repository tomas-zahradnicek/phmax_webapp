import React from "react";

type VerdictTone = "ok" | "warning" | "danger" | "neutral";

type NextStepAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
};

type VerdictNextStepsPanelProps = {
  verdictLabel: string;
  verdictDetail: string;
  tone?: VerdictTone;
  actions: readonly NextStepAction[];
};

/**
 * Jednoduchý verdikt + další kroky přímo pod hero souhrnem.
 */
export function VerdictNextStepsPanel({
  verdictLabel,
  verdictDetail,
  tone = "neutral",
  actions,
}: VerdictNextStepsPanelProps) {
  return (
    <section className={`verdict-panel verdict-panel--${tone}`} aria-label="Verdikt a doporučené další kroky">
      <p className="verdict-panel__title">{verdictLabel}</p>
      <p className="verdict-panel__detail">{verdictDetail}</p>
      <div className="verdict-panel__actions" role="group" aria-label="Co dělat dál">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="btn ghost"
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.title}
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
