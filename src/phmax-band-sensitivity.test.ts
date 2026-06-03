import { describe, expect, it } from "vitest";
import { B13_MORE_THAN_2 } from "./phmax-zs-logic";
import {
  buildBandUpgradeHint,
  findMinAvgForHigherBand,
  formatBandUpgradeHint,
} from "./phmax-band-sensitivity";

describe("phmax-band-sensitivity", () => {
  it("findMinAvgForHigherBand najde prah pro vyšší pásmo", () => {
    expect(findMinAvgForHigherBand(14, B13_MORE_THAN_2.first)).toBe(14.01);
  });

  it("buildBandUpgradeHint spočítá chybějící žáky", () => {
    const hint = buildBandUpgradeHint("1. stupeň", 10, 140, B13_MORE_THAN_2.first);
    expect(hint).not.toBeNull();
    expect(hint!.pupilsDeltaAtCurrentClasses).toBe(1);
    expect(formatBandUpgradeHint(hint!)).toContain("1. stupeň");
    expect(formatBandUpgradeHint(hint!)).toContain("+1");
  });

  it("vrátí null na nejvyšším pásmu", () => {
    const hint = buildBandUpgradeHint("test", 5, 500, B13_MORE_THAN_2.first);
    expect(hint).toBeNull();
  });
});
