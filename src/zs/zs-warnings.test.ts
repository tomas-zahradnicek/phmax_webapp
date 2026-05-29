import { describe, expect, it } from "vitest";
import { buildZsWarnings } from "./zs-warnings";

describe("buildZsWarnings", () => {
  it("vrátí prázdné pole bez varovných podmínek", () => {
    expect(
      buildZsWarnings({
        basicType: "full_more_than_2",
        basic1Classes: 10,
        basic2Classes: 0,
        phpExcludedTotal: 0,
        phpBaseValue: 200,
        phpExcludedSchool: false,
        phpAdjustedValue: 200,
        minorityType: "minority1",
        minority2Classes: 0,
      }),
    ).toEqual([]);
  });

  it("upozorní na vyloučenou školu z PHPmax", () => {
    const warnings = buildZsWarnings({
      basicType: "full_more_than_2",
      basic1Classes: 0,
      basic2Classes: 0,
      phpExcludedTotal: 0,
      phpBaseValue: 0,
      phpExcludedSchool: true,
      phpAdjustedValue: 0,
      minorityType: "minority1",
      minority2Classes: 0,
    });
    expect(warnings.some((w) => w.includes("vyloučená z PHPmax"))).toBe(true);
  });
});
