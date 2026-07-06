import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("E2E smoke contract", () => {
  it("Playwright smoke je v repozitáři (PV, ŠD, ZŠ, SŠ, NV75 + desktop TOC)", () => {
    expect(fs.existsSync(path.resolve(repoRoot, "playwright.config.ts"))).toBe(true);
    expect(readSource("playwright.config.ts")).toContain("desktop-chrome");
    expect(readSource("playwright.config.ts")).toContain("post-deploy)-smoke");
    expect(readSource("playwright.config.ts")).toContain("metric-label-casing");
    expect(readSource(".github/workflows/ci.yml")).toContain("npm run build");
    for (const specFile of [
      "e2e/pv-mobile-smoke.spec.ts",
      "e2e/sd-mobile-smoke.spec.ts",
      "e2e/zs-mobile-smoke.spec.ts",
      "e2e/ss-mobile-smoke.spec.ts",
      "e2e/nv75-mobile-smoke.spec.ts",
      "e2e/desktop-toc-smoke.spec.ts",
      "e2e/dashboard-deep-link-smoke.spec.ts",
      "e2e/dashboard-post-deploy-smoke.spec.ts",
      "e2e/dashboard-ux-013.spec.ts",
      "e2e/metric-label-casing.spec.ts",
      "e2e/own-data-ux-smoke.spec.ts",
    ]) {
      expect(fs.existsSync(path.resolve(repoRoot, specFile))).toBe(true);
    }
    const pvSpec = readSource("e2e/pv-mobile-smoke.spec.ts");
    expect(pvSpec).toContain("calculator-mobile-scroll-results");
    expect(pvSpec).toContain("calculator-mobile-summary-chip");
    expect(readSource("e2e/smoke-helpers.ts")).toContain("openDashboardAttentionModule");
    expect(readSource("e2e/smoke-helpers.ts")).toContain("openDashboardKpiModule");
    expect(readSource("e2e/smoke-helpers.ts")).toContain("openDashboardModuleCard");
    expect(readSource("e2e/smoke-helpers.ts")).toContain("clickHeroExportCsv");
    expect(readSource("e2e/dashboard-post-deploy-smoke.spec.ts")).toContain("clickHeroExportCsv");
    expect(readSource("src/phmax-dashboard-focus.ts")).toContain("getDashboardFocusHint");
    expect(readSource("e2e/dashboard-deep-link-smoke.spec.ts")).toContain("data-pv-row-id");
    expect(readSource("e2e/dashboard-deep-link-smoke.spec.ts")).toContain('[data-section="basic"]');
    expect(readSource("e2e/dashboard-deep-link-smoke.spec.ts")).toContain("data-nv75-row-id");
    expect(readSource("e2e/dashboard-deep-link-smoke.spec.ts")).toContain("data-sd-dept-id");
    expect(readSource("e2e/dashboard-deep-link-smoke.spec.ts")).toContain("Odeslat export na IS (POST)");
    expect(readSource("e2e/own-data-ux-smoke.spec.ts")).toContain('getByTestId("dash-new-user-checklist")');
    expect(readSource("src/dashboard/DashboardNewUserChecklist.tsx")).toContain('data-testid="dash-new-user-checklist"');
    expect(readSource("e2e/dashboard-ux-013.spec.ts")).toContain('aria-live", "assertive"');
    expect(readSource("src/phmax-sd-dashboard-focus.ts")).toContain("findFirstSdDashboardFocusHint");
    expect(readSource("playwright.config.ts")).toContain("own-data-ux-smoke");
    expect(readSource("playwright.config.ts")).toContain("e2e-static-preview");
    expect(readSource("package.json")).toContain('"test:e2e"');
    expect(readSource(".github/workflows/ci.yml")).toContain("npm run test:e2e");
    expect(readSource(".github/workflows/ci.yml")).toContain("npm run lint");
    expect(fs.existsSync(path.resolve(repoRoot, "docs/acceptance-pv-zs-nv75.md"))).toBe(true);
  });

  it("Dashboard školní profil má klikatelné čipy modulů", () => {
    const dash = readSource("src/PhmaxDashboardPage.tsx");
    expect(dash).toContain("DashboardSchoolProfile");
    expect(dash).toContain("buildDashboardSchoolProfile");
    expect(readSource("src/dashboard/DashboardSchoolProfile.tsx")).toContain("dash-school-profile__chip");
    expect(readSource("e2e/smoke-helpers.ts")).toContain("dash-school-profile__chip");
    expect(dash).toContain("Začít u ukázky");
    expect(readSource("src/styles.css")).toContain(".dash-school-profile__chip");
  });
});
