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
import {
  PHMAX_SS_METHODOLOGY_LABEL,
  PHMAX_SS_MSMT_PAGE_URL,
  PHMAX_SS_RIZENI_SKOLY_URL,
} from "./phmax-ss-constants";
import { SS_HERO_EXAMPLE_SELECT_ID } from "../ss-basic-wizard";
import { SsHeroToolbar, type SsHeroToolbarProps } from "./SsHeroToolbar";

export type SsHeroHeaderProps = {
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
  phmaxHeroValue: string;
  phamaxHeroValue: string;
  rowCount: number;
  verdictLabel: string;
  toolbar: SsHeroToolbarProps;
};

export function SsHeroHeader({
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
  phmaxHeroValue,
  phamaxHeroValue,
  rowCount,
  verdictLabel,
  toolbar,
}: SsHeroHeaderProps) {
  return (
    <header className="hero hero--feature" ref={heroHeaderRef as React.Ref<HTMLElement>}>
      <div className="hero__orb hero__orb--one" />
      <div className="hero__orb hero__orb--two" />

      <div className="hero__pills-row">
        <ProductViewPills productView={productView} setProductView={setProductView} />
        <CalculatorHeroDisplayControls
          moduleLabel="SŠ"
          viewModeName="ss-view-mode"
          viewMode={viewMode}
          setViewMode={setViewMode}
          displayDensityName="ss-display-density"
          displayDensity={displayDensity}
          setDisplayDensity={setDisplayDensity}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
          expertExampleSelectId={SS_HERO_EXAMPLE_SELECT_ID}
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
        title="PHmax a PHAmax – střední školy"
        kpis={[
          { label: "PHmax", value: phmaxHeroValue },
          { label: "PHAmax PrŠ", value: phamaxHeroValue },
          { label: "Řádky", value: rowCount },
          { label: "Stav", value: verdictLabel },
        ]}
      />

      <div className="hero__grid dash-hero-brand hero__grid--context">
        <HeroBrandLogoButton productView={productView} setProductView={setProductView} />
        <div className="dash-hero-brand__copy">
          <p className="hero-zone-label">A. Kontext výpočtu</p>
          <h1 className="hero__title">PHmax a PHAmax – střední školy</h1>
          <p className="hero__text">
            Přehledná kalkulačka pro <strong>střední vzdělávání</strong> podle{" "}
            <a href={PHMAX_SS_MSMT_PAGE_URL} target="_blank" rel="noopener noreferrer" className="status-link">
              {PHMAX_SS_METHODOLOGY_LABEL}
            </a>
            . Doplňující souvislosti:{" "}
            <a href={PHMAX_SS_RIZENI_SKOLY_URL} target="_blank" rel="noopener noreferrer" className="status-link">
              metodické doporučení (ŘŠ)
            </a>
            .
          </p>
        </div>
      </div>

      {viewMode === "expert" ? (
        <p className="hero__note" style={{ marginTop: 10 }}>
          PHAmax mimo PrŠ (78-62-C/01, 78-62-C/02) dopočítejte plným postupem metodiky MŠMT – navazující kroky a tabulky jsou na{" "}
          <a href={PHMAX_SS_MSMT_PAGE_URL} target="_blank" rel="noopener noreferrer" className="status-link">
            stránce metodiky pro SŠ
          </a>
          .
        </p>
      ) : null}

      <SsHeroToolbar {...toolbar} />
    </header>
  );
}
