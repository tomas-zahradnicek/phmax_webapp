import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("E2E smoke contract", () => {
  it("Playwright PV mobilní smoke je v repozitáři", () => {
    expect(fs.existsSync(path.resolve(repoRoot, "playwright.config.ts"))).toBe(true);
    expect(fs.existsSync(path.resolve(repoRoot, "e2e/pv-mobile-smoke.spec.ts"))).toBe(true);
    const spec = readSource("e2e/pv-mobile-smoke.spec.ts");
    expect(spec).toContain("calculator-mobile-scroll-results");
    expect(spec).toContain("calculator-mobile-summary-chip");
    expect(readSource("package.json")).toContain('"test:e2e"');
  });

  it("Dashboard KPI strip zobrazuje stav modulu", () => {
    const dash = readSource("src/PhmaxDashboardPage.tsx");
    expect(dash).toContain("dash-kpi-tile__status");
    expect(dash).toContain("dash-kpi-tile__detail");
    expect(dash).toContain("Začít u ukázky");
    expect(readSource("src/styles.css")).toContain(".dash-kpi-tile__status--ok");
  });
});
