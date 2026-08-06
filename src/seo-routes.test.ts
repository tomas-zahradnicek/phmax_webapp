import { describe, expect, it } from "vitest";
import { PRODUCT_VIEW_CODES } from "./calculator-ui-constants";
import { listPhmaxSitemapUrls } from "./phmax-document-head";
import { PRODUCT_VIEW_PATH } from "./product-view-paths";
import {
  getCanonicalRoutes,
  getPathByProductView,
  getSeoRouteByPath,
  listSitemapPaths,
  normalizePathname,
  SEO_ROUTES,
} from "./seo-routes";

describe("seo-routes registry", () => {
  it("každý ProductView má právě jednu hlavní cestu", () => {
    for (const view of PRODUCT_VIEW_CODES) {
      const matches = SEO_ROUTES.filter((route) => route.productView === view && !route.liteKind);
      expect(matches).toHaveLength(1);
      expect(matches[0]!.path).toBe(PRODUCT_VIEW_PATH[view]);
      expect(getPathByProductView(view)).toBe(PRODUCT_VIEW_PATH[view]);
    }
  });

  it("mapuje hlavní kalkulačky na ProductView", () => {
    expect(getSeoRouteByPath("/phmax-predskolni-vzdelavani")?.productView).toBe("pv");
    expect(getSeoRouteByPath("/phmax-skolni-druzina")?.productView).toBe("sd");
    expect(getSeoRouteByPath("/phmax-zakladni-skola")?.productView).toBe("zs");
    expect(getSeoRouteByPath("/phmax-stredni-skola")?.productView).toBe("ss");
    expect(getSeoRouteByPath("/banka-odpoctu-zastupcu-reditele")?.productView).toBe("nv75");
  });

  it("indexovatelné trasy mají title, description, canonical, H1 a intro", () => {
    for (const route of getCanonicalRoutes()) {
      expect(route.title.length).toBeGreaterThan(10);
      expect(route.description.length).toBeGreaterThan(40);
      expect(route.h1.length).toBeGreaterThan(5);
      expect(route.intro.length).toBeGreaterThan(20);
      expect(route.canonical.startsWith("https://")).toBe(true);
      expect(route.canonical).not.toContain("?");
      expect(route.indexable).toBe(true);
      expect(route.includeInSitemap).toBe(true);
    }
  });

  it("žádné dvě indexovatelné stránky nesdílí title ani canonical", () => {
    const indexable = SEO_ROUTES.filter((route) => route.indexable);
    const titles = indexable.map((route) => route.title);
    const canonicals = indexable.map((route) => route.canonical);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(canonicals).size).toBe(canonicals.length);
  });

  it("/rychly je noindex s canonical na plnou kalkulačku", () => {
    const zsLite = getSeoRouteByPath("/phmax-zakladni-skola/rychly");
    expect(zsLite?.indexable).toBe(false);
    expect(zsLite?.includeInSitemap).toBe(false);
    expect(zsLite?.canonicalParent).toBe("/phmax-zakladni-skola");
    expect(zsLite?.canonical).toBe("https://app.reditelskypruvodce.cz/phmax-zakladni-skola");

    const pvLite = getSeoRouteByPath("/phmax-predskolni-vzdelavani/rychly");
    expect(pvLite?.canonical).toBe("https://app.reditelskypruvodce.cz/phmax-predskolni-vzdelavani");
  });

  it("sitemap registry odpovídá listPhmaxSitemapUrls", () => {
    const fromRegistry = [...listSitemapPaths()].sort();
    const fromHead = listPhmaxSitemapUrls("https://app.reditelskypruvodce.cz")
      .map((url) => new URL(url).pathname.replace(/\/+$/, "") || "/")
      .sort();
    expect(fromRegistry).toEqual(fromHead);
    expect(fromRegistry).not.toContain("/phmax-zakladni-skola/rychly");
    expect(fromRegistry).not.toContain("/prehled");
    expect(fromRegistry).not.toContain("/profil-skoly");
  });

  it("normalizePathname odstraňuje koncové lomítko", () => {
    expect(normalizePathname("/phmax-zakladni-skola/")).toBe("/phmax-zakladni-skola");
    expect(normalizePathname("/")).toBe("/");
  });
});
