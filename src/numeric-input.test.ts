import { describe, expect, it } from "vitest";
import {
  formatNumericInputDisplay,
  parseNumericInput,
  sanitizeNumericInputString,
} from "./numeric-input";

describe("numeric-input", () => {
  it("sanitizeNumericInputString odstraní úvodní nuly z celé části", () => {
    expect(sanitizeNumericInputString("010")).toBe("10");
    expect(sanitizeNumericInputString("010,5")).toBe("10,5");
    expect(sanitizeNumericInputString("010.5")).toBe("10.5");
    expect(sanitizeNumericInputString("0,5")).toBe("0,5");
  });

  it("parseNumericInput a formatNumericInputDisplay", () => {
    expect(parseNumericInput("010")).toBe(10);
    expect(parseNumericInput("10,25")).toBe(10.25);
    expect(formatNumericInputDisplay(10)).toBe("10");
    expect(formatNumericInputDisplay(6.5)).toBe("6.5");
    expect(formatNumericInputDisplay(0, true)).toBe("");
  });
});
