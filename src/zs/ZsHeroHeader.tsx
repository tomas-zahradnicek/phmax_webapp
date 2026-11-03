import React from "react";
import { GlossaryIconButton } from "../GlossaryIconButton";
import { CalculatorHeroShell } from "../CalculatorHeroShell";
import { HeroSecondaryNavLinks } from "../HeroSecondaryNavLinks";
import { QuickOnboardingHeroButton } from "../QuickOnboarding";
import type { CalculatorFocusMode } from "../calculator-focus-mode";
import type { CalculatorVerdictTone } from "../calculator-verdict-ui";
import type { DisplayDensity } from "../display-density";
import type { CalculatorMode } from "../config/calculator-config";
import { MODE_CONFIG } from "../config/calculator-config";
import type { ProductView } from "../ProductViewPills";
import { ZS_PHA_HERO_EXAMPLE_SELECT_ID } from "./zs-pha-basic-wizard";
import { shortZsHeroModeLabel } from "./zs-hero-mode-label";
import { ZsHeroToolbar, type ZsHeroToolbarProps } from "./ZsHeroToolbar";
import { classifyZsHeaderResults, formatZsHeaderMetricValue, type ZsHeaderFacts } from "./zs-header-results";

export type ZsHeroHeaderProps = {
  heroHeaderRef: React.RefObject<HTMLElement | null>;
  productView: ProductView;
  setProductView: (view: ProductView) => void;
  onOpenRychlyPhmax?: () => void;
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
  headerFacts?: ZsHeaderFacts;
};

export function ZsHeroHeader({
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
  zsGuideOpen,
  toggleZsGuideFromHero,
  zsHelpButtonRef,
  zsTabPrimaryLabel,
  zsTabPrimaryValue,
  totalPhmax,
  mode,
  incompleteSections,
  toolbar,
  headerFacts,
}: ZsHeroHeaderProps) {
  const modeFullLabel = MODE_CONFIG[mode].label;
  const statusLabel = incompleteSections > 0 ? `${incompleteSections} nevyplněno` : "Vstupy jsou kompletní";
  const statusTone: CalculatorVerdictTone = incompleteSections > 0 ? "warning" : "ok";
  const primaryLabel = zsTabPrimaryLabel.replace(" celkem", "");
  const distinctPhmax =
    primaryLabel === "PHmax"
      ? []
      : [{ label: "PHmax", value: totalPhmax, variant: "secondary" as const }];
  const resultMetrics = headerFacts ? classifyZsHeaderResults(headerFacts) : null;

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
      moduleLabel="ZŠ"
      viewModeName="zs-view-mode"
      displayDensityName="zs-display-density"
      expertExampleSelectId={ZS_PHA_HERO_EXAMPLE_SELECT_ID}
      showKpiLabels={resultMetrics != null}
      title="Kalkulačka PHmax, PHAmax, PHA1Rmax a PHPmax – základní škola"
      titleClassName="hero__title hero__title--sd hero__title--zs"
      showMiniLogo
      tabsAside={<HeroSecondaryNavLinks />}
      kpis={[
        ...(resultMetrics
          ? resultMetrics.map((item, index) => ({
              label: item.label,
              value: formatZsHeaderMetricValue(item),
              variant: index === 0 ? ("primary" as const) : ("secondary" as const),
            }))
          : [
              { label: primaryLabel, value: zsTabPrimaryValue, variant: "primary" as const },
              ...distinctPhmax,
            ]),
        {
          label: "Režim",
          value: shortZsHeroModeLabel(mode),
          variant: "secondary",
          title: modeFullLabel,
        },
        { label: "Stav", value: statusLabel, variant: "status", tone: statusTone },
      ]}
      aboutContent={
        <p className="calculator-hero-shell__about-text">
          Orientační výpočet podle metodiky PHmax, PHAmax, PHA1Rmax a PHPmax pro ZŠ (verze 6 / říjen 2026). Ukázky a zálohy scénářů
          jsou v horní liště; podrobnosti k modulům v nápovědě.
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
            guideOpen={zsGuideOpen}
            onToggle={toggleZsGuideFromHero}
            layout="icon"
            buttonRef={zsHelpButtonRef as React.Ref<HTMLButtonElement>}
          />
        </>
      }
      toolbar={
        <ZsHeroToolbar {...toolbar} suppressOwnDataHint onOpenRychlyPhmax={onOpenRychlyPhmax} />
      }
    />
  );
}
