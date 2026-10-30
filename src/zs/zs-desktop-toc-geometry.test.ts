import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(resolve(__dirname, "..", rel), "utf8");
}

describe("ZŠ desktopový rail a kontejner", () => {
  it("otevřený rail odsouvá jen obal ZŠ a zavřený rail šířku nedrží", () => {
    const page = read("PhmaxZsPage.tsx");
    const css = read("styles.css");
    expect(page).toContain("app-shell--zs");
    expect(page).toContain("app-shell--with-toc");

    const blockStart = css.indexOf(".app-shell--zs.app-shell--with-toc:not(:has(.page-toc--rail.page-toc--open))");
    const mediaStart = css.lastIndexOf("@media (min-width: 1200px)", blockStart);
    const block = css.slice(blockStart, blockStart + 700);

    expect(mediaStart).toBeGreaterThanOrEqual(0);
    expect(mediaStart).toBeLessThan(blockStart);
    expect(block).toContain(":has(.page-toc--rail.page-toc--open)");
    expect(block).toContain("--zs-toc-rail-clearance: calc(12px + 248px + 24px)");
    expect(block).toContain("padding-right: max(0px, calc(var(--zs-toc-rail-clearance) - (100vw - 100%) / 2))");
    expect(block).not.toContain("overflow-x");
    expect(block).not.toContain("1500px");
    expect(css).toContain(".app-shell--with-toc .container--app");
  });

  it("nemění dock od 1500 px ani mobilní skrytí souhrnu", () => {
    const css = read("styles.css");
    expect(css).toContain("@media (min-width: 1500px)");
    expect(css).toContain(
      "grid-template-columns: minmax(0, 1fr) minmax(var(--calculator-dock-min), var(--calculator-dock-max));",
    );
    expect(css).toContain("body:has(.page-toc--rail.page-toc--open) .calculator-mobile-scroll-results");
    expect(css).toContain(".zs-phmax-module-row > details.ux-collapsible:only-child:has([data-section=\"sec16\"])");
    expect(css).toContain(".zs-phmax-stage-row > .zs-phmax-stage:only-child");
  });
});
