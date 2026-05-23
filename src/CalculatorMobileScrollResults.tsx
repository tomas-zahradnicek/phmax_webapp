import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ResultAnchorStat, ResultAnchorTone } from "./ResultAnchorCard";

export const CALCULATOR_WORKFLOW_DOCK_ANCHOR_ID = "calculator-workflow-dock-anchor";

const MOBILE_SCROLL_PIN_MS = 5000;

type CalculatorMobileScrollResultsProps = {
  visible: boolean;
  pinned?: boolean;
  tone?: ResultAnchorTone;
  primaryLabel: string;
  primaryValue: React.ReactNode;
  stats?: readonly ResultAnchorStat[];
  statusBadge?: string;
  onActivate?: () => void;
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
  pinned = false,
  tone = "neutral",
  primaryLabel,
  primaryValue,
  stats = [],
  statusBadge,
  onActivate,
}: CalculatorMobileScrollResultsProps) {
  const handleActivate = useCallback(() => {
    if (onActivate) {
      onActivate();
      return;
    }
    scrollToWorkflowDock();
  }, [onActivate]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleActivate();
      }
    },
    [handleActivate],
  );

  if (!visible || typeof document === "undefined") return null;

  const panel = (
    <aside
      className={[
        "calculator-mobile-scroll-results",
        "calculator-mobile-scroll-results--interactive",
        pinned ? "calculator-mobile-scroll-results--pinned" : "",
        `calculator-mobile-scroll-results--${tone}`,
      ]
        .filter(Boolean)
        .join(" ")}
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
      <p className="calculator-mobile-scroll-results__tap-hint">
        {pinned ? "Souhrn připnut – klepnutím zobrazíte dock nahoře" : "Klepnutím zobrazíte souhrn nahoře"}
      </p>
    </aside>
  );

  return createPortal(panel, document.body);
}

export { MOBILE_SCROLL_PIN_MS, scrollToWorkflowDock };
