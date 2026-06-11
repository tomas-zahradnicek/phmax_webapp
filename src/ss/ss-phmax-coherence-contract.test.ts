import { describe, expect, it } from "vitest";
import { buildSsDraftStoragePayload } from "./ss-draft-storage";
import { computeSsPhmaxTotalFromSnapshot } from "./ss-compute-phmax-total-from-snapshot";
import { createEmptyPhmaxSsUnitRow } from "./phmax-ss-types";

describe("SŠ PHmax koherence (autosave vs přepočet)", () => {
  it("buildSsDraftStoragePayload zapisuje přepočtený totalPhmax", () => {
    const rows = [createEmptyPhmaxSsUnitRow(1)];
    const payload = buildSsDraftStoragePayload(rows, computeSsPhmaxTotalFromSnapshot({ rows }));
    if (Array.isArray(payload)) {
      expect(payload).toEqual(rows);
      return;
    }
    expect(computeSsPhmaxTotalFromSnapshot(payload)).toBe(payload._phmaxAuditTotals?.totalPhmax ?? null);
  });
});
