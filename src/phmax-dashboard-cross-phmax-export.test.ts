import { describe, expect, it } from "vitest";
import {
  buildCrossPhmaxExportPayload,
  crossPhmaxAttentionMismatches,
} from "./phmax-dashboard-cross-phmax-export";
import { buildCrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";

describe("phmax-dashboard-cross-phmax-export", () => {
  it("crossPhmaxAttentionMismatches najde moduly v pozornosti i v součtu", () => {
    const summary = buildCrossPhmaxSummary(
      [
        {
          id: "pv",
          primaryKpi: { label: "PHmax", value: "50" },
          hasData: true,
          verdict: { tone: "warning" },
        },
        {
          id: "zs",
          primaryKpi: { label: "PHmax", value: "–" },
          hasData: true,
          verdict: { tone: "warning" },
        },
      ],
      { pv: "PV", sd: "ŠD", zs: "ZŠ", ss: "SŠ" },
    );
    const mismatches = crossPhmaxAttentionMismatches(summary, new Set(["pv", "zs"]));
    expect(mismatches).toEqual(["PV"]);
  });

  it("buildCrossPhmaxExportPayload má schema v1", () => {
    const summary = buildCrossPhmaxSummary([], { pv: "PV", sd: "ŠD", zs: "ZŠ", ss: "SŠ" });
    const payload = buildCrossPhmaxExportPayload(summary, []);
    expect(payload.schema).toBe("phmax-cross-phmax-v1");
    expect(payload.disclaimer).toMatch(/NV75/);
  });
});
