import { describe, expect, it } from "vitest";
import { computePvPhmaxTotal, getPhaMaxPv } from "./phmax-pv-logic";
import { PV_HERO_EXAMPLE_METH_KEYS, pvHeroExampleSnapshot } from "./phmax-pv-hero-examples";
import { round2 } from "./phmax-zs-logic";

function aggregatePvHeroExample(key: (typeof PV_HERO_EXAMPLE_METH_KEYS)[number]) {
  const snap = pvHeroExampleSnapshot(key);
  let phmaxSum = 0;
  let phaSum = 0;
  let incomplete = false;

  for (const row of snap.rows) {
    const computed = computePvPhmaxTotal({
      provoz: row.provoz,
      classCount: row.classCount,
      avgHoursPerDay: row.avgHours,
      sec16ClassCount: row.sec16Count,
      languageGroupCount: row.languageGroups,
    });
    if (computed.totalPhmax == null) incomplete = true;
    else phmaxSum += computed.totalPhmax;

    const hoursForPha = row.provoz === "zdravotnicke" ? 8 : row.avgHours;
    const pha = row.sec16Count > 0 ? getPhaMaxPv(row.sec16Count, hoursForPha) : null;
    if (pha != null) phaSum += pha;
  }

  return { phmaxSum: round2(phmaxSum), phaSum: round2(phaSum), incomplete };
}

/** Acceptance P6 – tři metodické ukázky z comboboxu PV. */
describe("PV hero examples acceptance (P6)", () => {
  it("combobox obsahuje právě 3 metodické ukázky", () => {
    expect(PV_HERO_EXAMPLE_METH_KEYS).toEqual(["meth_pv_1_240", "meth_pv_2_245", "meth_pv_3_pha27"]);
  });

  it("Př. 1 – PHmax 240, PHAmax 36", () => {
    const out = aggregatePvHeroExample("meth_pv_1_240");
    expect(out.incomplete).toBe(false);
    expect(out.phmaxSum).toBe(240);
    expect(out.phaSum).toBe(36);
  });

  it("Př. 2 – PHmax 245", () => {
    const out = aggregatePvHeroExample("meth_pv_2_245");
    expect(out.incomplete).toBe(false);
    expect(out.phmaxSum).toBe(245);
  });

  it("Př. 3 – PHAmax 27 (polodenní §16/9)", () => {
    const out = aggregatePvHeroExample("meth_pv_3_pha27");
    expect(out.incomplete).toBe(false);
    expect(out.phaSum).toBe(27);
  });
});
