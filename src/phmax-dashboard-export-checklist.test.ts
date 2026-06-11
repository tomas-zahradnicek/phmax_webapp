import { describe, expect, it } from "vitest";
import { buildDashboardExportChecklist } from "./phmax-dashboard-export-checklist";

describe("buildDashboardExportChecklist", () => {
  it("obsahuje varování koherence", () => {
    const items = buildDashboardExportChecklist({
      crossPhmax: {
        slices: [],
        modulesWithPhmax: 2,
        totalPhmax: 100,
        hasIncomplete: false,
      },
      attentionModuleLabels: [],
      auditCoherenceWarnings: ["ZŠ: audit ≠ přepočet"],
      exportDisclaimerConfirmed: true,
    });
    expect(items.some((x) => x.includes("ZŠ"))).toBe(true);
    expect(items.some((x) => x.includes("Potvrďte"))).toBe(false);
  });

  it("obsahuje IT položky a appVersion", () => {
    const items = buildDashboardExportChecklist({
      crossPhmax: {
        slices: [],
        modulesWithPhmax: 2,
        totalPhmax: 100,
        hasIncomplete: false,
      },
      attentionModuleLabels: [],
      auditCoherenceWarnings: [],
      exportDisclaimerConfirmed: true,
      appVersion: "0.3.15",
      scenarioLabel: "Test škola",
    });
    expect(items.some((x) => x.includes("appVersion"))).toBe(true);
    expect(items.some((x) => x.includes("phmax-is-integration"))).toBe(true);
    expect(items.some((x) => x.includes("nesouladu"))).toBe(true);
    expect(items.some((x) => x.includes("Test škola"))).toBe(true);
  });
});
