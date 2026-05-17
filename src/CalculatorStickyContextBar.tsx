import React, { useEffect, useState } from "react";
import type { ResultAnchorTone } from "./ResultAnchorCard";

type CalculatorStickyContextBarProps = {
  primaryLabel: string;
  primaryValue: React.ReactNode;
  statusText: string;
  tone?: ResultAnchorTone;
  onSave?: () => void;
  onExport?: () => void;
  saveLabel?: string;
  exportLabel?: string;
  /** Element, po jehož spodní hraně se lišta zobrazí (typicky hero). */
  anchorRef?: React.RefObject<HTMLElement | null>;
  className?: string;
};

/**
 * Při scrollu pod hero zobrazí kompaktní lištu: KPI, stav, uložit, export.
 */
export function CalculatorStickyContextBar({
  primaryLabel,
  primaryValue,
  statusText,
  tone = "neutral",
  onSave,
  onExport,
  saveLabel = "Uložit",
  exportLabel = "Export",
  anchorRef,
  className,
}: CalculatorStickyContextBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const anchor = anchorRef?.current;
    if (!anchor) {
      const onScroll = () => setVisible(window.scrollY > 200);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { root: null, threshold: 0, rootMargin: "-8px 0px 0px 0px" },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorRef]);

  if (!visible) return null;

  return (
    <div
      className={["calculator-sticky-context", `calculator-sticky-context--${tone}`, className]
        .filter(Boolean)
        .join(" ")}
      role="region"
      aria-label="Kontext výpočtu při posunu stránky"
    >
      <div className="calculator-sticky-context__kpi">
        <span className="calculator-sticky-context__value">{primaryValue}</span>
        <span className="calculator-sticky-context__label">{primaryLabel}</span>
      </div>
      <p className={`calculator-sticky-context__status calculator-sticky-context__status--${tone}`}>{statusText}</p>
      <div className="calculator-sticky-context__actions">
        {onSave ? (
          <button type="button" className="btn btn--sm btn--light" onClick={onSave}>
            {saveLabel}
          </button>
        ) : null}
        {onExport ? (
          <button type="button" className="btn btn--sm ghost calculator-sticky-context__export" onClick={onExport}>
            {exportLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
