import React from "react";
import { CalculatorHeroDisplayControls } from "../CalculatorHeroDisplayControls";
import { HeroExpertStrip } from "../HeroExpertStrip";
import { ProductViewPills, type ProductView } from "../ProductViewPills";
import { QuickOnboardingHeroButton } from "../QuickOnboarding";
import type { CalculatorFocusMode } from "../calculator-focus-mode";
import type { CalculatorViewMode } from "../calculator-view-mode";
import type { DisplayDensity } from "../display-density";
import { Nv75HeroToolbar, type Nv75HeroToolbarProps } from "./Nv75HeroToolbar";

export type Nv75HeroHeaderProps = {
  heroHeaderRef: React.RefObject<HTMLElement | null>;
  productView: ProductView;
  setProductView: (view: ProductView) => void;
  viewMode: CalculatorViewMode;
  setViewMode: (mode: CalculatorViewMode) => void;
  displayDensity: DisplayDensity;
  setDisplayDensity: (density: DisplayDensity) => void;
  focusMode: CalculatorFocusMode;
  setFocusMode: (mode: CalculatorFocusMode) => void;
  guideOpen: boolean;
  toggleGuide: () => void;
  helpButtonRef: React.RefObject<HTMLButtonElement | null>;
  bankHoursTotal: number;
  rowCount: number;
  appliedRule: string | null | undefined;
  verdictLabel: string;
  toolbar: Nv75HeroToolbarProps;
};

export function Nv75HeroHeader({
  heroHeaderRef,
  productView,
  setProductView,
  viewMode,
  setViewMode,
  displayDensity,
  setDisplayDensity,
  focusMode,
  setFocusMode,
  guideOpen,
  toggleGuide,
  helpButtonRef,
  bankHoursTotal,
  rowCount,
  appliedRule,
  verdictLabel,
  toolbar,
}: Nv75HeroHeaderProps) {
  return (
    <header className="hero hero--feature" ref={heroHeaderRef as React.Ref<HTMLElement>}>
      <div className="hero__pills-row">
        <ProductViewPills productView={productView} setProductView={setProductView} />
        <CalculatorHeroDisplayControls
          moduleLabel="NV75"
          viewModeName="nv75-view-mode"
          viewMode={viewMode}
          setViewMode={setViewMode}
          displayDensityName="nv75-display-density"
          displayDensity={displayDensity}
          setDisplayDensity={setDisplayDensity}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
          trailing={
            <QuickOnboardingHeroButton
              guideOpen={guideOpen}
              onToggle={toggleGuide}
              buttonRef={helpButtonRef as React.Ref<HTMLButtonElement>}
            />
          }
        />
      </div>

      <HeroExpertStrip
        title="Banka odpočtů – NV č. 75/2016 Sb. (§4b–§4d)"
        kpis={[
          { label: "Banka celkem", value: `${bankHoursTotal} h/týd` },
          { label: "Řádky", value: rowCount },
          { label: "§4b", value: appliedRule ?? "–" },
          { label: "Stav", value: verdictLabel },
        ]}
      />

      <div className="grid two hero__grid hero__grid--context">
        <div>
          <p className="hero-zone-label">A. Kontext výpočtu</p>
          <h1 className="hero__title">Banka odpočtů zástupců ředitele</h1>
          <p className="hero__text">
            Orientační výpočet banky hodin podle <strong>§4b–§4d NV č. 75/2016 Sb.</strong> V expertním režimu zůstává
            kompaktní lišta akcí; podrobný audit a tabulky jsou níže ve formuláři.
          </p>
        </div>
      </div>

      <Nv75HeroToolbar {...toolbar} />
    </header>
  );
}
