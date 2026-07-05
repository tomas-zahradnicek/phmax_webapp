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
    expect(readSource("src/App.tsx")).toContain("writeProductViewUrl");
    expect(readSource("src/phmax-document-head.ts")).toContain("SoftwareApplication");
    expect(readSource("src/phmax-document-head.ts")).toContain("FAQPage");
    expect(readSource("src/phmax-document-head.ts")).toContain("BreadcrumbList");
    expect(readSource("src/phmax-document-head.ts")).toContain("WebSite");
    expect(readSource("src/phmax-document-head.ts")).toContain("twitter:card");
    expect(readSource("src/phmax-document-head.ts")).toContain("buildPhmaxHeadHtmlTags");
    expect(readSource("src/phmax-document-head.ts")).toContain("og:description");
  });

  it("čisté URL a SEO bloky pod kalkulačkou", () => {
    expect(readSource("src/product-view-paths.ts")).toContain("/phmax-zakladni-skola");
    expect(readSource("src/PhmaxZsPage.tsx")).toContain("PhmaxModuleSeoSection");
    expect(readSource("src/PhmaxModuleSeoSection.tsx")).toContain("Nejčastější dotazy");
  });

  it("robots a sitemap ve public", () => {
    expect(readSource("public/robots.txt")).toContain("Sitemap:");
    expect(readSource("public/sitemap.xml")).toContain("app.reditelskypruvodce.cz");
    expect(readSource("public/robots.txt")).toContain("app.reditelskypruvodce.cz/sitemap.xml");
    expect(readSource("public/sitemap.xml")).toContain("/navod");
    expect(readSource("public/sitemap.xml")).toContain("/vyrocni-zprava");
    expect(readSource("public/sitemap.xml")).toContain("/profil-skoly");
    expect(readSource("public/sitemap.xml")).toContain("/phmax-zakladni-skola");
    expect(readSource("public/sitemap.xml")).toContain("/phmax-predskolni-vzdelavani/rychly");
    expect(readSource("public/sitemap.xml")).toContain("/phmax-skolni-druzina/rychly");
    expect(readSource("public/sitemap.xml")).toContain("/phmax-zakladni-skola/rychly");
    expect(readSource("vercel.json")).toContain("rewrites");
    expect(readSource("vercel.json")).toContain("redirects");
    expect(readSource("package.json")).toContain("prerender-route-html");
  });

  it("pilotní materiál pro ředitele", () => {
    expect(readSource("docs/pilot-reditel-5min.md")).toContain("Co bys udělal");
  });
});
