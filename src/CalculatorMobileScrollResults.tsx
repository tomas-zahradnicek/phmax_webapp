import React, { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ResultAnchorStat, ResultAnchorTone } from "./ResultAnchorCard";
import {
  clearMobileResultsHeight,
  publishMobileResultsHeight,
} from "./mobile-scroll-results-layout";

export const CALCULATOR_WORKFLOW_DOCK_ANCHOR_ID = "calculator-workflow-dock-anchor";

const MOBILE_SCROLL_PIN_MS = 5000;
const MOBILE_SUMMARY_CHIP_HEIGHT_PX = 40;

type CalculatorMobileScrollResultsProps = {
  visible: boolean;
  pinned?: boolean;
  compact?: boolean;
  dismissed?: boolean;
  onDismissToggle?: () => void;
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

function useMobileResultsHeight(
  visible: boolean,
  dismissed: boolean,
  targetRef: React.RefObject<HTMLElement | null>,
  deps: readonly unknown[],
): void {
  useEffect(() => {
    if (!visible || typeof document === "undefined") {
      clearMobileResultsHeight();
      return;
    }

    if (dismissed) {
      publishMobileResultsHeight(MOBILE_SUMMARY_CHIP_HEIGHT_PX, true);
      return () => clearMobileResultsHeight();
    }

    const el = targetRef.current;
    if (!el) {
      clearMobileResultsHeight();
      return;
    }

    const sync = () => {
      publishMobileResultsHeight(el.getBoundingClientRect().height, false);
    };

    sync();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    ro?.observe(el);
    window.addEventListener("resize", sync);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", sync);
      clearMobileResultsHeight();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remeasure when panel content changes
  }, [visible, dismissed, targetRef, ...deps]);
}

/** Kompaktní plovoucí souhrn výsledků na mobilu po odscrollování docku. */
export function CalculatorMobileScrollResults({
  visible,
  pinned = false,
  compact = true,
  dismissed = false,
  onDismissToggle,
  tone = "neutral",
  primaryLabel,
  primaryValue,
  stats = [],
  statusBadge,
  onActivate,
}: CalculatorMobileScrollResultsProps) {
  const panelRef = useRef<HTMLElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);

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

  const handleDismissClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onDismissToggle?.();
    },
    [onDismissToggle],
  );

  const handleShowSummaryClick = useCallback(() => {
    onDismissToggle?.();
  }, [onDismissToggle]);

  useMobileResultsHeight(
    visible,
    dismissed,
    dismissed ? chipRef : panelRef,
  [primaryLabel, primaryValue, statusBadge, stats.length, compact, pinned, tone]);

  if (!visible || typeof document === "undefined") return null;

  if (dismissed) {
    const chip = (
      <button
        ref={chipRef}
        type="button"
        className="calculator-mobile-summary-chip"
        aria-label="Zobrazit souhrn výsledků"
        onClick={handleShowSummaryClick}
      >
        Zobrazit souhrn
      </button>
    );
    return createPortal(chip, document.body);
  }

  const hasStats = stats.length > 0;
  const showBody = hasStats || !compact || pinned;
  const statusInHero = compact && !pinned && statusBadge;

  const panel = (
    <aside
      ref={panelRef}
      className={[
        "calculator-mobile-scroll-results",
        "calculator-mobile-scroll-results--interactive",
        pinned ? "calculator-mobile-scroll-results--pinned" : "",
        compact && !pinned ? "calculator-mobile-scroll-results--compact" : "",
        hasStats ? "calculator-mobile-scroll-results--with-stats" : "",
        `calculator-mobile-scroll-results--${tone}`,
      ]
        .filter(Boolean)
        .join(" ")}
      role="button"
      tabIndex={0}
      aria-label="Souhrn výsledků. Klepnutím zobrazíte plný souhrn nahoře."
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
    >
      <div className="calculator-mobile-scroll-results__toolbar">
        {onDismissToggle ? (
          <button
            type="button"
            className="calculator-mobile-scroll-results__dismiss btn btn--sm ghost"
            aria-label="Skrýt souhrn výsledků"
            onClick={handleDismissClick}
          >
            Skrýt souhrn
          </button>
        ) : null}
      </div>
      <div
        className="calculator-mobile-scroll-results__hero"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <p className="calculator-mobile-scroll-results__value">{primaryValue}</p>
        <p className="calculator-mobile-scroll-results__label">{primaryLabel}</p>
        {statusInHero ? (
          <p className={`calculator-mobile-scroll-results__status calculator-mobile-scroll-results__status--${tone}`}>
            {statusBadge}
          </p>
        ) : null}
      </div>
      {showBody ? (
        <div className="calculator-mobile-scroll-results__body">
          {statusBadge && !statusInHero ? (
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
        </div>
      ) : null}
      <p className="calculator-mobile-scroll-results__tap-hint">
        {pinned ? "Souhrn připnut – klepnutím zobrazíte dock nahoře" : "Klepnutím zobrazíte souhrn nahoře"}
      </p>
    </aside>
  );

  return createPortal(panel, document.body);
}

export { MOBILE_SCROLL_PIN_MS, scrollToWorkflowDock };
