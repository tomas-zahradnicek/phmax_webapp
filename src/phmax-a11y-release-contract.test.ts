import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: release notes + přístupnost", () => {
  it("Co je nového 0.2.1 – footer odkaz a auto-open po updatu", () => {
    expect(readSource("src/app-release-notes.ts")).toContain("PHMAX_CURRENT_RELEASE_NOTES");
    expect(readSource("src/app-release-notes.ts")).toContain("Mobilní souhrn");
    expect(readSource("src/AuthorCreditFooter.tsx")).toContain("openWhatsNew");
    expect(readSource("src/AppWhatsNewContext.tsx")).toContain("shouldAutoOpenWhatsNew");
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
    expect(readSource("src/QuickOnboarding.tsx")).toContain("useModalDialogA11y");
    expect(readSource("src/GlossaryDialog.tsx")).toContain("useModalDialogA11y");
    expect(readSource("src/GlossaryDialog.tsx")).toContain("createPortal");
    expect(readSource("src/PageTableOfContents.tsx")).toContain('e.key === "Escape"');
    expect(readSource("src/PageTableOfContents.tsx")).toContain("aria-controls");
    expect(readSource("src/useQuickOnboarding.ts")).toContain("helpButtonRef");
    expect(readSource("src/CalculatorWorkflowDock.tsx")).toContain('role="region"');
  });
});
