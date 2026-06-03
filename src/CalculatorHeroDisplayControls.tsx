import React, { useId } from "react";
import { CalculatorFocusToggle } from "./CalculatorFocusToggle";
import { CalculatorHintTooltip } from "./CalculatorHintTooltip";
import { CalculatorViewModeToggle } from "./CalculatorViewModeToggle";
import { DisplayDensityToggle } from "./DisplayDensityToggle";
import { CalculatorExpertModeNotice } from "./CalculatorExpertModeNotice";
import {
  CALCULATOR_LAYOUT_HINT_TOOLTIP,
  CALCULATOR_VIEW_MODE_HINT_TOOLTIP,
} from "./calculator-ui-constants";
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
  /** Pro jednorázový banner po přepnutí na Expertní (combobox ukázky). */
  expertExampleSelectId?: string;
};

/** Základní/Expertní a Pohodlné/Kompaktní+Fokus – kompaktní dvě skupiny, popisy v tooltipu. */
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
  expertExampleSelectId,
}: CalculatorHeroDisplayControlsProps) {
  const viewLegendId = useId();
  const layoutLegendId = useId();

  return (
    <div className="hero__pills-row-trailing">
      <div className="calculator-hero-display-controls calculator-hero-display-controls--compact">
        <section
          className="calculator-hero-display-controls__group calculator-hero-display-controls__group--view"
          aria-labelledby={viewLegendId}
        >
          <span id={viewLegendId} className="calculator-hero-display-controls__legend">
            Režim
          </span>
          <CalculatorViewModeToggle
            name={viewModeName}
            moduleLabel={moduleLabel}
            viewMode={viewMode}
            setViewMode={setViewMode}
            compact
            className="calculator-hero-display-controls__view-toggle"
          />
          <CalculatorHintTooltip
            label="Vysvětlení režimu práce"
            text={CALCULATOR_VIEW_MODE_HINT_TOOLTIP}
            firstVisitCoachmark
          />
        </section>

        <div className="calculator-hero-display-controls__divider" role="separator" aria-orientation="vertical" />

        <section
          className="calculator-hero-display-controls__group calculator-hero-display-controls__group--layout"
          aria-labelledby={layoutLegendId}
        >
          <span id={layoutLegendId} className="calculator-hero-display-controls__legend">
            Rozložení
          </span>
          <div className="calculator-hero-display-controls__layout-toggles">
            <DisplayDensityToggle
              density={displayDensity}
              onChange={setDisplayDensity}
              name={displayDensityName}
            />
            <CalculatorFocusToggle mode={focusMode} onChange={setFocusMode} />
          </div>
          <CalculatorHintTooltip label="Vysvětlení rozložení obrazovky" text={CALCULATOR_LAYOUT_HINT_TOOLTIP} />
        </section>

        {trailing ? <div className="calculator-hero-display-controls__actions">{trailing}</div> : null}
      </div>
      <CalculatorExpertModeNotice viewMode={viewMode} exampleSelectId={expertExampleSelectId} />
    </div>
  );
}
