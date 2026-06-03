import { describe, expect, it } from "vitest";
import { B11_B13, B14_B16, pickBand } from "../phmax-zs-logic";
import { DEFAULT_MODE } from "../config/default-form-state";
import {
  sanitizeCalculatorMode,
  sanitizeHealthRows,
  sanitizePsychRows,
  sanitizeZsAutosaveSnapshot,
} from "./zs-snapshot-row-sanitize";

describe("zs-snapshot-row-sanitize", () => {
  it("sanitizeCalculatorMode odmítne legacy full/basic", () => {
    expect(sanitizeCalculatorMode("full")).toBe(DEFAULT_MODE);
    expect(sanitizeCalculatorMode("basic")).toBe(DEFAULT_MODE);
    expect(sanitizeCalculatorMode("phmax_full_zs")).toBe("phmax_full_zs");
  });

  it("sanitizeZsAutosaveSnapshot nepřepíše mode na basic", () => {
    const safe = sanitizeZsAutosaveSnapshot({ mode: "phmax_psychiatric" });
    expect(safe.mode).toBe("phmax_psychiatric");
  });

  it("odfiltruje neplatný kind psychologa", () => {
    expect(
      sanitizePsychRows([{ kind: "bad", currentClasses: 1, currentPupils: 10 }]),
    ).toEqual([]);
    expect(
      sanitizePsychRows([{ kind: "psych1", currentClasses: 2, currentPupils: 16 }]),
    ).toHaveLength(1);
  });

  it("odfiltruje neplatný kind zdravotní třídy", () => {
    expect(sanitizeHealthRows([{ kind: "zdravotni", currentClasses: 1 }])).toEqual([]);
    expect(sanitizeHealthRows([{ kind: "health1", currentClasses: 1 }])).toHaveLength(1);
  });

  it("odfiltruje neplatný kind PHA řádku", () => {
    expect(sanitizeZsAutosaveSnapshot({ phaRows: [{ kind: "B35", classes: 1, pupils: 5 }] }).phaRows).toEqual(
      [],
    );
    const safe = sanitizeZsAutosaveSnapshot({
      phaRows: [{ kind: "zs1", classes: 2, pupils: 10 }],
    });
    expect(safe.phaRows).toHaveLength(1);
  });

  it("sanitizeZsAutosaveSnapshot zabrání pádu pickBand na neplatných řádcích", () => {
    const safe = sanitizeZsAutosaveSnapshot({
      psychRows: [{ kind: "psycholog", currentClasses: 1, currentPupils: 8 }],
      healthRows: [{ kind: "B11", currentClasses: 1, currentPupils: 6 }],
    });
    const psych = safe.psychRows as { kind: string }[];
    const health = safe.healthRows as { kind: string }[];
    expect(psych).toEqual([]);
    expect(health).toEqual([]);
    for (const row of psych) {
      expect(() => pickBand(8, B14_B16[row.kind as keyof typeof B14_B16])).not.toThrow();
    }
    for (const row of health) {
      expect(() => pickBand(6, B11_B13[row.kind as keyof typeof B11_B13])).not.toThrow();
    }
  });
});
