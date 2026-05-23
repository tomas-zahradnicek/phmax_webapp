import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: release notes + přístupnost", () => {
  it("Co je nového 0.2.2 – footer odkaz bez automatického popupu", () => {
    expect(readSource("src/app-release-notes.ts")).toContain("PHMAX_CURRENT_RELEASE_NOTES");
    expect(readSource("src/app-release-notes.ts")).toContain("ikona „i“");
    expect(readSource("src/FieldHintButton.tsx")).toContain("FieldHintButton");
    expect(readSource("src/AuthorCreditFooter.tsx")).toContain("openWhatsNew");
    expect(readSource("src/CalculatorMobileScrollResults.tsx")).toContain("calculator-mobile-scroll-results__hero");
    expect(readSource("src/HeroExampleSelect.tsx")).toContain("hero-example-sheet");
    const whatsNew = readSource("src/AppWhatsNewContext.tsx");
    expect(whatsNew).toContain("openWhatsNew");
    expect(whatsNew).not.toContain("shouldAutoOpenWhatsNew");
    expect(readSource("src/App.tsx")).toContain("AppWhatsNewProvider");
  });

  it("skip link a hlavní landmark pro výpočet", () => {
    expect(readSource("src/App.tsx")).toContain("SkipToMainLink");
    expect(readSource("src/SkipToMainLink.tsx")).toContain("Přeskočit na výpočet");
    expect(readSource("src/phmax-main-landmarks.ts")).toContain('PHMAX_CALCULATOR_MAIN_ID = "phmax-calculator-main"');
    expect(readSource("src/CalculatorWorkspaceLayout.tsx")).toContain("PHMAX_CALCULATOR_MAIN_ID");
    expect(readSource("src/PhmaxDashboardPage.tsx")).toContain("PHMAX_DASHBOARD_MAIN_ID");
    const css = readSource("src/styles.css");
    expect(css).toContain(".skip-link");
    expect(css).toContain(".skip-link:focus");
  });

  it("modály a mobilní TOC – klávesnice a focus trap", () => {
    expect(readSource("src/modal-dialog-a11y.ts")).toContain("useModalDialogA11y");
    expect(readSource("src/modal-dialog-a11y.ts")).toContain('document.body.style.overflow = "hidden"');
    expect(readSource("src/QuickOnboarding.tsx")).toContain("useModalDialogA11y");
    expect(readSource("src/GlossaryDialog.tsx")).toContain("useModalDialogA11y");
    expect(readSource("src/GlossaryDialog.tsx")).toContain("createPortal");
    expect(readSource("src/GlossaryIconButton.tsx")).toContain("aria-expanded");
    expect(readSource("src/PageTableOfContents.tsx")).toContain('e.key === "Escape"');
    expect(readSource("src/PageTableOfContents.tsx")).toContain("aria-controls");
    expect(readSource("src/calculator-section-focus.ts")).toContain("scrollToFirstNeedsAttentionSection");
    expect(readSource("src/PhmaxPvPage.tsx")).toContain("Přejít k chybě");
    expect(fs.existsSync(path.resolve(repoRoot, "docs/keyboard-a11y-checklist.md"))).toBe(true);
  });
});
