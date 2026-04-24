import React from "react";

type VerdictTone = "ok" | "warning" | "danger" | "neutral";

type NextStepAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
};

type WorkflowStepState = "done" | "active" | "todo";

type WorkflowStep = {
  label: string;
  state: WorkflowStepState;
};

type VerdictNextStepsPanelProps = {
  verdictLabel: string;
  verdictDetail: string;
  tone?: VerdictTone;
  actions: readonly NextStepAction[];
  recommendedStep?: string;
  workflowSteps?: readonly WorkflowStep[];
};

/**
 * Jednoduchý verdikt + další kroky přímo pod hero souhrnem.
 */
export function VerdictNextStepsPanel({
  verdictLabel,
  verdictDetail,
  tone = "neutral",
  actions,
  recommendedStep,
  workflowSteps = [],
}: VerdictNextStepsPanelProps) {
  return (
    <section className={`verdict-panel verdict-panel--${tone}`} aria-label="Verdikt a doporučené další kroky">
      <p className="verdict-panel__title">{verdictLabel}</p>
      <p className="verdict-panel__detail">{verdictDetail}</p>
      {recommendedStep ? (
        <p className="verdict-panel__recommended">
          <strong>Doporučený další krok:</strong> {recommendedStep}
        </p>
      ) : null}
      {workflowSteps.length > 0 ? (
        <ol className="verdict-panel__workflow" aria-label="Postup dalších kroků">
          {workflowSteps.map((step) => (
            <li key={step.label} className={`verdict-panel__workflow-item verdict-panel__workflow-item--${step.state}`}>
              {step.label}
            </li>
          ))}
        </ol>
      ) : null}
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
