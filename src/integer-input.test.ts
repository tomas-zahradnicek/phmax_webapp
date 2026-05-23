import { describe, expect, it } from "vitest";
import {
  formatIntegerInputDisplay,
  parseIntegerInput,
  sanitizeIntegerInputString,
} from "./integer-input";

describe("integer-input", () => {
  it("parseIntegerInput odstraní úvodní nuly", () => {
    expect(parseIntegerInput("020")).toBe(20);
    expect(parseIntegerInput("007")).toBe(7);
    expect(parseIntegerInput("0")).toBe(0);
    expect(parseIntegerInput("")).toBe(0);
  });

  it("formatIntegerInputDisplay zobrazí kanonický tvar", () => {
    expect(formatIntegerInputDisplay(20)).toBe("20");
    expect(formatIntegerInputDisplay(0)).toBe("0");
  });

  it("sanitizeIntegerInputString normalizuje textové pole", () => {
    expect(sanitizeIntegerInputString("020")).toBe("20");
    expect(sanitizeIntegerInputString("")).toBe("");
    expect(sanitizeIntegerInputString("abc")).toBe("");
  });
});
