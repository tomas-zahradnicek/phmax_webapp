import React, { useEffect, useRef, useState } from "react";
import { CALCULATOR_WORKSPACE_DOCK_LABEL, RESULT_ANCHOR_INPUT_DRIVEN_BADGE } from "./calculator-ui-constants";
import { CalculatorMobileScrollResults, CALCULATOR_WORKFLOW_DOCK_ANCHOR_ID, MOBILE_SCROLL_PIN_MS, scrollToWorkflowDock } from "./CalculatorMobileScrollResults";
import { OwnDataHint } from "./OwnDataHint";
import { readMobileSummaryDismissed, writeMobileSummaryDismissed } from "./mobile-scroll-results-layout";
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
  /** Zkrácený seznam varování (např. u ZŠ), bez opakování celého banneru. */
  issueSummaries?: readonly string[];
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
  issueSummaries = [],
  workflowSteps = [],
  actions = [],
  viewMode = "basic",
  footer,
  className,
}: CalculatorWorkflowDockProps) {
  const isWideDock = useMatchMedia("(min-width: 1100px)");
  const mobileFoldSummaryRef = useRef<HTMLElement>(null);
  const [mobileBodyOpen, setMobileBodyOpen] = useState(false);
  const [mobileSummaryDismissed, setMobileSummaryDismissed] = useState(readMobileSummaryDismissed);
  const [mobileScrollPinned, setMobileScrollPinned] = useState(false);
  const showMobileScrollResults = !isWideDock;
  const pinTimerRef = useRef<number | null>(null);
  const stepsOpen = viewMode === "basic" && workflowSteps.length > 0;
  const actionsOpen = false;
  const stepsSummary = workflowSteps.length > 0 ? workflowStepsSummary(workflowSteps) : null;

  useEffect(() => {
    if (isWideDock) setMobileBodyOpen(true);
  }, [isWideDock]);

  useEffect(
    () => () => {
      if (pinTimerRef.current != null) window.clearTimeout(pinTimerRef.current);
    },
    [],
  );

  const handleMobileScrollActivate = () => {
    scrollToWorkflowDock();
    setMobileBodyOpen(true);
    if (pinTimerRef.current != null) window.clearTimeout(pinTimerRef.current);
    setMobileScrollPinned(true);
    pinTimerRef.current = window.setTimeout(() => {
      setMobileScrollPinned(false);
      pinTimerRef.current = null;
    }, MOBILE_SCROLL_PIN_MS);
  };

  const toggleMobileSummaryDismissed = () => {
    setMobileSummaryDismissed((prev) => {
      const next = !prev;
      writeMobileSummaryDismissed(next);
      return next;
    });
  };

  const dockBody = (
    <>
      <ResultAnchorCard
        tone={tone}
        primaryLabel={primaryLabel}
        primaryValue={primaryValue}
        inputDrivenBadge={RESULT_ANCHOR_INPUT_DRIVEN_BADGE}
        stats={stats}
        statusBadge={statusBadge}
        verdictLabel={verdictLabel}
        verdictDetail={verdictDetail}
        issueSummaries={issueSummaries}
        omitVerdictLabelWhenSameAsStatus
      />
      <OwnDataHint variant="dock" />
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
    <>
      <CalculatorMobileScrollResults
        visible={showMobileScrollResults}
        pinned={mobileScrollPinned}
        dismissed={mobileSummaryDismissed}
        onDismissToggle={toggleMobileSummaryDismissed}
        compact
        tone={tone}
        primaryLabel={primaryLabel}
        primaryValue={primaryValue}
        stats={stats}
        statusBadge={statusBadge}
        onActivate={handleMobileScrollActivate}
      />
      <div
        id={CALCULATOR_WORKFLOW_DOCK_ANCHOR_ID}
        role="region"
        aria-label={dockTitle}
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
          <summary
            ref={mobileFoldSummaryRef}
            className="workflow-dock__mobile-fold-summary"
            aria-label={`${dockTitle}: ${primaryLabel} ${primaryValue}. ${verdictLabel}. Rozbalit nebo sbalit.`}
          >
            <span className="workflow-dock__mobile-fold-label">{primaryLabel}</span>
            <span className="workflow-dock__mobile-fold-value">{primaryValue}</span>
            <span className="workflow-dock__mobile-fold-hint">{verdictLabel}</span>
          </summary>
          <div className="workflow-dock__mobile-fold-body">{dockBody}</div>
        </details>
      )}
    </div>
    </>
  );
}
