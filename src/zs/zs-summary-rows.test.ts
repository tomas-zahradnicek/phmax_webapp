import { describe, expect, it } from "vitest";
import { buildZsSummaryRows } from "./zs-summary-rows";

describe("buildZsSummaryRows", () => {
  it("obsahuje výsledek PHmax a PHPmax", () => {
    const rows = buildZsSummaryRows({
      basic1Phmax: 10,
      basic2Phmax: 20,
      basicPhmax: 30,
      incl1Phmax: 0,
      incl2Phmax: 0,
      inclPhmax: 0,
      psychPhmax: 0,
      healthPhmax: 0,
      minority1Phmax: 0,
      minority2Phmax: 0,
      minorityPhmax: 0,
      gymPhmax: 0,
      mixedRows: [],
      mixedMethodFirstTotal: 0,
      mixedMethodSecondTotal: 0,
      mixedMethodTotal: 0,
      mixedPhmax: 0,
      special1PhmaxPart: 0,
      special2PhmaxPart: 0,
      specialIIPhmaxPart: 0,
      specialPhmax: 0,
      prepClassPhmax: 0,
      prepSpecialPhmax: 0,
      par38Phmax: 0,
      par41Phmax: 0,
      extrasPhmax: 0,
      totalPhmax: 30,
      totalPha: 0,
      phpBaseValue: 0,
      phpExcludedTotal: 0,
      phpAdjustedValue: 0,
      totalPhp: 0,
    });
    expect(rows.find(([label]) => label === "Výsledek PHmax")).toEqual(["Výsledek PHmax", 30]);
    expect(rows.find(([label]) => label === "Běžné třídy ZŠ – celkem")).toEqual(["Běžné třídy ZŠ – celkem", 30]);
  });
});
