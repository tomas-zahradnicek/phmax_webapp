import React, { useId } from "react";
import { CalculatorFocusToggle } from "./CalculatorFocusToggle";
import { CalculatorGlobalDisplayHint } from "./CalculatorGlobalDisplayHint";
import { CalculatorViewModeToggle } from "./CalculatorViewModeToggle";
import { DisplayDensityToggle } from "./DisplayDensityToggle";
import type { CalculatorFocusMode } from "./calculator-focus-mode";
import type { CalculatorViewMode } from "./calculator-view-mode";
import type { DisplayDensity } from "./display-density";

export type CalculatorHeroDisplayControlsProps = {
  moduleLabel: string;
  viewModeName: string;
  viewMode: CalculatorViewMode;
  setViewMode: (mode: CalculatorViewMode) => void;
  displayDensityName: string;
  displayDensity: DisplayDensity;
  setDisplayDensity: (density: DisplayDensity) => void;
  focusMode: CalculatorFocusMode;
  setFocusMode: (mode: CalculatorFocusMode) => void;
  /** Slovník, nápověda – vpravo od skupin přepínačů. */
  trailing?: React.ReactNode;
};

/** Základní/Expertní a Pohodlné/Kompaktní+Fokus – dvě blízké skupiny s vizuálním oddělením. */
export function CalculatorHeroDisplayControls({
  moduleLabel,
  viewModeName,
  viewMode,
  setViewMode,
  displayDensityName,
  displayDensity,
  setDisplayDensity,
  focusMode,
  setFocusMode,
  trailing,
}: CalculatorHeroDisplayControlsProps) {
  const viewLegendId = useId();
  const layoutLegendId = useId();

  return (
    <div className="hero__pills-row-trailing">
      <div className="calculator-hero-display-controls">
        <section
          className="calculator-hero-display-controls__group calculator-hero-display-controls__group--view"
          aria-labelledby={viewLegendId}
        >
          <p id={viewLegendId} className="calculator-hero-display-controls__legend">
            Režim práce
          </p>
          <CalculatorViewModeToggle
            name={viewModeName}
            moduleLabel={moduleLabel}
            viewMode={viewMode}
            setViewMode={setViewMode}
            className="calculator-hero-display-controls__view-toggle"
          />
        </section>

        <div className="calculator-hero-display-controls__divider" role="separator" aria-orientation="vertical" />

        <section
          className="calculator-hero-display-controls__group calculator-hero-display-controls__group--layout"
          aria-labelledby={layoutLegendId}
        >
          <p id={layoutLegendId} className="calculator-hero-display-controls__legend">
            Rozložení obrazovky
          </p>
          <div className="calculator-hero-display-controls__layout-toggles">
            <DisplayDensityToggle
              density={displayDensity}
              onChange={setDisplayDensity}
              name={displayDensityName}
            />
            <CalculatorFocusToggle mode={focusMode} onChange={setFocusMode} />
          </div>
          <CalculatorGlobalDisplayHint className="calculator-hero-display-controls__layout-hint" />
        </section>

        {trailing ? <div className="calculator-hero-display-controls__actions">{trailing}</div> : null}
      </div>
    </div>
  );
}
