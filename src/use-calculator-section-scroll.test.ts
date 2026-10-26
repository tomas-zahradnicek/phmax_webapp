import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CALCULATOR_SECTION_SCROLL_CORRECTION_LIMIT,
  CALCULATOR_SECTION_SCROLL_FALLBACK_OFFSET_PX,
  CALCULATOR_SECTION_SCROLL_GAP_PX,
  CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX,
  resolveCalculatorSectionScrollTop,
  resolveSectionScrollCorrection,
} from "./use-calculator-section-scroll";

const VIEWPORT_800 = 800;
const ELEMENT_TOP = 400;
const SCROLL_Y = 200;

function legacyScrollTop(documentTop: number, dockHeight: number): number {
  return Math.max(0, documentTop - dockHeight - CALCULATOR_SECTION_SCROLL_GAP_PX);
}

function finalTargetTop(documentTop: number, scrollTop: number): number {
  return documentTop - scrollTop;
}

describe("resolveCalculatorSectionScrollTop", () => {
  it("krátký dock ponechá původní výpočet", () => {
    const dockHeight = 120;
    const documentTop = ELEMENT_TOP + SCROLL_Y;
    const scrollTop = resolveCalculatorSectionScrollTop(ELEMENT_TOP, SCROLL_Y, dockHeight, VIEWPORT_800);
    expect(scrollTop).toBe(legacyScrollTop(documentTop, dockHeight));
    expect(finalTargetTop(documentTop, scrollTop)).toBe(dockHeight + CALCULATOR_SECTION_SCROLL_GAP_PX);
  });

  it("CI geometrie posune scroll aspoň na viditelnost 64 px", () => {
    const documentTop = 1608.171875;
    const dockHeight = 717;
    const scrollTop = resolveCalculatorSectionScrollTop(documentTop, 0, dockHeight, VIEWPORT_800);
    const minimum = documentTop - (VIEWPORT_800 - CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX);
    expect(scrollTop).toBeGreaterThanOrEqual(minimum);
    expect(scrollTop).toBeGreaterThanOrEqual(872.171875);
    expect(finalTargetTop(documentTop, scrollTop)).toBeLessThanOrEqual(736);
  });

  it("CI geometrie nepožádá o scroll, který položí cíl na spodní okraj", () => {
    const documentTop = 1608.171875;
    const scrollTop = resolveCalculatorSectionScrollTop(documentTop, 0, 717, VIEWPORT_800);
    expect(scrollTop).not.toBe(808.171875);
    expect(finalTargetTop(documentTop, scrollTop)).toBeLessThan(VIEWPORT_800);
  });

  it("vysoký dock zaručí aspoň 64 px cíle a vzdá se plné mezery pod dockem", () => {
    const documentTop = 2400;
    const dockHeight = 900;
    const scrollTop = resolveCalculatorSectionScrollTop(ELEMENT_TOP, documentTop - ELEMENT_TOP, dockHeight, VIEWPORT_800);
    const targetTop = finalTargetTop(documentTop, scrollTop);
    expect(targetTop).toBeLessThanOrEqual(VIEWPORT_800 - CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX);
    expect(VIEWPORT_800 - targetTop).toBeGreaterThanOrEqual(CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX);
    expect(targetTop).toBeLessThan(dockHeight + CALCULATOR_SECTION_SCROLL_GAP_PX);
  });

  it("velmi malý viewport zůstane nezáporný a konečný", () => {
    const scrollTop = resolveCalculatorSectionScrollTop(ELEMENT_TOP, SCROLL_Y, 400, 32);
    expect(Number.isFinite(scrollTop)).toBe(true);
    expect(scrollTop).toBeGreaterThanOrEqual(0);
    expect(resolveCalculatorSectionScrollTop(Number.NaN, SCROLL_Y, 400, 32)).toBe(0);
  });

  it("cíl u konce dokumentu nepřesáhne maxScrollY", () => {
    const documentTop = 5000;
    const maxScrollY = 4200;
    const scrollTop = resolveCalculatorSectionScrollTop(documentTop, 0, 80, 900, maxScrollY);
    expect(scrollTop).toBe(maxScrollY);
    expect(scrollTop).toBeLessThanOrEqual(maxScrollY);
  });

  it("chybějící dock použije původní fallback 100 px", () => {
    const documentTop = ELEMENT_TOP + SCROLL_Y;
    const scrollTop = resolveCalculatorSectionScrollTop(ELEMENT_TOP, SCROLL_Y, null, VIEWPORT_800);
    expect(scrollTop).toBe(legacyScrollTop(documentTop, CALCULATOR_SECTION_SCROLL_FALLBACK_OFFSET_PX));
  });

  it("běžný nízký offset kalkulačky se nemění", () => {
    const documentTop = 900;
    const dockHeight = 96;
    const scrollTop = resolveCalculatorSectionScrollTop(900, 0, dockHeight, 1000);
    expect(scrollTop).toBe(legacyScrollTop(documentTop, dockHeight));
  });

  it("výběr cílové sekce se nemění", () => {
    const source = readFileSync(new URL("./use-calculator-section-scroll.ts", import.meta.url), "utf8");
    expect(source).toContain('[data-section="${sectionId}"]');
    expect(source).toContain('[data-section="${targetId}"]');
    expect(source).toContain('[data-section="guide"]');
    expect(source).toContain("scrollend");
    expect(source).toContain('behavior: "instant"');
    expect(source).toContain("CALCULATOR_SECTION_SCROLL_CORRECTION_LIMIT");
    expect(source).not.toContain("pha1r");
    expect(source).not.toContain('"basic"');
  });
});

