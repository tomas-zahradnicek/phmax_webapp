import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(resolve(__dirname, "..", rel), "utf8");
}

describe("ZŠ šířka formuláře vedle docku", () => {
  it("nechá dock pod formulářem do 1919 px a jen na obalu ZŠ", () => {
    const css = read("styles.css");
    const marker = "@media (min-width: 1500px) and (max-width: 1919px)";
    const at = css.indexOf(marker);
    expect(at).toBeGreaterThan(0);
    const block = css.slice(at, at + 500);
    expect(block).toContain(".app-shell--zs .calculator-workspace");
    expect(block).toContain("grid-template-columns: 1fr;");
    expect(block).toContain(".app-shell--zs .calculator-workspace__dock");
    expect(block).toContain("position: static;");
    expect(block).not.toContain("page-toc--open");
    expect(block).not.toContain("overflow-x");
    expect(css).toContain(
      "grid-template-columns: minmax(0, 1fr) minmax(var(--calculator-dock-min), var(--calculator-dock-max));",
    );
  });

  it("nemění TOC mezeru, mobilní souhrn ani rozvržení stupňů", () => {
    const css = read("styles.css");
    expect(css).toContain("--zs-toc-rail-clearance: calc(12px + 248px + 24px)");
    expect(css).toContain("body:has(.page-toc--rail.page-toc--open) .calculator-mobile-scroll-results");
    expect(css).toContain(".zs-phmax-module-row > details.ux-collapsible:only-child:has([data-section=\"sec16\"])");
    expect(css).toContain(".zs-phmax-stage-row > .zs-phmax-stage:only-child");
    expect(css).toContain("@media (min-width: 1500px)");
    const page = read("PhmaxZsPage.tsx");
    expect(page).toContain("app-shell--zs");
  });
});
