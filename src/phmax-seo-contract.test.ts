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
    expect(readSource("src/ProductViewPills.tsx")).toContain('href={PRODUCT_VIEW_PATH[view]}');
    expect(readSource("src/phmax-calculator-nav.ts")).toContain("PHMAX_CALCULATOR_NAV_LINKS");
  });

  it("robots a sitemap ve public", () => {
    expect(readSource("public/robots.txt")).toContain("Sitemap:");
    expect(readSource("public/sitemap.xml")).toContain("app.reditelskypruvodce.cz");
    expect(readSource("public/robots.txt")).toContain("app.reditelskypruvodce.cz/sitemap.xml");
    expect(readSource("public/sitemap.xml")).toContain("/navod");
    expect(readSource("public/sitemap.xml")).toContain("/vyrocni-zprava");
    expect(readSource("public/sitemap.xml")).toContain("/kalkulacky-phmax");
    expect(readSource("public/sitemap.xml")).not.toContain("/profil-skoly");
    expect(readSource("public/sitemap.xml")).not.toContain("/prehled");
    expect(readSource("public/sitemap.xml")).toContain("/phmax-zakladni-skola");
    expect(readSource("public/sitemap.xml")).not.toContain("/phmax-predskolni-vzdelavani/rychly");
    expect(readSource("public/sitemap.xml")).not.toContain("/phmax-skolni-druzina/rychly");
    expect(readSource("public/sitemap.xml")).not.toContain("/phmax-zakladni-skola/rychly");
    expect(readSource("src/seo-routes.ts")).toContain("SEO_ROUTES");
    expect(readSource("docs/post-deploy-checklist.md")).toContain("vercel.json");
    // Prázdný vercel.json = žádný SPA catch-all rewrite (hard 404).
    expect(readSource("vercel.json").trim()).toBe("{}");
    expect(readSource("middleware.ts")).toContain("LEGACY_VIEW_PATHS");
    expect(readSource("middleware.ts")).toContain('matcher: ["/", "/prehled"]');
    expect(readSource("middleware.ts")).toContain('from "@vercel/functions"');
    expect(readSource("middleware.ts")).toContain("return next()");
    expect(readSource("legacy-view-redirect.mjs")).toContain("resolveLegacyViewRedirect");
    expect(readSource("legacy-view-redirect.mjs")).toContain('ROOT_REDIRECT_PATH = "/kalkulacky-phmax"');
    expect(readSource("package.json")).toContain('"tsx"');
    expect(readSource("package.json")).toContain('"@vercel/functions"');
    expect(readSource("package.json")).not.toContain("npx --yes tsx");
    expect(readSource("package.json")).toContain("prerender-route-html");
    expect(readSource("package.json")).toContain("check:seo-routing");
    expect(readSource("package.json")).toContain("check:seo-routing:deployed");
    expect(readSource("package.json")).toContain("check:seo-content");
    expect(readSource("scripts/prerender-route-html.ts")).toContain("404.html");
    expect(readSource("scripts/prerender-route-html.ts")).toContain("renderRouteSeoHtml");
    expect(readSource("src/phmax-route-seo-content.ts")).toContain("SEO_PRERENDER_CONTENT_PATHS");
    expect(readSource("src/phmax-landing-paths.ts")).toContain("/kalkulacky-phmax");
    expect(readSource("src/KalkulackyPhmaxPage.tsx")).toContain("KalkulackyPhmaxPage");
    expect(readSource("src/render-route-seo-html.ts")).toContain("renderRouteSeoHtml");
    expect(readSource("src/main.tsx")).toContain("removePrerenderFallbackWhenReady");
    expect(readSource("scripts/verify-seo-routing.mjs")).toContain("neexistuje-seo-route-404");
  });

  it("pilotní materiál pro ředitele", () => {
    expect(readSource("docs/pilot-reditel-5min.md")).toContain("Co bys udělal");
  });
});
