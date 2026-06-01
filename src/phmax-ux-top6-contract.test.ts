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
      "src/ZsPhaPhpBasicGuide.tsx",
      "src/zs-basic-wizard.ts",
      "src/useQuickOnboarding.ts",
      "src/HeroCompactToolbar.tsx",
      "src/HeroToolbarDropdown.tsx",
      "src/hero-toolbar-portal-context.tsx",
      "src/CalculatorWorkflowDock.tsx",
      "src/CalculatorProductShell.tsx",
      "src/DisplayDensityToggle.tsx",
      "src/display-density.ts",
      "src/CalculatorStickyContextBar.tsx",
    ]) {
      expect(fs.existsSync(path.resolve(repoRoot, file))).toBe(true);
    }
    const css = readSource("src/styles.css");
    expect(css).toContain(".result-anchor-card");
    expect(css).toContain(".page-toc");
    expect(css).toContain("body:has(.calculator-mobile-scroll-results) .page-toc-mobile-trigger");
    expect(css).toContain("writing-mode: vertical-rl");
    expect(css).toContain("--calculator-mobile-results-reserve");
    expect(css).toContain("--calculator-mobile-results-height");
    expect(css).toContain(".calculator-mobile-summary-chip");
    expect(css).toContain(".calculator-input-issue-banner");
    expect(css).toContain(".calculator-shell--basic .ux-expert-only");
    expect(css).toContain(".zs-basic-wizard-active");
    expect(css).toContain(".hero-compact-toolbar");
    expect(css).toContain(".calculator-shell--density-compact");
    expect(css).toContain(".workflow-dock");
    expect(css).toContain(".workflow-dock__mobile-fold");
    expect(css).toContain(".calculator-mobile-scroll-results--pinned");
    expect(css).toContain(".product-basic-wizard-active");
    expect(css).toContain(".basic-compare-preview");
    expect(css).toContain(".dash-new-user-card");
    expect(css).toContain(".zs-pha-php-basic-guide");
    expect(css).toContain(".calculator-shell__supplement--before");
    expect(css).toContain(".calculator-shell--focus .calculator-shell__supplement--after");
    expect(css).toContain("z-index: 10200");
    expect(css).toContain(".calculator-sticky-context");
    expect(css).toContain("display: none !important");
    expect(css).toContain(".calculator-sticky-context");
    expect(css).toContain(".ux-semantic--info");
    expect(css).toContain(".hero-compact-toolbar__primary .hero-action-icon-btn");
    expect(css).toContain(".hero-toolbar-dropdown-portal-root");
    expect(css).toContain(".hero-expert-strip");
    expect(css).toContain(".dash-kpi-strip");
    expect(css).toContain(".dash-kpi-tile__detail");
    expect(css).toContain(".dash-kpi-tile--clickable");
    expect(css).toContain(".result-anchor-card__issue-summaries");
    expect(css).toContain("--calculator-dock-min");
  });

  it("PV/ŠD/SŠ používají CalculatorProductShell, CalculatorWorkflowDock a TOC", () => {
    for (const page of ["src/PhmaxPvPage.tsx", "src/PhmaxSdPage.tsx", "src/PhmaxSsPage.tsx"]) {
      const src = readSource(page);
      expect(src).toMatch(/CalculatorProductShell|PvCalculatorShell|SdCalculatorShell/);
      expect(src).toMatch(
        /CalculatorWorkflowDock|PvWorkflowDockPanel|PvCalculatorShell|SdWorkflowDockPanel|SdCalculatorShell/,
      );
      expect(src).toMatch(/PageTableOfContents|tocSections=/);
      expect(src).toContain("calculatorShellClassName(viewMode, displayDensity, focusMode)");
      expect(src).not.toContain("ProductFloatingNav");
    }
  });

  it("všechny kalkulačky sdílí workspaceDockLabel Kontext výpočtu", () => {
    expect(readSource("src/calculator-ui-constants.ts")).toContain(
      'CALCULATOR_WORKSPACE_DOCK_LABEL = "Kontext výpočtu"',
    );
    for (const page of [
      "src/PhmaxPvPage.tsx",
      "src/PhmaxSdPage.tsx",
      "src/PhmaxSsPage.tsx",
      "src/PhmaxZsPage.tsx",
      "src/PhmaxNv75DeputyPage.tsx",
    ]) {
      const src = readSource(page);
      expect(src).toContain("workspaceDockLabel={CALCULATOR_WORKSPACE_DOCK_LABEL}");
    }
    expect(readSource("src/CalculatorWorkflowDock.tsx")).toContain("CALCULATOR_WORKSPACE_DOCK_LABEL");
    expect(readSource("src/CalculatorWorkspaceLayout.tsx")).toContain("CALCULATOR_WORKSPACE_DOCK_LABEL");
  });

  it("kalkulačky mají kompaktní hero toolbar a hustotu zobrazení", () => {
    expect(readSource("src/HeroCompactToolbar.tsx")).toContain('aria-label="Hlavní akce"');
    expect(readSource("src/HeroCompactToolbar.tsx")).toContain("HeroToolbarSaveButton");
    for (const page of [
      "src/PhmaxPvPage.tsx",
      "src/PhmaxSdPage.tsx",
      "src/PhmaxSsPage.tsx",
      "src/PhmaxNv75DeputyPage.tsx",
      "src/PhmaxZsPage.tsx",
    ]) {
      const toolbarSrc =
        page === "src/PhmaxZsPage.tsx"
          ? readSource("src/zs/ZsHeroToolbar.tsx")
          : page === "src/PhmaxPvPage.tsx"
            ? readSource("src/pv/PvHeroToolbar.tsx")
            : page === "src/PhmaxSdPage.tsx"
              ? readSource("src/sd/SdHeroToolbar.tsx")
              : page === "src/PhmaxSsPage.tsx"
                ? readSource("src/ss/SsHeroToolbar.tsx")
                : page === "src/PhmaxNv75DeputyPage.tsx"
                  ? readSource("src/nv75/Nv75HeroToolbar.tsx")
                  : readSource(page);
      const heroSrc =
        page === "src/PhmaxZsPage.tsx"
          ? readSource("src/zs/ZsHeroHeader.tsx")
          : page === "src/PhmaxPvPage.tsx"
            ? readSource("src/pv/PvHeroHeader.tsx")
            : page === "src/PhmaxSdPage.tsx"
              ? readSource("src/sd/SdHeroHeader.tsx")
              : page === "src/PhmaxSsPage.tsx"
                ? readSource("src/ss/SsHeroHeader.tsx")
                : page === "src/PhmaxNv75DeputyPage.tsx"
                  ? readSource("src/nv75/Nv75HeroHeader.tsx")
                  : readSource(page);
      expect(toolbarSrc).toContain("HeroCompactToolbar");
      expect(heroSrc).toContain("DisplayDensityToggle");
      expect(heroSrc).toMatch(/hero-zone-actions--toolbar|(Zs|Pv|Sd|Ss|Nv75)HeroToolbar/);
    }
    expect(readSource("src/PhmaxSdPage.tsx")).toContain('data-section="sd-vysledek"');
    expect(readSource("src/ss/PhmaxSsUnitsForm.tsx")).toContain('data-section="ss-vysledek"');
    expect(readSource("src/nv75/Nv75HeroToolbar.tsx")).toContain("hero-zone-actions");
    expect(readSource("src/PhmaxZsPage.tsx")).toContain("ZsCalculatorShell");
    expect(readSource("src/zs/ZsWorkflowDockPanel.tsx")).toContain("CalculatorWorkflowDock");
  });

  it("ZŠ má CalculatorProductShell (MASTER), CalculatorWorkflowDock a PageTableOfContents", () => {
    const src = readSource("src/PhmaxZsPage.tsx");
    const phmaxTab = readSource("src/zs/ZsPhmaxTabPanel.tsx");
    expect(src).toContain("ZsCalculatorShell");
    expect(readSource("src/zs/ZsCalculatorShell.tsx")).toContain("dockSticky");
    expect(readSource("src/zs/ZsWorkflowDockPanel.tsx")).toContain("CalculatorWorkflowDock");
    expect(src).toMatch(/PageTableOfContents|tocSections=/);
    expect(readSource("src/zs/ZsHeroToolbar.tsx")).toContain("ux-expert-only");
    expect(readSource("src/zs/ZsPhmaxMinoritySection.tsx")).toContain('sectionId="minority"');
    expect(readSource("src/zs/ZsPhmaxGymSection.tsx")).toContain('sectionId="gym"');
    expect(readSource("src/zs/ZsPhmaxMixedSection.tsx")).toContain('sectionId="mixed"');
    expect(readSource("src/zs/ZsPhmaxExtrasSection.tsx")).toContain('sectionId="extras"');
    expect(phmaxTab).toContain("ZsPhmaxMinoritySection");
    expect(phmaxTab).toContain("ZsPhmaxGymSection");
    expect(phmaxTab).toContain("ZsPhmaxMixedSection");
    expect(phmaxTab).toContain("ZsPhmaxExtrasSection");
    expect(readSource("src/zs/ZsPhmaxSec16Section.tsx")).toContain('sectionId="sec16"');
    expect(readSource("src/zs/ZsPhmaxSpecialSection.tsx")).toContain('sectionId="special"');
    expect(readSource("src/zs/ZsPhmaxPsychSection.tsx")).toContain('sectionId="psych"');
    expect(readSource("src/zs/ZsPhmaxHealthSection.tsx")).toContain('sectionId="health"');
    expect(readSource("src/zs/ZsPhaTabPanel.tsx")).toContain('sectionId="pha"');
    expect(readSource("src/zs/ZsPhpTabPanel.tsx")).toContain('sectionId="php"');
    expect(phmaxTab).toContain("ZsPhmaxSec16Section");
    expect(phmaxTab).toContain("ZsPhmaxSpecialSection");
    expect(phmaxTab).toContain("ZsPhmaxPsychSection");
    expect(phmaxTab).toContain("ZsPhmaxHealthSection");
    expect(src).toContain("ZsPhaPhpTabPanels");
    expect(readSource("src/zs/ZsPhaPhpTabPanels.tsx")).toContain("ZsPhaTabPanel");
    expect(readSource("src/zs/ZsPhaPhpTabPanels.tsx")).toContain("ZsPhpTabPanel");
    expect(phmaxTab).toContain("ZsPhmaxBasicSection");
    expect(readSource("src/zs/ZsPhmaxBasicSection.tsx")).toContain('data-section="basic"');
    expect(src).toContain("ZsPhmaxTabPanel");
    expect(src).toContain("ZsSetupSection");
    expect(src).toContain("ZsPhaPhpTabPanels");
    expect(readSource("src/zs/ZsPhaPhpTabPanels.tsx")).toContain("ZsOverviewSection");
    expect(src).toContain("ZsHeroHeader");
    expect(readSource("src/zs/ZsHeroHeader.tsx")).toContain("ZsHeroToolbar");
    expect(readSource("src/zs/ZsWizardShell.tsx")).toContain("ZsBasicWizard");
    expect(readSource("src/zs/ZsSetupSection.tsx")).toContain('data-section="setup"');
    expect(readSource("src/zs/ZsOverviewSection.tsx")).toContain('data-wizard-step="5"');
    expect(src).toContain("ZsWizardShell");
    expect(readSource("src/zs/ZsWizardShell.tsx")).toContain("ZsBasicWizard");
    expect(readSource("src/zs/ZsWizardShell.tsx")).toContain("ZsPhaPhpBasicGuide");
    expect(readSource("src/CalculatorWorkflowDock.tsx")).toContain("workflow-dock__mobile-fold");
    expect(readSource("src/CalculatorWorkflowDock.tsx")).toContain("CalculatorMobileScrollResults");
    expect(readSource("src/CalculatorMobileScrollResults.tsx")).toContain("publishMobileResultsHeight");
    expect(readSource("src/calculator-ui-constants.ts")).toContain("LAY_USER_QUICK_START_MOBILE_UX");
    expect(readSource("src/CalculatorProductShell.tsx")).toContain("calculator-shell__supplement--before");
    expect(readSource("src/App.tsx")).toContain("recordDashboardProductVisit");
    expect(src).toContain("zs-basic-wizard-active");
    expect(readSource("src/zs/ZsSetupSection.tsx")).toContain('data-wizard-step="1"');
    expect(readSource("src/zs/ZsPhmaxSummarySection.tsx")).toContain('data-wizard-step="4"');
    expect(readSource("src/zs-basic-wizard.ts")).toContain("ZS_BASIC_WIZARD_STEP_COUNT = 5");
  });

  it("kořen repa neobsahuje legacy PhmaxSsPage (jen src/)", () => {
    expect(fs.existsSync(path.join(repoRoot, "PhmaxSsPage.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, "src", "PhmaxSsPage.tsx"))).toBe(true);
  });

  it("useQuickOnboarding je výchozí zavřený a nečte localStorage", () => {
    const hook = readSource("src/useQuickOnboarding.ts");
    expect(hook).toContain("useState(false)");
    expect(hook).not.toContain("localStorage");
  });

  it("produkty sdílí useQuickOnboarding a hero tlačítko nápovědy", () => {
    for (const page of [
      "src/PhmaxPvPage.tsx",
      "src/PhmaxSdPage.tsx",
      "src/PhmaxZsPage.tsx",
      "src/PhmaxSsPage.tsx",
      "src/PhmaxNv75DeputyPage.tsx",
    ]) {
      const src = readSource(page);
      const heroSrc =
        page === "src/PhmaxZsPage.tsx"
          ? readSource("src/zs/ZsHeroHeader.tsx")
          : page === "src/PhmaxPvPage.tsx"
            ? readSource("src/pv/PvHeroHeader.tsx")
            : page === "src/PhmaxSdPage.tsx"
              ? readSource("src/sd/SdHeroHeader.tsx")
              : page === "src/PhmaxSsPage.tsx"
                ? readSource("src/ss/SsHeroHeader.tsx")
                : page === "src/PhmaxNv75DeputyPage.tsx"
                  ? readSource("src/nv75/Nv75HeroHeader.tsx")
                  : readSource(page);
      const onboardingSrc =
        page === "src/PhmaxZsPage.tsx"
          ? readSource("src/zs/ZsQuickOnboardingGuide.tsx")
          : page === "src/PhmaxPvPage.tsx"
            ? readSource("src/pv/PvQuickOnboardingGuide.tsx")
            : page === "src/PhmaxSdPage.tsx"
              ? readSource("src/sd/SdQuickOnboardingGuide.tsx")
              : page === "src/PhmaxSsPage.tsx"
                ? readSource("src/ss/SsQuickOnboardingGuide.tsx")
                : page === "src/PhmaxNv75DeputyPage.tsx"
                  ? readSource("src/nv75/Nv75QuickOnboardingGuide.tsx")
                  : readSource(page);
      expect(src).toContain("useQuickOnboarding");
      expect(heroSrc).toContain("QuickOnboardingHeroButton");
      expect(onboardingSrc).toContain("QuickOnboarding");
    }
    expect(readSource("src/calculator-ui-constants.ts")).toContain("PHMAX_PV_ONBOARDING_LS_KEY");
    expect(readSource("src/calculator-ui-constants.ts")).toContain("PHMAX_SS_ONBOARDING_LS_KEY");
    expect(readSource("src/calculator-ui-constants.ts")).toContain("PHMAX_NV75_ONBOARDING_LS_KEY");
  });

  it("PV/SŠ/NV75 sdílí ProductBasicWizard, ŠD má SdBasicWizard", () => {
    expect(readSource("src/product-basic-wizard.ts")).toContain("PRODUCT_BASIC_WIZARD_STEP_COUNT = 3");
    for (const page of ["src/PhmaxPvPage.tsx", "src/PhmaxSsPage.tsx", "src/PhmaxNv75DeputyPage.tsx"]) {
      const src = readSource(page);
      expect(src).toContain("ProductBasicWizard");
      expect(src).toContain("useProductBasicWizard");
    }
    const sd = readSource("src/PhmaxSdPage.tsx");
    expect(sd).toContain("SdBasicWizard");
    expect(sd).toContain("sd-basic-wizard");
  });

  it("NV75 má CalculatorProductShell, CalculatorWorkflowDock a TOC", () => {
    const src = readSource("src/PhmaxNv75DeputyPage.tsx");
    expect(src).toContain("CalculatorProductShell");
    expect(src).toContain("CalculatorWorkflowDock");
    expect(src).toMatch(/tocSections=|PageTableOfContents/);
    expect(src).toContain("calculatorShellClassName(viewMode, displayDensity, focusMode)");
    expect(src).not.toContain("ProductFloatingNav");
    expect(src).toContain('data-section="nv75-vstupy"');
    expect(src).toContain("Nv75ResultsSection");
    expect(readSource("src/nv75/Nv75ResultsSection.tsx")).toContain('data-section="nv75-vysledek"');
    expect(src).toContain("CalculatorWorkflowDock");
    expect(src).toContain("const nv75Workflow = useMemo");
  });

  it("ZŠ TOC obsahuje panely wizardu PHmax", () => {
    const src = readSource("src/PhmaxZsPage.tsx");
    const phmaxTab = readSource("src/zs/ZsPhmaxTabPanel.tsx");
    expect(src).toContain('id: "zs-phmax-exceptions"');
    expect(phmaxTab).toContain('data-section="zs-phmax-exceptions"');
  });
});
