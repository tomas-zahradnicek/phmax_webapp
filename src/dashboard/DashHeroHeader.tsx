import React from "react";
import { CalculatorHeroShell } from "../CalculatorHeroShell";
import type { CalculatorVerdictTone } from "../calculator-verdict-ui";
import type { CalculatorFocusMode } from "../calculator-focus-mode";
import type { CalculatorViewMode } from "../calculator-view-mode";
import type { DisplayDensity } from "../display-density";
import type { ProductView } from "../ProductViewPills";
import { HeroUserGuideTabLink } from "../HeroUserGuideTabLink";
import { DashHeroToolbar, type DashHeroToolbarProps } from "./DashHeroToolbar";

export type DashHeroHeaderProps = {
  productView: ProductView;
  setProductView: (view: ProductView) => void;
  phmaxTotalDisplay: React.ReactNode;
  modulesWithData: number;
  attentionCount: number;
  continueModuleLabel: string;
  statusLabel: string;
  statusTone: CalculatorVerdictTone;
  toolbar: DashHeroToolbarProps;
};

const DASH_VIEW_MODE: CalculatorViewMode = "basic";
const DASH_DISPLAY_DENSITY: DisplayDensity = "comfortable";
const DASH_FOCUS_MODE: CalculatorFocusMode = "off";

export function DashHeroHeader({
  productView,
  setProductView,
  phmaxTotalDisplay,
  modulesWithData,
  attentionCount,
  continueModuleLabel,
  statusLabel,
  statusTone,
  toolbar,
}: DashHeroHeaderProps) {
  return (
    <CalculatorHeroShell
      productView={productView}
      setProductView={setProductView}
      viewMode={DASH_VIEW_MODE}
      setViewMode={() => {}}
      displayDensity={DASH_DISPLAY_DENSITY}
      setDisplayDensity={() => {}}
      focusMode={DASH_FOCUS_MODE}
      setFocusMode={() => {}}
      moduleLabel="Přehled"
      viewModeName="dash-view-mode"
      displayDensityName="dash-display-density"
      title="Ředitelský průvodce"
      showMiniLogo
      showDisplaySettings={false}
      showOwnDataHint={false}
      className="calculator-hero-shell--dash"
      kpis={[
        { label: "PHmax celkem", value: phmaxTotalDisplay, variant: "primary" },
        { label: "Moduly s daty", value: modulesWithData, variant: "secondary" },
        { label: "Poslední práce", value: continueModuleLabel, variant: "secondary" },
        {
          label: "Stav",
          value: statusLabel,
          variant: "status",
          tone: statusTone,
          title: attentionCount > 0 ? `${attentionCount} modulů ke kontrole` : undefined,
        },
      ]}
      tabsAside={<HeroUserGuideTabLink />}
      aboutContent={
        <p className="calculator-hero-shell__about-text">
          Souhrnný přehled všech modulů PHmax v tomto prohlížeči. Pokračujte v modulu, kde jste naposledy pracovali,
          nebo začněte u modulu, který vaše škola provozuje.
        </p>
      }
      toolbar={<DashHeroToolbar {...toolbar} />}
    />
  );
}
