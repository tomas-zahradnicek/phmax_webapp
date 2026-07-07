import { describe, expect, it } from "vitest";
import { getRouteSeoContent, listPhaseCSeoContentRoutes, listSeoPrerenderContentRoutes } from "./phmax-route-seo-content";
import { VYROCNI_ZPRAVA_PATH } from "./calculator-ui-constants";
import { KALKULACKY_PHMAX_PATH } from "./phmax-landing-paths";
import { renderRouteSeoHtml } from "./render-route-seo-html";

describe("phmax-route-seo-content", () => {
  it("pokrývá fázi C a D2 prerender routy", () => {
    expect(listPhaseCSeoContentRoutes()).toHaveLength(9);
    expect(listSeoPrerenderContentRoutes()).toHaveLength(11);
    expect(getRouteSeoContent(VYROCNI_ZPRAVA_PATH)?.sections.length).toBeGreaterThanOrEqual(4);
    expect(getRouteSeoContent(KALKULACKY_PHMAX_PATH)?.relatedLinks.length).toBeGreaterThanOrEqual(8);
  });

  it("každá route má H1, FAQ a alespoň tři interní odkazy", () => {
    for (const content of listPhaseCSeoContentRoutes()) {
      expect(content.h1.length).toBeGreaterThan(10);
      expect(content.faq.length).toBeGreaterThan(0);
      expect(content.relatedLinks.length).toBeGreaterThanOrEqual(3);
      expect(content.sections.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("renderRouteSeoHtml", () => {
  it("escapuje HTML a generuje jeden H1", () => {
    const content = getRouteSeoContent("/phmax-zakladni-skola");
    expect(content).not.toBeNull();
    const html = renderRouteSeoHtml(content!);
    expect(html).toContain('id="seo-prerender-content"');
    expect(html).toContain("<main");
    expect(html.match(/<h1\b/gi)).toHaveLength(1);
    expect(html).not.toContain("<script");
  });

  it("odmítne externí URL v odkazech", () => {
    const content = getRouteSeoContent("/phmax-zakladni-skola");
    expect(content).not.toBeNull();
    expect(() =>
      renderRouteSeoHtml({
        ...content!,
        relatedLinks: [{ href: "https://evil.example", label: "Evil" }],
      }),
    ).toThrow(/Blocked non-internal/);
  });
});
