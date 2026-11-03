import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CalculatorFocusMode } from "../calculator-focus-mode";
import type { DisplayDensity } from "../display-density";
import { ZsHeroHeader, type ZsHeroHeaderProps } from "./ZsHeroHeader";
import type { ZsHeroToolbarProps } from "./ZsHeroToolbar";
import { buildZsValidationIssues } from "./zs-form-validation";
import { ZsWorkflowDockPanel } from "./ZsWorkflowDockPanel";
import {
  classifyZsHeaderResults,
  formatZsHeaderMetricValue,
  presentZsHeaderResults,
  type ZsHeaderFacts,
} from "./zs-header-results";
import { zsMobileSummaryReservePx, zsMobileSummaryShouldYield } from "./zs-mobile-summary-yield";

const repoRoot = resolve(__dirname, "../..");

function readSource(relPath: string): string {
  return readFileSync(resolve(repoRoot, relPath), "utf8");
}

const emptyCounts = {
  basic1Classes: 0,
  basic1Pupils: 0,
  basic2Classes: 0,
  basic2Pupils: 0,
  incl1Classes: 0,
  incl2Classes: 0,
  psychRowCount: 0,
  healthRowCount: 0,
  minority1Classes: 0,
  gymRowCount: 0,
  mixedRowCount: 0,
  special1Classes: 0,
  special2Classes: 0,
  specialIIClasses: 0,
  prepClasses: 0,
  prepSpecialClasses: 0,
  phaRowCount: 0,
  phpYear1: 0,
  phpYear2: 0,
  phpYear3: 0,
  phpMethodMode: "three_year_avg",
  phpExcludedSchool: false,
  pha1rClassCount: 0,
  pha1rInvalid: false,
  pha1rSchoolExcluded: false,
} satisfies Omit<ZsHeaderFacts, "tab" | "totalPhmax" | "totalPha" | "totalPhp" | "totalPha1r">;

