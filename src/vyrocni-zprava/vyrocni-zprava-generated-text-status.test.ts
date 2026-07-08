import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { createDefaultAnnualReport } from "./vyrocni-zprava-logic";
import { buildAnnualReportInputFingerprint } from "./vyrocni-zprava-fingerprint";
import { applyGeneratedDraft } from "./vyrocni-zprava-generated-text-logic";
import { buildSection01GeneratorInput } from "./vyrocni-zprava-section01-generator-input";
import { getSection01StoreSnapshot } from "./vyrocni-zprava-section01-data-storage";
import { resolveGeneratedTextStatus } from "./vyrocni-zprava-generated-text-status";
import { loadVyrocniZpravaStorage, saveVyrocniZpravaStorage } from "./vyrocni-zprava-storage";

describe("vyrocni-zprava-generated-text-status", () => {
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
  });

  it("označí text bez fingerprintu jako stale (reprodukce původního rizika)", () => {
    const schoolProfile = createDefaultSchoolProfile();
    const report = createDefaultAnnualReport("2024/2025");
    const section = {
      ...report.sections.find((item) => item.id === "01")!,
      generatedText: "Text kapitoly",
      generatedInputFingerprint: undefined,
    };
    expect(resolveGeneratedTextStatus({ section, schoolProfile, schoolYear: report.schoolYear })).toBe("stale");
  });

  it("po vygenerování stejného vstupu vrací current", () => {
    const schoolProfile = createDefaultSchoolProfile();
    const report = createDefaultAnnualReport("2024/2025");
    const fingerprint = buildAnnualReportInputFingerprint(
      buildSection01GeneratorInput({
        schoolProfile,
        schoolYear: report.schoolYear,
        sectionInputs: getSection01StoreSnapshot().data,
      }),
    );
    const section = {
      ...report.sections.find((item) => item.id === "01")!,
      generatedText: "Text kapitoly",
      generatedInputFingerprint: fingerprint,
    };
    expect(resolveGeneratedTextStatus({ section, schoolProfile, schoolYear: report.schoolYear })).toBe("current");
  });

  it("po změně relevantních dat vrací stale", () => {
    const schoolProfile = createDefaultSchoolProfile();
    const report = createDefaultAnnualReport("2024/2025");
    const currentFingerprint = buildAnnualReportInputFingerprint(
      buildSection01GeneratorInput({
        schoolProfile,
        schoolYear: report.schoolYear,
        sectionInputs: getSection01StoreSnapshot().data,
      }),
    );
    const section = {
      ...report.sections.find((item) => item.id === "01")!,
      generatedText: "Text kapitoly",
      generatedInputFingerprint: `${currentFingerprint}-old`,
    };
    expect(resolveGeneratedTextStatus({ section, schoolProfile, schoolYear: report.schoolYear })).toBe("stale");
  });

  it("persistence po reloadu: current při stejných vstupech, stale po změně", () => {
    const schoolProfile = createDefaultSchoolProfile();
    const report = createDefaultAnnualReport("2024/2025");
    const sectionId = "01";
    const fingerprint = buildAnnualReportInputFingerprint(
      buildSection01GeneratorInput({
        schoolProfile,
        schoolYear: report.schoolYear,
        sectionInputs: getSection01StoreSnapshot().data,
      }),
    );
    const generatedSection = applyGeneratedDraft(
      report.sections.find((item) => item.id === sectionId)!,
      "Text kapitoly 01",
      fingerprint,
    );
    const persistedReport = {
      ...report,
      sections: report.sections.map((section) => (section.id === sectionId ? generatedSection : section)),
    };
    saveVyrocniZpravaStorage({ version: 1, report: persistedReport, selectedSectionId: sectionId });
    const loaded = loadVyrocniZpravaStorage();
    const loadedSection = loaded.report.sections.find((item) => item.id === sectionId)!;

    expect(resolveGeneratedTextStatus({ section: loadedSection, schoolProfile, schoolYear: loaded.report.schoolYear })).toBe(
      "current",
    );

    const staleSection = { ...loadedSection, generatedInputFingerprint: `${loadedSection.generatedInputFingerprint}-old` };
    const staleReport = {
      ...loaded.report,
      sections: loaded.report.sections.map((section) => (section.id === sectionId ? staleSection : section)),
    };
    saveVyrocniZpravaStorage({ version: 1, report: staleReport, selectedSectionId: sectionId });
    const reloaded = loadVyrocniZpravaStorage();
    const reloadedSection = reloaded.report.sections.find((item) => item.id === sectionId)!;
    expect(resolveGeneratedTextStatus({ section: reloadedSection, schoolProfile, schoolYear: reloaded.report.schoolYear })).toBe(
      "stale",
    );
  });
});
