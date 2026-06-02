import React from "react";
import { VIEW_MODE_HINT_BASIC, VIEW_MODE_HINT_EXPERT } from "./calculator-ui-constants";
import type { CalculatorViewMode } from "./calculator-view-mode";

type CalculatorViewModeToggleProps = {
  name: string;
  moduleLabel: string;
  viewMode: CalculatorViewMode;
  setViewMode: (mode: CalculatorViewMode) => void;
  className?: string;
  /** Bez odstavce pod přepínačem (popis v tooltipu nad skupinou). */
  compact?: boolean;
};

/** Základní / expertní s krátkým vysvětlením aktivního režimu. */
export function CalculatorViewModeToggle({
  name,
  moduleLabel,
  viewMode,
  setViewMode,
  className,
  compact = false,
}: CalculatorViewModeToggleProps) {
  const hintId = `${name}-view-mode-hint`;
  return (
    <div className={["calculator-view-mode-toggle", compact ? "calculator-view-mode-toggle--compact" : "", className]
      .filter(Boolean)
      .join(" ")}>
      <div
        className="checks"
        role="group"
        aria-label={`Režim zobrazení ${moduleLabel}`}
        aria-describedby={compact ? undefined : hintId}
      >
        <label title={VIEW_MODE_HINT_BASIC}>
          <input type="radio" name={name} checked={viewMode === "basic"} onChange={() => setViewMode("basic")} />
          Základní
        </label>
        <label title={VIEW_MODE_HINT_EXPERT}>
          <input type="radio" name={name} checked={viewMode === "expert"} onChange={() => setViewMode("expert")} />
          Expertní
        </label>
      </div>
      {compact ? null : (
        <p id={hintId} className="calculator-view-mode-toggle__hint" role="note">
          {viewMode === "basic" ? VIEW_MODE_HINT_BASIC : VIEW_MODE_HINT_EXPERT}
        </p>
      )}
    </div>
  );
}
