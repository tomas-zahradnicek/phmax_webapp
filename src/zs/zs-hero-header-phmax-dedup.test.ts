import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CalculatorFocusMode } from "../calculator-focus-mode";
import type { DisplayDensity } from "../display-density";
import { ZsHeroHeader, type ZsHeroHeaderProps } from "./ZsHeroHeader";
import type { ZsHeroToolbarProps } from "./ZsHeroToolbar";

const repoRoot = resolve(__dirname, "../..");

function readSource(relPath: string): string {
  return readFileSync(resolve(repoRoot, relPath), "utf8");
}

function kpiTitles(html: string): string[] {
  const marker = 'aria-label="Přehled výsledků"';
  const start = html.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = html.indexOf("</ul>", start);
  const list = html.slice(start, end);
  return [...list.matchAll(/\btitle="([^"]*)"/g)].map((match) => match[1] ?? "");
}

function titlesEqual(titles: readonly string[], expected: string): string[] {
  return titles.filter((title) => title === expected);
}

const toolbar: ZsHeroToolbarProps = {
  selectedExample: "",
  exampleLegend: "Ukázka je volitelná.",
  onExampleChange: () => {},
  onSaveSnapshot: () => {},
  onExportCsv: () => {},
  onExportXlsx: () => {},
  xlsxExportBusy: false,
  onPrintSummary: () => {},
  onRestoreSnapshot: () => {},
  exportLabel: "",
  setExportLabel: () => {},
  namedSaveName: "",
  setNamedSaveName: () => {},
  namedSnapshots: [],
  selectedNamedId: "",
  setSelectedNamedId: () => {},
  onSaveNamedSnapshot: () => {},
  onRestoreNamedSnapshot: () => {},
  onDeleteNamedSnapshot: () => {},
  onCompareWithNamedSnapshot: () => {},
  onExportAuditJson: () => {},
  comparePreview: null,
  onCopySummary: () => {},
  onClearStored: () => {},
  onResetAll: () => {},
};

function renderHeader(options: {
  viewMode: "basic" | "expert";
  primaryLabel: string;
  primaryValue: ReactNode;
  totalPhmax: number;
}): string {
  const props: ZsHeroHeaderProps = {
    heroHeaderRef: { current: null },
    productView: "zs",
    setProductView: () => {},
    viewMode: options.viewMode,
    setViewMode: () => {},
    displayDensity: "comfortable" satisfies DisplayDensity,
    setDisplayDensity: () => {},
    focusMode: "off" satisfies CalculatorFocusMode,
    setFocusMode: () => {},
    glossaryTriggerRef: { current: null },
    glossaryOpen: false,
    setGlossaryOpen: () => {},
    zsGuideOpen: false,
    toggleZsGuideFromHero: () => {},
    zsHelpButtonRef: { current: null },
    zsTabPrimaryLabel: options.primaryLabel,
    zsTabPrimaryValue: options.primaryValue,
    totalPhmax: options.totalPhmax,
    mode: "phmax_full_zs",
    incompleteSections: 0,
    toolbar,
  };
  return renderToStaticMarkup(createElement(ZsHeroHeader, props));
}

