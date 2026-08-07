import { describe, expect, it, vi } from "vitest";
import * as confirmDestructiveMod from "./confirm-destructive";
import {
  MSG_CONFIRM_CLEAR_AFTER_SCHOOL_SCENARIO_EXPORT,
  offerClearWorkingDataAfterSchoolScenarioExport,
} from "./phmax-dashboard-export-followup";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("phmax-dashboard-export-followup", () => {
  it("má text připomínky po exportu školního scénáře s úzkým scope", () => {
    expect(MSG_CONFIRM_CLEAR_AFTER_SCHOOL_SCENARIO_EXPORT).toMatch(/sdíleném počítači/i);
    expect(MSG_CONFIRM_CLEAR_AFTER_SCHOOL_SCENARIO_EXPORT).toMatch(/Smazat nyní/i);
    expect(MSG_CONFIRM_CLEAR_AFTER_SCHOOL_SCENARIO_EXPORT).toMatch(/Named snapshoty/i);
    expect(MSG_CONFIRM_CLEAR_AFTER_SCHOOL_SCENARIO_EXPORT).toMatch(/profil školy/i);
  });

  it("po potvrzení volá jen dodaný clear callback", () => {
    const clear = vi.fn();
    vi.spyOn(confirmDestructiveMod, "confirmDestructive").mockReturnValue(true);
    offerClearWorkingDataAfterSchoolScenarioExport(clear);
    expect(clear).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });

  it("dashboard nabízí post-export clear jen u školního scénáře / IS handoff", () => {
    const page = readFileSync(resolve("src/PhmaxDashboardPage.tsx"), "utf8");
    expect(page).toContain("offerClearWorkingDataAfterSchoolScenarioExport");
    expect(page).toContain("offerSchoolScenarioWorkingClear: true");
    expect(page).toContain("clearSchoolScenarioExportWorkingLocalStorage");
    // Cross-PHmax volá afterDashboardJsonExport bez offer flagu.
    const crossCall = page.match(
      /afterDashboardJsonExport\(\s*"Stažen orientační JSON součtu PHmax\."[\s\S]*?\);/,
    );
    expect(crossCall?.[0]).toBeTruthy();
    expect(crossCall?.[0]).not.toContain("offerSchoolScenarioWorkingClear");
  });
});
