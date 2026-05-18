import React, { useEffect, useState } from "react";
import { CALCULATOR_WORKSPACE_DOCK_LABEL } from "./calculator-ui-constants";
import { ResultAnchorCard, type ResultAnchorStat, type ResultAnchorTone } from "./ResultAnchorCard";
import type { CalculatorViewMode } from "./calculator-view-mode";
import { useMatchMedia } from "./useMatchMedia";

export type WorkflowDockStep = {
  label: string;
  state: "done" | "active" | "todo";
};

export type WorkflowDockAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
};

type CalculatorWorkflowDockProps = {
  dockTitle?: string;
  /** Např. záložky PHmax / PHAmax u ZŠ. */
  header?: React.ReactNode;
  tone?: ResultAnchorTone;
  primaryLabel: string;
  primaryValue: React.ReactNode;
  stats?: readonly ResultAnchorStat[];
  statusBadge?: string;
  verdictLabel: string;
  verdictDetail: string;
  workflowSteps?: readonly WorkflowDockStep[];
  actions?: readonly WorkflowDockAction[];
  viewMode?: CalculatorViewMode;
  /** Meta, navigace sekce apod. */
  footer?: React.ReactNode;
  className?: string;
};

function workflowStepsSummary(steps: readonly WorkflowDockStep[]): { title: string; hint: string } {
  const active = steps.find((s) => s.state === "active");
  const done = steps.filter((s) => s.state === "done").length;
  const title = `Checklist (${steps.length})`;
  const hint = active
    ? active.label
    : done === steps.length
      ? "Vše hotovo"
      : `${done}/${steps.length} hotovo`;
  return { title, hint };
}

/**
 * Jednotný pravý dock: KPI, jeden postup, akce v accordionu — bez opakovaných workflow boxů.
 * Na úzkém displeji lze souhrn sbalit; záložky v hlavičce docku zůstávají vždy viditelné.
 */
export function CalculatorWorkflowDock({
  dockTitle = CALCULATOR_WORKSPACE_DOCK_LABEL,
  header,
  tone = "neutral",
  primaryLabel,
  primaryValue,
  stats = [],
  statusBadge,
  verdictLabel,
  verdictDetail,
  workflowSteps = [],
  actions = [],
  viewMode = "basic",
  footer,
  className,
}: CalculatorWorkflowDockProps) {
  const isWideDock = useMatchMedia("(min-width: 1100px)");
  const [mobileBodyOpen, setMobileBodyOpen] = useState(true);
  const stepsOpen = viewMode === "basic" && workflowSteps.length > 0;
  const actionsOpen = false;
  const stepsSummary = workflowSteps.length > 0 ? workflowStepsSummary(workflowSteps) : null;

  useEffect(() => {
    if (isWideDock) setMobileBodyOpen(true);
  }, [isWideDock]);

  const dockBody = (
    <>
      <ResultAnchorCard
        tone={tone}
        primaryLabel={primaryLabel}
        primaryValue={primaryValue}
        stats={stats}
        statusBadge={statusBadge}
        verdictLabel={verdictLabel}
        verdictDetail={verdictDetail}
        omitVerdictLabelWhenSameAsStatus
      />
      {workflowSteps.length > 0 ? (
        <details className="workflow-dock__block workflow-dock__block--steps" open={stepsOpen}>
          <summary className="workflow-dock__summary">
            <span className="workflow-dock__summary-glyph" aria-hidden>
              📋
            </span>
            <span className="workflow-dock__summary-text">
              <span className="workflow-dock__summary-title">{stepsSummary?.title}</span>
              {stepsSummary?.hint ? (
                <span className="workflow-dock__summary-hint">{stepsSummary.hint}</span>
              ) : null}
            </span>
            <span className="workflow-dock__summary-icon" aria-hidden>
              ▶
            </span>
          </summary>
          <ol className="workflow-dock__steps" aria-label="Checklist dalších kroků">
            {workflowSteps.map((step) => (
              <li
                key={step.label}
                className={`workflow-dock__step workflow-dock__step--${step.state}`}
              >
                {step.label}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
      {actions.length > 0 ? (
        <details className="workflow-dock__block workflow-dock__block--actions" open={actionsOpen}>
          <summary className="workflow-dock__summary">
            <span className="workflow-dock__summary-glyph" aria-hidden>
              ⚡
            </span>
            <span className="workflow-dock__summary-text">
              <span className="workflow-dock__summary-title">Akce ({actions.length})</span>
              <span className="workflow-dock__summary-hint">Uložit, export, porovnat</span>
            </span>
            <span className="workflow-dock__summary-icon" aria-hidden>
              ▶
            </span>
          </summary>
          <div className="workflow-dock__actions" role="group" aria-label="Rychlé akce v kontextu výsledku">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="btn ghost btn--sm workflow-dock__action-btn"
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.title}
              >
                {action.label}
              </button>
            ))}
          </div>
        </details>
      ) : null}
      {footer ? <div className="workflow-dock__footer">{footer}</div> : null}
    </>
  );

  return (
    <div
      className={["calculator-workspace-dock__card workflow-dock", `workflow-dock--${tone}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="calculator-workspace-dock__title">{dockTitle}</p>
      {header ? <div className="workflow-dock__header">{header}</div> : null}
      {isWideDock ? (
        dockBody
      ) : (
        <details
          className="workflow-dock__mobile-fold"
          open={mobileBodyOpen}
          onToggle={(e) => setMobileBodyOpen(e.currentTarget.open)}
        >
          <summary className="workflow-dock__mobile-fold-summary">
            <span className="workflow-dock__mobile-fold-label">{primaryLabel}</span>
            <span className="workflow-dock__mobile-fold-value">{primaryValue}</span>
            <span className="workflow-dock__mobile-fold-hint">{verdictLabel}</span>
          </summary>
          <div className="workflow-dock__mobile-fold-body">{dockBody}</div>
        </details>
      )}
    </div>
  );
}
