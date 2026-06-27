import React from "react";
import { CalculatorHeroShell } from "../CalculatorHeroShell";
import { HeroSecondaryNavLinks } from "../HeroSecondaryNavLinks";
import { QuickOnboardingHeroButton } from "../QuickOnboarding";
import type { CalculatorFocusMode } from "../calculator-focus-mode";
import type { CalculatorViewMode } from "../calculator-view-mode";
import type { CalculatorVerdictTone } from "../calculator-verdict-ui";
import type { DisplayDensity } from "../display-density";
import { formatCsHoursPerWeek } from "../cs-format";
import type { ProductView } from "../ProductViewPills";
import { NV75_HERO_EXAMPLE_SELECT_ID } from "../nv75-basic-wizard";
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
  verdictTone: CalculatorVerdictTone;
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
  verdictTone,
  toolbar,
}: Nv75HeroHeaderProps) {
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
      moduleLabel="NV75"
      viewModeName="nv75-view-mode"
      displayDensityName="nv75-display-density"
      expertExampleSelectId={NV75_HERO_EXAMPLE_SELECT_ID}
      title="Kalkulačka banky odpočtů zástupců ředitele"
      showMiniLogo
      tabsAside={<HeroSecondaryNavLinks />}
      kpis={[
        { label: "Banka celkem", value: formatCsHoursPerWeek(bankHoursTotal), variant: "primary" },
        { label: "Řádky", value: rowCount, variant: "secondary" },
        { label: "§4b", value: appliedRule ?? "–", variant: "secondary" },
        { label: "Stav", value: verdictLabel, variant: "status", tone: verdictTone },
      ]}
      aboutContent={
        <p className="calculator-hero-shell__about-text">
          Orientační výpočet banky hodin podle <strong>§4b–§4d NV č. 75/2016 Sb.</strong> V expertním režimu zůstává
          kompaktní lišta akcí; podrobný audit a tabulky jsou níže ve formuláři.
        </p>
      }
      headerActions={
        <QuickOnboardingHeroButton
          guideOpen={guideOpen}
          onToggle={toggleGuide}
          layout="icon"
          buttonRef={helpButtonRef as React.Ref<HTMLButtonElement>}
        />
      }
      toolbar={<Nv75HeroToolbar {...toolbar} suppressOwnDataHint />}
    />
  );
}
