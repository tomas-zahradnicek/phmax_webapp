import { describe, expect, it, beforeEach, vi } from "vitest";
import { createDefaultAnnualReport, refreshAllSections } from "./vyrocni-zprava-logic";
import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { buildAnnualReportInputFingerprint } from "./vyrocni-zprava-fingerprint";
import { resolveGeneratedTextStatus } from "./vyrocni-zprava-generated-text-status";
import { buildSection01GeneratorInput } from "./vyrocni-zprava-section01-generator-input";
import { getSection01StoreSnapshot } from "./vyrocni-zprava-section01-data-storage";
import {
  VYROCNI_ZPRAVA_DIAGNOSTIC_BACKUP_KEY_PREFIX,
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

  it("při neplatném JSON zachová diagnostickou zálohu a vrátí loadIssue", () => {
    localStorage.setItem(VYROCNI_ZPRAVA_LS_KEY, "{invalid-json");

    const loaded = loadVyrocniZpravaStorage();

    expect(loaded.loadIssue?.code).toBe("invalid_json");
    expect(loaded.report.sections.length).toBeGreaterThan(0);
    const backupKey = Object.keys((localStorage as { store: Record<string, string> }).store).find((key) =>
      key.startsWith(VYROCNI_ZPRAVA_DIAGNOSTIC_BACKUP_KEY_PREFIX),
    );
    expect(backupKey).toBeTruthy();
  });

  it("při nekompatibilní verzi zachová diagnostickou zálohu a vrátí loadIssue", () => {
    localStorage.setItem(
      VYROCNI_ZPRAVA_LS_KEY,
      JSON.stringify({
        version: 2,
        report: {},
        selectedSectionId: "01",
      }),
    );

    const loaded = loadVyrocniZpravaStorage();

    expect(loaded.loadIssue?.code).toBe("incompatible_version");
    expect(loaded.report.sections.length).toBeGreaterThan(0);
    const backupKey = Object.keys((localStorage as { store: Record<string, string> }).store).find((key) =>
      key.startsWith(VYROCNI_ZPRAVA_DIAGNOSTIC_BACKUP_KEY_PREFIX),
    );
    expect(backupKey).toBeTruthy();
  });

  it("vrátí saveIssue quota_exceeded při překročení kvóty", () => {
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem() {
        throw { name: "QuotaExceededError" };
      },
      removeItem(key: string) {
        delete this.store[key];
      },
    });
    const profile = createDefaultSchoolProfile();
    const report = refreshAllSections({ ...createDefaultAnnualReport("2023/2024") }, profile);

    const result = saveVyrocniZpravaStorage({
      version: 1,
      report,
      selectedSectionId: "01",
    });

    expect(result.ok).toBe(false);
    expect(result.saveIssue?.code).toBe("quota_exceeded");
  });

  it("vrátí saveIssue other_dom_exception pro jinou DOM chybu", () => {
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem() {
        throw { name: "SecurityError" };
      },
      removeItem(key: string) {
        delete this.store[key];
      },
    });
    const profile = createDefaultSchoolProfile();
    const report = refreshAllSections({ ...createDefaultAnnualReport("2023/2024") }, profile);

    const result = saveVyrocniZpravaStorage({
      version: 1,
      report,
      selectedSectionId: "01",
    });

    expect(result.ok).toBe(false);
    expect(result.saveIssue?.code).toBe("other_dom_exception");
  });

  it("starší payload bez generatedInputFingerprint se načte a bezpečně přejde stale -> current po regeneraci", () => {
    const profile = createDefaultSchoolProfile();
    const report = refreshAllSections({ ...createDefaultAnnualReport("2023/2024") }, profile);
    const withLegacyGeneratedText = {
      ...report,
      sections: report.sections.map((section) =>
        section.id === "01"
          ? {
              ...section,
              generatedText: "01 Základní údaje o škole\n\nLegacy text",
              status: "VYGENEROVANO",
              generatedInputFingerprint: undefined,
            }
          : section,
      ),
    };
    const legacyPayload = {
      version: 1,
      report: withLegacyGeneratedText,
      selectedSectionId: "01",
    };
    localStorage.setItem(VYROCNI_ZPRAVA_LS_KEY, JSON.stringify(legacyPayload));

    const loaded = loadVyrocniZpravaStorage();
    const loadedSection = loaded.report.sections.find((section) => section.id === "01");
    expect(loadedSection).toBeTruthy();
    expect(loadedSection?.generatedText).toContain("Legacy text");
    expect(resolveGeneratedTextStatus({ section: loadedSection!, schoolProfile: profile, schoolYear: loaded.report.schoolYear })).toBe(
      "stale",
    );

    const fingerprint = buildAnnualReportInputFingerprint(
      buildSection01GeneratorInput({
        schoolProfile: profile,
        schoolYear: loaded.report.schoolYear,
        sectionInputs: getSection01StoreSnapshot().data,
      }),
    );
    const regenerated = {
      ...loaded.report,
      sections: loaded.report.sections.map((section) =>
        section.id === "01" ? { ...section, generatedInputFingerprint: fingerprint } : section,
      ),
    };
    saveVyrocniZpravaStorage({
      version: 1,
      report: regenerated,
      selectedSectionId: loaded.selectedSectionId,
    });
    const reloaded = loadVyrocniZpravaStorage();
    const reloadedSection = reloaded.report.sections.find((section) => section.id === "01");
    expect(reloadedSection?.generatedInputFingerprint).toBe(fingerprint);
    expect(
      resolveGeneratedTextStatus({ section: reloadedSection!, schoolProfile: profile, schoolYear: reloaded.report.schoolYear }),
    ).toBe("current");
  });

});
