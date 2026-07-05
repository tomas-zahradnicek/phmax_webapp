import { describe, expect, it } from "vitest";
import { PRODUCT_VIEW_CODES, PROFIL_SKOLY_PATH, USER_GUIDE_PATH, VYROCNI_ZPRAVA_PATH } from "./calculator-ui-constants";
import {
  PHMAX_DOCUMENT_HEAD,
  PHMAX_LITE_DOCUMENT_HEAD,
  buildPhmaxCanonicalUrl,
  buildPhmaxHeadHtmlTags,
  buildPhmaxSitemapEntries,
  buildPhmaxSitemapXml,
  listPhmaxPrerenderRoutes,
  listPhmaxSitemapUrls,
} from "./phmax-document-head";
import { PHMAX_PV_LITE_PATH, PHMAX_SD_LITE_PATH } from "./phmax-lite-paths";

describe("phmax-document-head", () => {
  it("má meta pro každý produktový view", () => {
    for (const view of PRODUCT_VIEW_CODES) {
      const meta = PHMAX_DOCUMENT_HEAD[view];
      expect(meta.title.length).toBeGreaterThan(10);
      expect(meta.description.length).toBeGreaterThan(40);
      expect(meta.applicationName.length).toBeGreaterThan(5);
      expect(meta.title.toLowerCase()).not.toContain("nejlepší");
      expect(meta.description.toLowerCase()).not.toContain("oficiální výpočet");
    }
  });

  it("canonical URL používá parametr view", () => {
    expect(buildPhmaxCanonicalUrl("zs", "https://example.test")).toBe(
      "https://example.test/phmax-zakladni-skola",
    );
    const urls = listPhmaxSitemapUrls("https://example.test");
    expect(urls).toHaveLength(PRODUCT_VIEW_CODES.length + 6);
    expect(urls).toContain(`https://example.test${USER_GUIDE_PATH}`);
    expect(urls).toContain(`https://example.test${VYROCNI_ZPRAVA_PATH}`);
    expect(urls).toContain(`https://example.test${PROFIL_SKOLY_PATH}`);
    expect(urls).toContain(`https://example.test${PHMAX_PV_LITE_PATH}`);
    expect(urls).toContain(`https://example.test${PHMAX_SD_LITE_PATH}`);
    expect(urls).toContain(`https://example.test/phmax-zakladni-skola/rychly`);
  });

  it("má meta pro rychlé PHmax režimy", () => {
    for (const lite of ["pv", "sd", "zs"] as const) {
      const meta = PHMAX_LITE_DOCUMENT_HEAD[lite];
      expect(meta.title).toContain("Rychlý PHmax");
      expect(meta.description.length).toBeGreaterThan(40);
    }
  });

  it("sitemap XML obsahuje všechny veřejné cesty na produkční doméně", () => {
    const xml = buildPhmaxSitemapXml();
    expect(xml).toContain("https://app.reditelskypruvodce.cz/prehled");
    expect(xml).toContain("<lastmod>");
    expect(xml).not.toContain("/vyrocni-zprava/nahled");
    expect(xml).toContain("/navod");
    expect(xml).toContain("/vyrocni-zprava");
    expect(xml).toContain("/profil-skoly");
    expect(xml).toContain("/phmax-zakladni-skola/rychly");
    expect(buildPhmaxSitemapEntries()).toHaveLength(listPhmaxSitemapUrls().length);
  });

  it("prerender routes mají statický head a noindex náhled", () => {
    const routes = listPhmaxPrerenderRoutes("https://example.test");
    expect(routes.length).toBeGreaterThan(listPhmaxSitemapUrls("https://example.test").length);
    const preview = routes.find((route) => route.pathname === "/vyrocni-zprava/nahled");
    expect(preview?.indexable).toBe(false);
    const head = buildPhmaxHeadHtmlTags(PHMAX_DOCUMENT_HEAD.zs, "https://example.test", {
      canonical: "https://example.test/phmax-zakladni-skola",
      faqView: "zs",
      breadcrumbLabel: PHMAX_DOCUMENT_HEAD.zs.applicationName,
    });
    expect(head).toContain("twitter:card");
    expect(head).toContain("BreadcrumbList");
    expect(head).toContain('name="robots" content="index, follow');
  });
});
