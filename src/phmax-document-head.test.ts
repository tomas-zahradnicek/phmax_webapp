import { describe, expect, it } from "vitest";
import { PRODUCT_VIEW_CODES } from "./calculator-ui-constants";
import {
  PHMAX_DOCUMENT_HEAD,
  PHMAX_LITE_DOCUMENT_HEAD,
  buildPhmaxCanonicalUrl,
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
    expect(urls).toHaveLength(PRODUCT_VIEW_CODES.length + 3);
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
});
