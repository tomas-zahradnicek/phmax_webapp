import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CalculatorInputIssueBanner } from "../CalculatorInputIssueBanner";
import { CalculatorNextActionStrip } from "../CalculatorNextActionStrip";
import { buildCalculatorNextAction } from "../calculator-next-action";
import { calculatorInputIssueBannerFromVerdict } from "../calculator-verdict-ui";
import { buildZsBandUpgradeHints } from "./zs-band-sensitivity";
import { computeZsPhmaxTotalFromFields, zsPhmaxFieldsFromFormState } from "./zs-compute-phmax-total-from-snapshot";
import { applyZsResetNv75, applyZsResetPha, applyZsResetPhmax, applyZsResetPhp } from "./zs-form-reset";
import type { ZsFormSnapshotSetters } from "./zs-form-snapshot";
import { buildZsValidationIssues, buildZsVerdict } from "./zs-form-validation";
import { presentZsHeaderResults } from "./zs-header-results";
import { loadZsHeroExample } from "./zs-hero-example-load";
import { ZS_BAND_HINT_BANNER_LABEL, zsInputIssueBannerDetail, zsInputIssueBannerLabel } from "./zs-hint-banner-label";
import { buildZsPhpBandUpgradeHints } from "./zs-pha-php-band-sensitivity";
import { buildZsWarnings } from "./zs-warnings";
import { ZsWorkflowDockPanel } from "./ZsWorkflowDockPanel";

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function loadOfficialExample(): Record<string, unknown> {
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
  loadZsHeroExample("priloha_uplna_zs_sec16", {
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

function hintsFor(state: Record<string, unknown>): string[] {
  return buildZsBandUpgradeHints({
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
}

function pageBannerHtml(input: {
  verdict: { tone: "ok" | "warning" | "danger" | "neutral"; label: string; detail: string };
  firstIssueSection: string;
  hints: readonly string[];
  issueLabels?: readonly string[];
  warningLabels?: readonly string[];
}): string {
  const visible = [...(input.issueLabels ?? []), ...(input.warningLabels ?? []), ...input.hints];
  const label = zsInputIssueBannerLabel({
    verdictLabel: input.verdict.label,
    verdictTone: input.verdict.tone,
    firstIssueSection: input.firstIssueSection,
    bandHintCount: input.hints.length,
  });
  const detail = zsInputIssueBannerDetail({
    verdictDetail: input.verdict.detail,
    verdictTone: input.verdict.tone,
    firstIssueSection: input.firstIssueSection,
    bandHints: input.hints,
    visibleItemLabels: visible,
  });
  return renderToStaticMarkup(
    createElement(CalculatorInputIssueBanner, {
      ...calculatorInputIssueBannerFromVerdict(input.verdict, input.firstIssueSection ? () => {} : undefined),
      label,
      detail,
      items:
        visible.length > 1
          ? visible.map((item) => ({ label: item, onFix: input.firstIssueSection ? () => {} : undefined }))
          : undefined,
    }),
  );
}

function bannerHtml(label: string, items: readonly string[], onFix?: () => void): string {
  return renderToStaticMarkup(
    createElement(CalculatorInputIssueBanner, {
      ...calculatorInputIssueBannerFromVerdict(
        { tone: "ok", label, detail: "" },
        onFix,
      ),
      items: items.length > 1 ? items.map((item) => ({ label: item })) : undefined,
      detail: items.length === 1 ? items[0] : undefined,
    }),
  );
}

describe("ZŠ nadpis informačního banneru", () => {
  it("A. kompletní 934 h popisuje nápovědu pásma a neschovává ji", () => {
    const state = loadOfficialExample();
    const issues = buildZsValidationIssues(validationInput(state));
    const firstIssueSection = issues[0]?.section ?? "";
    const warnings = buildZsWarnings({
      basicType: "full_more_than_2",
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
    const hints = hintsFor(state);
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
    const html = pageBannerHtml({ verdict, firstIssueSection, hints });

    expect(presented.text.phmax).toBe("934 h");
    expect(presented.text.pha).toBe("Nezadáno");
    expect(presented.text.php).toBe("Nezadáno");
    expect(presented.text.pha1r).toBe("Nezadáno");
    expect(hints.length).toBe(2);
    expect(html).toContain(hints[0]!);
    expect(html).toContain(hints[1]!);
    expect(html).toContain(ZS_BAND_HINT_BANNER_LABEL);
    expect(html).not.toContain("Vstupy jsou kompletní");
    expect(html).not.toContain("Přejít k chybě");
  });

  it("B. ostatní oblasti dokončení zůstávají", () => {
    const verdict = buildZsVerdict(0, 0);
    const next = buildCalculatorNextAction({
      verdict,
      hasData: true,
      incomplete: false,
      onExport: () => {},
    });
    const strip = renderToStaticMarkup(createElement(CalculatorNextActionStrip, { action: next }));
    expect(strip).toContain("Vstupy jsou v pořádku");
    expect(strip).toContain("Export");

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
        zsVerdictTone: verdict.tone,
        zsVerdictLabel: verdict.label,
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
    expect(dock).toContain("Vstupy jsou kompletní");
    expect(dock).toContain("934 h");
    expect(dock).toContain("Nezadáno");
  });

  it("C. třídy bez žáků ponechají validační nadpis a akci", () => {
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
    const verdict = buildZsVerdict(1, 0);
    const label = zsInputIssueBannerLabel({
      verdictLabel: verdict.label,
      verdictTone: verdict.tone,
      firstIssueSection: issues[0]?.section ?? "",
      bandHintCount: 1,
    });
    const html = renderToStaticMarkup(
      createElement(CalculatorInputIssueBanner, {
        ...calculatorInputIssueBannerFromVerdict(verdict, () => {}),
        label,
        items: [{ label: issues[0]!.label, onFix: () => {} }],
      }),
    );
    expect(label).toBe("Na hraně: zadání ještě není kompletní");
    expect(html).toContain("chybí počet žáků");
    expect(html).toContain("Přejít k chybě");
    expect(html).not.toContain(ZS_BAND_HINT_BANNER_LABEL);
  });

  it("D. varování bez validační sekce nezmění nadpis na nápovědu pásma", () => {
    const warnings = buildZsWarnings({
      basicType: "full_more_than_2",
      basic1Classes: 10,
      basic2Classes: 8,
      phpExcludedTotal: 0,
      phpBaseValue: 0,
      phpExcludedSchool: true,
      phpAdjustedValue: 0,
      minorityType: "minority1",
      minority2Classes: 0,
    });
    const verdict = buildZsVerdict(0, warnings.length);
    const label = zsInputIssueBannerLabel({
      verdictLabel: verdict.label,
      verdictTone: verdict.tone,
      firstIssueSection: "",
      bandHintCount: 2,
    });
    const html = bannerHtml(label, warnings);
    expect(warnings[0]).toContain("vyloučená z PHPmax");
    expect(label).toBe("Pozor na hraniční pravidla");
    expect(html).toContain("vyloučená z PHPmax");
    expect(html).not.toContain(ZS_BAND_HINT_BANNER_LABEL);
  });

  it("E. jedna nápověda PHmax zůstane v banneru", () => {
    const state = { basicType: "full_more_than_2", basic1Classes: 10, basic1Pupils: 200 };
    const issues = buildZsValidationIssues(validationInput(state));
    const firstIssueSection = issues[0]?.section ?? "";
    const warnings = buildZsWarnings({
      basicType: "full_more_than_2",
      basic1Classes: 10,
      basic2Classes: 0,
      phpExcludedTotal: 0,
      phpBaseValue: 0,
      phpExcludedSchool: false,
      phpAdjustedValue: 0,
      minorityType: "minority1",
      minority2Classes: 0,
    });
    const hints = hintsFor(state);
    const verdict = buildZsVerdict(new Set(issues.map((item) => item.section)).size, warnings.length);
    const html = pageBannerHtml({
      verdict,
      firstIssueSection,
      hints,
      issueLabels: issues.map((item) => item.label),
      warningLabels: warnings,
    });

    expect(issues).toHaveLength(0);
    expect(warnings).toHaveLength(0);
    expect(hints).toHaveLength(1);
    expect(firstIssueSection).toBe("");
    expect(html).toContain(ZS_BAND_HINT_BANNER_LABEL);
    expect(html).toContain(hints[0]!);
    expect(html).not.toContain("Přejít k chybě");
  });

  it("F. jedna nápověda PHPmax zůstane v banneru", () => {
    const hints = buildZsPhpBandUpgradeHints({ phpExcludedSchool: false, phpAdjustedValue: 300 });
    const issues = buildZsValidationIssues({
      ...validationInput({}),
      tab: "php",
      phpYear1: 300,
      phpYear2: 300,
      phpYear3: 300,
    });
    const firstIssueSection = issues[0]?.section ?? "";
    const verdict = buildZsVerdict(new Set(issues.map((item) => item.section)).size, 0);
    const html = pageBannerHtml({
      verdict,
      firstIssueSection,
      hints,
      issueLabels: issues.map((item) => item.label),
    });

    expect(hints).toHaveLength(1);
    expect(issues).toHaveLength(0);
    expect(html).toContain(hints[0]!);
    expect(html).not.toContain("Přejít k chybě");
  });

  it("G. třídy bez žáků přes stejné složení banneru ponechají validační text", () => {
    const state = { basicType: "full_more_than_2", basic1Classes: 2, basic1Pupils: 0 };
    const issues = buildZsValidationIssues(validationInput(state));
    const firstIssueSection = issues[0]?.section ?? "";
    const hints = hintsFor(state);
    const verdict = buildZsVerdict(1, 0);
    const html = pageBannerHtml({
      verdict,
      firstIssueSection,
      hints,
      issueLabels: issues.map((item) => item.label),
    });
    expect(html).toContain("Na hraně: zadání ještě není kompletní");
    expect(html).toContain("chybí počet žáků");
    expect(html).toContain("Přejít k chybě");
    expect(html).not.toContain(ZS_BAND_HINT_BANNER_LABEL);
  });
});
