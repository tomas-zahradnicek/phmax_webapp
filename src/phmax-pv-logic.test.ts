import { describe, expect, it } from "vitest";
import {
  PHMAX_PV_ZDRAVOTNICKY_NA_TRIDU,
  celodenniDurationColumnIndex,
  computePvPhmaxTotal,
  getPhaMaxPv,
  getPhmaxPvBase,
  polodenniDurationColumnIndex,
} from "./phmax-pv-logic";

describe("getPhmaxPvBase – příloha tabulky 1–3 (průměrná doba v hodinách)", () => {
  it("celodenní: 4 třídy, 10 h/den → 235", () => {
    const r = getPhmaxPvBase({ provoz: "celodenni", classCount: 4, avgHoursPerDay: 10 });
    expect(r.data).not.toBeNull();
    expect(r.data!.basePhmax).toBe(235);
  });

  it("celodenní: 4 třídy, 9,5 h/den → 225", () => {
    const r = getPhmaxPvBase({ provoz: "celodenni", classCount: 4, avgHoursPerDay: 9.5 });
    expect(r.data!.basePhmax).toBe(225);
  });

  it("+5 h za 1 třídu § 16 → 240", () => {
    const t = computePvPhmaxTotal({
      provoz: "celodenni",
      classCount: 4,
      avgHoursPerDay: 10,
      sec16ClassCount: 1,
      languageGroupCount: 0,
    });
    expect(t.totalPhmax).toBe(240);
  });

  it("MŠ při zdravotnickém zařízení: 31 h × třídy", () => {
    const r = getPhmaxPvBase({ provoz: "zdravotnicke", classCount: 3, avgHoursPerDay: 0 });
    expect(r.data!.basePhmax).toBe(3 * PHMAX_PV_ZDRAVOTNICKY_NA_TRIDU);
  });
});

describe("PHAmax PV", () => {
  it("1 třída § 16, provoz 6 h → 27 h (metodický příklad)", () => {
    expect(getPhaMaxPv(1, 6)).toBe(27);
  });

  it("3 třídy § 16, 8 h → 108", () => {
    expect(getPhaMaxPv(3, 8)).toBe(108);
  });
});

describe("pásma doby (shoda se sloupci přílohy)", () => {
  it("polodenní 6–6,5 h → poslední sloupec", () => {
    expect(polodenniDurationColumnIndex(6.5)).toBe(4);
    expect(polodenniDurationColumnIndex(4)).toBe(0);
  });

  it("celodenní pod 6,5 h → null", () => {
    expect(celodenniDurationColumnIndex(6.5)).toBeNull();
  });

  it("celodenní mezi 6,5 a 7 → první sloupec", () => {
    expect(celodenniDurationColumnIndex(6.75)).toBe(0);
  });
});
