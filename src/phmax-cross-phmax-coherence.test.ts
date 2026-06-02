import { describe, expect, it } from "vitest";
import { crossPhmaxAuditCoherenceWarnings } from "./phmax-cross-phmax-coherence";
import type { CrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";

const summary: CrossPhmaxSummary = {
  slices: [
    { id: "pv", label: "PV", phmax: 10, incomplete: false },
    { id: "sd", label: "ŠD", phmax: null, incomplete: false },
    { id: "zs", label: "ZŠ", phmax: 100, incomplete: false },
    { id: "ss", label: "SŠ", phmax: null, incomplete: false },
  ],
  modulesWithPhmax: 2,
  totalPhmax: 110,
  hasIncomplete: false,
};

describe("crossPhmaxAuditCoherenceWarnings", () => {
  it("hlásí nesoulad ZŠ audit vs dashboard", () => {
    const w = crossPhmaxAuditCoherenceWarnings(summary, {
      zs: { _phmaxAuditTotals: { totalPhmax: 80, tab: "phmax" } },
    });
    expect(w.some((x) => x.includes("ZŠ"))).toBe(true);
  });

  it("hlásí nesoulad ZŠ audit vs přepočet z vstupů", () => {
    const w = crossPhmaxAuditCoherenceWarnings(
      { ...summary, slices: summary.slices.map((s) => (s.id === "zs" ? { ...s, phmax: 200 } : s)) },
      {
        zs: {
          tab: "phmax",
          basic1Classes: 2,
          basic1Pupils: 40,
          _phmaxAuditTotals: { totalPhmax: 200, totalPha: 0, totalPhp: 0, tab: "phmax" },
        },
      },
    );
    expect(w.some((x) => x.includes("ZŠ") && x.includes("přepočet"))).toBe(true);
  });

  it("bez auditu nevrací varování", () => {
    expect(crossPhmaxAuditCoherenceWarnings(summary, {})).toEqual([]);
  });
});
