import { describe, expect, it } from "vitest";
import { dashboardAttentionSortKey, sortByDashModuleOrder, sortByDashboardAttention } from "./phmax-dashboard-sort";

describe("phmax-dashboard-sort", () => {
  it("dashboardAttentionSortKey řadí danger před warning a prázdné", () => {
    expect(dashboardAttentionSortKey(true, "danger")).toBeLessThan(dashboardAttentionSortKey(true, "warning"));
    expect(dashboardAttentionSortKey(true, "warning")).toBeLessThan(dashboardAttentionSortKey(false, undefined));
    expect(dashboardAttentionSortKey(false, undefined)).toBeLessThan(dashboardAttentionSortKey(true, "ok"));
  });

  it("sortByDashModuleOrder řadí PV → ŠD → ZŠ → SŠ → NV75", () => {
    const rows = [
      { id: "nv75" as const },
      { id: "zs" as const },
      { id: "pv" as const },
      { id: "ss" as const },
      { id: "sd" as const },
    ];
    expect(sortByDashModuleOrder(rows).map((r) => r.id)).toEqual(["pv", "sd", "zs", "ss", "nv75"]);
  });

  it("sortByDashboardAttention seřadí řádky podle priority", () => {
    const rows = [
      { id: "ok", hasData: true, verdict: { tone: "ok" as const, label: "", detail: "" } },
      { id: "danger", hasData: true, verdict: { tone: "danger" as const, label: "", detail: "" } },
      { id: "empty", hasData: false, verdict: null },
    ];
    const sorted = sortByDashboardAttention(rows);
    expect(sorted.map((r) => r.id)).toEqual(["danger", "empty", "ok"]);
  });
});
