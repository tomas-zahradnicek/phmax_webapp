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
      "src/HeroActionsTiered.tsx",
    ]) {
      expect(fs.existsSync(path.resolve(repoRoot, file))).toBe(true);
    }
    const css = readSource("src/styles.css");
    expect(css).toContain(".result-anchor-card");
    expect(css).toContain(".page-toc");
    expect(css).toContain(".calculator-shell--basic .ux-expert-only");
    expect(css).toContain(".zs-basic-wizard-active");
  });

  it("PV/ŠD/SŠ používají ResultAnchorCard a PageTableOfContents", () => {
    for (const page of ["src/PhmaxPvPage.tsx", "src/PhmaxSdPage.tsx", "src/PhmaxSsPage.tsx"]) {
      const src = readSource(page);
      expect(src).toContain("ResultAnchorCard");
      expect(src).toContain("PageTableOfContents");
      expect(src).toContain("calculatorShellClassName(viewMode)");
      expect(src).not.toContain("ProductFloatingNav");
    }
  });

  it("PV má tiered hero akce (TOP 4 vzor)", () => {
    expect(readSource("src/PhmaxPvPage.tsx")).toContain("HeroActionsTiered");
    expect(readSource("src/HeroActionsTiered.tsx")).toContain('aria-label="Hlavní akce"');
  });

  it("ZŠ má ResultAnchorCard, ZsModuleGate a PageTableOfContents", () => {
    const src = readSource("src/PhmaxZsPage.tsx");
    expect(src).toContain("ResultAnchorCard");
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

  it("NV75 má ResultAnchorCard, režim basic/expert a PageTableOfContents", () => {
    const src = readSource("src/PhmaxNv75DeputyPage.tsx");
    expect(src).toContain("ResultAnchorCard");
    expect(src).toContain("PageTableOfContents");
    expect(src).toContain("calculatorShellClassName(viewMode)");
    expect(src).not.toContain("ProductFloatingNav");
    expect(src).toContain('data-section="nv75-vstupy"');
    expect(src).toContain('data-section="nv75-vysledek"');
  });
});
