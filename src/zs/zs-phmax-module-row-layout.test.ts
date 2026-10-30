import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { FormSection } from "../config/calculator-config";
import type { ZsPhmaxTabPanelProps } from "./ZsPhmaxTabPanel";
import { ZsPhmaxTabPanel } from "./ZsPhmaxTabPanel";

const band = { label: "pásmo", value: 1 };
const noop = () => {};

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function panelProps(viewMode: "basic" | "expert", sections: readonly FormSection[]): ZsPhmaxTabPanelProps {
  const visible = new Set<FormSection>(sections);
  return {
    viewMode,
    mode: "phmax_full_zs_sec16",
    hasSection: (section) => visible.has(section),
    hasIssue: () => false,
    showPhmaxSubNav: false,
    effectivePhmaxPane: "exceptions",
    onPhmaxSubTabChange: noop,
    zsBasicWizardActive: false,
    zsWizardStep: 1,
    zsWizardHasExceptions: true,
    validationHighlight: false,
    onResetPhmax: noop,
    zsMethodologyHighlights: {},
    basicType: "full_more_than_2",
    onBasicTypeChange: noop,
    basic1Classes: 0,
    basic1Pupils: 0,
    basic2Classes: 0,
    basic2Pupils: 0,
    onBasic1ClassesChange: noop,
    onBasic1PupilsChange: noop,
    onBasic2ClassesChange: noop,
    onBasic2PupilsChange: noop,
    basic1Avg: 0,
    basic2Avg: 0,
    basicFirstBand: band,
    basicSecondBand: band,
    basic1Phmax: 0,
    basic2Phmax: 0,
    basicPhmax: 0,
    prepClassPhmax: 0,
    prepSpecialPhmax: 0,
    par38Phmax: 0,
    par41Phmax: 0,
    sec16FirstClasses: 1,
    sec16FirstPupils: 10,
    sec16SecondClasses: 1,
    sec16SecondPupils: 12,
    onSec16FirstClassesChange: noop,
    onSec16FirstPupilsChange: noop,
    onSec16SecondClassesChange: noop,
    onSec16SecondPupilsChange: noop,
    incl1Avg: 10,
    incl2Avg: 12,
    sec16FirstBand: band,
    sec16SecondBand: band,
    incl1Phmax: 20,
    incl2Phmax: 22,
    inclPhmax: 42,
    special1Classes: 1,
    special1Pupils: 6,
    special2Classes: 0,
    special2Pupils: 0,
    specialIIClasses: 0,
    specialIIPupils: 0,
    onSpecial1ClassesChange: noop,
    onSpecial1PupilsChange: noop,
    onSpecial2ClassesChange: noop,
    onSpecial2PupilsChange: noop,
    onSpecialIIClassesChange: noop,
    onSpecialIIPupilsChange: noop,
    special1Avg: 6,
    special2Avg: 0,
    specialIIAvg: 0,
    special1Band: band,
    special2Band: band,
    specialIIBand: band,
    special1PhmaxPart: 8,
    special2PhmaxPart: 0,
    specialIIPhmaxPart: 0,
    specialPhmax: 8,
    psychComputedRows: [],
    onAddPsych: noop,
    onUpdatePsych: noop,
    onRemovePsych: noop,
    healthComputedRows: [],
    onAddHealth: noop,
    onUpdateHealth: noop,
    onRemoveHealth: noop,
    minorityType: "minority1",
    onMinorityTypeChange: noop,
    minority1Classes: 0,
    minority1Pupils: 0,
    minority2Classes: 0,
    minority2Pupils: 0,
    onMinority1ClassesChange: noop,
    onMinority1PupilsChange: noop,
    onMinority2ClassesChange: noop,
    onMinority2PupilsChange: noop,
    minority1Avg: 0,
    minority2Avg: 0,
    minority1Band: band,
    minority2Band: band,
    minority1Phmax: 0,
    minority2Phmax: 0,
    minorityPhmax: 0,
    gymComputedRows: [],
    onAddGym: noop,
    onUpdateGym: noop,
    onRemoveGym: noop,
    mixedMethodFirstZsPupils: 0,
    mixedMethodFirstZsClasses: 0,
    mixedMethodFirstSpecialPupils: 0,
    mixedMethodFirstSpecialClasses: 0,
    mixedMethodSecondZsPupils: 0,
    mixedMethodSecondZsClasses: 0,
    mixedMethodSecondSpecialPupils: 0,
    mixedMethodSecondSpecialClasses: 0,
    mixedMethodFirstZsAvg: 0,
    mixedMethodSecondZsAvg: 0,
    mixedMethodFirstSpecialAvg: 0,
    mixedMethodSecondSpecialAvg: 0,
    mixedMethodFirstZsBand: band,
    mixedMethodSecondZsBand: band,
    mixedMethodFirstSpecialBand: band,
    mixedMethodSecondSpecialBand: band,
    mixedMethodFirstZsResult: 0,
    mixedMethodSecondZsResult: 0,
    mixedMethodFirstSpecialResult: 0,
    mixedMethodSecondSpecialResult: 0,
    mixedMethodFirstTotal: 0,
    mixedMethodSecondTotal: 0,
    mixedMethodTotal: 0,
    onMixedMethodFirstZsPupilsChange: noop,
    onMixedMethodFirstZsClassesChange: noop,
    onMixedMethodFirstSpecialPupilsChange: noop,
    onMixedMethodFirstSpecialClassesChange: noop,
    onMixedMethodSecondZsPupilsChange: noop,
    onMixedMethodSecondZsClassesChange: noop,
    onMixedMethodSecondSpecialPupilsChange: noop,
    onMixedMethodSecondSpecialClassesChange: noop,
    prepClasses: 0,
    prepChildren: 0,
    prepSpecialClasses: 0,
    prepSpecialChildren: 0,
    p38First: 0,
    p38Second: 0,
    p41First: 0,
    p41Second: 0,
    onPrepClassesChange: noop,
    onPrepChildrenChange: noop,
    onPrepSpecialClassesChange: noop,
    onPrepSpecialChildrenChange: noop,
    onP38FirstChange: noop,
    onP38SecondChange: noop,
    onP41FirstChange: noop,
    onP41SecondChange: noop,
    prepAvg: 0,
    prepPh: 0,
    prepSpecialAvg: 0,
    prepSpecialPh: 0,
    psychPhmax: 0,
    healthPhmax: 0,
    gymPhmax: 0,
    mixedForTotal: 0,
    extrasPhmax: 0,
    totalPhmax: 42,
  };
}

