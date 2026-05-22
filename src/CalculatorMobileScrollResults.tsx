import React from "react";
import { createPortal } from "react-dom";
import type { ResultAnchorStat, ResultAnchorTone } from "./ResultAnchorCard";

type CalculatorMobileScrollResultsProps = {
  visible: boolean;
  tone?: ResultAnchorTone;
  primaryLabel: string;
  primaryValue: React.ReactNode;
  stats?: readonly ResultAnchorStat[];
  statusBadge?: string;
};

/** Kompaktní plovoucí souhrn výsledků na mobilu po odscrollování docku. */
export function CalculatorMobileScrollResults({
  visible,
  tone = "neutral",
  primaryLabel,
  primaryValue,
  stats = [],
  statusBadge,
}: CalculatorMobileScrollResultsProps) {
  if (!visible || typeof document === "undefined") return null;

  const panel = (
    <aside
      className={["calculator-mobile-scroll-results", `calculator-mobile-scroll-results--${tone}`].join(" ")}
      role="status"
      aria-live="polite"
      aria-label="Souhrn výsledků při posunu stránky"
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
    </aside>
  );

  return createPortal(panel, document.body);
}
