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
import {
  PHMAX_SS_METHODOLOGY_LABEL,
  PHMAX_SS_MSMT_DOWNLOAD_URL,
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
  verdictTone: CalculatorVerdictTone;
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
  verdictTone,
  toolbar,
}: SsHeroHeaderProps) {
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
      moduleLabel="SŠ"
      viewModeName="ss-view-mode"
      displayDensityName="ss-display-density"
      expertExampleSelectId={SS_HERO_EXAMPLE_SELECT_ID}
      title="Kalkulačka PHmax a PHAmax – střední školy"
      showMiniLogo
      tabsAside={<HeroUserGuideTabLink />}
      kpis={[
        { label: "PHmax", value: phmaxHeroValue, variant: "primary" },
        { label: "PHAmax PrŠ", value: phamaxHeroValue, variant: "secondary" },
        { label: "Řádky", value: rowCount, variant: "secondary" },
        { label: "Stav", value: verdictLabel, variant: "status", tone: verdictTone },
      ]}
      aboutContent={
        <p className="calculator-hero-shell__about-text">
          Přehledná kalkulačka pro <strong>střední vzdělávání</strong> podle{" "}
          <a href={PHMAX_SS_MSMT_PAGE_URL} target="_blank" rel="noopener noreferrer" className="status-link">
            {PHMAX_SS_METHODOLOGY_LABEL}
          </a>
          {" "}
          (
          <a href={PHMAX_SS_MSMT_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="status-link">
            DOCX ke stažení
          </a>
          ). Doplňující souvislosti:{" "}
          <a href={PHMAX_SS_RIZENI_SKOLY_URL} target="_blank" rel="noopener noreferrer" className="status-link">
            metodické doporučení (ŘŠ)
          </a>
          .
        </p>
      }
      note={
        viewMode === "expert" ? (
          <p className="calculator-hero-shell__note-text">
            PHAmax mimo PrŠ (78-62-C/01, 78-62-C/02) dopočítejte plným postupem metodiky MŠMT – navazující kroky a
            tabulky jsou na{" "}
            <a href={PHMAX_SS_MSMT_PAGE_URL} target="_blank" rel="noopener noreferrer" className="status-link">
              stránce metodiky pro SŠ
            </a>
            .
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
      toolbar={<SsHeroToolbar {...toolbar} suppressOwnDataHint />}
    />
  );
}
