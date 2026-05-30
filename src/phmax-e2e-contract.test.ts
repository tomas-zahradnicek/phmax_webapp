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
    for (const specFile of [
      "e2e/pv-mobile-smoke.spec.ts",
      "e2e/sd-mobile-smoke.spec.ts",
      "e2e/zs-mobile-smoke.spec.ts",
      "e2e/ss-mobile-smoke.spec.ts",
      "e2e/nv75-mobile-smoke.spec.ts",
      "e2e/desktop-toc-smoke.spec.ts",
      "e2e/dashboard-deep-link-smoke.spec.ts",
    ]) {
      expect(fs.existsSync(path.resolve(repoRoot, specFile))).toBe(true);
    }
    const pvSpec = readSource("e2e/pv-mobile-smoke.spec.ts");
    expect(pvSpec).toContain("calculator-mobile-scroll-results");
    expect(pvSpec).toContain("calculator-mobile-summary-chip");
    expect(readSource("e2e/smoke-helpers.ts")).toContain("openDashboardAttentionModule");
    expect(readSource("e2e/dashboard-deep-link-smoke.spec.ts")).toContain("data-pv-row-id");
    expect(readSource("e2e/dashboard-deep-link-smoke.spec.ts")).toContain('[data-section="basic"]');
    expect(readSource("package.json")).toContain('"test:e2e"');
    expect(readSource(".github/workflows/ci.yml")).toContain("npm run test:e2e");
    expect(readSource(".github/workflows/ci.yml")).toContain("npm run lint");
    expect(fs.existsSync(path.resolve(repoRoot, "docs/acceptance-pv-zs-nv75.md"))).toBe(true);
  });

  it("Dashboard KPI strip zobrazuje stav modulu a je klikatelný", () => {
    const dash = readSource("src/PhmaxDashboardPage.tsx");
    expect(dash).toContain("dash-kpi-tile__status");
    expect(dash).toContain("dash-kpi-tile__detail");
    expect(dash).toContain("dash-kpi-tile--clickable");
    expect(dash).toContain("openDashboardKpiModule");
    expect(dash).toContain("Začít u ukázky");
    expect(readSource("src/styles.css")).toContain(".dash-kpi-tile__status--ok");
  });
});
