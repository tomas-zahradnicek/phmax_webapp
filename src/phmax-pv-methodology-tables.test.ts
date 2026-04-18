import { describe, expect, it } from "vitest";
import { getPvMethodologyAppendixVisibility } from "./phmax-pv-methodology-tables";

describe("getPvMethodologyAppendixVisibility", () => {
  it("bez aktivních buněk a bez „vše“ zobrazí nápovědu a skryje tabulky", () => {
    const v = getPvMethodologyAppendixVisibility(false, []);
    expect(v.showEmptyHint).toBe(true);
    expect(v.show1).toBe(false);
    expect(v.show2).toBe(false);
    expect(v.show3).toBe(false);
  });

  it("bez aktivních buněk se zapnutým „vše“ zobrazí všechny tabulky", () => {
    const v = getPvMethodologyAppendixVisibility(true, []);
    expect(v.showEmptyHint).toBe(false);
    expect(v.show1 && v.show2 && v.show3).toBe(true);
  });

  it("s aktivní buňkou filtruje na danou tabulku", () => {
    const v = getPvMethodologyAppendixVisibility(false, [{ table: 2, rowIndex: 0, colIndex: 0 }]);
    expect(v.showEmptyHint).toBe(false);
    expect(v.show1).toBe(false);
    expect(v.show2).toBe(true);
    expect(v.show3).toBe(false);
  });

  it("undefined activeCells se chová jako prázdné pole", () => {
    const v = getPvMethodologyAppendixVisibility(false, undefined);
    expect(v.showEmptyHint).toBe(true);
    expect(v.show1).toBe(false);
  });
});
