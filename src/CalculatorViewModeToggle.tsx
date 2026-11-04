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
  labels?: { basic: string; expert: string };
  titles?: { basic: string; expert: string };
};

/** Základní / expertní s krátkým vysvětlením aktivního režimu. */
export function CalculatorViewModeToggle({
  name,
  moduleLabel,
  viewMode,
  setViewMode,
  className,
  compact = false,
  labels = { basic: "Základní", expert: "Expertní" },
  titles = { basic: VIEW_MODE_HINT_BASIC, expert: VIEW_MODE_HINT_EXPERT },
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
        <label title={titles.basic}>
          <input type="radio" name={name} checked={viewMode === "basic"} onChange={() => setViewMode("basic")} />
          {labels.basic}
        </label>
        <label title={titles.expert}>
          <input type="radio" name={name} checked={viewMode === "expert"} onChange={() => setViewMode("expert")} />
          {labels.expert}
        </label>
      </div>
      {compact ? null : (
        <p id={hintId} className="calculator-view-mode-toggle__hint" role="note">
          {viewMode === "basic" ? titles.basic : titles.expert}
        </p>
      )}
    </div>
  );
}
