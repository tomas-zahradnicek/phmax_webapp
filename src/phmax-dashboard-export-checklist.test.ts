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
});
