import React from "react";
import { HeroBrandLogoButton } from "../AppBrandLogo";
import { CalculatorHeroDisplayControls } from "../CalculatorHeroDisplayControls";
import { GlossaryIconButton } from "../GlossaryIconButton";
import { HeroExpertStrip } from "../HeroExpertStrip";
import { ProductViewPills, type ProductView } from "../ProductViewPills";
import { QuickOnboardingHeroButton } from "../QuickOnboarding";
import type { CalculatorFocusMode } from "../calculator-focus-mode";
import type { CalculatorViewMode } from "../calculator-view-mode";
import type { DisplayDensity } from "../display-density";
import { PV_HERO_EXAMPLE_SELECT_ID } from "../pv-basic-wizard";
import { PvHeroToolbar, type PvHeroToolbarProps } from "./PvHeroToolbar";

export type PvHeroHeaderProps = {
  heroHeaderRef: React.RefObject<HTMLElement | null>;
  productView: ProductView;
  setProductView: (view: ProductView) => void;
  viewMode: CalculatorViewMode;
  setViewMode: (mode: CalculatorViewMode) => void;
  displayDensity: DisplayDensity;
  setDisplayDensity: (density: DisplayDensity) => void;
  focusMode: CalculatorFocusMode;
  setFocusMode: (mode: CalculatorFocusMode) => void;
  glossaryTriggerRef: React.RefObject<HTMLButtonElement | null>;
  glossaryOpen: boolean;
  setGlossaryOpen: (open: boolean) => void;
  guideOpen: boolean;
  toggleGuide: () => void;
  helpButtonRef: React.RefObject<HTMLButtonElement | null>;
  phmaxTotalDisplay: React.ReactNode;
  phaMaxDisplay: React.ReactNode;
  workplaceCount: number;
  verdictLabel: string;
  aggregateIncomplete: boolean;
  toolbar: PvHeroToolbarProps;
};

export function PvHeroHeader({
  heroHeaderRef,
  productView,
  setProductView,
  viewMode,
  setViewMode,
  displayDensity,
  setDisplayDensity,
  focusMode,
  setFocusMode,
  glossaryTriggerRef,
  glossaryOpen,
  setGlossaryOpen,
  guideOpen,
  toggleGuide,
  helpButtonRef,
  phmaxTotalDisplay,
  phaMaxDisplay,
  workplaceCount,
  verdictLabel,
  aggregateIncomplete,
  toolbar,
}: PvHeroHeaderProps) {
  return (
    <header className="hero hero--feature" ref={heroHeaderRef as React.Ref<HTMLElement>}>
      <div className="hero__orb hero__orb--one" />
      <div className="hero__orb hero__orb--two" />

      <div className="hero__pills-row">
        <ProductViewPills productView={productView} setProductView={setProductView} />
        <CalculatorHeroDisplayControls
          moduleLabel="PV"
          viewModeName="pv-view-mode"
          viewMode={viewMode}
          setViewMode={setViewMode}
          displayDensityName="pv-display-density"
          displayDensity={displayDensity}
          setDisplayDensity={setDisplayDensity}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
          expertExampleSelectId={PV_HERO_EXAMPLE_SELECT_ID}
          trailing={
            <>
              <GlossaryIconButton
                ref={glossaryTriggerRef as React.Ref<HTMLButtonElement>}
                className="glossary-icon-btn--hero"
                expanded={glossaryOpen}
                onClick={() => setGlossaryOpen(true)}
              />
              <QuickOnboardingHeroButton
                guideOpen={guideOpen}
                onToggle={toggleGuide}
                buttonRef={helpButtonRef as React.Ref<HTMLButtonElement>}
              />
            </>
          }
        />
      </div>

      <HeroExpertStrip
        title="PHmax a PHAmax – předškolní vzdělávání"
        kpis={[
          { label: "PHmax celkem", value: phmaxTotalDisplay },
          { label: "PHAmax", value: phaMaxDisplay },
          { label: "Pracoviště", value: workplaceCount },
          { label: "Stav", value: verdictLabel },
        ]}
      />

      <div className="hero__grid dash-hero-brand hero__grid--context">
        <HeroBrandLogoButton productView={productView} setProductView={setProductView} />
        <div className="dash-hero-brand__copy">
          <p className="hero-zone-label">A. Kontext výpočtu</p>
          <h1 className="hero__title hero__title--sd">PHmax a PHAmax – předškolní vzdělávání</h1>
          <p className="hero__text hero__text--sd">
            Orientační výpočet podle metodiky PHmax a PHAmax pro předškolní vzdělávání (verze 4, 2026) a{" "}
            <strong>vyhlášky č. 14/2005 Sb.</strong> Podrobnosti k pracovištím, součtům PHmax a výkazům najdete v{" "}
            <strong>nápovědě</strong>.
          </p>
          {aggregateIncomplete ? (
            <p className="hero__note hero__text--sd" style={{ marginTop: 10 }}>
              * Součet PHmax nezahrnuje pracoviště s neplatným vstupem – opravte je v tabulce níže.
            </p>
          ) : null}
        </div>
      </div>

      <PvHeroToolbar {...toolbar} />
    </header>
  );
}
