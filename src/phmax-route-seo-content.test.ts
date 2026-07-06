import { describe, expect, it } from "vitest";
import { getRouteSeoContent, listPhaseCSeoContentRoutes } from "./phmax-route-seo-content";
import { renderRouteSeoHtml } from "./render-route-seo-html";

describe("phmax-route-seo-content", () => {
  it("pokrývá všech 9 rout fáze C", () => {
    expect(listPhaseCSeoContentRoutes()).toHaveLength(9);
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
