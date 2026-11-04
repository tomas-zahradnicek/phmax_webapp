import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ZsFormSnapshotSetters } from "./zs-form-snapshot";
import { loadZsHeroExample } from "./zs-hero-example-load";
import { ZsHeroHeader } from "./ZsHeroHeader";
import { ZsHeroToolbar, type ZsHeroToolbarProps } from "./ZsHeroToolbar";
import { ZsWizardShell } from "./ZsWizardShell";
import { clampZsBasicWizardStep } from "../zs-basic-wizard";
import { ZsBasicWizard } from "../ZsBasicWizard";
import { presentZsHeaderResults, type ZsHeaderFacts } from "./zs-header-results";
import { zsWizardOwnsEmptyStart } from "./zs-start-flow";

const repoRoot = resolve(__dirname, "../..");

function readSource(relPath: string): string {
  return readFileSync(resolve(repoRoot, relPath), "utf8");
}

const toolbarProps: ZsHeroToolbarProps = {
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
  onOpenRychlyPhmax: () => {},
};

function renderToolbar(): string {
  return renderToStaticMarkup(createElement(ZsHeroToolbar, toolbarProps));
}

function renderWizard(step: 1 | 2) {
  return renderToStaticMarkup(
    createElement(ZsBasicWizard, {
      step,
      modeLabel: "PHmax – úplná ZŠ",
      hasExceptionModules: true,
      wizardChoice: "",
      wizardOptions: [{ value: "ph_inclusion", label: "Inkluze a § 16/9" }],
      onStartEmptyForm: () => {},
      onWizardChoice: () => {},
      onStepChange: () => {},
      onBack: () => {},
      onNext: () => {},
    }),
  );
}

