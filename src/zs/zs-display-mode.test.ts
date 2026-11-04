import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ZS_ALL_FIELDS_NOTICE,
  ZS_DISPLAY_MODE_HINT,
  ZS_DISPLAY_MODE_LABELS,
  zsCalculatorShellClassName,
} from "./zs-display-mode";

const root = path.resolve(__dirname, "../..");

function readSource(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("ZŠ režimy zobrazení", () => {
  it("A. má přesně dva režimy Průvodce a Všechna pole", () => {
    expect(Object.values(ZS_DISPLAY_MODE_LABELS)).toEqual(["Průvodce", "Všechna pole"]);
    expect(ZS_DISPLAY_MODE_HINT).toContain("Nezobrazuje kalkulačky PV");
    expect(ZS_ALL_FIELDS_NOTICE).toContain("zůstávají samostatně");
    expect(ZS_ALL_FIELDS_NOTICE).not.toContain("Expertní režim");
  });

  it("E–F. uložený Fokus a Kompaktní nemění třídu rozložení ZŠ", () => {
    const basic = zsCalculatorShellClassName("basic", "compact", "on");
    const expert = zsCalculatorShellClassName("expert", "compact", "on");
    expect(basic).toBe("calculator-shell calculator-shell--basic calculator-shell--density-comfortable");
    expect(expert).toBe("calculator-shell calculator-shell--expert calculator-shell--density-comfortable");
    expect(basic).not.toContain("focus");
    expect(expert).not.toContain("density-compact");
  });

  it("ZŠ ignoruje sdílené klíče a ostatní moduly je dál používají", () => {
    const page = readSource("src/PhmaxZsPage.tsx");
    const hero = readSource("src/zs/ZsHeroHeader.tsx");
    const menu = readSource("src/CalculatorHeroSettingsMenu.tsx");
    expect(page).toContain("zsCalculatorShellClassName(viewMode, displayDensity, focusMode)");
    expect(page).not.toContain("calculatorShellClassName(viewMode, displayDensity, focusMode)");
    expect(hero).toContain("showLayoutControls={false}");
    expect(hero).toContain("ZS_DISPLAY_MODE_LABELS");
    expect(menu).toContain("showLayoutControls");
    for (const file of [
      "src/pv/PvHeroHeader.tsx",
      "src/sd/SdHeroHeader.tsx",
      "src/ss/SsHeroHeader.tsx",
      "src/nv75/Nv75HeroHeader.tsx",
    ]) {
      const src = readSource(file);
      expect(src).not.toContain("showLayoutControls={false}");
      expect(src).toContain("displayDensity={displayDensity}");
      expect(src).toContain("focusMode={focusMode}");
    }
    expect(readSource("src/display-density.ts")).toContain('const STORAGE_KEY = "phmax-display-density"');
    expect(readSource("src/calculator-focus-mode.ts")).toContain('const STORAGE_KEY = "phmax-calculator-focus"');
    expect(readSource("src/PhmaxZsPage.tsx")).toContain('const ZS_VIEW_MODE_LS_KEY = "phmax-zs-view-mode"');
  });
});
