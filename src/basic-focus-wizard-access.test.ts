import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

const FOCUS_HIDES_ONBOARDING =
  ".calculator-shell--focus .card--onboarding:not(.hero):not(.glossary-modal__panel)";
const BASIC_FOCUS_KEEPS_PRODUCT_WIZARD =
  ".calculator-shell--basic.calculator-shell--focus .product-basic-wizard.card--onboarding";
const BASIC_FOCUS_KEEPS_ZS_WIZARD =
  ".calculator-shell--basic.calculator-shell--focus .zs-basic-wizard.card--onboarding";

describe("Basic + Focus wizard access", () => {
  it("navigace průvodce zůstane viditelná, ostatní onboarding Focus dál schová", () => {
    const css = readSource("src/styles.css");
    const hideAt = css.indexOf(FOCUS_HIDES_ONBOARDING);
    const productAt = css.indexOf(BASIC_FOCUS_KEEPS_PRODUCT_WIZARD);
    const zsAt = css.indexOf(BASIC_FOCUS_KEEPS_ZS_WIZARD);

    expect(hideAt).toBeGreaterThan(-1);
    expect(productAt).toBeGreaterThan(hideAt);
    expect(zsAt).toBeGreaterThan(hideAt);
    expect(css).toContain(".calculator-shell--focus .ux-methodology");
    expect(css).toContain(".calculator-shell--focus .page-toc");
    expect(css).toMatch(
      /\.calculator-shell--basic\.calculator-shell--focus \.product-basic-wizard\.card--onboarding[\s\S]{0,240}display:\s*block\s*!important/,
    );
  });

  it("PV, ŠD, ZŠ, SŠ a NV75 mají vstupy až ve wizard kroku a navigaci v card--onboarding", () => {
    expect(readSource("src/ProductBasicWizard.tsx")).toContain("card card--onboarding");
    expect(readSource("src/ProductBasicWizard.tsx")).toContain("zs-basic-wizard__nav");
    expect(readSource("src/ZsBasicWizard.tsx")).toContain("card card--onboarding");
    expect(readSource("src/ZsBasicWizard.tsx")).toContain("zs-basic-wizard__nav");
    expect(readSource("src/PhmaxPvPage.tsx")).toContain('data-wizard-step="2"');
    expect(readSource("src/PhmaxSdPage.tsx")).toContain('data-wizard-step="2"');
    expect(readSource("src/PhmaxSsPage.tsx")).toContain('data-wizard-step="2"');
    expect(readSource("src/PhmaxNv75DeputyPage.tsx")).toContain('data-wizard-step="2"');
    expect(readSource("src/zs/ZsPhmaxBasicSection.tsx")).toContain('data-wizard-step="2"');
    expect(readSource("src/zs/ZsExpertOnboardingCard.tsx")).toContain("card--onboarding");
    expect(readSource("src/zs/PhmaxZsLitePage.tsx")).not.toContain("product-basic-wizard");
    expect(readSource("src/pv/PhmaxPvLitePage.tsx")).not.toContain("product-basic-wizard");
    expect(readSource("src/sd/PhmaxSdLitePage.tsx")).not.toContain("product-basic-wizard");
  });
});
