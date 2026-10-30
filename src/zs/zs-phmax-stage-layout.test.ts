import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ZsPhmaxBasicSection } from "./ZsPhmaxBasicSection";
import { ZsPhmaxSec16Section } from "./ZsPhmaxSec16Section";

const band = { label: "17–20", value: 30 };

function blocks(html: string, className: string): string[] {
  const needle = `class="${className}"`;
  const found: string[] = [];
  let from = 0;
  while (from < html.length) {
    const at = html.indexOf(needle, from);
    if (at < 0) break;
    const start = html.lastIndexOf("<div", at);
    let depth = 0;
    let end = -1;
    for (let i = start; i < html.length; i += 1) {
      const divOpen = html.startsWith("<div", i) && /[\s>]/.test(html[i + 4] ?? "");
      if (divOpen) depth += 1;
      else if (html.startsWith("</div>", i)) {
        depth -= 1;
        if (depth === 0) {
          end = i + "</div>".length;
          break;
        }
      }
    }
    if (end < 0) throw new Error(`Neuzavřený blok ${className}`);
    found.push(html.slice(start, end));
    from = end;
  }
  return found;
}

function basicMarkup(showSecond = true) {
  return renderToStaticMarkup(
    createElement(ZsPhmaxBasicSection, {
      hasBasicIssue: false,
      showBasicFirst: true,
      showBasicSecond: showSecond,
      showSchoolVariantFirstOnly: false,
      showPrepClass: false,
      showPrepSpecial: false,
      showPar38: false,
      showPar41: false,
      basicType: "full_more_than_2",
      onBasicTypeChange: () => {},
      basic1Classes: 10,
      basic1Pupils: 250,
      basic2Classes: 8,
      basic2Pupils: 225,
      onBasic1ClassesChange: () => {},
      onBasic1PupilsChange: () => {},
      onBasic2ClassesChange: () => {},
      onBasic2PupilsChange: () => {},
      basic1Avg: 25,
      basic2Avg: 28.125,
      basicFirstBand: band,
      basicSecondBand: { label: "více než 24", value: 46 },
      basic1Phmax: 300,
      basic2Phmax: 368,
      basicPhmax: 668,
      prepClassPhmax: 0,
      prepSpecialPhmax: 0,
      par38Phmax: 0,
      par41Phmax: 0,
    }),
  );
}

function sec16Markup(viewMode: "basic" | "expert", showSecond = true) {
  return renderToStaticMarkup(
    createElement(ZsPhmaxSec16Section, {
      viewMode,
      showFirst: true,
      showSecond,
      firstClasses: 5,
      firstPupils: 40,
      secondClasses: 4,
      secondPupils: 32,
      onFirstClassesChange: () => {},
      onFirstPupilsChange: () => {},
      onSecondClassesChange: () => {},
      onSecondPupilsChange: () => {},
      firstAvg: 8,
      secondAvg: 8,
      firstBand: { label: "pásmo B9", value: 26 },
      secondBand: { label: "pásmo B10", value: 34 },
      firstPhmax: 130,
      secondPhmax: 136,
      totalPhmax: 266,
    }),
  );
}

