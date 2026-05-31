import { describe, expect, it } from "vitest";
import { findPvDashboardFocusHint } from "./phmax-pv-dashboard-focus";
import { findSdDashboardFocusHint } from "./phmax-sd-dashboard-focus";
import { findNv75DashboardFocusHint } from "./phmax-nv75-dashboard-focus";
import { findZsDashboardFocusHint } from "./zs/phmax-zs-dashboard-focus";

describe("dashboard focus hints – ok vs issue", () => {
  it("PV preferIssue vrátí neúplné pracoviště", () => {
    const raw = JSON.stringify({
      rows: [
        { id: "ok", provoz: "zdravotnicke", classCount: 2, avgHours: 0, sec16Count: 0, languageGroups: 0 },
        { id: "bad", provoz: "celodenni", classCount: 0, avgHours: 10, sec16Count: 0, languageGroups: 0 },
      ],
    });
    expect(findPvDashboardFocusHint(raw, { preferIssue: true })?.rowKey).toBe("bad");
  });

  it("PV ok stav vrátí první řádek", () => {
    const raw = JSON.stringify({
      rows: [{ id: "pv-1", provoz: "zdravotnicke", classCount: 2, avgHours: 0, sec16Count: 0, languageGroups: 0 }],
    });
    expect(findPvDashboardFocusHint(raw, { preferIssue: false })).toEqual({
      rowKey: "pv-1",
      sectionId: "pv-vstupy",
    });
  });

  it("ŠD ok stav vrátí sekci vstupů", () => {
    const raw = JSON.stringify({ pupils: 20, departments: 1, inputMode: "summary" });
    expect(findSdDashboardFocusHint(raw, { preferIssue: false })).toEqual({ sectionId: "sd-vstupy" });
    expect(findSdDashboardFocusHint(raw, { preferIssue: true })).toBeUndefined();
  });

  it("ZŠ ok stav vrátí basic", () => {
    const raw = JSON.stringify({ tab: "phmax", basic1Classes: 2, basic1Pupils: 40 });
    expect(findZsDashboardFocusHint(raw, { preferIssue: false })?.sectionId).toBe("basic");
  });

  it("NV75 ok stav vrátí první řádek", () => {
    const raw = JSON.stringify({ rows: [{ id: 5, kind: "ms", units: 2 }] });
    expect(findNv75DashboardFocusHint(raw, { preferIssue: false })).toEqual({ rowId: 5, sectionId: "nv75-vstupy" });
    expect(findNv75DashboardFocusHint(raw, { preferIssue: true })).toBeUndefined();
  });
});
