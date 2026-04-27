import { describe, expect, it } from "vitest";
import { additionalWorkplaceUnitsForRow, eligibleAdditionalWorkplacesForRow, type Nv75DeputyUiRow } from "./PhmaxNv75DeputyPage";

describe("NV75 UI flow: §4d additional workplace thresholds", () => {
  it("MŠ/ZŠ/SŠ: další pracoviště s 2 jednotkami není způsobilé, se 3 jednotkami už je", () => {
    const row2: Nv75DeputyUiRow = {
      id: 1,
      kind: "zs",
      units: 18,
      additionalWorkplaceUnits: [2],
    };
    const row3: Nv75DeputyUiRow = {
      ...row2,
      additionalWorkplaceUnits: [3],
    };

    expect(eligibleAdditionalWorkplacesForRow(row2)).toBe(0);
    expect(eligibleAdditionalWorkplacesForRow(row3)).toBe(1);
  });

  it("ŠPZ: každé další pracoviště se započítává bez prahu 3 jednotek", () => {
    const row: Nv75DeputyUiRow = {
      id: 2,
      kind: "poradenske",
      units: 0,
      additionalWorkplaceUnits: [0, 1, 2],
    };

    expect(eligibleAdditionalWorkplacesForRow(row)).toBe(3);
  });

  it("legacy autosave: počítadlo způsobilých pracovišť se převede na detailní seznam", () => {
    const legacyRow: Nv75DeputyUiRow = {
      id: 3,
      kind: "ms",
      units: 8,
      additionalWorkplacesEligible: 2,
    };

    expect(additionalWorkplaceUnitsForRow(legacyRow)).toEqual([3, 3]);
    expect(eligibleAdditionalWorkplacesForRow(legacyRow)).toBe(2);
  });
});

