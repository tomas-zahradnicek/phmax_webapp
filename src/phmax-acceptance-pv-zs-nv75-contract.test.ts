import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("Acceptance checklist contract (PV, ZŠ, NV75)", () => {
  it("checklist dokument má vyplněné OK sloupce a záznam běhu", () => {
    const doc = readSource("docs/acceptance-pv-zs-nv75.md");
    expect(doc).toContain("Metodický box u pracoviště");
    expect(doc).toContain("| 2026-05-21 |");
    for (const id of ["P1", "P2", "P3", "P4", "P5", "P6", "Z1", "Z2", "Z3", "Z4", "Z5", "N1", "N2", "N3", "N4", "N5", "N6", "S1"]) {
      expect(doc).toMatch(new RegExp(`\\| ${id} \\|[\\s\\S]*?\\| (E2E|contract|ručně)`));
    }
  });

  it("PV § 1d – metodický box u řádku (P5)", () => {
    const pv = readSource("src/PhmaxPvPage.tsx");
    expect(pv).toContain("pv-row-method-hint");
    expect(pv).toContain("automaticky nepočítá");
    expect(pv).toContain("Kdy přidat další pracoviště");
  });

  it("ZŠ – snapshot, export metadata a PHA záložka (refaktor krok 2–3)", () => {
    const zsPage = readSource("src/PhmaxZsPage.tsx");
    expect(zsPage).toContain("buildZsFormSnapshot");
    expect(zsPage).toContain("useZsFormAutosave");
    expect(zsPage).toContain("ZS_AUTOSAVE_STORAGE_KEY");
    expect(zsPage).toContain("createZsPageHandlers");
    expect(zsPage).toContain("ZsPhmaxTabPanel");
    expect(zsPage).toContain("ZsSetupSection");
    expect(zsPage).toContain("ZsPhaPhpTabPanels");
    expect(readSource("src/zs/ZsPhaPhpTabPanels.tsx")).toContain("ZsOverviewSection");
    expect(zsPage).toContain("ZsHeroHeader");
    expect(zsPage).toContain("ZsQuickOnboardingGuide");
    expect(readSource("src/zs/ZsHeroHeader.tsx")).toContain("ZsHeroToolbar");
    expect(zsPage).toContain("ZsWizardShell");
    expect(zsPage).toContain("ZsPhaPhpTabPanels");
    expect(zsPage).toContain("ZsPhaPhpTabPanels");
    expect(readSource("src/zs/ZsPhaPhpTabPanels.tsx")).toContain("ZsPhaTabPanel");
    expect(readSource("src/zs/ZsPhaPhpTabPanels.tsx")).toContain("ZsPhpTabPanel");
    expect(readSource("src/zs/ZsPhmaxTabPanel.tsx")).toContain("ZsPhmaxBasicSection");
    expect(readSource("src/phmax-sd-acceptance-contract.test.ts")).toContain("sd-summary-dept-hint");
    expect(readSource("src/zs/zs-form-snapshot.ts")).toContain('export const ZS_AUTOSAVE_STORAGE_KEY = "edu-cz-zs-calculator-state"');
    expect(readSource("src/zs/zs-export-rows.ts")).toContain("buildZsExtendedExportMetaRows");
    expect(readSource("src/zs/zs-export-build.ts")).toContain("buildZsExtendedCsvRows");
    expect(readSource("src/zs/zs-audit-actions.ts")).toContain("exportZsAuditJson");
    expect(readSource("src/zs/zs-row-handlers.ts")).toContain("createZsRowHandlers");
    expect(readSource("src/zs/zs-page-handlers.ts")).toContain("createZsPageHandlers");
    expect(readSource("src/zs/use-zs-section-scroll.ts")).toContain("useZsSectionScroll");
    expect(readSource("src/zs/use-zs-wizard-navigation.ts")).toContain("useZsWizardNavigation");
    expect(readSource("src/zs/ZsNamedSnapshotsHeroPanel.tsx")).toContain("ZsNamedSnapshotsHeroPanel");
    expect(readSource("src/zs/zs-summary-rows.ts")).toContain("buildZsSummaryRows");
    expect(readSource("src/zs/ZsPhmaxSummarySection.tsx")).toContain("ZsPhmaxSummarySection");
    expect(readSource("src/zs/ZsPhmaxTabPanel.tsx")).toContain("ZsPhmaxTabPanel");
    expect(readSource("src/zs/ZsSetupSection.tsx")).toContain("ZsSetupSection");
    expect(readSource("src/zs/ZsOverviewSection.tsx")).toContain("ZsOverviewSection");
    expect(readSource("src/ss/create-ss-scroll-to-inputs.ts")).toContain("createSsScrollToInputs");
    expect(readSource("src/pv/create-pv-scroll-to-inputs.ts")).toContain("createPvScrollToInputs");
    expect(readSource("src/sd/create-sd-scroll-to-inputs.ts")).toContain("createSdScrollToInputs");
    expect(readSource("src/nv75/create-nv75-scroll-to-inputs.ts")).toContain("createNv75ScrollToInputs");
    expect(readSource("src/phmax-dashboard-focus.ts")).toContain("getDashboardFocusHint");
    expect(readSource("src/zs/zs-export-actions.ts")).toContain("runZsExportCsv");
    expect(readSource("src/zs/zs-hero-example-load.ts")).toContain("zdravotnicke_zs");
    expect(readSource("src/zs/zs-hero-example-load.ts")).toContain("pha_zss_prep_b45");
    expect(readSource("src/zs/zs-hero-example-load.ts")).toContain("gymnazium_phmax");
    expect(readSource("src/zs/zs-hero-example-load.ts")).toContain("mensina_phmax");
    expect(readSource("src/PhmaxPvPage.tsx")).toContain("PvHeroHeader");
    expect(readSource("src/pv/PvHeroHeader.tsx")).toContain("PvHeroToolbar");
    expect(readSource("src/PhmaxSdPage.tsx")).toContain("SdHeroHeader");
    expect(readSource("src/sd/SdHeroHeader.tsx")).toContain("SdHeroToolbar");
    expect(zsPage).toContain("ZsCalculatorShell");
    expect(readSource("src/zs/ZsWorkflowDockPanel.tsx")).toContain("CalculatorWorkflowDock");
    expect(readSource("src/zs/ZsPhmaxHealthSection.tsx")).toContain("B11");
  });

  it("PV P6 – tři metodické ukázky mají golden test", () => {
    const t = readSource("src/phmax-pv-hero-examples-acceptance.test.ts");
    expect(t).toContain("meth_pv_1_240");
    expect(t).toContain("meth_pv_2_245");
    expect(t).toContain("meth_pv_3_pha27");
  });

  it("NV75 – export a vložení druhu školy (N5, N6)", () => {
    const nv75 = readSource("src/PhmaxNv75DeputyPage.tsx");
    expect(nv75).toContain("Vložit druh školy/zařízení");
    expect(nv75).toContain("calculatorInputIssueBannerFromVerdict");
    expect(nv75).toContain("Verze release notes");
    expect(nv75).toContain("archivní razítko");
  });
});
