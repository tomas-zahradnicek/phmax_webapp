import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

const PRODUCT_PAGES = [
  "src/PhmaxPvPage.tsx",
  "src/PhmaxSdPage.tsx",
  "src/PhmaxSsPage.tsx",
  "src/PhmaxNv75DeputyPage.tsx",
  "src/PhmaxZsPage.tsx",
] as const;

describe("UX contract: hero result + tiered actions (post TOP 4)", () => {
  it("všechny produktové stránky mají sticky workspace dock a workflow panel", () => {
    for (const page of PRODUCT_PAGES) {
      const src = readSource(page);
      expect(src, page).toMatch(/CalculatorProductShell|CalculatorWorkspaceLayout/);
      expect(src, page).toMatch(/calculator-workspace-dock|CalculatorWorkflowDock/);
      expect(src, page).toContain("HeroCompactToolbar");
      expect(src, page).toContain("useDisplayDensity");
      expect(src, page).toContain("hero-zone-actions--toolbar");
      expect(src, page).toContain("CalculatorWorkflowDock");
    }
    expect(readSource("src/CalculatorWorkflowDock.tsx")).toContain("workflow-dock__block--steps");
    expect(readSource("src/HeroToolbarDropdown.tsx")).toContain("createPortal");
    expect(readSource("src/HeroActionsDrawer.tsx")).toContain("HeroToolbarPortalContext");
    expect(readSource("src/HeroExpertStrip.tsx")).toContain("hero-expert-strip");
    expect(readSource("src/CalculatorProductShell.tsx")).toContain("CalculatorWorkspaceLayout");
  });

  it("NV75 má nv75Workflow a doporučený krok", () => {
    const src = readSource("src/PhmaxNv75DeputyPage.tsx");
    expect(src).toContain("const nv75Workflow = useMemo");
    expect(src).toContain("workflowSteps={nv75BasicWizardActive ? [] : nv75Workflow.steps}");
    expect(src).toContain("ProductBasicWizard");
    expect(src).toContain("CalculatorWorkflowDock");
  });

  it("ZŠ TOC zahrnuje wizard panely PHmax", () => {
    const src = readSource("src/PhmaxZsPage.tsx");
    expect(src).toContain("zsShowPhmaxExceptionsToc");
    expect(src).toContain('id: "zs-phmax-exceptions"');
    expect(src).toContain('data-section="zs-phmax-exceptions"');
    expect(src).toContain("PhmaxZsPhmaxSubNav");
    expect(readSource("src/zs/ZsPhmaxBasicSection.tsx")).toContain('data-phmax-pane="classes"');
    expect(readSource("src/zs/ZsPhmaxMinoritySection.tsx")).toContain('data-phmax-pane="exceptions"');
    expect(readSource("src/PhmaxZsPage.tsx")).toContain('data-phmax-pane="summary"');
    expect(src).toContain('ref={heroHeaderRef}');
    expect(src).toContain("hero__title--zs");
    expect(src).toContain("hero-zone-actions--toolbar");
  });
});