describe("ZŠ PHmax oddělení zadání a výpočtu", () => {
  it("běžné třídy drží vstupy mimo výsledkové karty a součty stupňů jen jednou", () => {
    const html = basicMarkup();
    expect(html).toContain('data-section="basic"');
    expect(html).toContain('data-wizard-step="2"');
    expect(html).toContain('data-phmax-pane="classes"');
    expect(blocks(html, "subcard zs-phmax-stage")).toHaveLength(2);
    expect(html).toContain("<h3>1. stupeň</h3>");
    expect(html).toContain("<h3>2. stupeň</h3>");

    const inputs = blocks(html, "zs-phmax-stage__inputs");
    const results = blocks(html, "zs-phmax-stage__results");
    expect(inputs).toHaveLength(2);
    expect(results).toHaveLength(2);
    for (const block of inputs) {
      expect(block).toContain("Počet tříd");
      expect(block).toContain("Počet žáků");
      expect(block).toContain("number-field");
      expect(block).not.toContain("result-card");
    }
    for (const block of results) {
      expect(block).toContain("Průměrný počet žáků ve třídě");
      expect(block).toContain("Pásmo");
      expect(block).toContain("PHmax na 1 třídu");
      expect(block).toContain("result-card");
      expect(block).not.toContain("number-field");
    }
    expect(html).toContain("Výsledek PHmax – 1. stupeň");
    expect(html).toContain("Výsledek PHmax – 2. stupeň");
    expect(html).toContain(">300<");
    expect(html).toContain(">368<");
    expect(html).toContain("PHmax – běžné třídy celkem");
    expect(html).toContain(">668<");
    expect(html.match(/Výsledek PHmax – 1\. stupeň/g)).toHaveLength(1);
    expect(html.match(/PHmax – běžné třídy celkem/g)).toHaveLength(1);
    expect(html).not.toContain("Počet tříd × PHmax");
  });

  it("§ 16/9 oddělí stupně, průměr, hodiny a zachová accordion", () => {
    const basic = sec16Markup("basic");
    expect(basic).toContain('data-section="sec16"');
    expect(basic).toContain('data-wizard-step="3"');
    expect(basic).toContain('data-phmax-pane="exceptions"');
    expect(basic.match(/<details\b[^>]*>/)?.[0]).toContain("ux-collapsible");
    expect(basic.match(/<details\b[^>]*>/)?.[0]).toContain('data-wizard-step="3"');
    expect(blocks(basic, "subcard zs-phmax-stage")).toHaveLength(2);
    expect(basic).toContain("<h3>1. stupeň</h3>");
    expect(basic).toContain("<h3>2. stupeň</h3>");
    expect(basic).toContain("1. stupeň – třídy");
    expect(basic).toContain("2. stupeň – žáci");
    expect(blocks(basic, "zs-phmax-stage__inputs").every((block) => block.includes("number-field") && !block.includes("result-card"))).toBe(true);
    expect(basic).toContain("1. stupeň – průměrný počet žáků");
    expect(basic).toContain("1. stupeň – pásmo");
    expect(basic).toContain("2. stupeň – pásmo");
    expect(basic).toContain("1. stupeň – PHmax na 1 třídu");
    expect(basic).toContain("1. stupeň – výsledek PHmax");
    expect(basic).toContain("2. stupeň – výsledek PHmax");
    expect(basic).toContain(">130<");
    expect(basic).toContain(">136<");
    expect(basic).toContain("– celkem");
    expect(basic.match(/– celkem/g)).toHaveLength(1);
    expect(basic).toContain(">266<");
    expect(basic.match(/1\. stupeň – výsledek PHmax/g)).toHaveLength(1);
    expect(basic).not.toContain("PHmax § 16/9 – 1. stupeň");
    expect(basic).not.toContain("počet tříd × PHmax");

    const expert = sec16Markup("expert");
    expect(expert).not.toContain("ux-collapsible");
    expect(expert).toContain("field-why-phmax");
    expect(expert).toContain('data-section="sec16"');
    expect(expert).toContain('data-wizard-step="3"');
    expect(blocks(expert, "subcard zs-phmax-stage")).toHaveLength(2);

    const firstOnly = sec16Markup("expert", false);
    expect(blocks(firstOnly, "subcard zs-phmax-stage")).toHaveLength(1);
    expect(firstOnly).toContain("<h3>1. stupeň</h3>");
    expect(firstOnly).not.toContain("<h3>2. stupeň</h3>");
  });

  it("šířka samotného stupně a řádek § 16/9 z LAYOUT-2A zůstávají vymezené na ZŠ", () => {
    const css = readFileSync(resolve(__dirname, "../styles.css"), "utf8");
    expect(css).toContain(".zs-phmax-stage-row > .zs-phmax-stage:only-child");
    expect(css).toContain(".zs-phmax-module-row > details.ux-collapsible:only-child:has([data-section=\"sec16\"])");
    expect(css).toContain(".zs-phmax-module-row > section.section-card--module-support:only-child");
    expect(css).not.toContain(".grid.two > .zs-phmax-stage");
    expect(basicMarkup(false).match(/class="subcard zs-phmax-stage"/g)).toHaveLength(1);
  });
});