describe("resolveSectionScrollCorrection", () => {
  const preShiftDocumentTop = 1537.171875;
  const postShiftDocumentTop = 1608.171875;
  const dockHeight = 717;
  const maxScrollY = 3744;

  it("první měření CI geometrie požádá o 808.171875", () => {
    const scrollTop = resolveCalculatorSectionScrollTop(preShiftDocumentTop, 0, dockHeight, VIEWPORT_800);
    expect(scrollTop).toBe(808.171875);
  });

  it("pozdní posun +71 px opraví cíl na horních 736 px", () => {
    const initial = resolveCalculatorSectionScrollTop(preShiftDocumentTop, 0, dockHeight, VIEWPORT_800);
    const shiftedTop = postShiftDocumentTop - initial;
    const correction = resolveSectionScrollCorrection(
      shiftedTop,
      initial,
      dockHeight,
      VIEWPORT_800,
      maxScrollY,
      0,
    );
    expect(correction).not.toBeNull();
    expect(finalTargetTop(postShiftDocumentTop, correction!)).toBeLessThanOrEqual(736);
  });

  it("beze změny layoutu další scroll nespouští", () => {
    const scrollTop = resolveCalculatorSectionScrollTop(preShiftDocumentTop, 0, dockHeight, VIEWPORT_800);
    const settledTop = preShiftDocumentTop - scrollTop;
    expect(
      resolveSectionScrollCorrection(settledTop, scrollTop, dockHeight, VIEWPORT_800, maxScrollY, 0),
    ).toBeNull();
  });

  it("malý posun, který pořád nechává 64 px viditelných, neopravuje", () => {
    const scrollTop = 808.171875;
    const shiftedDocumentTop = 1544.171875;
    const targetTop = shiftedDocumentTop - scrollTop;
    expect(targetTop).toBe(VIEWPORT_800 - CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX);
    expect(
      resolveSectionScrollCorrection(targetTop, scrollTop, dockHeight, VIEWPORT_800, maxScrollY, 0),
    ).toBeNull();
  });

  it("oprava u konce dokumentu respektuje maxScrollY", () => {
    const correction = resolveSectionScrollCorrection(800.171875, 808.171875, dockHeight, VIEWPORT_800, 820, 0);
    expect(correction).toBe(820);
    expect(
      resolveSectionScrollCorrection(800.171875, 808.171875, dockHeight, VIEWPORT_800, 808.171875, 0),
    ).toBeNull();
  });

  it("druhá oprava se už nespustí", () => {
    expect(CALCULATOR_SECTION_SCROLL_CORRECTION_LIMIT).toBe(1);
    expect(
      resolveSectionScrollCorrection(800.171875, 808.171875, dockHeight, VIEWPORT_800, maxScrollY, 1),
    ).toBeNull();
  });
});
