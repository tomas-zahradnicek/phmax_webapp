import { describe, expect, it } from "vitest";
import {
  PHMAX_PV_ZDRAVOTNICKY_NA_TRIDU,
  celodenniDurationColumnIndex,
  computePvPhmaxTotal,
  getPhaMaxPv,
  getPhmaxPvBase,
  polodenniDurationColumnIndex,
} from "./phmax-pv-logic";

describe("getPhmaxPvBase – příloha tabulky 1–3 (výběr pásma)", () => {
  it("celodenní: 4 třídy, pásmo „10 h … 10,5 h“ (index 7) → 235", () => {
    const r = getPhmaxPvBase({ provoz: "celodenni", classCount: 4, durationBandIndex: 7 });
    expect(r.data).not.toBeNull();
    expect(r.data!.basePhmax).toBe(235);
  });

  it("celodenní: 4 třídy, pásmo „9,5 h … 10 h“ (index 6) → 225", () => {
    const r = getPhmaxPvBase({ provoz: "celodenni", classCount: 4, durationBandIndex: 6 });
    expect(r.data!.basePhmax).toBe(225);
  });

  it("+5 h za 1 třídu § 16 → 240", () => {
    const t = computePvPhmaxTotal({
      provoz: "celodenni",
      classCount: 4,
      durationBandIndex: 7,
      sec16ClassCount: 1,
      languageGroupCount: 0,
    });
    expect(t.totalPhmax).toBe(240);
  });

  it("MŠ při zdravotnickém zařízení: 31 h × třídy", () => {
    const r = getPhmaxPvBase({ provoz: "zdravotnicke", classCount: 3, durationBandIndex: 0 });
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

describe("pásma doby (mapování z desetinné hodiny — kontrola shody s přílohou)", () => {
  it("polodenní 6–6,5 h → poslední sloupec", () => {
    expect(polodenniDurationColumnIndex(6.5)).toBe(4);
    expect(polodenniDurationColumnIndex(4)).toBe(0);
  });

  it("celodenní pod 6,5 h → null", () => {
    expect(celodenniDurationColumnIndex(6.5)).toBeNull();
  });

  it("celodenní mezi 6,5 a 7 → první sloupec (index 0)", () => {
    expect(celodenniDurationColumnIndex(6.75)).toBe(0);
  });

  it("10 h → sloupec index 7 (stejný jako volba v selectu)", () => {
    expect(celodenniDurationColumnIndex(10)).toBe(7);
  });
});
