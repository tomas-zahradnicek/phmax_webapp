import { describe, expect, it } from "vitest";
import { computePvPhmaxTotalFromSnapshot } from "./pv-compute-phmax-total-from-snapshot";

describe("PV PHmax koherence (autosave vs přepočet)", () => {
  it("přepočet ze snapshotu odpovídá _phmaxAuditTotals", () => {
    const rows = [
      {
        id: "r1",
        provoz: "celodenni" as const,
        classCount: 2,
        avgHours: 8,
        sec16Count: 0,
        languageGroups: 0,
      },
    ];
    const computed = computePvPhmaxTotalFromSnapshot({ rows });
    expect(computed).not.toBeNull();
    const snap = {
      rows,
      _phmaxAuditTotals: { totalPhmax: computed!, tab: "phmax" as const },
    };
    expect(computePvPhmaxTotalFromSnapshot(snap)).toBe(computed);
  });

  it("přepočet ignoruje chybný uložený součet v audit (kontrola z vstupů)", () => {
    const rows = [
      {
        id: "r1",
        provoz: "polodenni" as const,
        classCount: 1,
        avgHours: 5,
        sec16Count: 0,
        languageGroups: 0,
      },
    ];
    const computed = computePvPhmaxTotalFromSnapshot({ rows });
    const snap = {
      rows,
      _phmaxAuditTotals: { totalPhmax: 99_999, tab: "phmax" as const },
    };
    expect(computePvPhmaxTotalFromSnapshot(snap)).toBe(computed);
    expect((snap._phmaxAuditTotals as { totalPhmax: number }).totalPhmax).not.toBe(computed);
  });
});
