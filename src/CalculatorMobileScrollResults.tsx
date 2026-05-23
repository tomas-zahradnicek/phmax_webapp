import React, { useCallback } from "react";
import { createPortal } from "react-dom";
import type { ResultAnchorStat, ResultAnchorTone } from "./ResultAnchorCard";

export const CALCULATOR_WORKFLOW_DOCK_ANCHOR_ID = "calculator-workflow-dock-anchor";

type CalculatorMobileScrollResultsProps = {
  visible: boolean;
  tone?: ResultAnchorTone;
  primaryLabel: string;
  primaryValue: React.ReactNode;
  stats?: readonly ResultAnchorStat[];
  statusBadge?: string;
};

function scrollToWorkflowDock(): void {
  const el = document.getElementById(CALCULATOR_WORKFLOW_DOCK_ANCHOR_ID);
  if (el instanceof HTMLElement) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Kompaktní plovoucí souhrn výsledků na mobilu po odscrollování docku. */
export function CalculatorMobileScrollResults({
  visible,
  tone = "neutral",
  primaryLabel,
  primaryValue,
  stats = [],
  statusBadge,
}: CalculatorMobileScrollResultsProps) {
  const handleActivate = useCallback(() => {
    scrollToWorkflowDock();
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      scrollToWorkflowDock();
    }
  }, []);

  if (!visible || typeof document === "undefined") return null;

  const panel = (
    <aside
      className={[
        "calculator-mobile-scroll-results",
        "calculator-mobile-scroll-results--interactive",
        `calculator-mobile-scroll-results--${tone}`,
      ].join(" ")}
      role="button"
      tabIndex={0}
      aria-label="Souhrn výsledků při posunu stránky. Klepnutím zobrazíte plný souhrn nahoře."
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
    >
      <div className="calculator-mobile-scroll-results__head">
        <p className="calculator-mobile-scroll-results__value">{primaryValue}</p>
        <p className="calculator-mobile-scroll-results__label">{primaryLabel}</p>
      </div>
      {statusBadge ? (
        <p className={`calculator-mobile-scroll-results__status calculator-mobile-scroll-results__status--${tone}`}>
          {statusBadge}
        </p>
      ) : null}
      {stats.length > 0 ? (
        <dl className="calculator-mobile-scroll-results__stats">
          {stats.map((stat) => (
            <div key={stat.label} className="calculator-mobile-scroll-results__stat">
              <dt>{stat.label}</dt>
              <dd title={stat.title}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="calculator-mobile-scroll-results__tap-hint">Klepnutím zobrazíte souhrn nahoře</p>
    </aside>
  );

  return createPortal(panel, document.body);
}
