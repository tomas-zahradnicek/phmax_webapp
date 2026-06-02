import React from "react";
import { CalculatorFocusToggle } from "../CalculatorFocusToggle";
import { CalculatorGlobalDisplayHint } from "../CalculatorGlobalDisplayHint";
import { CalculatorViewModeToggle } from "../CalculatorViewModeToggle";
import { DisplayDensityToggle } from "../DisplayDensityToggle";
import { GlossaryIconButton } from "../GlossaryIconButton";
import { HeroExpertStrip } from "../HeroExpertStrip";
import { ProductViewPills, type ProductView } from "../ProductViewPills";
import { QuickOnboardingHeroButton } from "../QuickOnboarding";
import type { CalculatorFocusMode } from "../calculator-focus-mode";
import type { DisplayDensity } from "../display-density";
import type { CalculatorMode } from "../config/calculator-config";
import { MODE_CONFIG } from "../config/calculator-config";
import { ZsHeroToolbar, type ZsHeroToolbarProps } from "./ZsHeroToolbar";

export type ZsHeroHeaderProps = {
  heroHeaderRef: React.RefObject<HTMLElement | null>;
  productView: ProductView;
  setProductView: (view: ProductView) => void;
  viewMode: "basic" | "expert";
  setViewMode: (mode: "basic" | "expert") => void;
  displayDensity: DisplayDensity;
  setDisplayDensity: (density: DisplayDensity) => void;
  focusMode: CalculatorFocusMode;
  setFocusMode: (mode: CalculatorFocusMode) => void;
  glossaryTriggerRef: React.RefObject<HTMLButtonElement | null>;
  glossaryOpen: boolean;
  setGlossaryOpen: (open: boolean) => void;
  zsGuideOpen: boolean;
  toggleZsGuideFromHero: () => void;
  zsHelpButtonRef: React.RefObject<HTMLButtonElement | null>;
  zsTabPrimaryLabel: string;
  zsTabPrimaryValue: React.ReactNode;
  totalPhmax: number;
  mode: CalculatorMode;
  incompleteSections: number;
  toolbar: ZsHeroToolbarProps;
};

export function ZsHeroHeader({
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
  zsGuideOpen,
  toggleZsGuideFromHero,
  zsHelpButtonRef,
  zsTabPrimaryLabel,
  zsTabPrimaryValue,
  totalPhmax,
  mode,
  incompleteSections,
  toolbar,
}: ZsHeroHeaderProps) {
  return (
    <header className="hero hero--feature" ref={heroHeaderRef as React.Ref<HTMLElement>}>
      <div className="hero__orb hero__orb--one" />
      <div className="hero__orb hero__orb--two" />

      <div className="hero__pills-row">
        <ProductViewPills productView={productView} setProductView={setProductView} />
        <div className="hero__pills-row-trailing">
          <div className="hero__pills-controls">
            <CalculatorViewModeToggle
              name="zs-view-mode"
              moduleLabel="ZŠ"
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
            <DisplayDensityToggle density={displayDensity} onChange={setDisplayDensity} name="zs-display-density" />
            <CalculatorFocusToggle mode={focusMode} onChange={setFocusMode} />
            <GlossaryIconButton
              ref={glossaryTriggerRef as React.Ref<HTMLButtonElement>}
              className="glossary-icon-btn--hero"
              expanded={glossaryOpen}
              onClick={() => setGlossaryOpen(true)}
            />
            <QuickOnboardingHeroButton
              guideOpen={zsGuideOpen}
              onToggle={toggleZsGuideFromHero}
              buttonRef={zsHelpButtonRef as React.Ref<HTMLButtonElement>}
            />
          </div>
          <CalculatorGlobalDisplayHint />
        </div>
      </div>

      <HeroExpertStrip
        title="PHmax, PHAmax a PHPmax – základní škola"
        kpis={[
          { label: zsTabPrimaryLabel.replace(" celkem", ""), value: zsTabPrimaryValue },
          { label: "PHmax", value: totalPhmax },
          { label: "Režim", value: MODE_CONFIG[mode].label },
          {
            label: "Stav",
            value: incompleteSections > 0 ? `${incompleteSections} nevyplněno` : "Vstupy kompletní",
          },
        ]}
      />

      <div className="grid two hero__grid hero__grid--context">
        <div>
          <p className="hero-zone-label">A. Kontext výpočtu</p>
          <h1 className="hero__title hero__title--zs">PHmax, PHAmax a PHPmax – základní škola</h1>
          <p className="hero__text hero__text--zs">
            Orientační výpočet podle metodiky PHmax, PHAmax a PHPmax pro ZŠ (verze 5 / 2026) a souvisejících
            předpisů. Ukázkové situace a zálohy scénářů jsou v horní liště; podrobnosti k modulům najdete v nápovědě.
          </p>
        </div>
      </div>

      <ZsHeroToolbar {...toolbar} />
    </header>
  );
}