describe("ZŠ hero header — jeden PHmax na záložce PHmax", () => {
  it("A. záložka PHmax ukáže jediný primární výsledek PHmax", () => {
    const html = renderHeader({
      viewMode: "basic",
      primaryLabel: "PHmax celkem",
      primaryValue: 54,
      totalPhmax: 54,
    });
    const titles = kpiTitles(html);
    expect(titlesEqual(titles, "PHmax: 54")).toHaveLength(1);
    expect(titles.some((title) => title.startsWith("PHAmax:"))).toBe(false);
    expect(titles.some((title) => title.startsWith("PHPmax:"))).toBe(false);
  });

  it("B. záložka PHAmax ponechá vlastní PHAmax a odlišný PHmax i při stejné hodnotě", () => {
    const html = renderHeader({
      viewMode: "basic",
      primaryLabel: "PHAmax celkem",
      primaryValue: 54,
      totalPhmax: 54,
    });
    const titles = kpiTitles(html);
    expect(titlesEqual(titles, "PHAmax: 54")).toHaveLength(1);
    expect(titlesEqual(titles, "PHmax: 54")).toHaveLength(1);
  });

  it("C. záložka PHPmax ponechá vlastní PHPmax a odlišný PHmax i při stejné hodnotě", () => {
    const html = renderHeader({
      viewMode: "basic",
      primaryLabel: "PHPmax celkem",
      primaryValue: 54,
      totalPhmax: 54,
    });
    const titles = kpiTitles(html);
    expect(titlesEqual(titles, "PHPmax: 54")).toHaveLength(1);
    expect(titlesEqual(titles, "PHmax: 54")).toHaveLength(1);
  });

  it("D. hlavička nepřičítá PHA1Rmax k PHmax", () => {
    const header = readSource("src/zs/ZsHeroHeader.tsx");
    const formula = readSource("src/zs/zs-compute-phmax-total-from-snapshot.ts");
    expect(header).not.toMatch(/totalPhmax\s*\+/);
    expect(header).not.toMatch(/totalPha1r/);
    expect(formula).not.toMatch(/pha1r/i);
    const html = renderHeader({
      viewMode: "basic",
      primaryLabel: "PHmax celkem",
      primaryValue: 54,
      totalPhmax: 54,
    });
    const phmaxTitles = kpiTitles(html).filter((title) => title.startsWith("PHmax:"));
    expect(phmaxTitles.length).toBeGreaterThan(0);
    expect(phmaxTitles.every((title) => title === "PHmax: 54")).toBe(true);
    expect(html).not.toContain("PHmax: 74");
  });

  it("E. základní i expertní zobrazení vykreslí hlavičku a jediný PHmax", () => {
    for (const viewMode of ["basic", "expert"] as const) {
      const html = renderHeader({
        viewMode,
        primaryLabel: "PHmax celkem",
        primaryValue: 54,
        totalPhmax: 54,
      });
      expect(html, viewMode).toContain("Kalkulačka PHmax, PHAmax, PHA1Rmax a PHPmax – základní škola");
      expect(html, viewMode).toContain("Vstupy jsou kompletní");
      expect(html, viewMode).toContain("PHmax – úplná ZŠ");
      expect(kpiTitles(html).filter((title) => title === "PHmax: 54"), viewMode).toHaveLength(1);
      if (viewMode === "expert") {
        expect(html).toContain("calculator-hero-kpi-chips--compact");
      } else {
        expect(html).not.toContain("calculator-hero-kpi-chips--compact");
      }
    }
  });

  it("F. ostatní kalkulačky si ponechají vlastní KPI", () => {
    const pv = readSource("src/pv/PvHeroHeader.tsx");
    const sd = readSource("src/sd/SdHeroHeader.tsx");
    const ss = readSource("src/ss/SsHeroHeader.tsx");
    const nv75 = readSource("src/nv75/Nv75HeroHeader.tsx");
    const chips = readSource("src/CalculatorHeroKpiChips.tsx");

    expect(pv).toContain('{ label: "PHmax celkem", value: phmaxTotalDisplay, variant: "primary" }');
    expect(pv).toContain('{ label: "PHAmax", value: phaMaxDisplay, variant: "secondary" }');
    expect(sd).toContain('{ label: "PHmax", value: phmaxDisplay, variant: "primary" }');
    expect(sd).toContain('{ label: "Účastníci", value: pupils, variant: "secondary" }');
    expect(ss).toContain('{ label: "PHmax", value: phmaxHeroValue, variant: "primary" }');
    expect(ss).toContain('{ label: "PHAmax PrŠ", value: phamaxHeroValue, variant: "secondary" }');
    expect(nv75).toContain('{ label: "Banka celkem", value: formatCsHoursPerWeek(bankHoursTotal), variant: "primary" }');
    expect(chips).not.toMatch(/totalPhmax|PHmax celkem/);
  });
});
