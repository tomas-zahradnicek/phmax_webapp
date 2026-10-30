import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(resolve(__dirname, "..", rel), "utf8");
}

describe("ZŠ Lite přetékání dekorace", () => {
  it("ořízne jen vodorovný přesah hero a karet na stránce ZŠ Lite", () => {
    const css = read("styles.css");
    const heroSel = css.indexOf(".phmax-lite-page--zs .hero--feature,");
    const cardSel = css.indexOf(".phmax-lite-page--zs .section-card {");
    expect(heroSel).toBeGreaterThan(css.indexOf(".phmax-lite-page--zs .phmax-lite-form__field"));
    expect(cardSel).toBeGreaterThan(heroSel);
    expect(cardSel - heroSel).toBeLessThan(80);
    const block = css.slice(heroSel, heroSel + 180);
    expect(block).toContain("overflow-x: clip;");
    expect(block).not.toContain("overflow-x: hidden");
    expect(block).not.toContain("phmax-lite-page--pv");
    expect(block).not.toContain("phmax-lite-page--sd");
    expect(css).toMatch(/\.hero--feature \{\r?\n[ ]{2}position: relative;\r?\n[ ]{2}overflow: visible;/);
    expect(css).toMatch(/\.section-card \{\r?\n[ ]{2}position: relative;\r?\n[ ]{2}overflow: visible;/);
    expect(css).not.toMatch(/body\s*\{[^}]*overflow-x:\s*hidden/);
  });
});
