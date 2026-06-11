import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("CalculatorHeroShell contract (variant A)", () => {
  it("definuje společný layout a podpůrné komponenty", () => {
    expect(readSource("src/CalculatorHeroShell.tsx")).toContain("calculator-hero-shell--pro");
    expect(readSource("src/CalculatorHeroShell.tsx")).toContain("calculator-hero-work-card");
    expect(readSource("src/CalculatorHeroShell.tsx")).toContain("CalculatorHeroSettingsMenu");
    expect(readSource("src/CalculatorHeroShell.tsx")).toContain("CalculatorHeroKpiChips");
    expect(readSource("src/CalculatorHeroShell.tsx")).toContain("CalculatorHeroCollapsibleHint");
    expect(readSource("src/CalculatorHeroSettingsMenu.tsx")).toContain("Zobrazení");
    expect(readSource("src/CalculatorHeroSettingsMenu.tsx")).toContain("createPortal");
    expect(readSource("src/CalculatorHeroSettingsMenu.tsx")).toContain("hero-toolbar-dropdown-portal-root");
    expect(readSource("src/styles.css")).toContain(".calculator-hero-settings__panel--portal");
    expect(readSource("src/styles.css")).toContain(".calculator-hero-shell");
    expect(readSource("src/styles.css")).toContain(".calculator-hero-kpi-chips");
    expect(readSource("src/CalculatorHeroKpiChips.tsx")).toContain("calculator-hero-kpi-chips__status-icon");
    expect(readSource("src/styles.css")).toContain(".calculator-hero-work-card");
    expect(readSource("src/calculator-ui-constants.ts")).toContain("HERO_EXPORT_TOOLS_LABEL");
    expect(readSource("src/styles.css")).toContain("glossary-icon-btn--tile");
  });

  it("produktové hero moduly používají CalculatorHeroShell", () => {
    for (const file of [
      "src/pv/PvHeroHeader.tsx",
      "src/zs/ZsHeroHeader.tsx",
      "src/ss/SsHeroHeader.tsx",
      "src/nv75/Nv75HeroHeader.tsx",
      "src/sd/SdHeroHeader.tsx",
    ]) {
      const src = readSource(file);
      expect(src).toContain("CalculatorHeroShell");
      expect(src).not.toContain("CalculatorHeroDisplayControls");
      expect(src).not.toContain("HeroExpertStrip");
    }
  });

  it("Přehled používá CalculatorHeroShell bez panelu Zobrazení", () => {
    const dash = readSource("src/dashboard/DashHeroHeader.tsx");
    expect(dash).toContain("CalculatorHeroShell");
    expect(dash).toContain("showDisplaySettings={false}");
    expect(readSource("src/PhmaxDashboardPage.tsx")).toContain("DashHeroHeader");
    expect(readSource("src/PhmaxDashboardPage.tsx")).not.toMatch(/<header className="hero hero--feature">/);
  });
});
