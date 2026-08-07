import { describe, expect, it } from "vitest";
import {
  formatSchoolYearLabel,
  isValidSchoolYearLabel,
  parseSchoolYearLabel,
} from "./school-year-label";

describe("school-year-label", () => {
  it("formatSchoolYearLabel(2026) → 2026/2027", () => {
    expect(formatSchoolYearLabel(2026)).toBe("2026/2027");
  });

  it("parseSchoolYearLabel(2026/2027) → 2026", () => {
    expect(parseSchoolYearLabel("2026/2027")).toBe(2026);
  });

  it("přijímá validní rok 2026/2027", () => {
    expect(isValidSchoolYearLabel("2026/2027")).toBe(true);
  });

  it("odmítá 2026/2028 (druhý rok ≠ první + 1)", () => {
    expect(isValidSchoolYearLabel("2026/2028")).toBe(false);
    expect(parseSchoolYearLabel("2026/2028")).toBeNull();
  });

  it("odmítá 26/27", () => {
    expect(isValidSchoolYearLabel("26/27")).toBe(false);
    expect(parseSchoolYearLabel("26/27")).toBeNull();
  });

  it("odmítá 2026-2027", () => {
    expect(isValidSchoolYearLabel("2026-2027")).toBe(false);
    expect(parseSchoolYearLabel("2026-2027")).toBeNull();
  });

  it("nemá implicitní default roku (prázdný / neplatný → null)", () => {
    expect(parseSchoolYearLabel("")).toBeNull();
    expect(parseSchoolYearLabel("   ")).toBeNull();
    expect(parseSchoolYearLabel("neuvedeno")).toBeNull();
    expect(isValidSchoolYearLabel("")).toBe(false);
  });

  it("formatSchoolYearLabel odmítá neceločíselný startYear", () => {
    expect(() => formatSchoolYearLabel(2026.5)).toThrow(RangeError);
  });
});
