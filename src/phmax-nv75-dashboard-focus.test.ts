import { describe, expect, it } from "vitest";
import { findFirstNv75DashboardFocusRowId, nv75DashboardVerdictFromLs } from "./phmax-nv75-dashboard-focus";
describe("findFirstNv75DashboardFocusRowId", () => {
  it("vrátí id řádku bez jednotek", () => {
    const raw = JSON.stringify({
      rows: [
        { id: 10, kind: "zs", units: 12 },
        { id: 77, kind: "ms", units: 0 },
      ],
    });
    expect(findFirstNv75DashboardFocusRowId(raw)).toBe(77);
  });

  it("vrátí undefined bez řádků", () => {
    expect(findFirstNv75DashboardFocusRowId(JSON.stringify({ rows: [] }))).toBeUndefined();
  });

  it("nv75DashboardVerdictFromLs varuje u řádků bez jednotek", () => {
    const raw = JSON.stringify({ rows: [{ id: 3, kind: "ms", units: 0 }] });
    const verdict = nv75DashboardVerdictFromLs(raw, 0, "4b1");
    expect(verdict?.tone).toBe("warning");
    expect(verdict?.label).toContain("jednotek");
  });
});