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
import type { CalculatorViewMode } from "../calculator-view-mode";
import type { DisplayDensity } from "../display-density";
import { SdHeroToolbar, type SdHeroToolbarProps } from "./SdHeroToolbar";

export type SdHeroHeaderProps = {
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
  phmaxDisplay: React.ReactNode;
  pupils: number;
  departmentCount: number;
  verdictLabel: string;
  toolbar: SdHeroToolbarProps;
};

export function SdHeroHeader({
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
  phmaxDisplay,
  pupils,
  departmentCount,
  verdictLabel,
  toolbar,
}: SdHeroHeaderProps) {
  return (
    <header className="hero hero--feature" ref={heroHeaderRef as React.Ref<HTMLElement>}>
      <div className="hero__orb hero__orb--one" />
      <div className="hero__orb hero__orb--two" />

      <div className="hero__pills-row">
        <ProductViewPills productView={productView} setProductView={setProductView} />
        <div className="hero__pills-row-trailing">
          <div className="hero__pills-controls">
            <CalculatorViewModeToggle
              name="sd-view-mode"
              moduleLabel="ŠD"
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
            <DisplayDensityToggle density={displayDensity} onChange={setDisplayDensity} name="sd-display-density" />
            <CalculatorFocusToggle mode={focusMode} onChange={setFocusMode} />
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
          </div>
          <CalculatorGlobalDisplayHint />
        </div>
      </div>

      <HeroExpertStrip
        title="PHmax ve školní družině"
        kpis={[
          { label: "PHmax", value: phmaxDisplay },
          { label: "Účastníci", value: pupils },
          { label: "Oddělení", value: departmentCount },
          { label: "Stav", value: verdictLabel },
        ]}
      />

      <div className="grid two hero__grid hero__grid--context">
        <div>
          <p className="hero-zone-label">A. Kontext výpočtu</p>
          <h1 className="hero__title hero__title--sd">PHmax ve školní družině</h1>
          <p className="hero__text hero__text--sd">
            Orientační výpočet podle{" "}
            <strong>vyhlášky č. 74/2005 Sb., o zájmovém vzdělávání</strong> (zejména § 10 a{" "}
            <strong>přílohy s tabulkou</strong> týdenního nejvyššího rozsahu přímé pedagogické činnosti / PHmax podle
            počtu oddělení) a metodických pokynů MŠMT. U „speciálních“ oddělení dle § 16 školského zákona a u méně než
            čtyř oddělení platí další pravidla – vždy vycházejte z úplného znění vyhlášky a metodiky.
          </p>
        </div>
      </div>

      <SdHeroToolbar {...toolbar} />
    </header>
  );
}
