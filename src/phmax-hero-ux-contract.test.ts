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

const HERO_TOOLBAR_BY_PAGE: Partial<Record<(typeof PRODUCT_PAGES)[number], string>> = {
  "src/PhmaxZsPage.tsx": "src/zs/ZsHeroToolbar.tsx",
  "src/PhmaxPvPage.tsx": "src/pv/PvHeroToolbar.tsx",
  "src/PhmaxSdPage.tsx": "src/sd/SdHeroToolbar.tsx",
  "src/PhmaxNv75DeputyPage.tsx": "src/nv75/Nv75HeroToolbar.tsx",
  "src/PhmaxSsPage.tsx": "src/ss/SsHeroToolbar.tsx",
};

const HERO_HEADER_BY_PAGE: Partial<Record<(typeof PRODUCT_PAGES)[number], string>> = {
  "src/PhmaxZsPage.tsx": "src/zs/ZsHeroHeader.tsx",
  "src/PhmaxPvPage.tsx": "src/pv/PvHeroHeader.tsx",
  "src/PhmaxSdPage.tsx": "src/sd/SdHeroHeader.tsx",
  "src/PhmaxNv75DeputyPage.tsx": "src/nv75/Nv75HeroHeader.tsx",
  "src/PhmaxSsPage.tsx": "src/ss/SsHeroHeader.tsx",
};

function heroToolbarSrc(page: (typeof PRODUCT_PAGES)[number]) {
  const path = HERO_TOOLBAR_BY_PAGE[page];
  return path ? readSource(path) : readSource(page);
}

function heroHeaderSrc(page: (typeof PRODUCT_PAGES)[number]) {
  const path = HERO_HEADER_BY_PAGE[page];
  return path ? readSource(path) : readSource(page);
}

describe("UX contract: hero result + tiered actions (post TOP 4)", () => {
  it("všechny produktové stránky mají sticky workspace dock a workflow panel", () => {
    for (const page of PRODUCT_PAGES) {
      const src = readSource(page);
      const toolbarSrc = heroToolbarSrc(page);
      const heroSrc = heroHeaderSrc(page);
      expect(src, page).toMatch(
        /CalculatorProductShell|CalculatorWorkspaceLayout|ZsCalculatorShell|SdCalculatorShell|PvCalculatorShell/,
      );
      expect(src, page).toMatch(
        /calculator-workspace-dock|CalculatorWorkflowDock|ZsWorkflowDockPanel|ZsCalculatorShell|SdWorkflowDockPanel|SdCalculatorShell|PvWorkflowDockPanel|PvCalculatorShell/,
      );
      expect(toolbarSrc, page).toContain("HeroCompactToolbar");
      expect(heroSrc, page).toContain("DisplayDensityToggle");
      expect(heroSrc, page).toMatch(/hero-zone-actions--toolbar|(Zs|Pv|Sd|Nv75|Ss)HeroToolbar/);
      expect(src, page).toMatch(
        /CalculatorWorkflowDock|ZsWorkflowDockPanel|ZsCalculatorShell|SdWorkflowDockPanel|SdCalculatorShell|PvWorkflowDockPanel|PvCalculatorShell/,
      );
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
    const heroHeader = readSource("src/zs/ZsHeroHeader.tsx");
    const phmaxTab = readSource("src/zs/ZsPhmaxTabPanel.tsx");
    expect(src).toContain("zsShowPhmaxExceptionsToc");
    expect(src).toContain('id: "zs-phmax-exceptions"');
    expect(phmaxTab).toContain('data-section="zs-phmax-exceptions"');
    expect(phmaxTab).toContain("PhmaxZsPhmaxSubNav");
    expect(readSource("src/zs/ZsPhmaxBasicSection.tsx")).toContain('data-phmax-pane="classes"');
    expect(readSource("src/zs/ZsPhmaxMinoritySection.tsx")).toContain('data-phmax-pane="exceptions"');
    expect(readSource("src/zs/ZsOverviewSection.tsx")).toContain('data-phmax-pane="summary"');
    expect(heroHeader).toContain("heroHeaderRef as React.Ref<HTMLElement>");
    expect(heroHeader).toContain("hero__title--zs");
    expect(heroHeader).toMatch(/hero-zone-actions--toolbar|ZsHeroToolbar/);
  });
});
