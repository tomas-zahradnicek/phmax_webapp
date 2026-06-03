import { describe, expect, it } from "vitest";
import { buildZsPhaBandUpgradeHints, buildZsPhpBandUpgradeHints } from "./zs-pha-php-band-sensitivity";

describe("zs-pha-php-band-sensitivity", () => {
  it("PHA: navrhne žáky k vyššímu pásmu", () => {
    const hints = buildZsPhaBandUpgradeHints([
      { id: 1, kind: "zs1", classes: 10, pupils: 50 },
    ]);
    expect(hints.length).toBeGreaterThan(0);
    expect(hints[0]).toContain("PHAmax");
  });

  it("PHP: navrhne vyšší pásmo podle upravené hodnoty", () => {
    const hints = buildZsPhpBandUpgradeHints({ phpExcludedSchool: false, phpAdjustedValue: 250 });
    expect(hints.length).toBe(1);
    expect(hints[0]).toContain("PHPmax");
  });
});
