import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(resolve(__dirname, "..", rel), "utf8");
}

describe("ZŠ mobilní překryvy Obsah a souhrn", () => {
  it("vlastníky jsou TOC a plovoucí souhrn, ne výpočet", () => {
    const toc = read("PageTableOfContents.tsx");
    const summary = read("CalculatorMobileScrollResults.tsx");
    const dock = read("CalculatorWorkflowDock.tsx");
    expect(toc).toContain('aria-label={tocOpen ? "Skrýt obsah stránky" : "Zobrazit obsah stránky"}');
    expect(toc).toContain('e.key === "Escape"');
    expect(toc).toContain("page-toc--open");
    expect(summary).toContain('aria-label="Skrýt souhrn výsledků"');
    expect(summary).toContain('aria-label="Zobrazit souhrn výsledků"');
    expect(dock).toContain("showMobileScrollResults = !isWideDock");
    expect(dock).toContain('useMatchMedia("(min-width: 1100px)")');
  });

  it("otevřený Obsah do 1099 px schová rozbalený souhrn a desktopový breakpoint nemění", () => {
    const css = read("styles.css");
    const hide = "body:has(.page-toc--rail.page-toc--open) .calculator-mobile-scroll-results";
    const hideAt = css.indexOf(hide);
    const mobileStart = css.lastIndexOf("@media (max-width: 1099px)", hideAt);
    const desktopStart = css.indexOf("@media (min-width: 1100px)", hideAt);
    expect(hideAt).toBeGreaterThan(mobileStart);
    expect(desktopStart).toBeGreaterThan(hideAt);
    expect(css).toContain("body:has(.page-toc--rail.page-toc--open):has(.calculator-mobile-scroll-results)");
    expect(css).toContain("--calculator-mobile-results-height: 0px;");

    const desktopMarker = "@media (min-width: 1100px)";
    let desktopHide = "";
    for (let at = css.indexOf(desktopMarker); at >= 0; at = css.indexOf(desktopMarker, at + desktopMarker.length)) {
      const window = css.slice(at, at + 220);
      if (window.includes(".calculator-mobile-scroll-results") && window.includes("display: none !important")) {
        desktopHide = window;
        break;
      }
    }
    expect(desktopHide).toContain("display: none !important;");
    expect(desktopHide).not.toContain("page-toc--open");
  });
});