function primaryButtonLabels(html: string): string[] {
  return [...html.matchAll(/<button\b[^>]*class="[^"]*\bbtn primary\b[^"]*"[^>]*>([\s\S]*?)<\/button>/g)].map((match) =>
    (match[1] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
  );
}

describe("ZŠ jeden začátek výpočtu", () => {
  it("A. nový uživatel má jeden primární další krok a ukázka není druhý začátek", () => {
    const toolbar = renderToolbar();
    const wizard = renderWizard(1);
    const html = `${toolbar}${wizard}`;
    expect(html).not.toContain("Začněte zde");
    expect(html).not.toContain("První spuštění");
    expect(toolbar).toContain("Volitelná ukázka");
    expect(primaryButtonLabels(html)).toEqual(["Další krok"]);
    expect(readSource("src/PhmaxZsPage.tsx")).not.toContain("CalculatorModuleQuickTour");
    expect(zsWizardOwnsEmptyStart("basic", false)).toBe(true);
    expect(zsWizardOwnsEmptyStart("basic", true)).toBe(false);
    expect(zsWizardOwnsEmptyStart("expert", false)).toBe(false);
  });

  it("B–D. krok 1 je ovladatelný, další otevře krok 2 a zpět se vrací", () => {
    const step1 = renderWizard(1);
    expect(step1).toContain("Typ školy");
    expect(step1).toContain("Další krok");
    expect(step1).toContain("disabled");
    expect(step1).toContain(">Zpět<");
    expect(clampZsBasicWizardStep(1 + 1)).toBe(2);

    const step2 = renderWizard(2);
    expect(step2).toContain("Třídy");
    expect(step2).not.toMatch(/<button[^>]*disabled[^>]*>[\s\S]*Zpět/);
    expect(clampZsBasicWizardStep(2 - 1)).toBe(1);
  });

  it("E–F. ukázka zůstává dostupná a načtení příkladu plní třídy", () => {
    const toolbar = renderToolbar();
    expect(toolbar).toContain('id="zs-hero-example-select"');
    expect(toolbar).toContain("Rychlý výpočet");

    const setters = new Proxy({} as ZsFormSnapshotSetters, {
      get(target, prop: string) {
        if (!(prop in target)) {
          (target as Record<string, ReturnType<typeof vi.fn>>)[prop] = vi.fn();
        }
        return (target as Record<string, ReturnType<typeof vi.fn>>)[prop];
      },
    });
    loadZsHeroExample("priloha_uplna_zs_sec16", {
      setters,
      createEmptyGymRow: (id) => ({ id, kind: "gym8", classes: 0, pupils: 0 }),
      createEmptyMixedRow: (id) => ({ id, stage: "first", majority: "zs", classes: 0, pupils: 0 }),
      createEmptyPhaRow: (id) => ({ id, kind: "zs1", classes: 0, pupils: 0 }),
      applyResetPhmax: vi.fn(),
      applyResetPha: vi.fn(),
      applyResetPhp: vi.fn(),
      resetNv75: vi.fn(),
    });
    expect(setters.setBasic1Classes).toHaveBeenCalledWith(10);
    expect(setters.setBasic2Classes).toHaveBeenCalledWith(8);
    expect(clampZsBasicWizardStep(2)).toBe(2);
  });

  it("H. expertní režim neschovává vstupy do druhého průvodce", () => {
    const html = renderToStaticMarkup(
      createElement(ZsWizardShell, {
        zsBasicWizardActive: false,
        zsWizardStep: 1,
        mode: "phmax_full_zs",
        zsWizardHasExceptions: true,
        wizardChoice: "",
        wizardOptions: [],
        showInputIssueFix: false,
        onScrollToIssue: () => {},
        onWizardChoice: () => {},
        onStepChange: () => {},
        onBack: () => {},
        onNext: () => {},
        viewMode: "expert",
        tab: "phmax",
        phaWizardStep: 1,
        onPhaWizardStepChange: () => {},
        onPhaWizardBack: () => {},
        onPhaWizardNext: () => {},
        phpWizardStep: 1,
        onPhpWizardStepChange: () => {},
        onPhpWizardBack: () => {},
        onPhpWizardNext: () => {},
        visibleSections: [],
        hasSection: () => false,
      }),
    );
    expect(html).toBe("");
    const page = readSource("src/PhmaxZsPage.tsx");
    expect(page).toContain("ZsPhmaxTabPanel");
    expect(page).toContain("ZsExpertOnboardingCard");
  });

  it("I. uložení a export zůstávají v liště", () => {
    const toolbar = renderToolbar();
    expect(toolbar).toContain("Uložit průběh");
    expect(toolbar).toContain("Export CSV");
    expect(toolbar).toContain("Export Excel");
  });

  it("J. sdílené styly PV nemění popisek začátku", () => {
    expect(readSource("src/pv/PvHeroToolbar.tsx")).toContain("HERO_EXAMPLE_FIELD_LABEL");
    expect(readSource("src/pv/PvHeroToolbar.tsx")).toContain("btn primary calculator-hero-work-card__quick-btn");
    const css = readSource("src/styles.css");
    expect(css).toContain(".calculator-hero-shell--pro .calculator-hero-work-card__start .hero-pv-example-select");
    expect(css).toContain(".app-shell--zs .calculator-hero-shell--pro .calculator-hero-work-card__start .hero-zs-example-select");
  });

  it("K. hlavička výsledků zůstává 934 h", () => {
    const facts: ZsHeaderFacts = {
      tab: "phmax",
      totalPhmax: 934,
      totalPha: 0,
      totalPhp: 0,
      totalPha1r: 20,
      basic1Classes: 10,
      basic1Pupils: 250,
      basic2Classes: 8,
      basic2Pupils: 225,
      incl1Classes: 5,
      incl2Classes: 4,
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
      pha1rClassCount: 1,
      pha1rInvalid: false,
      pha1rSchoolExcluded: false,
    };
    expect(presentZsHeaderResults(facts).text.phmax).toBe("934 h");
    const html = renderToStaticMarkup(
      createElement(ZsHeroHeader, {
        heroHeaderRef: { current: null },
        productView: "zs",
        setProductView: () => {},
        viewMode: "basic",
        setViewMode: () => {},
        displayDensity: "comfortable",
        setDisplayDensity: () => {},
        focusMode: "off",
        setFocusMode: () => {},
        glossaryTriggerRef: { current: null },
        glossaryOpen: false,
        setGlossaryOpen: () => {},
        zsGuideOpen: false,
        toggleZsGuideFromHero: () => {},
        zsHelpButtonRef: { current: null },
        zsTabPrimaryLabel: "PHmax celkem",
        zsTabPrimaryValue: 934,
        totalPhmax: 934,
        mode: "phmax_full_zs",
        incompleteSections: 0,
        toolbar: toolbarProps,
        headerFacts: facts,
      }),
    );
    expect(html).toContain("934 h");
    expect(html).toContain("PHmax");
  });
});
