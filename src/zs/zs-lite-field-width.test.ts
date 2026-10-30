import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(rel: string): string {
  return readFileSync(resolve(__dirname, "..", rel), "utf8");
}

describe("ZŠ Lite šířka polí", () => {
  it("uvolní 320px strop jen na stránce ZŠ Lite a nechá dvousloupec", () => {
    const css = read("styles.css");
    const sharedAt = css.indexOf(".phmax-lite-form__field {");
    expect(sharedAt).toBeGreaterThan(0);
    expect(css).toContain("max-width: 320px;");
    const zsRule = ".phmax-lite-page--zs .phmax-lite-form__field";
    const zsAt = css.indexOf(zsRule);
    expect(zsAt).toBeGreaterThan(sharedAt);
    const block = css.slice(zsAt, zsAt + 180);
    expect(block).toContain("width: 100%;");
    expect(block).toContain("max-width: min(100%, 40rem);");
    expect(block).not.toContain("phmax-lite-page--pv");
    expect(block).not.toContain("phmax-lite-page--sd");

    const page = read("zs/PhmaxZsLitePage.tsx");
    expect(page).toContain("phmax-lite-page phmax-lite-page--zs");
    expect(page).toContain('className="grid two"');
  });
});
