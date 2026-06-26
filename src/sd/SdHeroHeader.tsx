import React from "react";
import { GlossaryIconButton } from "../GlossaryIconButton";
import { CalculatorHeroShell } from "../CalculatorHeroShell";
import { HeroUserGuideTabLink } from "../HeroUserGuideTabLink";
import { QuickOnboardingHeroButton } from "../QuickOnboarding";
import type { CalculatorFocusMode } from "../calculator-focus-mode";
import type { CalculatorViewMode } from "../calculator-view-mode";
import type { CalculatorVerdictTone } from "../calculator-verdict-ui";
import type { DisplayDensity } from "../display-density";
import type { ProductView } from "../ProductViewPills";
import { SD_HERO_EXAMPLE_SELECT_ID } from "../sd-basic-wizard";
import { SdHeroToolbar, type SdHeroToolbarProps } from "./SdHeroToolbar";

export type SdHeroHeaderProps = {
  heroHeaderRef: React.RefObject<HTMLElement | null>;
  productView: ProductView;
  setProductView: (view: ProductView) => void;
  onOpenRychlyPhmax?: () => void;
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
  verdictTone: CalculatorVerdictTone;
  toolbar: SdHeroToolbarProps;
};

export function SdHeroHeader({
  heroHeaderRef,
  productView,
  setProductView,
  onOpenRychlyPhmax,
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
  verdictTone,
  toolbar,
}: SdHeroHeaderProps) {
  return (
    <CalculatorHeroShell
      heroHeaderRef={heroHeaderRef}
      productView={productView}
      setProductView={setProductView}
      viewMode={viewMode}
      setViewMode={setViewMode}
      displayDensity={displayDensity}
      setDisplayDensity={setDisplayDensity}
      focusMode={focusMode}
      setFocusMode={setFocusMode}
      moduleLabel="ŠD"
      viewModeName="sd-view-mode"
      displayDensityName="sd-display-density"
      expertExampleSelectId={SD_HERO_EXAMPLE_SELECT_ID}
      title="Kalkulačka PHmax školní družiny a model úvazků vychovatele"
      titleClassName="hero__title hero__title--sd"
      showMiniLogo
      tabsAside={<HeroUserGuideTabLink />}
      kpis={[
        { label: "PHmax", value: phmaxDisplay, variant: "primary" },
        { label: "Účastníci", value: pupils, variant: "secondary" },
        { label: "Oddělení", value: departmentCount, variant: "secondary" },
        { label: "Stav", value: verdictLabel, variant: "status", tone: verdictTone },
      ]}
      aboutContent={
        <p className="calculator-hero-shell__about-text">
          Orientační výpočet podle <strong>vyhlášky č. 74/2005 Sb., o zájmovém vzdělávání</strong> (zejména § 10 a{" "}
          <strong>přílohy s tabulkou</strong> týdenního nejvyššího rozsahu přímé pedagogické činnosti / PHmax podle
          počtu oddělení) a metodických pokynů MŠMT. U „speciálních“ oddělení dle § 16 školského zákona a u méně než
          čtyř oddělení platí další pravidla – vždy vycházejte z úplného znění vyhlášky a metodiky.
        </p>
      }
      headerActions={
        <>
          <GlossaryIconButton
            ref={glossaryTriggerRef as React.Ref<HTMLButtonElement>}
            className="glossary-icon-btn--header"
            layout="icon"
            expanded={glossaryOpen}
            onClick={() => setGlossaryOpen(true)}
          />
          <QuickOnboardingHeroButton
            guideOpen={guideOpen}
            onToggle={toggleGuide}
            layout="icon"
            buttonRef={helpButtonRef as React.Ref<HTMLButtonElement>}
          />
        </>
      }
      toolbar={<SdHeroToolbar {...toolbar} suppressOwnDataHint onOpenRychlyPhmax={onOpenRychlyPhmax} />}
    />
  );
}
