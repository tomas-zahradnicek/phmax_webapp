import { describe, expect, it } from "vitest";
import { buildNv75UnitsUpgradeHint } from "./nv75-units-sensitivity";

describe("nv75-units-sensitivity", () => {
  it("navrhne více jednotek pro vyšší §4b pásmo u ZŠ", () => {
    const hint = buildNv75UnitsUpgradeHint("zs", 5, "ZŠ test");
    expect(hint).toContain("ZŠ test");
    expect(hint).toContain("jednotek");
  });
});
