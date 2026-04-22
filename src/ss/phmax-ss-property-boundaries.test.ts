import { describe, expect, it } from "vitest";
import { phmaxSsDataset } from "./phmax-ss-dataset";
import { getProgram, intervalContains } from "./phmax-ss-helpers";

function assertSingleMatchForRange(
  intervals: readonly { min?: number; max?: number; minExclusive?: boolean; maxExclusive?: boolean }[],
  range: { min: number; max: number; step: number },
) {
  for (let x = range.min; x <= range.max; x = Math.round((x + range.step) * 1000) / 1000) {
    const matches = intervals.filter((interval) => intervalContains(interval, x));
    expect(matches.length, `x=${x}`).toBe(1);
  }
}

describe("SŠ property boundaries", () => {
  it("jednooborová pásma pro 39-41-L/01 mají úplné a disjunktní pokrytí", () => {
    const program = getProgram(phmaxSsDataset, "39-41-L/01");
    assertSingleMatchForRange(program.modes.oneObor, { min: 0, max: 45, step: 0.1 });
  });

  it("82 talent pásma (2 obory) mají úplné a disjunktní pokrytí", () => {
    const program = getProgram(phmaxSsDataset, "82-51-L/01");
    assertSingleMatchForRange(program.modes.twoObory82, { min: 0, max: 45, step: 0.1 });
  });
});
