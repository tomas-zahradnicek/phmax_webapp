import { describe, expect, it } from "vitest";
import { buildPhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import type { SchoolScenarioExportPayload } from "./phmax-school-scenario-export";

const scenario: SchoolScenarioExportPayload = {
  schema: "phmax-school-scenario-v1",
  appVersion: "0.3.10",
  exportedAt: "2026-05-28T12:00:00.000Z",
  disclaimer: "test",
  summary: {
    slices: [],
    modulesWithPhmax: 0,
    totalPhmax: null,
    hasIncomplete: false,
  },
  attentionModuleLabels: [],
  moduleSnapshots: {},
  scenarioLabel: "Test",
  coherenceWarnings: ["ZŠ: test varování"],
};

describe("buildPhmaxIsHandoffPayload", () => {
  it("předává coherenceWarnings ve schoolScenario", () => {
    const payload = buildPhmaxIsHandoffPayload(scenario);
    expect(payload.schema).toBe("phmax-is-handoff-v1");
    expect(payload.schoolScenario.coherenceWarnings).toEqual(["ZŠ: test varování"]);
  });
});
