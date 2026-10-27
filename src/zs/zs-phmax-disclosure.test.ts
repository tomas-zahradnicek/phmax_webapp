import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ZsModuleGate } from "../ZsModuleGate";
import { ZsPhmaxBasicSection } from "./ZsPhmaxBasicSection";
import { ZsPhmaxExtrasSection } from "./ZsPhmaxExtrasSection";
import { ZsPhmaxSec16Section } from "./ZsPhmaxSec16Section";

const band = { label: "pásmo", value: 30 };

function markup(node: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(node);
}

function sec16(classes: { c1: number; p1: number; c2: number; p2: number; hours: number }) {
  return markup(
    createElement(ZsPhmaxSec16Section, {
      viewMode: "basic",
      showFirst: true,
      showSecond: true,
      firstClasses: classes.c1,
      firstPupils: classes.p1,
      secondClasses: classes.c2,
      secondPupils: classes.p2,
      onFirstClassesChange: () => {},
      onFirstPupilsChange: () => {},
      onSecondClassesChange: () => {},
      onSecondPupilsChange: () => {},
      firstAvg: 8,
      secondAvg: 8,
      firstBand: { label: "pásmo", value: 26 },
      secondBand: { label: "pásmo", value: 34 },
      firstPhmax: 130,
      secondPhmax: 136,
      totalPhmax: classes.hours,
    }),
  );
}

function extras(hours: { par38: number; par41: number }) {
  return markup(
    createElement(ZsPhmaxExtrasSection, {
      viewMode: "basic",
      gateTitle: "§ 38 a § 41 (navýšení PHmax)",
      showPrepClass: false,
      showPrepSpecial: false,
      showPar38: true,
      showPar41: true,
      prepClasses: 0,
      prepChildren: 0,
      prepSpecialClasses: 0,
      prepSpecialChildren: 0,
      p38First: 0,
      p38Second: 0,
      p41First: 0,
      p41Second: 0,
      onPrepClassesChange: () => {},
      onPrepChildrenChange: () => {},
      onPrepSpecialClassesChange: () => {},
      onPrepSpecialChildrenChange: () => {},
      onP38FirstChange: () => {},
      onP38SecondChange: () => {},
      onP41FirstChange: () => {},
      onP41SecondChange: () => {},
      prepAvg: 0,
      prepPh: 0,
      prepSpecialAvg: 0,
      prepSpecialPh: 0,
      prepClassPhmax: 0,
      prepSpecialPhmax: 0,
      par38Phmax: hours.par38,
      par41Phmax: hours.par41,
    }),
  );
}

function detailsTag(html: string): string {
  return html.match(/<details\b[^>]*>/)?.[0] ?? "";
}

describe("ZŠ PHmax disclosure", () => {
  it("A. summary § 16 a § 38 patří ke kroku 3, ne visí mimo tělo", () => {
    const sec = sec16({ c1: 5, p1: 40, c2: 4, p2: 32, hours: 266 });
    const extra = extras({ par38: 0, par41: 0 });
    expect(detailsTag(sec)).toContain('data-wizard-step="3"');
    expect(detailsTag(extra)).toContain('data-wizard-step="3"');
    expect(sec).toContain("Třídy podle");
    expect(extra).toContain("§ 38 a § 41 (navýšení PHmax)");
  });

  it("B. zavřený summary má šipku a aria-expanded false", () => {
    const html = sec16({ c1: 0, p1: 0, c2: 0, p2: 0, hours: 0 });
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("ux-collapsible__chevron");
    expect(detailsTag(html)).not.toContain(" open");
  });

  it("C. krok běžných tříd vysvětlí 668 + 266 = 934 bez formuláře § 16", () => {
    const html = markup(
      createElement(ZsPhmaxBasicSection, {
        hasBasicIssue: false,
        showBasicFirst: true,
        showBasicSecond: true,
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
        basicSecondBand: { label: "pásmo", value: 46 },
        basic1Phmax: 300,
        basic2Phmax: 368,
        basicPhmax: 668,
        prepClassPhmax: 0,
        prepSpecialPhmax: 0,
        par38Phmax: 0,
        par41Phmax: 0,
        compositionParts: [
          { label: "Běžné třídy", hours: 668 },
          { label: "§ 16/9", hours: 266 },
        ],
        totalPhmax: 934,
      }),
    );
    expect(html).toContain("Běžné třídy 668 h + § 16/9 266 h = PHmax 934 h");
    expect(html).toContain(">300<");
    expect(html).toContain(">368<");
    expect(html).toContain(">668<");
    expect(html).not.toContain("1. stupeň – třídy");
  });

  it("D. zavřené § 16 s ukázkou ukáže 9 tříd · 72 žáků · 266 h", () => {
    const html = sec16({ c1: 5, p1: 40, c2: 4, p2: 32, hours: 266 });
    expect(html).toContain("9 tříd · 72 žáků · 266 h");
  });

  it("E. nulové § 38 říká bez navýšení, nenulové součet hodin", () => {
    expect(extras({ par38: 0, par41: 0 })).toContain("bez navýšení");
    const active = extras({ par38: 10, par41: 2 });
    expect(active).not.toContain("bez navýšení");
    expect(active).toContain("12 h");
  });

  it("F. každý PHmax modul kroku 3 dostane vnější details z brány, PHAmax a PHPmax ne", () => {
    const dir = resolve(process.cwd(), "src/zs");
    const step3Ids = new Set<string>();
    const otherIds = new Set<string>();
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".tsx")) continue;
      const text = readFileSync(resolve(dir, file), "utf8");
      if (!text.includes("<ZsModuleGate")) continue;
      const ids = [...text.matchAll(/sectionId="([^"]+)"/g)].map((match) => match[1]);
      const bucket = text.includes('data-wizard-step="3"') ? step3Ids : otherIds;
      for (const id of ids) bucket.add(id);
    }

    expect([...step3Ids].sort()).toEqual(
      ["extras", "gym", "health", "minority", "mixed", "psych", "sec16", "special"].sort(),
    );
    expect([...otherIds].sort()).toEqual(["pha", "php"]);

    for (const sectionId of step3Ids) {
      const html = markup(
        createElement(
          ZsModuleGate,
          { sectionId, title: sectionId, viewMode: "basic" },
          createElement("p", null, "tělo"),
        ),
      );
      expect(detailsTag(html), sectionId).toContain('data-wizard-step="3"');
      expect(html, sectionId).toContain("tělo");
    }

    for (const sectionId of otherIds) {
      const html = markup(
        createElement(
          ZsModuleGate,
          { sectionId, title: sectionId, viewMode: "basic", defaultOpenInBasic: true },
          createElement("p", null, "tělo"),
        ),
      );
      expect(detailsTag(html), sectionId).not.toContain("data-wizard-step");
    }

    const expert = markup(
      createElement(
        ZsModuleGate,
        { sectionId: "psych", title: "Psychiatrie", viewMode: "expert" },
        createElement("p", null, "expert-tělo"),
      ),
    );
    expect(expert).not.toContain("<details");
    expect(expert).toContain("expert-tělo");
  });
});
