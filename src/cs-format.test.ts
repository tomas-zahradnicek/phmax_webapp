import { describe, expect, it } from "vitest";
import { formatCsHoursPerWeek, formatCsNumber, formatCsNumberOrDash, formatExportCell } from "./cs-format";

describe("cs-format", () => {
  it("formatCsNumber používá čárku", () => {
    expect(formatCsNumber(57.5)).toBe("57,5");
    expect(formatCsNumber(1000).replace(/\s/g, " ")).toBe("1 000");
  });

  it("formatCsHoursPerWeek má zkratky s tečkou", () => {
    expect(formatCsHoursPerWeek(79)).toBe("79 h./týd.");
    expect(formatCsHoursPerWeek(57.5)).toBe("57,5 h./týd.");
  });

  it("formatCsNumberOrDash pro null", () => {
    expect(formatCsNumberOrDash(null)).toBe("–");
    expect(formatCsNumberOrDash(12)).toBe("12");
  });

  it("formatExportCell formátuje čísla", () => {
    expect(formatExportCell(57.5)).toBe("57,5");
    expect(formatExportCell("text")).toBe("text");
  });
});
