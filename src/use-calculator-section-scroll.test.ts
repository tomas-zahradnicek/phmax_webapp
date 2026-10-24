import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CALCULATOR_SECTION_SCROLL_FALLBACK_OFFSET_PX,
  CALCULATOR_SECTION_SCROLL_GAP_PX,
  CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX,
  resolveCalculatorSectionScrollOffset,
  resolveCalculatorSectionScrollTop,
} from "./use-calculator-section-scroll";

const VIEWPORT_800 = 800;
const ELEMENT_TOP = 400;
const SCROLL_Y = 200;

function legacyScrollTop(dockHeight: number): number {
  return Math.max(0, ELEMENT_TOP + SCROLL_Y - dockHeight - CALCULATOR_SECTION_SCROLL_GAP_PX);
}

function targetViewportTop(dockHeight: number | null, viewportHeight: number): number {
  const offset = resolveCalculatorSectionScrollOffset(dockHeight, viewportHeight);
  return offset + CALCULATOR_SECTION_SCROLL_GAP_PX;
}

describe("resolveCalculatorSectionScrollOffset", () => {
  it("krátký dock ponechá původní výpočet", () => {
    const dockHeight = 120;
    const offset = resolveCalculatorSectionScrollOffset(dockHeight, VIEWPORT_800);
    expect(offset).toBe(dockHeight);
    expect(resolveCalculatorSectionScrollTop(ELEMENT_TOP, SCROLL_Y, offset)).toBe(legacyScrollTop(dockHeight));
  });

  it("vysoký dock ořízne offset, aby cíl nezačínal pod viewportem", () => {
    const dockHeight = 900;
    const offset = resolveCalculatorSectionScrollOffset(dockHeight, VIEWPORT_800);
    const start = targetViewportTop(dockHeight, VIEWPORT_800);
    expect(offset).toBeLessThan(dockHeight);
    expect(start).toBeLessThan(VIEWPORT_800);
    expect(VIEWPORT_800 - start).toBeGreaterThanOrEqual(CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX);
    const scrollY = 2000;
    const unclamped = Math.max(0, ELEMENT_TOP + scrollY - dockHeight - CALCULATOR_SECTION_SCROLL_GAP_PX);
    expect(resolveCalculatorSectionScrollTop(ELEMENT_TOP, scrollY, offset)).toBeGreaterThan(unclamped);
  });

  it("viewport 800 px a dock kolem výšky ZŠ sticky bloku nechá aspoň minimum cíle vidět", () => {
    const dockHeight = 760;
    const start = targetViewportTop(dockHeight, VIEWPORT_800);
    expect(start).toBeLessThan(VIEWPORT_800);
    expect(VIEWPORT_800 - start).toBeGreaterThanOrEqual(CALCULATOR_SECTION_SCROLL_MIN_VISIBLE_PX);
  });

  it("velmi malý viewport zůstane nezáporný a konečný", () => {
    const offset = resolveCalculatorSectionScrollOffset(400, 32);
    const top = resolveCalculatorSectionScrollTop(ELEMENT_TOP, SCROLL_Y, offset);
    expect(Number.isFinite(offset)).toBe(true);
    expect(offset).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(top)).toBe(true);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(resolveCalculatorSectionScrollTop(Number.NaN, SCROLL_Y, offset)).toBe(0);
  });

  it("chybějící dock použije původní fallback 100 px", () => {
    const offset = resolveCalculatorSectionScrollOffset(null, VIEWPORT_800);
    expect(offset).toBe(CALCULATOR_SECTION_SCROLL_FALLBACK_OFFSET_PX);
    expect(resolveCalculatorSectionScrollTop(ELEMENT_TOP, SCROLL_Y, offset)).toBe(
      legacyScrollTop(CALCULATOR_SECTION_SCROLL_FALLBACK_OFFSET_PX),
    );
  });

  it("výběr cílové sekce se nemění", () => {
    const source = readFileSync(new URL("./use-calculator-section-scroll.ts", import.meta.url), "utf8");
    expect(source).toContain('[data-section="${sectionId}"]');
    expect(source).toContain('[data-section="${targetId}"]');
    expect(source).toContain('[data-section="guide"]');
    expect(source).not.toContain("pha1r");
    expect(source).not.toContain('"basic"');
  });
});
