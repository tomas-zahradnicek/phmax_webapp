import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: basic onboarding steps + CTA", () => {
  it("ProductBasicWizard a basic-quick-start podporují CTA na cílový prvek", () => {
    const wizard = readSource("src/ProductBasicWizard.tsx");
    const factory = readSource("src/basic-quick-start.ts");
    expect(factory).toContain("BASIC_QUICK_START_EXAMPLE_CTA_LABEL");
    expect(wizard).toContain("heroExampleSelectId");
    expect(wizard).toContain("document.getElementById");
    expect(wizard).toContain('el.scrollIntoView({ behavior: "smooth", block: "center" });');
    expect(wizard).toContain("BASIC_QUICK_START_EXAMPLE_CTA_LABEL");
  });

  it("PV/SŠ/NV75 používají ProductBasicWizard se 3 kroky, ŠD má SdBasicWizard", () => {
    const pv = readSource("src/PhmaxPvPage.tsx");
    const sd = readSource("src/PhmaxSdPage.tsx");
    const ss = readSource("src/PhmaxSsPage.tsx");
    const nv75 = readSource("src/PhmaxNv75DeputyPage.tsx");

    for (const src of [pv, ss, nv75]) {
      expect(src).toContain("ProductBasicWizard");
      expect(src).toContain("useProductBasicWizard");
      expect(src).toContain("product-basic-wizard-active");
    }

    expect(sd).toContain("SdBasicWizard");
    expect(sd).toContain("sd-basic-wizard");
    expect(readSource("src/sd-basic-wizard.ts")).toContain("SD_BASIC_WIZARD_STEP_COUNT = 3");
    expect(readSource("src/product-basic-wizard.ts")).toContain("PRODUCT_BASIC_WIZARD_STEP_COUNT = 3");
  });

  it("CTA cíl míří na existující hero example select id", () => {
    const pv = readSource("src/PhmaxPvPage.tsx");
    const ss = readSource("src/PhmaxSsPage.tsx");
    const nv75 = readSource("src/PhmaxNv75DeputyPage.tsx");

    expect(pv).toContain('heroExampleSelectId={PV_HERO_EXAMPLE_SELECT_ID}');
    expect(readSource("src/pv-basic-wizard.ts")).toContain('PV_HERO_EXAMPLE_SELECT_ID = "pv-hero-example-select"');
    expect(readSource("src/pv/PvHeroToolbar.tsx")).toContain('id="pv-hero-example-select"');

    expect(readSource("src/sd/SdHeroToolbar.tsx")).toContain('id="sd-hero-example-select"');
    expect(readSource("src/sd-basic-wizard.ts")).toContain('SD_HERO_EXAMPLE_SELECT_ID = "sd-hero-example-select"');
    expect(readSource("src/SdBasicWizard.tsx")).toContain("SD_HERO_EXAMPLE_SELECT_ID");
    expect(readSource("src/ProductBasicWizard.tsx")).toContain("document.getElementById");

    expect(ss).toContain("SS_HERO_EXAMPLE_SELECT_ID");
    expect(readSource("src/ss/SsHeroToolbar.tsx")).toContain('id="ss-hero-example-select"');
    expect(readSource("src/ss-basic-wizard.ts")).toContain('SS_HERO_EXAMPLE_SELECT_ID = "ss-hero-example-select"');

    expect(nv75).toContain("NV75_HERO_EXAMPLE_SELECT_ID");
    expect(nv75).toContain('id="nv75-hero-example-select"');
    expect(readSource("src/nv75-basic-wizard.ts")).toContain('NV75_HERO_EXAMPLE_SELECT_ID = "nv75-hero-example-select"');
  });

  it("dashboard pro nové uživatele nabízí ukázku bez modalu", () => {
    const dash = readSource("src/PhmaxDashboardPage.tsx");
    expect(dash).toContain("dash-new-user-card");
    expect(dash).toContain("showNewUserGuide");
    expect(dash).toContain("requestFocusExampleSelect");
    expect(dash).toContain("openModuleWithExampleHint");
    expect(dash).not.toContain("Modal");
  });

  it("dashboard u modulů s varováním posune na vstupy po otevření", () => {
    const dash = readSource("src/PhmaxDashboardPage.tsx");
    expect(dash).toContain("dash-attention-card");
    expect(dash).toContain("requestFocusModuleInputs");
    expect(dash).toContain("openDashboardModule");
    expect(dash).toContain("sortByDashboardAttention");
    expect(readSource("src/useFocusInputsOnMount.ts")).toContain("consumeFocusModuleInputs");
  });

  it("SŠ §16 má srozumitelnou větu u řádků", () => {
    expect(readSource("src/ss/phmax-ss-par16.ts")).toContain("PHMAX_SS_PAR16_ROW_SUMMARY");
    expect(readSource("src/ss/SsResultsSection.tsx")).toContain("PHMAX_SS_PAR16_ROW_SUMMARY");
    expect(readSource("src/ss/SsResultsSection.tsx")).toContain("ss-par16-row-summary");
  });

  it("vlastní údaje – sdílená nápověda ve všech režimech", () => {
    expect(readSource("src/calculator-ui-constants.ts")).toContain("HERO_OWN_DATA_HINT");
    expect(readSource("src/calculator-ui-constants.ts")).toContain("VIEW_MODE_HINT_BASIC");
    expect(readSource("src/calculator-ui-constants.ts")).toContain("RESULT_ANCHOR_INPUT_DRIVEN_BADGE");
    expect(readSource("src/calculator-ui-constants.ts")).toContain("HERO_EXAMPLE_SELECT_PLACEHOLDER");
    expect(readSource("src/OwnDataHint.tsx")).toContain('variant?: OwnDataHintVariant');
    expect(readSource("src/CalculatorWorkflowDock.tsx")).toContain('<OwnDataHint variant="dock" />');
    expect(readSource("src/CalculatorWorkflowDock.tsx")).toContain("RESULT_ANCHOR_INPUT_DRIVEN_BADGE");
    expect(readSource("src/CalculatorViewModeToggle.tsx")).toContain("VIEW_MODE_HINT_BASIC");

    expect(readSource("src/CalculatorHeroDisplayControls.tsx")).toContain("calculator-hero-display-controls__divider");
    for (const hero of [
      "src/pv/PvHeroHeader.tsx",
      "src/zs/ZsHeroHeader.tsx",
      "src/sd/SdHeroHeader.tsx",
      "src/ss/SsHeroHeader.tsx",
      "src/nv75/Nv75HeroHeader.tsx",
    ]) {
      expect(readSource(hero)).toContain("CalculatorHeroDisplayControls");
    }

    for (const toolbar of [
      "src/pv/PvHeroToolbar.tsx",
      "src/zs/ZsHeroToolbar.tsx",
      "src/sd/SdHeroToolbar.tsx",
      "src/ss/SsHeroToolbar.tsx",
      "src/nv75/Nv75HeroToolbar.tsx",
    ]) {
      expect(readSource(toolbar)).toContain('<OwnDataHint variant="hero" />');
    }

    expect(readSource("src/ProductBasicWizard.tsx")).toContain("WIZARD_START_EMPTY_FORM_BUTTON_LABEL");
    expect(readSource("src/ProductBasicWizard.tsx")).toContain("BASIC_WIZARD_OWN_DATA_NOTE");
    expect(readSource("src/HeroExampleSelect.tsx")).toContain("HERO_EXAMPLE_SELECT_PLACEHOLDER");
    expect(readSource("src/PhmaxDashboardPage.tsx")).toContain("openModuleForOwnData");
    expect(readSource("src/pv/PvQuickOnboardingGuide.tsx")).toContain("CALCULATOR_GLOBAL_DISPLAY_HINT");
    expect(readSource("src/PhmaxZsPage.tsx")).toContain("ZS_PHA_BASIC_WIZARD_STEPS");
    expect(readSource("src/PhmaxZsPage.tsx")).toContain("ZS_PHP_BASIC_WIZARD_STEPS");
  });

  it("dashboard Σ a koherence (0.3.12)", () => {
    expect(readSource("src/phmax-dashboard-cross-phmax.ts")).toContain("formatCrossPhmaxSliceLabel");
    expect(readSource("src/PhmaxDashboardPage.tsx")).toContain("coherenceWarningModuleId");
    expect(readSource("src/PhmaxDashboardPage.tsx")).toContain("offerClearBrowserDataAfterDashboardExport");
  });
});
