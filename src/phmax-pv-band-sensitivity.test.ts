import { describe, expect, it } from "vitest";
import { buildPvDurationUpgradeHint } from "./phmax-pv-band-sensitivity";

describe("phmax-pv-band-sensitivity", () => {
  it("navrhne vyšší pásmo doby u celodenního provozu", () => {
    const hint = buildPvDurationUpgradeHint({
      workplaceLabel: "MŠ A",
      provoz: "celodenni",
      classCount: 4,
      avgHoursPerDay: 9.5,
    });
    expect(hint).toContain("MŠ A");
    expect(hint).toContain("+");
  });
});
