import { describe, expect, it } from "vitest";
import { PROFIL_SKOLY_PATH, USER_GUIDE_PATH, VYROCNI_ZPRAVA_PATH } from "./calculator-ui-constants";
import {
  PHMAX_DOCUMENT_HEAD,
  PHMAX_LITE_DOCUMENT_HEAD,
  PHMAX_USER_GUIDE_DOCUMENT_HEAD,
  buildPhmaxHeadHtmlTags,
  buildPhmaxSitemapEntries,
  buildPhmaxSitemapXml,
  listPhmaxPrerenderRoutes,
  listPhmaxSitemapUrls,
} from "./phmax-document-head";
import { getRouteSeoContent } from "./phmax-route-seo-content";
import { KALKULACKY_PHMAX_PATH } from "./phmax-landing-paths";
import { PHMAX_PV_LITE_PATH, PHMAX_SD_LITE_PATH } from "./phmax-lite-paths";
import { PRODUCT_VIEW_CODES } from "./calculator-ui-constants";

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
    const urls = listPhmaxSitemapUrls("https://example.test");
    expect(urls).toHaveLength(PRODUCT_VIEW_CODES.length + 5);
    expect(urls).toContain(`https://example.test${KALKULACKY_PHMAX_PATH}`);
    expect(urls).toContain(`https://example.test${USER_GUIDE_PATH}`);
    expect(urls).toContain(`https://example.test${VYROCNI_ZPRAVA_PATH}`);
    expect(urls).not.toContain(`https://example.test${PROFIL_SKOLY_PATH}`);
    expect(urls).not.toContain("https://example.test/prehled");
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

  it("sitemap XML obsahuje veřejné cesty bez dashboardu a profilu", () => {
    const xml = buildPhmaxSitemapXml();
    expect(xml).toContain(`https://app.reditelskypruvodce.cz${KALKULACKY_PHMAX_PATH}`);
    expect(xml).not.toContain("https://app.reditelskypruvodce.cz/prehled");
    expect(xml).not.toContain("/profil-skoly");
    expect(xml).toContain("<lastmod>");
    expect(xml).not.toContain("/vyrocni-zprava/nahled");
    expect(xml).toContain("/navod");
    expect(xml).toContain("/vyrocni-zprava");
    expect(xml).toContain("/phmax-zakladni-skola/rychly");
    expect(buildPhmaxSitemapEntries()).toHaveLength(listPhmaxSitemapUrls().length);
  });

  it("prerender routes mají statický head a noindex interní stránky", () => {
    const routes = listPhmaxPrerenderRoutes("https://example.test");
    expect(routes.length).toBeGreaterThan(listPhmaxSitemapUrls("https://example.test").length);
    const preview = routes.find((route) => route.pathname === "/vyrocni-zprava/nahled");
    expect(preview?.head.indexable).toBe(false);
    const dash = routes.find((route) => route.pathname === "/prehled");
    expect(dash?.head.indexable).toBe(false);
    const profile = routes.find((route) => route.pathname === "/profil-skoly");
    expect(profile?.head.indexable).toBe(false);
    const head = buildPhmaxHeadHtmlTags(PHMAX_DOCUMENT_HEAD.zs, "https://example.test", {
      canonical: "https://example.test/phmax-zakladni-skola",
      faqView: "zs",
      breadcrumbLabel: PHMAX_DOCUMENT_HEAD.zs.applicationName,
    });
    expect(head).toContain("twitter:card");
    expect(head).toContain("BreadcrumbList");
    expect(head).toContain('name="robots" content="index, follow');
    expect(head).toContain("/kalkulacky-phmax");
  });

  it("/navod používá WebPage místo SoftwareApplication a FAQ odpovídá prerenderu", () => {
    const origin = "https://example.test";
    const canonical = `${origin}${USER_GUIDE_PATH}`;
    const guideRoute = listPhmaxPrerenderRoutes(origin).find((route) => route.pathname === USER_GUIDE_PATH);
    expect(guideRoute?.head.includeSoftwareApplication).toBe(false);
    expect(guideRoute?.head.includeWebPage).toBe(true);

    const head = buildPhmaxHeadHtmlTags(PHMAX_USER_GUIDE_DOCUMENT_HEAD, origin, {
      canonical,
      ...guideRoute!.head,
      breadcrumbLabel: guideRoute!.head.breadcrumbLabel ?? "Návod k použití",
    });

    expect(head).not.toContain('"@type":"SoftwareApplication"');
    expect(head).not.toContain('"@type": "SoftwareApplication"');
    expect(head).toContain('"@type":"WebPage"');
    expect(head).toContain('"@type":"BreadcrumbList"');
    expect(head).toContain('"@type":"FAQPage"');
    expect(head).toContain('name="robots" content="index, follow');
    expect(head).toContain(`href="${canonical}"`);

    const jsonLdBlocks = [...head.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(
      (match) => JSON.parse(match[1]!),
    );
    expect(jsonLdBlocks.length).toBeGreaterThanOrEqual(3);
    expect(jsonLdBlocks.some((block) => block["@type"] === "WebPage")).toBe(true);
    expect(jsonLdBlocks.some((block) => block["@type"] === "BreadcrumbList")).toBe(true);
    expect(jsonLdBlocks.some((block) => block["@type"] === "SoftwareApplication")).toBe(false);

    const faqBlock = jsonLdBlocks.find((block) => block["@type"] === "FAQPage");
    const routeFaq = getRouteSeoContent(USER_GUIDE_PATH)?.faq ?? [];
    expect(faqBlock?.mainEntity).toHaveLength(routeFaq.length);
    for (const item of routeFaq) {
      const entity = faqBlock?.mainEntity.find(
        (entry: { name: string }) => entry.name === item.question,
      );
      expect(entity?.acceptedAnswer?.text).toBe(item.answer);
    }

    expect(listPhmaxSitemapUrls(origin)).toContain(canonical);
  });
});
