import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ZsBasicWizard } from "../ZsBasicWizard";
import { ZS_BASIC_WIZARD_STEPS, ZS_EXCEPTIONS_STEP_NOTE } from "../zs-basic-wizard";
import { ZsPhmaxBasicSection } from "./ZsPhmaxBasicSection";
import { zsShowPhmaxSubNav } from "./use-zs-wizard-navigation";

const band = { label: "17 – 20", value: 25 };

function basicMarkup(firstClasses: number, firstPupils: number, secondClasses = 0, secondPupils = 0) {
  return renderToStaticMarkup(
    createElement(ZsPhmaxBasicSection, {
      hasBasicIssue: firstClasses <= 0 || firstPupils <= 0 || secondClasses <= 0 || secondPupils <= 0,
      showBasicFirst: true,
      showBasicSecond: true,
      showSchoolVariantFirstOnly: false,
      showPrepClass: false,
      showPrepSpecial: false,
      showPar38: false,
      showPar41: false,
      basicType: "full_more_than_2",
      onBasicTypeChange: () => {},
      basic1Classes: firstClasses,
      basic1Pupils: firstPupils,
      basic2Classes: secondClasses,
      basic2Pupils: secondPupils,
      onBasic1ClassesChange: () => {},
      onBasic1PupilsChange: () => {},
      onBasic2ClassesChange: () => {},
      onBasic2PupilsChange: () => {},
      basic1Avg: 20,
      basic2Avg: 20,
      basicFirstBand: band,
      basicSecondBand: { label: "17 – 20", value: 25 },
      basic1Phmax: 50,
      basic2Phmax: 100,
      basicPhmax: 150,
      prepClassPhmax: 0,
      prepSpecialPhmax: 0,
      par38Phmax: 0,
      par41Phmax: 0,
    }),
  );
}

function wizardMarkup(step: 2 | 3, hasExceptionModules: boolean) {
  return renderToStaticMarkup(
    createElement(ZsBasicWizard, {
      step,
      modeLabel: "PHmax – úplná ZŠ",
      hasExceptionModules,
      wizardChoice: "",
      wizardOptions: [],
      onWizardChoice: () => {},
      onStepChange: () => {},
      onBack: () => {},
      onNext: () => {},
    }),
  );
}

describe("ZŠ kroky Třídy a Výjimky", () => {
  it("A–C. krok 2 pojmenuje kategorii a první počty", () => {
    const html = basicMarkup(0, 0);
    expect(html).toContain('id="zs-basic-class-category"');
    expect(html).toContain("Kategorie běžných tříd");
    expect(html).toContain('for="zs-basic-class-category"');
    expect(html).toContain("Počet tříd");
    expect(html).toContain("Počet žáků");
    expect(html).toContain("1. stupeň");
    expect(html).toContain("2. stupeň");
    expect(html).toContain("Doplňte počet tříd a žáků");
    expect(basicMarkup(2, 40, 4, 80)).toContain("Počty tříd a žáků jsou zadané");
  });

  it("krok 2 a 3 mají jeden úkol a neopakují režim z hlavičky", () => {
    expect(ZS_BASIC_WIZARD_STEPS[1]).toMatchObject({
      label: "Třídy",
      lead: "Vyberte kategorii běžných tříd a doplňte počet tříd a žáků u každého stupně.",
    });
    expect(ZS_BASIC_WIZARD_STEPS[2]?.lead).toContain("nechte zavřený");
    const step2 = wizardMarkup(2, true);
    expect(step2).toContain("Třídy");
    expect(step2).toContain("Další krok");
    expect(step2).toContain("Zpět");
    expect(step2).not.toContain("Aktivní režim");
    const step3 = wizardMarkup(3, true);
    expect(step3).toContain("Výjimky");
    expect(step3).not.toContain("Aktivní režim");
    expect(wizardMarkup(3, false)).toContain("nejsou viditelné doplňkové moduly");
  });

  it("E. výjimky říkají, které moduly lze přeskočit", () => {
    expect(ZS_EXCEPTIONS_STEP_NOTE).toContain("nechte zavřený");
    expect(ZS_EXCEPTIONS_STEP_NOTE).not.toMatch(/nezapočít/i);
  });

  it("průvodce nemá druhou navigaci částí PHmax", () => {
    expect(zsShowPhmaxSubNav("phmax", true)).toBe(false);
    expect(zsShowPhmaxSubNav("phmax", false)).toBe(true);
    expect(zsShowPhmaxSubNav("pha", false)).toBe(false);
    expect(zsShowPhmaxSubNav("php", false)).toBe(false);
  });
});
