import React, { useEffect, useRef, useState } from "react";
import { CALCULATOR_WORKSPACE_DOCK_LABEL } from "./calculator-ui-constants";
import { CalculatorMobileScrollResults, CALCULATOR_WORKFLOW_DOCK_ANCHOR_ID, MOBILE_SCROLL_PIN_MS, scrollToWorkflowDock } from "./CalculatorMobileScrollResults";
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
  const mobileFoldSummaryRef = useRef<HTMLElement>(null);
  const [mobileBodyOpen, setMobileBodyOpen] = useState(false);
  const [mobileScrollResultsVisible, setMobileScrollResultsVisible] = useState(false);
  const [mobileScrollPinnedUntil, setMobileScrollPinnedUntil] = useState(0);
  const mobileScrollPinned = mobileScrollPinnedUntil > Date.now();
  const pinTimerRef = useRef<number | null>(null);
  const pinnedUntilRef = useRef(0);
  pinnedUntilRef.current = mobileScrollPinnedUntil;
  const stepsOpen = viewMode === "basic" && workflowSteps.length > 0;
  const actionsOpen = false;
  const stepsSummary = workflowSteps.length > 0 ? workflowStepsSummary(workflowSteps) : null;

  useEffect(() => {
    if (isWideDock) setMobileBodyOpen(true);
  }, [isWideDock]);

  useEffect(() => {
    if (mobileScrollPinnedUntil <= Date.now()) return;
    const remaining = mobileScrollPinnedUntil - Date.now();
    pinTimerRef.current = window.setTimeout(() => {
      setMobileScrollPinnedUntil(0);
      pinTimerRef.current = null;
    }, remaining);
    return () => {
      if (pinTimerRef.current != null) window.clearTimeout(pinTimerRef.current);
    };
  }, [mobileScrollPinnedUntil]);

  useEffect(() => {
    if (isWideDock) {
      setMobileScrollResultsVisible(false);
      return;
    }

    const syncVisibility = () => {
      if (pinnedUntilRef.current > Date.now()) {
        setMobileScrollResultsVisible(true);
        return;
      }
      const summary = mobileFoldSummaryRef.current;
      if (!summary) {
        setMobileScrollResultsVisible(window.scrollY > 200);
        return;
      }
      const rect = summary.getBoundingClientRect();
      const summaryAboveViewport = rect.bottom < 8;
      setMobileScrollResultsVisible(summaryAboveViewport && window.scrollY > 120);
    };

    let observer: IntersectionObserver | null = null;

    const attach = () => {
      syncVisibility();
      const summary = mobileFoldSummaryRef.current;
      if (!summary) return;
      observer?.disconnect();
      observer = new IntersectionObserver(() => syncVisibility(), { root: null, threshold: [0, 1] });
      observer.observe(summary);
    };

    attach();
    const rafId = window.requestAnimationFrame(attach);

    window.addEventListener("scroll", syncVisibility, { passive: true });
    window.addEventListener("resize", syncVisibility, { passive: true });
    return () => {
      window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener("scroll", syncVisibility);
      window.removeEventListener("resize", syncVisibility);
    };
  }, [isWideDock, primaryValue, verdictLabel, mobileBodyOpen, mobileScrollPinnedUntil]);

  const handleMobileScrollActivate = () => {
    scrollToWorkflowDock();
    setMobileBodyOpen(true);
    setMobileScrollPinnedUntil(Date.now() + MOBILE_SCROLL_PIN_MS);
  };

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
    <>
      <CalculatorMobileScrollResults
        visible={mobileScrollResultsVisible || mobileScrollPinned}
        pinned={mobileScrollPinned}
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
