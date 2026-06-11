import { describe, expect, it } from "vitest";
import { computeZsLitePhmax } from "./phmax-zs-lite-logic";

const zeroSec16 = {
  incl1Classes: 0,
  incl1Pupils: 0,
  incl2Classes: 0,
  incl2Pupils: 0,
};

describe("ZŠ lite PHmax", () => {
  it("úplná ZŠ: 3 třídy 1. st. (avg 17) + 2 třídy 2. st. (avg 17) → 141 h", () => {
    const r = computeZsLitePhmax({
      basicType: "full_more_than_2",
      basic1Classes: 3,
      basic1Pupils: 51,
      basic2Classes: 2,
      basic2Pupils: 34,
      ...zeroSec16,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.phmaxHours).toBe(141);
    expect(r.firstStagePhmax).toBe(75);
    expect(r.secondStagePhmax).toBe(66);
  });

  it("§ 16/9 přičte hodiny z tabulek B9–B10", () => {
    const r = computeZsLitePhmax({
      basicType: "full_more_than_2",
      basic1Classes: 3,
      basic1Pupils: 51,
      basic2Classes: 2,
      basic2Pupils: 34,
      incl1Classes: 2,
      incl1Pupils: 20,
      incl2Classes: 0,
      incl2Pupils: 0,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.sec16FirstPhmax).toBe(52);
    expect(r.phmaxHours).toBe(193);
  });

  it("neúplná ZŠ: 1 třída 1. st., 18 žáků", () => {
    const r = computeZsLitePhmax({
      basicType: "first_only_1",
      basic1Classes: 1,
      basic1Pupils: 18,
      basic2Classes: 0,
      basic2Pupils: 0,
      ...zeroSec16,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.phmaxHours).toBeGreaterThan(0);
    expect(r.secondStagePhmax).toBe(0);
  });

  it("bez tříd 1. stupně vrátí chybu", () => {
    const r = computeZsLitePhmax({
      basicType: "full_more_than_2",
      basic1Classes: 0,
      basic1Pupils: 40,
      basic2Classes: 2,
      basic2Pupils: 34,
      ...zeroSec16,
    });
    expect(r.ok).toBe(false);
  });

  it("úplná ZŠ vyžaduje 2. stupeň", () => {
    const r = computeZsLitePhmax({
      basicType: "full_more_than_2",
      basic1Classes: 2,
      basic1Pupils: 40,
      basic2Classes: 0,
      basic2Pupils: 0,
      ...zeroSec16,
    });
    expect(r.ok).toBe(false);
  });
});
