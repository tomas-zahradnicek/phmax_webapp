import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

function read(rel: string) {
  return fs.readFileSync(path.join(repoRoot, rel), "utf8");
}

describe("handout ředitel / zřizovatel", () => {
  it("verze handoutu odpovídá package.json", () => {
    const pkg = JSON.parse(read("package.json")) as { version: string };
    const md = read("docs/phmax-handout-reditel-zrizovatel.md");
    const html = read("docs/phmax-handout-reditel-zrizovatel.html");
    expect(md).toContain(`**Verze ${pkg.version}**`);
    expect(html).toContain(pkg.version);
  });
});
