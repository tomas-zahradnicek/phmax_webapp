import { describe, expect, it } from "vitest";
import { computePvLitePhmax } from "./phmax-pv-lite-logic";

describe("PV lite PHmax", () => {
  it("jednotřídní celodenní 10 h → PHmax 62,5 (příloha)", () => {
    const r = computePvLitePhmax({
      provoz: "celodenni",
      classCount: 1,
      avgHours: 10,
      soleMsInMunicipality: false,
      actualChildren: 0,
      sec16ClassCount: 0,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.phmaxHours).toBe(62.5);
    expect(r.basePhmax).toBe(62.5);
  });

  it("MŠ při zdravotnickém zařízení: 3 třídy → 93 h", () => {
    const r = computePvLitePhmax({
      provoz: "zdravotnicke",
      classCount: 3,
      avgHours: 0,
      soleMsInMunicipality: false,
      actualChildren: 0,
      sec16ClassCount: 0,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.phmaxHours).toBe(93);
  });

  it("bez tříd vrátí chybu", () => {
    const r = computePvLitePhmax({
      provoz: "celodenni",
      classCount: 0,
      avgHours: 10,
      soleMsInMunicipality: false,
      actualChildren: 0,
      sec16ClassCount: 0,
    });
    expect(r.ok).toBe(false);
  });

  it("jediná MŠ v obci sníží minimum na 13 a změní krácení § 1d", () => {
    const sole = computePvLitePhmax({
      provoz: "celodenni",
      classCount: 1,
      avgHours: 10,
      soleMsInMunicipality: true,
      actualChildren: 10,
      sec16ClassCount: 0,
    });
    const general = computePvLitePhmax({
      provoz: "celodenni",
      classCount: 1,
      avgHours: 10,
      soleMsInMunicipality: false,
      actualChildren: 10,
      sec16ClassCount: 0,
    });
    expect(sole.ok).toBe(true);
    expect(general.ok).toBe(true);
    if (!sole.ok || !general.ok) return;
    expect(sole.minimumChildren).toBe(13);
    expect(general.minimumChildren).toBe(15);
    expect(sole.phmaxHours).toBeCloseTo(48.08, 1);
    expect(general.phmaxHours).toBeCloseTo(41.67, 1);
  });

  it("bonus § 16 odst. 9 přičte hodiny za třídy", () => {
    const base = computePvLitePhmax({
      provoz: "celodenni",
      classCount: 1,
      avgHours: 10,
      soleMsInMunicipality: false,
      actualChildren: 0,
      sec16ClassCount: 0,
    });
    const withSec16 = computePvLitePhmax({
      provoz: "celodenni",
      classCount: 1,
      avgHours: 10,
      soleMsInMunicipality: false,
      actualChildren: 0,
      sec16ClassCount: 1,
    });
    expect(base.ok).toBe(true);
    expect(withSec16.ok).toBe(true);
    if (!base.ok || !withSec16.ok) return;
    expect(withSec16.sec16Bonus).toBeGreaterThan(0);
    expect(withSec16.phmaxHours).toBeCloseTo(base.phmaxHours + withSec16.sec16Bonus, 2);
  });
});
