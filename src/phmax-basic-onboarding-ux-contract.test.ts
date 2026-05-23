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
    const sd = readSource("src/PhmaxSdPage.tsx");
    const ss = readSource("src/PhmaxSsPage.tsx");
    const nv75 = readSource("src/PhmaxNv75DeputyPage.tsx");

    expect(pv).toContain('heroExampleSelectId={PV_HERO_EXAMPLE_SELECT_ID}');
    expect(readSource("src/pv-basic-wizard.ts")).toContain('PV_HERO_EXAMPLE_SELECT_ID = "pv-hero-example-select"');
    expect(pv).toContain('id="pv-hero-example-select"');

    expect(sd).toContain('id="sd-hero-example-select"');
    expect(readSource("src/sd-basic-wizard.ts")).toContain('SD_HERO_EXAMPLE_SELECT_ID = "sd-hero-example-select"');
    expect(readSource("src/SdBasicWizard.tsx")).toContain("SD_HERO_EXAMPLE_SELECT_ID");
    expect(readSource("src/ProductBasicWizard.tsx")).toContain("document.getElementById");

    expect(ss).toContain("SS_HERO_EXAMPLE_SELECT_ID");
    expect(ss).toContain('id="ss-hero-example-select"');
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

  it("SŠ §16 má srozumitelnou větu u řádků", () => {
    expect(readSource("src/ss/phmax-ss-par16.ts")).toContain("PHMAX_SS_PAR16_ROW_SUMMARY");
    expect(readSource("src/ss/PhmaxSsUnitsForm.tsx")).toContain("PHMAX_SS_PAR16_ROW_SUMMARY");
    expect(readSource("src/ss/PhmaxSsUnitsForm.tsx")).toContain("ss-par16-row-summary");
  });
});
