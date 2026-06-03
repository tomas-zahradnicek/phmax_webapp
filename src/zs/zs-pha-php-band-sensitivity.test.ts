import { describe, expect, it } from "vitest";
import {
  buildZsPhaBandUpgradeHints,
  buildZsPhaPhpHintsFromSnapshot,
  buildZsPhpBandUpgradeHints,
} from "./zs-pha-php-band-sensitivity";

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

  it("autosave: PHA a PHP z jednoho snapshotu", () => {
    const hints = buildZsPhaPhpHintsFromSnapshot({
      phaRows: [{ id: 1, kind: "zs1", classes: 10, pupils: 50 }],
      phpMethodMode: "average",
      phpYear1: 300,
      phpYear2: 0,
      phpYear3: 0,
      phpExcludedSchool: false,
    });
    expect(hints.some((h) => h.includes("PHAmax"))).toBe(true);
    expect(hints.some((h) => h.includes("PHPmax"))).toBe(true);
  });
});
