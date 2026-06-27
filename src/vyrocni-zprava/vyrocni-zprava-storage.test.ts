import { describe, expect, it, beforeEach, vi } from "vitest";
import { createDefaultAnnualReport, refreshAllSections } from "./vyrocni-zprava-logic";
import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import {
  VYROCNI_ZPRAVA_LS_KEY,
  clearVyrocniZpravaStorage,
  loadVyrocniZpravaStorage,
  saveVyrocniZpravaStorage,
} from "./vyrocni-zprava-storage";

describe("vyrocni-zprava-storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
    });
    clearVyrocniZpravaStorage();
  });

  it("ukládá a načítá stav výroční zprávy bez vloženého profilu školy", () => {
    const profile = createDefaultSchoolProfile();
    const report = refreshAllSections({ ...createDefaultAnnualReport("2023/2024") }, profile);
    saveVyrocniZpravaStorage({
      version: 1,
      report,
      selectedSectionId: "1.1",
    });

    const loaded = loadVyrocniZpravaStorage();
    expect(loaded.report.schoolYear).toBe("2023/2024");
    expect(loaded.selectedSectionId).toBe("1.1");
    expect("schoolProfile" in loaded.report).toBe(false);
    expect(VYROCNI_ZPRAVA_LS_KEY).toBe("vyrocni-zprava-state-v1");
  });
});
