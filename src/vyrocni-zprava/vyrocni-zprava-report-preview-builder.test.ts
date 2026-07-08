import { describe, expect, it } from "vitest";

import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { createDefaultAnnualReport } from "./vyrocni-zprava-logic";
import type { AnnualReportSectionStatus } from "./vyrocni-zprava-types";
import { VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER } from "./vyrocni-zprava-types";
import { buildAnnualReportPreview } from "./vyrocni-zprava-report-preview-builder";

function withSectionText(
  report: ReturnType<typeof createDefaultAnnualReport>,
  sectionId: string,
  patch: {
    generatedText?: string;
    originalGeneratedText?: string;
    status?: AnnualReportSectionStatus;
    approved?: boolean;
    editedByUser?: boolean;
  },
) {
  return {
    ...report,
    sections: report.sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)),
  };
}

describe("vyrocni-zprava-report-preview-builder", () => {
  it("používá generatedText, nikoliv originalGeneratedText", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = withSectionText(report, "01", {
      generatedText: "Aktuální text kapitoly 01.",
      originalGeneratedText: "Původní text kapitoly 01.",
      status: "UPRAVENO_UZIVATELEM",
    });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: { ...createDefaultSchoolProfile(), name: "ZŠ Ukázková" },
    });
    expect(preview.fullText).toContain("Aktuální text kapitoly 01.");
    expect(preview.fullText).not.toContain("Původní text kapitoly 01.");
  });

  it("chybějící kapitoly jsou uvedeny v missingSections", () => {
    const preview = buildAnnualReportPreview({
      report: createDefaultAnnualReport("2024/2025"),
      schoolProfile: createDefaultSchoolProfile(),
    });
    expect(preview.missingSections.length).toBe(14);
    expect(preview.missingSections[0]).toContain("01");
  });

  it("neschválené kapitoly jsou uvedeny v unapprovedSections", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = withSectionText(report, "01", {
      generatedText: "Text 01",
      status: "VYGENEROVANO",
      approved: false,
    });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: createDefaultSchoolProfile(),
    });
    expect(preview.unapprovedSections.some((item) => item.startsWith("01 "))).toBe(true);
  });

  it("počty schválených kapitol jsou správné", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = withSectionText(report, "01", {
      generatedText: "Text 01",
      status: "SCHVALENO",
      approved: true,
    });
    report = withSectionText(report, "02", {
      generatedText: "Text 02",
      status: "SCHVALENO",
      approved: true,
    });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: createDefaultSchoolProfile(),
    });
    expect(preview.approvedSectionsCount).toBe(2);
  });

  it("počty vygenerovaných kapitol jsou správné", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = withSectionText(report, "01", { generatedText: "Text 01", status: "VYGENEROVANO" });
    report = withSectionText(report, "02", { generatedText: "Text 02", status: "VYGENEROVANO" });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: createDefaultSchoolProfile(),
    });
    expect(preview.generatedSectionsCount).toBe(2);
  });

  it("placeholder text se nebere jako finální obsah", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = withSectionText(report, "06", {
      generatedText: VYROCNI_ZPRAVA_GENERATED_PLACEHOLDER,
      status: "VYGENEROVANO",
    });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: createDefaultSchoolProfile(),
    });
    expect(preview.fullText).not.toContain("AI asistenta");
    expect(preview.missingSections.some((item) => item.startsWith("06 "))).toBe(true);
  });

  it("ručně upravený text je v náhledu zachován", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = withSectionText(report, "03", {
      generatedText: "Upravený text kapitoly 03.",
      originalGeneratedText: "Původní text kapitoly 03.",
      editedByUser: true,
      status: "UPRAVENO_UZIVATELEM",
    });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: createDefaultSchoolProfile(),
    });
    expect(preview.fullText).toContain("Upravený text kapitoly 03.");
  });

  it("promítne status aktuálnosti textu do náhledu", () => {
    let report = createDefaultAnnualReport("2024/2025");
    report = withSectionText(report, "01", { generatedText: "Text 01", status: "VYGENEROVANO" });
    const preview = buildAnnualReportPreview({
      report,
      schoolProfile: createDefaultSchoolProfile(),
      generatedTextStatuses: { "01": "stale" },
    });
    expect(preview.sections.find((section) => section.number === "01")?.generatedTextStatus).toBe("stale");
  });

  it("pořadí sekcí v náhledu odpovídá 01 až 14", () => {
    const preview = buildAnnualReportPreview({
      report: createDefaultAnnualReport("2024/2025"),
      schoolProfile: createDefaultSchoolProfile(),
    });
    expect(preview.totalSectionsCount).toBe(14);
    expect(preview.sections.map((section) => section.number)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
      "13",
      "14",
    ]);
  });
});
