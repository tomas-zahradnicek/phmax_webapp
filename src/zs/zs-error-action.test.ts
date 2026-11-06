import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CalculatorInputIssueBanner } from "../CalculatorInputIssueBanner";
import { buildCalculatorNextAction } from "../calculator-next-action";
import { calculatorInputIssueBannerFromVerdict } from "../calculator-verdict-ui";
import { ZsBasicWizard } from "../ZsBasicWizard";
import { ZS_BASIC_WIZARD_STEP_COUNT } from "../zs-basic-wizard";
import { buildZsBandUpgradeHints } from "./zs-band-sensitivity";
import { computeZsPhmaxTotalFromFields, zsPhmaxFieldsFromFormState } from "./zs-compute-phmax-total-from-snapshot";
import { applyZsResetNv75, applyZsResetPha, applyZsResetPhmax, applyZsResetPhp } from "./zs-form-reset";
import type { ZsFormSnapshotSetters } from "./zs-form-snapshot";
import { buildZsValidationIssues, buildZsVerdict } from "./zs-form-validation";
import { presentZsHeaderResults } from "./zs-header-results";
import { loadZsHeroExample } from "./zs-hero-example-load";
import { buildZsWarnings } from "./zs-warnings";
import { ZsWorkflowDockPanel } from "./ZsWorkflowDockPanel";

const pageSource = readFileSync(resolve(__dirname, "../PhmaxZsPage.tsx"), "utf8");

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function loadExample(example: "priloha_uplna_zs_sec16"): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  const setters = new Proxy({} as ZsFormSnapshotSetters, {
    get(_target, prop) {
      if (typeof prop !== "string" || !prop.startsWith("set")) return undefined;
      return (value: unknown) => {
        const key = prop.slice(3, 4).toLowerCase() + prop.slice(4);
        state[key] = value;
      };
    },
  });
  loadZsHeroExample(example, {
    setters,
    createEmptyGymRow: (id) => ({ id, kind: "gym8", classes: 0, pupils: 0 }),
    createEmptyMixedRow: (id) => ({ id, stage: "first", majority: "zs", classes: 0, pupils: 0 }),
    createEmptyPhaRow: (id) => ({ id, kind: "zs1", classes: 0, pupils: 0 }),
    applyResetPhmax: () => applyZsResetPhmax(setters),
    applyResetPha: () => applyZsResetPha(setters),
    applyResetPhp: () => applyZsResetPhp(setters),
    resetNv75: () => applyZsResetNv75(setters),
  });
  return state;
}

function validationInput(state: Record<string, unknown>) {
  return {
    tab: "phmax" as const,
    basic1Classes: num(state.basic1Classes),
    basic1Pupils: num(state.basic1Pupils),
    basic2Classes: num(state.basic2Classes),
    basic2Pupils: num(state.basic2Pupils),
    incl1Classes: num(state.incl1Classes),
    incl2Classes: num(state.incl2Classes),
    psychRowCount: 0,
    healthRowCount: 0,
    minority1Classes: num(state.minority1Classes),
    gymRowCount: 0,
    mixedRowCount: 0,
    special1Classes: num(state.special1Classes),
    special2Classes: num(state.special2Classes),
    specialIIClasses: num(state.specialIIClasses),
    prepClasses: num(state.prepClasses),
    prepSpecialClasses: num(state.prepSpecialClasses),
    phaRowCount: 0,
    phpYear1: 0,
    phpYear2: 0,
    phpYear3: 0,
    phpMethodMode: "three_year_avg",
  };
}

/** Stejné tři větve jako PhmaxZsPage. Bez cíle nesmí předat onFix. */
function pageOffersErrorActionWithoutTarget(source: string): boolean {
  return (
    source.includes("calculatorInputIssueBannerFromVerdict(zsVerdict, zsScrollToInputs)") ||
    /showInputIssueFix=\{showZsInputBanner\}/.test(source) ||
    /onFix:\s*showZsInputBanner\s*\?\s*zsScrollToInputs/.test(source)
  );
}