function exceptionsRow(viewMode: "basic" | "expert", sections: readonly FormSection[]): string {
  const html = renderToStaticMarkup(createElement(ZsPhmaxTabPanel, panelProps(viewMode, sections)));
  const marker = "zs-phmax-module-row";
  const at = html.indexOf(marker);
  expect(at).toBeGreaterThan(-1);
  const start = html.lastIndexOf("<div", at);
  let depth = 0;
  for (let i = start; i < html.length; i += 1) {
    const divOpen = html.startsWith("<div", i) && /[\s>]/.test(html[i + 4] ?? "");
    if (divOpen) depth += 1;
    else if (html.startsWith("</div>", i)) {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + "</div>".length);
    }
  }
  throw new Error("Řádek výjimek PHmax se nepodařilo vyříznout.");
}

function directOpenTags(wrapper: string): string[] {
  const body = wrapper.slice(wrapper.indexOf(">") + 1, wrapper.lastIndexOf("</div>"));
  const tags: string[] = [];
  let depth = 0;
  for (let i = 0; i < body.length; i += 1) {
    if (body[i] !== "<") continue;
    if (body.startsWith("<!--", i)) {
      i = body.indexOf("-->", i) + 2;
      continue;
    }
    const match = /^<\/?([a-zA-Z][\w:-]*)/.exec(body.slice(i));
    if (!match) continue;
    const name = match[1].toLowerCase();
    const tagEnd = body.indexOf(">", i);
    const raw = body.slice(i, tagEnd + 1);
    const isClose = raw.startsWith("</");
    const selfClosing = raw.endsWith("/>") || VOID_TAGS.has(name);
    if (!isClose && depth === 0) tags.push(raw);
    if (isClose) depth = Math.max(0, depth - 1);
    else if (!selfClosing) depth += 1;
    i = tagEnd;
  }
  return tags;
}

const sec16Sections = ["sec16_first", "sec16_second"] as const;
const bothSections = ["sec16_first", "sec16_second", "special_i_first"] as const;

describe("ZŠ PHmax řádek § 16/9", () => {
  it("samotné § 16/9 je v basic režimu jediné details a ve expert režimu jediná karta", () => {
    const basicRow = exceptionsRow("basic", sec16Sections);
    const basicChildren = directOpenTags(basicRow);
    expect(basicChildren).toHaveLength(1);
    expect(basicChildren[0]).toContain("<details");
    expect(basicChildren[0]).toContain("ux-collapsible");
    expect(basicChildren[0]).toContain('data-wizard-step="3"');
    expect(basicChildren[0]).not.toContain(" open");
    expect(basicRow).toContain('data-section="sec16"');
    expect(basicRow).toContain("section-card--module-support");
    expect(basicRow).toContain('data-section="zs-phmax-exceptions"');

    const expertRow = exceptionsRow("expert", sec16Sections);
    const expertChildren = directOpenTags(expertRow);
    expect(expertChildren).toHaveLength(1);
    expect(expertChildren[0]).toContain("<section");
    expect(expertChildren[0]).toContain("section-card--module-support");
    expect(expertChildren[0]).toContain('data-section="sec16"');
    expect(expertChildren[0]).toContain('data-wizard-step="3"');
    expect(expertChildren[0]).not.toContain("<details");
  });

  it("dva moduly zůstanou dva sloupce v basic i expert režimu", () => {
    const basicChildren = directOpenTags(exceptionsRow("basic", bothSections));
    expect(basicChildren).toHaveLength(2);
    expect(basicChildren.every((tag) => tag.includes("<details") && tag.includes("ux-collapsible"))).toBe(true);
    expect(basicChildren.every((tag) => tag.includes('data-wizard-step="3"'))).toBe(true);

    const expertRow = exceptionsRow("expert", bothSections);
    const expertChildren = directOpenTags(expertRow);
    expect(expertChildren).toHaveLength(2);
    expect(expertChildren[0]).toContain("section-card--module-support");
    expect(expertChildren[0]).toContain('data-section="sec16"');
    expect(expertChildren[1]).toContain("section-card--module-special");
    expect(expertChildren[1]).toContain('data-section="special"');
    expect(expertRow.indexOf('data-section="sec16"')).toBeLessThan(expertRow.indexOf('data-section="special"'));
  });

  it("plnou šířku dostane jen samotné § 16/9 v řádku ZŠ, ne sdílená mřížka", () => {
    const css = readFileSync(resolve(__dirname, "../styles.css"), "utf8");
    expect(css).toContain(".zs-phmax-module-row > details.ux-collapsible:only-child:has([data-section=\"sec16\"])");
    expect(css).toContain(".zs-phmax-module-row > section.section-card--module-support:only-child");
    expect(css).toContain("grid-column: 1 / -1;");
    expect(css).not.toContain(".grid.two > :only-child");
    expect(css).not.toContain(".grid.two > details");
  });
});
