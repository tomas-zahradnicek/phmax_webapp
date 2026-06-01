import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: ZŠ + SŠ workflow panel pattern", () => {
  it("CalculatorWorkflowDock má mobilní plovoucí souhrn výsledků stále viditelný", () => {
    const dock = readSource("src/CalculatorWorkflowDock.tsx");
    const css = readSource("src/styles.css");
    expect(dock).toContain("CalculatorMobileScrollResults");
    expect(dock).toContain("showMobileScrollResults");
    expect(dock).toContain("MOBILE_SCROLL_PIN_MS");
    expect(dock).toContain("mobileScrollPinned");
    expect(dock).toContain("handleMobileScrollActivate");
    const mobile = readSource("src/CalculatorMobileScrollResults.tsx");
    expect(mobile).toContain("hasStats");
    expect(mobile).toMatch(/showBody\s*=\s*hasStats\s*\|\|\s*!compact\s*\|\|\s*pinned/);
    expect(css).toContain(".calculator-mobile-scroll-results");
    expect(css).toContain(".hero-example-sheet");
    expect(css).toContain(".calculator-mobile-scroll-results--compact");
    expect(css).toContain("bottom: calc(env(safe-area-inset-bottom");
    expect(css).toContain(".calculator-mobile-scroll-results--pinned");
    expect(css).toContain("display: block !important");
    expect(css).toMatch(/@media \(min-width: 1100px\)[\s\S]*\.calculator-mobile-scroll-results/);
  });

  it("ZŠ drží zsWorkflow a předává kroky do CalculatorWorkflowDock", () => {
    const src = readSource("src/PhmaxZsPage.tsx");

    expect(src).toContain("buildZsFormSnapshot");
    expect(src).toContain("useZsFormAutosave");
    expect(src).toContain("ZsPhaPhpTabPanels");
    expect(readSource("src/zs/ZsPhaPhpTabPanels.tsx")).toContain("ZsPhaTabPanel");
    expect(readSource("src/zs/ZsPhaPhpTabPanels.tsx")).toContain("ZsPhpTabPanel");
    expect(src).toContain("ZsPhmaxTabPanel");
    expect(readSource("src/zs/ZsPhmaxTabPanel.tsx")).toContain("ZsPhmaxBasicSection");
    expect(readSource("src/zs/use-zs-page-derived-state.ts")).toContain("buildZsWorkflow");
    expect(src).toContain("useZsPageDerivedState");
    expect(readSource("src/zs/ZsHeroHeader.tsx")).toContain("incompleteSections > 0");
    expect(readSource("src/zs/use-zs-page-derived-state.ts")).toContain("warnings.length > 0");
    expect(src).toContain("zsWorkflowSteps: zsWorkflow.steps");
    expect(readSource("src/zs/ZsWorkflowDockPanel.tsx")).toContain("workflowSteps={zsBasicWizardActive ? [] : zsWorkflowSteps}");
    expect(readSource("src/zs/ZsWorkflowDockPanel.tsx")).toContain("CalculatorWorkflowDock");
    expect(readSource("src/zs/zs-form-validation.ts")).toContain(
      '{ label: "Vyplnit povinné vstupy v aktivních modulech", state: "active" }',
    );
  });

  it("NV75 drží nv75Workflow a předává kroky do CalculatorWorkflowDock", () => {
    const src = readSource("src/PhmaxNv75DeputyPage.tsx");

    expect(src).toContain("const nv75Workflow = useMemo");
    expect(src).toContain("nv75InputWarnings.length > 0");
    expect(src).toContain("!bank.appliedRule");
    expect(src).toContain("workflowSteps={nv75BasicWizardActive ? [] : nv75Workflow.steps}");
    expect(src).toContain("CalculatorWorkflowDock");
    expect(src).toContain('{ label: "Uložit scénář", onClick: saveNamedSnapshot }');
  });

  it("SŠ drží ssWorkflow a předává kroky do CalculatorWorkflowDock", () => {
    const src = readSource("src/PhmaxSsPage.tsx");

    expect(src).toContain("const ssWorkflow = (() => {");
    expect(src).toContain('const errorRows = ss.preview.filter((p) => !p.skipped && "error" in p).length;');
    expect(src).toContain("workflowSteps={ssBasicWizardActive ? [] : ssWorkflow.steps}");
    expect(src).toContain("SsHumanSummary");
    expect(src).toContain("ss-human-summary--main");
    expect(src).toContain('{ label: "Opravit chybné kombinace nebo hodnoty", state: "active" as const }');
  });
});
