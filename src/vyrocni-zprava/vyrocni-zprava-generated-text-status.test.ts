import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { createDefaultAnnualReport } from "./vyrocni-zprava-logic";
import { buildAnnualReportInputFingerprint } from "./vyrocni-zprava-fingerprint";
import { buildSection01GeneratorInput } from "./vyrocni-zprava-section01-generator-input";
import { getSection01StoreSnapshot } from "./vyrocni-zprava-section01-data-storage";
import { resolveGeneratedTextStatus } from "./vyrocni-zprava-generated-text-status";

describe("vyrocni-zprava-generated-text-status", () => {
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
});
