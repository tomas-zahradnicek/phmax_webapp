import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function readSource(relPath: string) {
  return fs.readFileSync(path.resolve(repoRoot, relPath), "utf8");
}

describe("UX contract: PV tables readability guards", () => {
  it("methodology tables keep text band headers with explicit line break helper", () => {
    const src = readSource("src/phmax-pv-methodology-tables.tsx");

    expect(src).toContain("function renderBandLabelWithBreak");
    expect(src).toContain('const splitToken = " do ";');
    expect(src).toContain("<br />");
    expect(src).toContain("{renderBandLabelWithBreak(lab)}");
    expect(src).toContain("Počet tříd");
    expect(src).toContain("pásmo průměrné denní doby provozu");
    expect(src).toContain("počtu tříd");
  });

  it("Tabulka 2 keeps 6+continuation segmentation instead of one wide row", () => {
    const src = readSource("src/phmax-pv-methodology-tables.tsx");

    expect(src).toContain("PV_CELODENNI_BAND_OPTIONS.slice(0, 6)");
    expect(src).toContain("PV_CELODENNI_BAND_OPTIONS.slice(6)");
    expect(src).toContain("Pokračování");
    expect(src).toContain("row.slice(0, 6)");
    expect(src).toContain("row.slice(6)");
    expect(src).toContain("Tabulka je rozdělena do navazujících bloků pro lepší čitelnost");
    expect(src).toContain('className="pv-methodology-tbody--celodenni-pair"');
  });

  it("PV workplace verification matrix keeps segmented 6-column rendering", () => {
    const src = readSource("src/PhmaxPvPage.tsx");

    expect(src).toContain("const segmentSize = 6;");
    expect(src).toContain("const columnSegments: number[][] = [];");
    expect(src).toContain("{columnSegments.length > 1 ? (");
    expect(src).toContain("Tabulka je rozdělena do navazujících bloků pro lepší čitelnost");
    expect(src).toContain('segmentIndex === 0 ? "Sloupec (pásmo)" : "Pokračování"');
    expect(src).toContain('segmentIndex === 0 ? "PHmax základ (h/týd.)" : "Pokračování"');
    expect(src).toContain("{renderBandLabelWithBreak(bandLabels[j])}");
    expect(src).toContain('className="sd-phmax-breakdown pv-appendix-verify-matrix"');
    expect(src).toContain("pásmům průměrné denní doby provozu");
    expect(src).toContain("tabulky 1–3 níže");
  });

  it("print stylesheet keeps PV matrix page-break hints (27C)", () => {
    const css = readSource("src/styles.css");

    expect(css).toContain("/* PV (27C):");
    expect(css).toContain(".pv-methodology-tbody--celodenni-pair");
    expect(css).toContain(".pv-appendix-verify-matrix thead");
    expect(css).toContain("display: table-header-group !important");
  });
});
