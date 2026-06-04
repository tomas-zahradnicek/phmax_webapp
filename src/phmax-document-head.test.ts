import { describe, expect, it } from "vitest";
import { PRODUCT_VIEW_CODES } from "./calculator-ui-constants";
import {
  PHMAX_DOCUMENT_HEAD,
  buildPhmaxCanonicalUrl,
  listPhmaxSitemapUrls,
} from "./phmax-document-head";

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
    expect(listPhmaxSitemapUrls("https://example.test")).toHaveLength(PRODUCT_VIEW_CODES.length);
  });
});
