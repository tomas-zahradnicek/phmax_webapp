import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: compare panel side-by-side pattern", () => {
  it("shared compare panel keeps human-oriented verdict copy", () => {
    const src = readSource("src/CompareVariantsPanel.tsx");

    expect(src).toContain("function compareVerdict");
    expect(src).toContain("Vyšší PHmax má varianta");
    expect(src).toContain("Co to znamená v praxi:");
    expect(src).toContain("compare-panel__verdict");
    expect(src).toContain("compare-panel__practice-note");
  });

  it("all products render compare preview panel in named snapshots section", () => {
    const zs = readSource("src/PhmaxZsPage.tsx");
    const ss = readSource("src/PhmaxSsPage.tsx");
    const pv = readSource("src/PhmaxPvPage.tsx");
    const sd = readSource("src/PhmaxSdPage.tsx");

    for (const src of [zs, ss, pv, sd]) {
      expect(src).toContain("<CompareVariantsPanel");
      expect(src).toContain('title="Porovnání 2 variant (náhled)"');
      expect(src).toContain("result={");
      expect(src).toContain("emptyHint=");
    }
  });
});