function facts(overrides: Partial<ZsHeaderFacts> & Pick<ZsHeaderFacts, "tab">): ZsHeaderFacts {
  return {
    totalPhmax: 0,
    totalPha: 0,
    totalPhp: 0,
    totalPha1r: 0,
    ...emptyCounts,
    ...overrides,
  };
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

function kpiTitles(html: string): string[] {
  const marker = 'aria-label="Přehled výsledků"';
  const start = html.indexOf(marker);
  expect(start).toBeGreaterThanOrEqual(0);
  const end = html.indexOf("</ul>", start);
  return [...html.slice(start, end).matchAll(/\btitle="([^"]*)"/g)].map((match) => match[1] ?? "");
}

function renderPanel(viewMode: "basic" | "expert", input: ZsHeaderFacts): string {
  const primaryLabel = input.tab === "phmax" ? "PHmax celkem" : input.tab === "pha" ? "PHAmax celkem" : "PHPmax celkem";
  const primaryValue = input.tab === "phmax" ? input.totalPhmax : input.tab === "pha" ? input.totalPha : input.totalPhp;
  const props: ZsHeroHeaderProps = {
    heroHeaderRef: { current: null },
    productView: "zs",
    setProductView: () => {},
    viewMode,
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
    zsTabPrimaryLabel: primaryLabel,
    zsTabPrimaryValue: primaryValue,
    totalPhmax: input.totalPhmax,
    mode: "phmax_full_zs",
    incompleteSections: 0,
    toolbar,
    headerFacts: input,
  };
  return renderToStaticMarkup(createElement(ZsHeroHeader, props));
}

describe("ZŠ results header states", () => {
  it("A. záložka PHmax má jeden primární PHmax", () => {
    const input = facts({
      tab: "phmax",
      totalPhmax: 934,
      basic1Classes: 10,
      basic1Pupils: 250,
      basic2Classes: 8,
      basic2Pupils: 225,
      incl1Classes: 5,
      incl2Classes: 4,
      totalPha1r: 20,
      pha1rClassCount: 1,
    });
    const titles = kpiTitles(renderPanel("basic", input));
    expect(titles.filter((title) => title.startsWith("PHmax:"))).toEqual(["PHmax: 934 h"]);
    expect(titles).toContain("PHA1Rmax: 20 h");
    expect(titles.join(" ")).not.toContain("954");
  });

  it("B. záložka PHAmax ponechá vlastní PHAmax a odlišný PHmax i při stejné hodnotě", () => {
    const input = facts({
      tab: "pha",
      totalPhmax: 54,
      totalPha: 54,
      basic1Classes: 2,
      basic1Pupils: 40,
      phaRowCount: 1,
    });
    const titles = kpiTitles(renderPanel("basic", input));
    expect(titles.filter((title) => title === "PHAmax: 54 h")).toHaveLength(1);
    expect(titles.filter((title) => title === "PHmax: 54 h")).toHaveLength(1);
  });

  it("C. záložka PHPmax ponechá vlastní PHPmax a odlišný PHmax i při stejné hodnotě", () => {
    const input = facts({
      tab: "php",
      totalPhmax: 54,
      totalPhp: 54,
      basic1Classes: 2,
      basic1Pupils: 40,
      phpYear1: 400,
      phpYear2: 400,
      phpYear3: 400,
    });
    const titles = kpiTitles(renderPanel("basic", input));
    expect(titles.filter((title) => title === "PHPmax: 54 h")).toHaveLength(1);
    expect(titles.filter((title) => title === "PHmax: 54 h")).toHaveLength(1);
  });

  it("D. zákonná nula zůstane 0 h", () => {
    const excluded = classifyZsHeaderResults(
      facts({
        tab: "pha",
        pha1rClassCount: 1,
        pha1rSchoolExcluded: true,
        totalPha1r: 0,
      }),
    );
    expect(excluded.find((item) => item.id === "pha1r")).toMatchObject({ state: "calculated", hours: 0 });
    expect(formatZsHeaderMetricValue(excluded.find((item) => item.id === "pha1r")!)).toBe("0 h");

    const belowBand = classifyZsHeaderResults(
      facts({
        tab: "php",
        phpYear1: 100,
        phpYear2: 100,
        phpYear3: 100,
        totalPhp: 0,
        basic1Classes: 1,
        basic1Pupils: 20,
      }),
    );
    expect(belowBand.find((item) => item.id === "php")).toMatchObject({ state: "calculated", hours: 0 });
  });

  it("E. nezadaný modul se neukáže jako vypočtená nula", () => {
    const result = classifyZsHeaderResults(facts({ tab: "phmax" }));
    expect(result.find((item) => item.id === "phmax")?.state).toBe("not_entered");
    expect(result.find((item) => item.id === "pha")?.state).toBe("not_entered");
    expect(result.find((item) => item.id === "php")?.state).toBe("not_entered");
    expect(result.find((item) => item.id === "pha1r")?.state).toBe("not_entered");
    const html = renderPanel("basic", facts({ tab: "phmax" }));
    expect(html).toContain("Nezadáno");
    expect(kpiTitles(html)).not.toContain("PHmax: 0 h");
  });

  it("F. neplatný vstup se neukáže jako platný výsledek", () => {
    const phmax = classifyZsHeaderResults(
      facts({
        tab: "phmax",
        basic1Classes: 2,
        basic1Pupils: 0,
        totalPhmax: 48,
      }),
    );
    expect(phmax.find((item) => item.id === "phmax")?.state).toBe("invalid");
    expect(formatZsHeaderMetricValue(phmax.find((item) => item.id === "phmax")!)).toBe("Nelze spočítat");

    const php = classifyZsHeaderResults(
      facts({
        tab: "php",
        phpYear1: 200,
        phpYear2: 0,
        phpYear3: 200,
        totalPhp: 12,
        basic1Classes: 1,
        basic1Pupils: 20,
      }),
    );
    expect(php.find((item) => item.id === "php")?.state).toBe("invalid");

    const pha1r = classifyZsHeaderResults(
      facts({
        tab: "pha",
        pha1rClassCount: 1,
        pha1rInvalid: true,
        totalPha1r: 20,
        phaRowCount: 1,
        totalPha: 10,
      }),
    );
    expect(pha1r.find((item) => item.id === "pha1r")?.state).toBe("invalid");
  });

  it("G. nepoužije stav Nevztahuje se bez pravidla ve zdroji", () => {
    const samples = [
      facts({ tab: "phmax" }),
      facts({ tab: "pha", pha1rSchoolExcluded: true, pha1rClassCount: 1 }),
      facts({ tab: "php", phpYear1: 100, phpYear2: 100, phpYear3: 100, basic1Classes: 1, basic1Pupils: 10 }),
    ];
    for (const sample of samples) {
      expect(classifyZsHeaderResults(sample).some((item) => item.state === "not_applicable")).toBe(false);
    }
    expect(formatZsHeaderMetricValue({ id: "php", label: "PHPmax", state: "not_applicable", hours: null })).toBe(
      "Nevztahuje se",
    );
    expect(readSource("src/zs/zs-header-results.ts")).not.toMatch(/phpEligibility/);
  });

  it("H. PHA1Rmax zůstane samostatný údaj", () => {
    const result = classifyZsHeaderResults(
      facts({
        tab: "phmax",
        totalPhmax: 934,
        totalPha1r: 20,
        basic1Classes: 10,
        basic1Pupils: 250,
        pha1rClassCount: 1,
      }),
    );
    const phmax = result.find((item) => item.id === "phmax");
    const pha1r = result.find((item) => item.id === "pha1r");
    expect(phmax).toMatchObject({ state: "calculated", hours: 934 });
    expect(pha1r).toMatchObject({ state: "calculated", hours: 20 });
    expect(phmax?.hours).not.toBe(954);
  });

  it("I. základní a expertní zobrazení mají stejné hodnoty a viditelné popisky", () => {
    const input = facts({
      tab: "phmax",
      totalPhmax: 934,
      basic1Classes: 10,
      basic1Pupils: 250,
    });
    const basic = kpiTitles(renderPanel("basic", input));
    const expertHtml = renderPanel("expert", input);
    const expert = kpiTitles(expertHtml);
    expect(expert).toEqual(basic);
    expect(expertHtml).toContain("calculator-hero-kpi-chips__label");
    expect(expertHtml).not.toContain("calculator-hero-kpi-chips--compact");
    expect(basic.join("|")).toContain("PHmax: 934 h");
  });

  it("J. PV, ŠD, SŠ a NV75 zůstávají beze změny hlavičkových KPI", () => {
    expect(readSource("src/pv/PvHeroHeader.tsx")).toContain(
      '{ label: "PHmax celkem", value: phmaxTotalDisplay, variant: "primary" }',
    );
    expect(readSource("src/sd/SdHeroHeader.tsx")).toContain('{ label: "PHmax", value: phmaxDisplay, variant: "primary" }');
    expect(readSource("src/ss/SsHeroHeader.tsx")).toContain('{ label: "PHmax", value: phmaxHeroValue, variant: "primary" }');
    expect(readSource("src/nv75/Nv75HeroHeader.tsx")).toContain(
      '{ label: "Banka celkem", value: formatCsHoursPerWeek(bankHoursTotal), variant: "primary" }',
    );
    expect(readSource("src/CalculatorHeroKpiChips.tsx")).not.toMatch(/Nezadáno|Nevztahuje se/);
  });

  it("K. prezentace 934 h nemění předaný součet PHmax", () => {
    const result = classifyZsHeaderResults(
      facts({
        tab: "phmax",
        totalPhmax: 934,
        totalPha1r: 20,
        basic1Classes: 10,
        basic1Pupils: 250,
        basic2Classes: 8,
        basic2Pupils: 225,
        incl1Classes: 5,
        incl2Classes: 4,
        pha1rClassCount: 1,
      }),
    );
    expect(result.find((item) => item.id === "phmax")?.hours).toBe(934);
  });

  it("dock a sticky text používá stejné stavy jako hlavička", () => {
    const empty = facts({ tab: "phmax" });
    const presented = presentZsHeaderResults(empty);
    expect(presented.primaryText).toBe("Nezadáno");
    expect(presented.text).toEqual({
      phmax: "Nezadáno",
      pha: "Nezadáno",
      pha1r: "Nezadáno",
      php: "Nezadáno",
    });

    const html = renderToStaticMarkup(
      createElement(ZsWorkflowDockPanel, {
        tab: "phmax",
        setTab: () => {},
        mode: "phmax_full_zs",
        incompleteSections: 1,
        zsTabPrimaryLabel: "PHmax celkem",
        zsTabPrimaryValue: 0,
        totalPhmax: 0,
        totalPha: 0,
        totalPhp: 0,
        totalPha1r: 0,
        zsVerdictTone: "warning",
        zsVerdictLabel: "Na hraně: zadání ještě není kompletní",
        zsVerdictDetail: "Doplňte poslední nevyplněnou část.",
        zsDockIssueSummaries: [],
        zsBasicWizardActive: true,
        zsWorkflowSteps: [],
        viewMode: "basic",
        firstIssueSection: "",
        goToSection: () => {},
        saveSnapshotManually: () => {},
        handleExportCsv: () => {},
        handleCompareZsWithNamedSnapshot: () => {},
        presentedResults: {
          primary: presented.primaryText,
          phmax: presented.text.phmax,
          pha: presented.text.pha,
          php: presented.text.php,
          pha1r: presented.text.pha1r,
        },
      }),
    );
    expect(html).toContain("Nezadáno");
    expect(html).not.toContain(">0<");

    const excluded = presentZsHeaderResults(facts({ tab: "php", phpExcludedSchool: true, totalPhp: 0 }));
    expect(excluded.text.php).toBe("0 h");
    expect(excluded.primaryText).toBe("0 h");
  });

  it("INVALID odpovídá existující validaci a prázdné PHP neznačí jako neplatné", () => {
    const missingPupils = facts({ tab: "phmax", basic1Classes: 2, basic1Pupils: 0, totalPhmax: 48 });
    expect(classifyZsHeaderResults(missingPupils).find((item) => item.id === "phmax")?.state).toBe("invalid");
    expect(buildZsValidationIssues(missingPupils).some((issue) => issue.label.includes("chybí počet žáků"))).toBe(true);

    const emptyPhp = facts({ tab: "php" });
    expect(classifyZsHeaderResults(emptyPhp).find((item) => item.id === "php")?.state).toBe("not_entered");
    expect(buildZsValidationIssues(emptyPhp).map((issue) => issue.section)).toEqual(["php", "php"]);

    const partialPha = facts({ tab: "pha", phaRowCount: 1, totalPha: 0 });
    expect(classifyZsHeaderResults(partialPha).find((item) => item.id === "pha")).toMatchObject({
      state: "calculated",
      hours: 0,
    });
    expect(buildZsValidationIssues(partialPha)).toEqual([]);

    const specialOnly = facts({ tab: "phmax", prepClasses: 1, totalPhmax: 22 });
    expect(classifyZsHeaderResults(specialOnly).find((item) => item.id === "phmax")).toMatchObject({
      state: "calculated",
      hours: 22,
    });
  });

  it("plovoucí souhrn ustoupí, dokud hero zasahuje do jeho pásma", () => {
    expect(zsMobileSummaryShouldYield(624, 844, 260)).toBe(true);
    expect(zsMobileSummaryShouldYield(200, 844, 260)).toBe(false);
    expect(zsMobileSummaryReservePx(844, null)).toBeGreaterThan(320);
    const css = readSource("src/styles.css");
    const rule = "body.zs-mobile-summary-yields .calculator-mobile-scroll-results";
    const at = css.indexOf(rule);
    expect(at).toBeGreaterThan(css.lastIndexOf("@media (max-width: 1099px)", at));
    expect(css.indexOf("@media (min-width: 1100px)", at)).toBeGreaterThan(at);
  });
});
