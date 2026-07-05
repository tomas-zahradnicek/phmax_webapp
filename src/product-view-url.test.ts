import { describe, expect, it } from "vitest";
import { PRODUCT_VIEW_CODES } from "./calculator-ui-constants";
import { buildProductViewPageUrl, listProductViewPathUrls, productViewFromPathname } from "./product-view-paths";
import { readInitialProductView } from "./product-view-url";

describe("product-view-paths", () => {
  it("mapuje pathname na view", () => {
    expect(productViewFromPathname("/prehled")).toBe("dash");
    expect(productViewFromPathname("/phmax-zakladni-skola")).toBe("zs");
    expect(productViewFromPathname("/banka-odpoctu-zastupcu-reditele")).toBe("nv75");
    expect(productViewFromPathname("/")).toBeNull();
  });

  it("canonical URL používá čisté path", () => {
    expect(buildProductViewPageUrl("zs", "https://example.test")).toBe(
      "https://example.test/phmax-zakladni-skola",
    );
    expect(listProductViewPathUrls("https://example.test")).toHaveLength(PRODUCT_VIEW_CODES.length);
  });
});

describe("readInitialProductView", () => {
  it("default je dash (přehled) mimo prohlížeč a pro kořenovou URL", () => {
    expect(readInitialProductView()).toBe("dash");
  });
});