describe("ZŠ akce Přejít k chybě", () => {
  it("A. kompletní 934 h s nápovědou pásma nemá akci v banneru, průvodci ani dalším kroku", () => {
    const state = loadExample("priloha_uplna_zs_sec16");
    const issues = buildZsValidationIssues(validationInput(state));
    const firstIssueSection = issues[0]?.section ?? "";
    const warnings = buildZsWarnings({
      basicType: state.basicType as "full_more_than_2",
      basic1Classes: num(state.basic1Classes),
      basic2Classes: num(state.basic2Classes),
      phpExcludedTotal: 0,
      phpBaseValue: 0,
      phpExcludedSchool: false,
      phpAdjustedValue: 0,
      minorityType: "minority1",
      minority2Classes: 0,
    });
    const verdict = buildZsVerdict(new Set(issues.map((item) => item.section)).size, warnings.length);
    const hints = buildZsBandUpgradeHints({
      tab: "phmax",
      basicType: state.basicType as "full_more_than_2",
      basic1Classes: num(state.basic1Classes),
      basic1Pupils: num(state.basic1Pupils),
      basic2Classes: num(state.basic2Classes),
      basic2Pupils: num(state.basic2Pupils),
      incl1Classes: num(state.incl1Classes),
      incl1Pupils: num(state.incl1Pupils),
      incl2Classes: num(state.incl2Classes),
      incl2Pupils: num(state.incl2Pupils),
      psychRows: [],
      healthRows: [],
      minorityType: "minority1",
      minority1Classes: 0,
      minority1Pupils: 0,
      minority2Classes: 0,
      minority2Pupils: 0,
      gymRows: [],
      special1Classes: 0,
      special1Pupils: 0,
      special2Classes: 0,
      special2Pupils: 0,
      specialIIClasses: 0,
      specialIIPupils: 0,
    });
    const presented = presentZsHeaderResults({
      ...validationInput(state),
      totalPhmax: computeZsPhmaxTotalFromFields(
        zsPhmaxFieldsFromFormState(state as Parameters<typeof zsPhmaxFieldsFromFormState>[0]),
      ),
      totalPha: 0,
      totalPhp: 0,
      totalPha1r: 0,
      phpExcludedSchool: false,
      pha1rClassCount: 0,
      pha1rInvalid: false,
      pha1rSchoolExcluded: false,
    });
    const offersWithoutTarget = pageOffersErrorActionWithoutTarget(pageSource);
    const onFix = offersWithoutTarget || firstIssueSection ? () => {} : undefined;

    expect(presented.text.phmax).toBe("934 h");
    expect(verdict.label).toBe("Vstupy jsou kompletní");
    expect(presented.text.pha).toBe("Nezadáno");
    expect(presented.text.php).toBe("Nezadáno");
    expect(presented.text.pha1r).toBe("Nezadáno");
    expect(hints.length).toBeGreaterThan(0);
    expect(firstIssueSection).toBe("");

    const banner = renderToStaticMarkup(
      createElement(CalculatorInputIssueBanner, {
        ...calculatorInputIssueBannerFromVerdict(verdict, onFix),
        items: hints.map((label) => ({ label })),
      }),
    );
    expect(banner).toContain(hints[0]!);
    expect(banner).not.toContain("Přejít k chybě");

    const wizard = renderToStaticMarkup(
      createElement(ZsBasicWizard, {
        step: ZS_BASIC_WIZARD_STEP_COUNT,
        modeLabel: "PHmax – úplná ZŠ",
        hasExceptionModules: true,
        wizardChoice: "",
        wizardOptions: [],
        inputIssueFix: offersWithoutTarget ? { onFix: () => {} } : undefined,
        onWizardChoice: () => {},
        onStepChange: () => {},
        onBack: () => {},
        onNext: () => {},
      }),
    );
    expect(wizard).toContain("Celkový přehled");
    expect(wizard).not.toContain("Přejít k chybě");

    const next = buildCalculatorNextAction({
      verdict,
      hasData: true,
      incomplete: false,
      onFix,
      onExport: () => {},
    });
    expect(next.actionLabel).not.toBe("Přejít k chybě");
  });

  it("B. třídy bez žáků ponechají akci a cíl basic", () => {
    const issues = buildZsValidationIssues({
      tab: "phmax",
      basic1Classes: 2,
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
    });
    const firstIssueSection = issues[0]?.section ?? "";
    const verdict = buildZsVerdict(1, 0);
    const seen: string[] = [];
    const banner = renderToStaticMarkup(
      createElement(CalculatorInputIssueBanner, {
        ...calculatorInputIssueBannerFromVerdict(verdict, () => {
          if (firstIssueSection) seen.push(firstIssueSection);
        }),
        items: issues.map((item) => ({
          label: item.label,
          onFix: () => {
            seen.push(item.section);
          },
        })),
      }),
    );

    expect(firstIssueSection).toBe("basic");
    expect(banner).toContain("chybí počet žáků");
    expect(banner).toContain("Přejít k chybě");
    expect(seen).toEqual([]);
  });

  it("C. prázdný cíl neschovává nápovědu a dock ani další krok nenabízí skok k chybě", () => {
    const hints = ["Inkluzivní – 1. stupeň: orientační nápověda pásma"];
    const warningVerdict = {
      tone: "warning" as const,
      label: "Pozor na hraniční pravidla",
      detail: "Výpočet proběhl, ale obsahuje upozornění k výjimkám nebo ruční kontrole podle metodiky.",
    };
    const onFix = pageOffersErrorActionWithoutTarget(pageSource) ? () => {} : undefined;
    const banner = renderToStaticMarkup(
      createElement(CalculatorInputIssueBanner, {
        ...calculatorInputIssueBannerFromVerdict(warningVerdict, onFix),
        items: hints.map((label) => ({ label })),
      }),
    );
    expect(banner).toContain(hints[0]!);
    expect(banner).not.toContain("Přejít k chybě");

    const next = buildCalculatorNextAction({
      verdict: warningVerdict,
      hasData: true,
      incomplete: false,
      onFix,
      onExport: () => {},
    });
    expect(next.actionLabel).not.toBe("Přejít k chybě");

    const dock = renderToStaticMarkup(
      createElement(ZsWorkflowDockPanel, {
        tab: "phmax",
        setTab: () => {},
        mode: "phmax_full_zs_sec16",
        incompleteSections: 0,
        zsTabPrimaryLabel: "PHmax celkem",
        zsTabPrimaryValue: 934,
        totalPhmax: 934,
        totalPha: 0,
        totalPhp: 0,
        totalPha1r: 0,
        zsVerdictTone: "ok",
        zsVerdictLabel: "Vstupy jsou kompletní",
        zsVerdictDetail: "",
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
          primary: "934 h",
          phmax: "934 h",
          pha: "Nezadáno",
          php: "Nezadáno",
          pha1r: "Nezadáno",
        },
      }),
    );
    expect(dock).not.toContain("Přejít k chybě");
    expect(dock).toContain("934 h");
  });
});
