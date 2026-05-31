import { describe, expect, it } from "vitest";
import { buildCrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";

describe("buildCrossPhmaxSummary", () => {
  const labels = { pv: "PV", sd: "ŠD", zs: "ZŠ", ss: "SŠ" } as const;

  it("sečte PHmax z modulů s číselnou hodnotou", () => {
    const summary = buildCrossPhmaxSummary(
      [
        {
          id: "pv",
          primaryKpi: { label: "PHmax", value: "50" },
          hasData: true,
          verdict: { tone: "ok" },
        },
        {
          id: "sd",
          primaryKpi: { label: "PHmax", value: "32,5" },
          hasData: true,
          verdict: { tone: "ok" },
        },
        {
          id: "zs",
          primaryKpi: { label: "PHmax", value: "–" },
          hasData: false,
          verdict: null,
        },
        {
          id: "ss",
          primaryKpi: { label: "PHmax", value: "100" },
          hasData: true,
          verdict: { tone: "ok" },
        },
        {
          id: "nv75",
          primaryKpi: { label: "Banka h/týd", value: "40" },
          hasData: true,
          verdict: { tone: "ok" },
        },
      ],
      labels,
    );

    expect(summary.modulesWithPhmax).toBe(3);
    expect(summary.totalPhmax).toBe(182.5);
    expect(summary.hasIncomplete).toBe(false);
  });

  it("označí neúplný modul se stavem warning", () => {
    const summary = buildCrossPhmaxSummary(
      [
        {
          id: "pv",
          primaryKpi: { label: "PHmax", value: "50 *" },
          hasData: true,
          verdict: { tone: "warning" },
        },
        {
          id: "sd",
          primaryKpi: { label: "PHmax", value: "10" },
          hasData: true,
          verdict: { tone: "ok" },
        },
      ],
      labels,
    );

    expect(summary.hasIncomplete).toBe(true);
    expect(summary.slices.find((s) => s.id === "pv")?.incomplete).toBe(true);
  });
});
