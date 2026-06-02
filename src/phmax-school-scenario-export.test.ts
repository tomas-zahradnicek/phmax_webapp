import { describe, expect, it } from "vitest";
import { buildSchoolScenarioExportPayload } from "./phmax-school-scenario-export";
import type { CrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";

const summary: CrossPhmaxSummary = {
  slices: [
    { id: "pv", label: "PV", phmax: 100, incomplete: false },
    { id: "sd", label: "ŠD", phmax: 32.5, incomplete: false },
    { id: "zs", label: "ZŠ", phmax: 200, incomplete: false },
    { id: "ss", label: "SŠ", phmax: null, incomplete: false },
  ],
  modulesWithPhmax: 3,
  totalPhmax: 332.5,
  hasIncomplete: false,
};

describe("buildSchoolScenarioExportPayload", () => {
  it("obsahuje coherenceWarnings", () => {
    const payload = buildSchoolScenarioExportPayload(summary, [], "Test školy", ["ZŠ: audit ≠ přepočet"]);
    expect(payload.schema).toBe("phmax-school-scenario-v1");
    expect(payload.coherenceWarnings).toEqual(["ZŠ: audit ≠ přepočet"]);
  });
});
