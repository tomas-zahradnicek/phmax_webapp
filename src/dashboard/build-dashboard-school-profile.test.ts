import { describe, expect, it } from "vitest";
import { buildDashboardSchoolProfile } from "./build-dashboard-school-profile";

describe("buildDashboardSchoolProfile", () => {
  it("shrne moduly, PHmax, zálohy a export", () => {
    const profile = buildDashboardSchoolProfile({
      moduleLabels: { pv: "PV", sd: "ŠD", zs: "ZŠ", ss: "SŠ", nv75: "NV75" },
      rows: [
        {
          id: "pv",
          hasData: true,
          namedBackups: 2,
          primaryKpi: { value: "120 h./týd." },
          verdict: { tone: "ok" },
        },
        {
          id: "sd",
          hasData: false,
          namedBackups: 0,
          primaryKpi: { value: "–" },
          verdict: null,
        },
      ],
      crossPhmax: {
        totalPhmax: 120,
        hasIncomplete: false,
        modulesWithPhmax: 1,
        slices: [],
      },
      scenarioLabel: "Škola A",
      attentionCount: 0,
      modulesOk: 1,
      lastExport: { at: "2026-06-11T10:00:00.000Z", kind: "JSON součtu PHmax" },
      formatLastExport: () => "11. 6. 2026 12:00 · JSON",
      hasUnusedModules: true,
    });

    expect(profile.tone).toBe("ok");
    expect(profile.modulesInUse).toBe(1);
    expect(profile.namedBackupsTotal).toBe(2);
    expect(profile.totalPhmax).toBe(120);
    expect(profile.moduleChips).toHaveLength(2);
    expect(profile.lead).toContain("Ostatní moduly");
  });
});
