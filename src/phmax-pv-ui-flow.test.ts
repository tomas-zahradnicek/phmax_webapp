import { describe, expect, it } from "vitest";
import { computePvPhmaxTotal, getPhaMaxPv } from "./phmax-pv-logic";
import { pvHeroExampleSnapshot } from "./phmax-pv-hero-examples";
import { round2 } from "./phmax-zs-logic";

function computeAggregateFromExample(exampleKey: Parameters<typeof pvHeroExampleSnapshot>[0]) {
  const snap = pvHeroExampleSnapshot(exampleKey);
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

describe("PV UI flow integration (example -> summary)", () => {
  it("metodický příklad 1 dává stejný souhrn jako v UI", () => {
    const out = computeAggregateFromExample("meth_pv_1_240");
    expect(out.incomplete).toBe(false);
    expect(out.phmaxSum).toBe(240);
    expect(out.phaSum).toBe(36);
  });

  it("kombinovaný příklad z přílohy sečte dva řádky správně", () => {
    const out = computeAggregateFromExample("ill_pv_5_mixed_1625");
    expect(out.incomplete).toBe(false);
    expect(out.phmaxSum).toBe(162.5);
    expect(out.phaSum).toBe(0);
  });
});
