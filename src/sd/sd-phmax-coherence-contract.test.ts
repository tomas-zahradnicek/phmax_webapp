import { describe, expect, it } from "vitest";
import { computeSdPhmaxTotalFromSnapshot } from "./sd-compute-phmax-total-from-snapshot";

function minimalSdSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    pupils: 40,
    manualDepts: false,
    departments: 2,
    inputMode: "summary" as const,
    regularExceptionGranted: false,
    specialExceptionGranted: false,
    schoolFirstStageClassCount: null,
    summarySpecialDepartments: [],
    detailDepartments: [],
    ...overrides,
  };
}

describe("ŠD PHmax koherence (autosave vs přepočet)", () => {
  it("přepočet odpovídá _phmaxAuditTotals z buildSdSnapshot vzoru", () => {
    const core = minimalSdSnapshot();
    const computed = computeSdPhmaxTotalFromSnapshot(core);
    expect(computed).not.toBeNull();
    const snap = {
      ...core,
      _phmaxAuditTotals: { totalPhmax: computed!, totalPha: 0, tab: "phmax" as const },
    };
    expect(computeSdPhmaxTotalFromSnapshot(snap)).toBe(computed);
  });
});
