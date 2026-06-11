import React from "react";

import { HeroBrandLogoButton } from "./AppBrandLogo";

import { CalculatorHeroCollapsibleHint } from "./CalculatorHeroCollapsibleHint";

import { CalculatorHeroKpiChips } from "./CalculatorHeroKpiChips";

import { CalculatorHeroSettingsMenu } from "./CalculatorHeroSettingsMenu";

import type { CalculatorFocusMode } from "./calculator-focus-mode";

import type { CalculatorViewMode } from "./calculator-view-mode";

import type { DisplayDensity } from "./display-density";

import type { HeroExpertKpi } from "./HeroExpertStrip";

import { ProductViewPills, type ProductView } from "./ProductViewPills";



export type CalculatorHeroShellProps = {

  heroHeaderRef?: React.RefObject<HTMLElement | null>;

  productView: ProductView;

  setProductView: (view: ProductView) => void;

  viewMode: CalculatorViewMode;

  setViewMode: (mode: CalculatorViewMode) => void;

  displayDensity: DisplayDensity;

  setDisplayDensity: (density: DisplayDensity) => void;

  focusMode: CalculatorFocusMode;

  setFocusMode: (mode: CalculatorFocusMode) => void;

  moduleLabel: string;

  viewModeName: string;

  displayDensityName: string;

  expertExampleSelectId?: string;

  title: string;

  titleClassName?: string;

  kpis: HeroExpertKpi[];

  /** Obsah vpravo vedle záložek modulů (např. Návod k použití na přehledu). */
  tabsAside?: React.ReactNode;

  /** Malé logo vlevo od nadpisu (základní režim). */

  showMiniLogo?: boolean;

  aboutSummary?: string;

  aboutContent?: React.ReactNode;

  note?: React.ReactNode;

  /** Slovníček, nápověda – v tmavé hlavičce vpravo. */

  headerActions?: React.ReactNode;

  showOwnDataHint?: boolean;

  toolbar: React.ReactNode;

  className?: string;

  /** Přehled školy – bez panelu Zobrazení a režimů kalkulačky. */
  showDisplaySettings?: boolean;

};



/**

 * Společný layout hero – profesionální varianta (světlá pracovní plocha).

 *

 * 1. tmavá hlavička: logo + název | Zobrazení + akce

 * 2. světlá plocha: záložky modulů

 * 3. KPI metriky

 * 4. sbalitelný kontext

 * 5. bílá hlavní pracovní karta (toolbar modulu)

 */

export function CalculatorHeroShell({

  heroHeaderRef,

  productView,

  setProductView,

  viewMode,

  setViewMode,

  displayDensity,

  setDisplayDensity,

  focusMode,

  setFocusMode,

  moduleLabel,

  viewModeName,

  displayDensityName,

  expertExampleSelectId,

  title,

  titleClassName,

  kpis,

  tabsAside,

  showMiniLogo = false,

  aboutSummary = "ⓘ O modulu a metodice",

  aboutContent,

  note,

  headerActions,

  showOwnDataHint = true,

  toolbar,

  className,

  showDisplaySettings = true,

}: CalculatorHeroShellProps) {

  const showAbout = (showDisplaySettings ? viewMode === "basic" : true) && aboutContent != null;



  return (

    <header

      className={[

        "hero hero--feature calculator-hero-shell calculator-hero-shell--pro",

        className,

      ]

        .filter(Boolean)

        .join(" ")}

      ref={heroHeaderRef as React.Ref<HTMLElement>}

    >

      <div className="calculator-hero-shell__topbar">

        <div className="calculator-hero-shell__topbar-main">

          {showMiniLogo ? (

            <HeroBrandLogoButton productView={productView} setProductView={setProductView} />

          ) : null}

          <h1 className={["calculator-hero-shell__title", titleClassName].filter(Boolean).join(" ")}>

            {title}

          </h1>

        </div>

        <div className="calculator-hero-shell__topbar-actions">

          {showDisplaySettings ? (
            <CalculatorHeroSettingsMenu
              moduleLabel={moduleLabel}
              viewModeName={viewModeName}
              viewMode={viewMode}
              setViewMode={setViewMode}
              displayDensityName={displayDensityName}
              displayDensity={displayDensity}
              setDisplayDensity={setDisplayDensity}
              focusMode={focusMode}
              setFocusMode={setFocusMode}
              expertExampleSelectId={expertExampleSelectId}
              tone="header"
            />
          ) : null}

          {headerActions}

        </div>

      </div>



      <div className="calculator-hero-shell__workspace">

        <div className="calculator-hero-shell__nav">
          <ProductViewPills productView={productView} setProductView={setProductView} />
          {tabsAside ? <div className="calculator-hero-shell__nav-trailing">{tabsAside}</div> : null}
        </div>

        <CalculatorHeroKpiChips
          kpis={kpis}
          compact={showDisplaySettings && viewMode === "expert"}
          theme="workspace"
        />



        {showAbout ? (

          <details className="calculator-hero-shell__about ux-collapsible ux-collapsible--workspace">

            <summary className="ux-collapsible__summary">{aboutSummary}</summary>

            <div className="ux-collapsible__body calculator-hero-shell__about-body">{aboutContent}</div>

          </details>

        ) : null}



        {note ? <div className="calculator-hero-shell__note">{note}</div> : null}



        {showOwnDataHint ? (

          <CalculatorHeroCollapsibleHint className="calculator-hero-collapsible-hint--workspace" />

        ) : null}



        <div className="calculator-hero-work-card">{toolbar}</div>

      </div>

    </header>

  );

}


