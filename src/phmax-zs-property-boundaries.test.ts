import { describe, expect, it } from "vitest";
import { B11_B13, B13_MORE_THAN_2, PHP_TABLE, pickBand } from "./phmax-zs-logic";

function assertSingleBandCoverage(
  bands: readonly { test: (x: number) => boolean; label: string; value: number }[],
  range: { min: number; max: number; step: number },
) {
  for (let x = range.min; x <= range.max; x = Math.round((x + range.step) * 1000) / 1000) {
    const matches = bands.filter((b) => b.test(x));
    expect(matches.length, `x=${x}`).toBe(1);
    const picked = pickBand(x, bands);
    expect(picked.label, `x=${x}`).toBe(matches[0].label);
    expect(picked.value, `x=${x}`).toBe(matches[0].value);
  }
}

describe("ZŠ property boundaries", () => {
  it("B13 (více než 2 třídy) má úplné a disjunktní pokrytí pásem", () => {
    assertSingleBandCoverage(B13_MORE_THAN_2.first, { min: 0, max: 40, step: 0.1 });
    assertSingleBandCoverage(B13_MORE_THAN_2.second, { min: 0, max: 40, step: 0.1 });
  });

  it("B11 zdravotnické zařízení má úplné a disjunktní pokrytí pásem", () => {
    assertSingleBandCoverage(B11_B13.health1, { min: 0, max: 20, step: 0.1 });
  });

  it("PHP tabulka má úplné a disjunktní pokrytí pásem", () => {
    assertSingleBandCoverage(PHP_TABLE, { min: 0, max: 1200, step: 1 });
  });
});
