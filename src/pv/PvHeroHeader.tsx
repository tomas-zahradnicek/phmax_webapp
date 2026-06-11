import React from "react";
import { GlossaryIconButton } from "../GlossaryIconButton";
import { CalculatorHeroShell } from "../CalculatorHeroShell";
import { QuickOnboardingHeroButton } from "../QuickOnboarding";
import type { CalculatorFocusMode } from "../calculator-focus-mode";
import type { CalculatorViewMode } from "../calculator-view-mode";
import type { DisplayDensity } from "../display-density";
import type { ProductView } from "../ProductViewPills";
import type { CalculatorVerdictTone } from "../calculator-verdict-ui";
import { PV_HERO_EXAMPLE_SELECT_ID } from "../pv-basic-wizard";
import { PvHeroToolbar, type PvHeroToolbarProps } from "./PvHeroToolbar";

export type PvHeroHeaderProps = {
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
  phmaxTotalDisplay: React.ReactNode;
  phaMaxDisplay: React.ReactNode;
  workplaceCount: number;
  verdictLabel: string;
  verdictTone: CalculatorVerdictTone;
  aggregateIncomplete: boolean;
  toolbar: PvHeroToolbarProps;
};

export function PvHeroHeader({
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
  phmaxTotalDisplay,
  phaMaxDisplay,
  workplaceCount,
  verdictLabel,
  verdictTone,
  aggregateIncomplete,
  toolbar,
}: PvHeroHeaderProps) {
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
      moduleLabel="PV"
      viewModeName="pv-view-mode"
      displayDensityName="pv-display-density"
      expertExampleSelectId={PV_HERO_EXAMPLE_SELECT_ID}
      title="PHmax a PHAmax – předškolní vzdělávání"
      titleClassName="hero__title--sd"
      showMiniLogo
      kpis={[
        { label: "PHmax celkem", value: phmaxTotalDisplay, variant: "primary" },
        { label: "PHAmax", value: phaMaxDisplay, variant: "secondary" },
        { label: "Pracoviště", value: workplaceCount, variant: "secondary" },
        { label: "Stav", value: verdictLabel, variant: "status", tone: verdictTone },
      ]}
      aboutContent={
        <p className="calculator-hero-shell__about-text">
          Orientační výpočet podle metodiky PHmax a PHAmax pro předškolní vzdělávání (verze 4, 2026) a{" "}
          <strong>vyhlášky č. 14/2005 Sb.</strong> Podrobnosti k pracovištím, součtům PHmax a výkazům najdete v{" "}
          <strong>nápovědě</strong>.
        </p>
      }
      note={
        aggregateIncomplete ? (
          <p className="calculator-hero-shell__note-text">
            * Součet PHmax nezahrnuje pracoviště s neplatným vstupem – opravte je v tabulce níže.
          </p>
        ) : null
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
      toolbar={
        <PvHeroToolbar {...toolbar} suppressOwnDataHint onOpenRychlyPhmax={onOpenRychlyPhmax} />
      }
    />
  );
}
