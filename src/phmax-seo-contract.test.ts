import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("SEO fáze A contract", () => {
  it("App aplikuje document head při změně view", () => {
    expect(readSource("src/App.tsx")).toContain("applyPhmaxDocumentHead");
    expect(readSource("src/phmax-document-head.ts")).toContain("SoftwareApplication");
    expect(readSource("src/phmax-document-head.ts")).toContain("og:description");
  });

  it("robots a sitemap ve public", () => {
    expect(readSource("public/robots.txt")).toContain("Sitemap:");
    expect(readSource("public/sitemap.xml")).toContain("?view=dash");
    expect(readSource("public/sitemap.xml")).toContain("?view=zs");
  });

  it("pilotní materiál pro ředitele", () => {
    expect(readSource("docs/pilot-reditel-5min.md")).toContain("Co bys udělal");
  });
});
