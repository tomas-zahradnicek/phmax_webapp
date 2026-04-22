import { describe, expect, it } from "vitest";
import {
  celodenniDurationColumnIndex,
  computePvPhmaxTotal,
  getPhaMaxPv,
  getPhmaxPvBase,
  internatDurationColumnIndex,
  polodenniDurationColumnIndex,
} from "./phmax-pv-logic";

describe("PV golden matrix", () => {
  it("počítá referenční scénáře z metodiky PV", () => {
    const c1 = computePvPhmaxTotal({
      provoz: "celodenni",
      classCount: 4,
      avgHoursPerDay: 10,
      sec16ClassCount: 1,
      languageGroupCount: 0,
    });
    expect(c1.base?.basePhmax).toBe(235);
    expect(c1.sec16Bonus).toBe(5);
    expect(c1.languageBonus).toBe(0);
    expect(c1.totalPhmax).toBe(240);

    const c2 = computePvPhmaxTotal({
      provoz: "polodenni",
      classCount: 1,
      avgHoursPerDay: 6,
      sec16ClassCount: 1,
      languageGroupCount: 0,
    });
    expect(c2.base?.basePhmax).toBe(42.5);
    expect(c2.totalPhmax).toBe(47.5);
    expect(getPhaMaxPv(1, 6)).toBe(27);

    const c3 = computePvPhmaxTotal({
      provoz: "zdravotnicke",
      classCount: 3,
      avgHoursPerDay: 0,
      sec16ClassCount: 0,
      languageGroupCount: 0,
    });
    expect(c3.base?.basePhmax).toBe(93);
    expect(c3.totalPhmax).toBe(93);
  });
});

describe("PV hraniční pásma", () => {
  it("správně mapuje hranice polodenního provozu", () => {
    expect(polodenniDurationColumnIndex(3.99)).toBeNull();
    expect(polodenniDurationColumnIndex(4)).toBe(0);
    expect(polodenniDurationColumnIndex(4.5)).toBe(1);
    expect(polodenniDurationColumnIndex(5.5)).toBe(3);
    expect(polodenniDurationColumnIndex(6.5)).toBe(4);
  });

  it("správně mapuje hranice celodenního a internátního provozu", () => {
    expect(celodenniDurationColumnIndex(6.5)).toBeNull();
    expect(celodenniDurationColumnIndex(6.51)).toBe(0);
    expect(celodenniDurationColumnIndex(11.99)).toBe(10);
    expect(celodenniDurationColumnIndex(12)).toBe(11);

    expect(internatDurationColumnIndex(19.99)).toBeNull();
    expect(internatDurationColumnIndex(20)).toBe(0);
    expect(internatDurationColumnIndex(21.5)).toBe(3);
    expect(internatDurationColumnIndex(22)).toBe(4);
  });

  it("vrací chybu lookupu mimo podporovaný rozsah tabulky", () => {
    const r = getPhmaxPvBase({ provoz: "internat", classCount: 7, avgHoursPerDay: 21 });
    expect(r.data).toBeNull();
    expect(r.issues.some((x) => x.code === "classes")).toBe(true);
  });
});
