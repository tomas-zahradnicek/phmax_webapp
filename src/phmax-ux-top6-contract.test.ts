import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX TOP 6 contract", () => {
  it("sdílené komponenty a styly existují", () => {
    for (const file of [
      "src/ResultAnchorCard.tsx",
      "src/CollapsibleSection.tsx",
      "src/PageTableOfContents.tsx",
      "src/calculator-view-mode.ts",
      "src/ZsModuleGate.tsx",
      "src/ZsBasicWizard.tsx",
      "src/zs-basic-wizard.ts",
      "src/HeroCompactToolbar.tsx",
      "src/CalculatorWorkflowDock.tsx",
      "src/DisplayDensityToggle.tsx",
      "src/display-density.ts",
      "src/CalculatorStickyContextBar.tsx",
    ]) {
      expect(fs.existsSync(path.resolve(repoRoot, file))).toBe(true);
    }
    const css = readSource("src/styles.css");
    expect(css).toContain(".result-anchor-card");
    expect(css).toContain(".page-toc");
    expect(css).toContain(".calculator-shell--basic .ux-expert-only");
    expect(css).toContain(".zs-basic-wizard-active");
    expect(css).toContain(".hero-compact-toolbar");
    expect(css).toContain(".calculator-shell--density-compact");
    expect(css).toContain(".workflow-dock");
    expect(css).toContain(".calculator-sticky-context");
  });

  it("PV/ŠD/SŠ používají CalculatorWorkflowDock a PageTableOfContents", () => {
    for (const page of ["src/PhmaxPvPage.tsx", "src/PhmaxSdPage.tsx", "src/PhmaxSsPage.tsx"]) {
      const src = readSource(page);
      expect(src).toContain("CalculatorWorkflowDock");
      expect(src).toContain("PageTableOfContents");
      expect(src).toContain("calculatorShellClassName(viewMode, displayDensity, focusMode)");
      expect(src).not.toContain("ProductFloatingNav");
    }
  });

  it("kalkulačky mají kompaktní hero toolbar a hustotu zobrazení", () => {
    expect(readSource("src/HeroCompactToolbar.tsx")).toContain('aria-label="Hlavní akce"');
    for (const page of [
      "src/PhmaxPvPage.tsx",
      "src/PhmaxSdPage.tsx",
      "src/PhmaxSsPage.tsx",
      "src/PhmaxNv75DeputyPage.tsx",
      "src/PhmaxZsPage.tsx",
    ]) {
      const src = readSource(page);
      expect(src).toContain("HeroCompactToolbar");
      expect(src).toContain("DisplayDensityToggle");
      expect(src).toContain("hero-zone-actions--toolbar");
    }
    expect(readSource("src/PhmaxSdPage.tsx")).toContain('data-section="sd-vysledek"');
    expect(readSource("src/ss/PhmaxSsUnitsForm.tsx")).toContain('data-section="ss-vysledek"');
    expect(readSource("src/PhmaxNv75DeputyPage.tsx")).toContain("hero-zone-actions");
    expect(readSource("src/PhmaxZsPage.tsx")).toContain("CalculatorWorkspaceLayout");
    expect(readSource("src/PhmaxZsPage.tsx")).toContain("CalculatorWorkflowDock");
  });

  it("ZŠ má CalculatorWorkflowDock, ZsModuleGate a PageTableOfContents", () => {
    const src = readSource("src/PhmaxZsPage.tsx");
    expect(src).toContain("CalculatorWorkflowDock");
    expect(src).toContain("ZsModuleGate");
    expect(src).toContain("PageTableOfContents");
    expect(src).toContain("ux-expert-only");
    for (const moduleId of ["psych", "health", "minority", "gym", "mixed", "extras", "pha", "php"]) {
      expect(src).toContain(`sectionId="${moduleId}"`);
    }
    expect(src).toContain("ZsBasicWizard");
    expect(src).toContain("zs-basic-wizard-active");
    expect(src).toContain('data-wizard-step="1"');
    expect(src).toContain('data-wizard-step="4"');
  });

  it("NV75 má CalculatorWorkflowDock, režim basic/expert a PageTableOfContents", () => {
    const src = readSource("src/PhmaxNv75DeputyPage.tsx");
    expect(src).toContain("CalculatorWorkflowDock");
    expect(src).toContain("PageTableOfContents");
    expect(src).toContain("calculatorShellClassName(viewMode, displayDensity, focusMode)");
    expect(src).not.toContain("ProductFloatingNav");
    expect(src).toContain('data-section="nv75-vstupy"');
    expect(src).toContain('data-section="nv75-vysledek"');
    expect(src).toContain("CalculatorWorkflowDock");
    expect(src).toContain("const nv75Workflow = useMemo");
  });

  it("ZŠ TOC obsahuje panely wizardu PHmax", () => {
    const src = readSource("src/PhmaxZsPage.tsx");
    expect(src).toContain('id: "zs-phmax-exceptions"');
    expect(src).toContain('data-section="zs-phmax-exceptions"');
  });
});
