import { describe, expect, it } from "vitest";
import { B13_MORE_THAN_2, PHP_TABLE, pickBand, round2 } from "./phmax-zs-logic";

describe("ZŠ UI flow integration (example-like flows)", () => {
  it("PHmax flow pro běžnou úplnou ZŠ počítá součet obou stupňů", () => {
    // Odpovídá ukázce "phmax_bezna_zs" (10 tříd/250 žáků + 8 tříd/225 žáků).
    const basic1Avg = 250 / 10;
    const basic2Avg = 225 / 8;
    const basic1PerClass = pickBand(basic1Avg, B13_MORE_THAN_2.first).value;
    const basic2PerClass = pickBand(basic2Avg, B13_MORE_THAN_2.second).value;

    const basic1Total = round2(10 * basic1PerClass);
    const basic2Total = round2(8 * basic2PerClass);
    const totalPhmax = round2(basic1Total + basic2Total);

    expect(basic1PerClass).toBe(30);
    expect(basic2PerClass).toBe(46);
    expect(basic1Total).toBe(300);
    expect(basic2Total).toBe(368);
    expect(totalPhmax).toBe(668);
  });

  it("PHPmax flow pro tříletý průměr + odpočty drží pásmo tabulky", () => {
    // Odpovídá ukázce "phpmax_tri_roky" (260, 272, 281; odpočty 5+3+2).
    const average = (260 + 272 + 281) / 3;
    const excluded = 5 + 3 + 2;
    const adjusted = round2(average - excluded);
    const phpBand = pickBand(adjusted, PHP_TABLE);

    expect(round2(average)).toBe(271);
    expect(adjusted).toBe(261);
    expect(phpBand.value).toBe(12);
  });
});
