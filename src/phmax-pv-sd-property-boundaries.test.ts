import { describe, expect, it } from "vitest";
import {
  celodenniDurationColumnIndex,
  internatDurationColumnIndex,
  polodenniDurationColumnIndex,
} from "./phmax-pv-logic";
import { getPhmaxSdBase, reducedPhmaxIfUnderStaffed } from "./phmax-sd-logic";

describe("PV property boundaries", () => {
  it("polodenní mapování je úplné na [4, 6.5] a mimo rozsah vrací null", () => {
    for (let x = 4; x <= 6.5; x = Math.round((x + 0.01) * 1000) / 1000) {
      const col = polodenniDurationColumnIndex(x);
      expect(col, `x=${x}`).not.toBeNull();
      expect((col ?? -1) >= 0 && (col ?? -1) <= 4, `x=${x}`).toBe(true);
    }
    expect(polodenniDurationColumnIndex(3.99)).toBeNull();
    expect(polodenniDurationColumnIndex(6.51)).toBeNull();
  });

  it("celodenní a internátní mapování drží hranice bez děr", () => {
    for (let x = 6.51; x <= 12; x = Math.round((x + 0.01) * 1000) / 1000) {
      expect(celodenniDurationColumnIndex(x), `x=${x}`).not.toBeNull();
    }
    expect(celodenniDurationColumnIndex(6.5)).toBeNull();

    for (let x = 20; x <= 24; x = Math.round((x + 0.01) * 1000) / 1000) {
      expect(internatDurationColumnIndex(x), `x=${x}`).not.toBeNull();
    }
    expect(internatDurationColumnIndex(19.99)).toBeNull();
  });
});

describe("ŠD property boundaries", () => {
  it("krácení je monotónní podle počtu žáků a nikdy nepřekročí základ", () => {
    for (let depts = 1; depts <= 21; depts++) {
      const base = getPhmaxSdBase(depts);
      expect(base).not.toBeNull();
      const minPupils = depts * 20;
      let prevAdjusted = -1;
      for (let pupils = 1; pupils < minPupils; pupils++) {
        const r = reducedPhmaxIfUnderStaffed({
          pupilsFirstGrade: pupils,
          departmentCount: depts,
          basePhmax: base!,
        });
        expect(r.applied).toBe(true);
        expect(r.adjusted <= base!, `depts=${depts}, pupils=${pupils}`).toBe(true);
        expect(r.adjusted >= prevAdjusted, `depts=${depts}, pupils=${pupils}`).toBe(true);
        prevAdjusted = r.adjusted;
      }
    }
  });
});
