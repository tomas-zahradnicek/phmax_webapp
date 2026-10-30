import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(resolve(__dirname, "..", rel), "utf8");
}

describe("ZŠ Lite rozložení PHA1Rmax", () => {
  it("zjednoduší jen vnořený rámeček v Lite a nechá plnou sekci beze změny", () => {
    const css = read("styles.css");
    const section = read("zs/ZsPha1rSection.tsx");
    const page = read("zs/PhmaxZsLitePage.tsx");

    expect(section).toContain('className="card section-card section-card--pha1r"');
    expect(section).toContain('className="subcard"');
    expect(section).toContain('className="grid two"');
    expect(section).toContain("pha1rGrade1Label");
    expect(section).toContain("pha1rPar38Label");
    expect(section).toContain("pha1rPar41Label");
    expect(section).toContain("pha1rSec16Label");
    expect(page).toContain("<ZsPha1rSection");
    expect(page).toContain("showHeading={false}");
    expect(page).toContain("showResultCard={false}");

    const rule = ".phmax-lite-page--zs .section-card--pha1r .subcard > .grid.two {";
    const at = css.indexOf(rule);
    expect(at).toBeGreaterThan(css.indexOf(".phmax-lite-page--zs .phmax-lite-form__field"));
    const block = css.slice(at, at + 220);
    expect(block).toContain("grid-template-columns: repeat(3, minmax(0, 1fr));");
    expect(css).toContain("grid-column: 1 / -1;");
    const narrow = css.indexOf(rule, at + rule.length);
    expect(narrow).toBeGreaterThan(at);
    expect(css.slice(narrow, narrow + 160)).toContain("grid-template-columns: 1fr;");
    expect(css.slice(at, narrow)).not.toContain("phmax-lite-page--pv");
    expect(css.slice(at, narrow + 120)).not.toContain("phmax-lite-page--sd");
  });
});
