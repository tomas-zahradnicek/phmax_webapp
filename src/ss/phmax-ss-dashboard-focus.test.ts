import { describe, expect, it } from "vitest";
import { findFirstSsDashboardFocusRowId } from "./phmax-ss-dashboard-focus";
import type { PhmaxSsUnitRow } from "./phmax-ss-types";

function row(partial: Partial<PhmaxSsUnitRow> & Pick<PhmaxSsUnitRow, "id">): PhmaxSsUnitRow {
  return {
    id: partial.id,
    label: partial.label ?? "",
    educationField: partial.educationField ?? "",
    studyForm: partial.studyForm ?? "denni",
    phmaxMode: partial.phmaxMode ?? "",
    oborCountInClass: partial.oborCountInClass ?? "1",
    additionalOborCodes: partial.additionalOborCodes ?? "",
    oborStudentCountsRaw: partial.oborStudentCountsRaw ?? "",
    isArt82TalentClass: partial.isArt82TalentClass ?? false,
    classType: partial.classType ?? "",
    isPar16Class: partial.isPar16Class ?? false,
    isLegacyMultioborClass: partial.isLegacyMultioborClass ?? false,
    legacyMaxOborCount: partial.legacyMaxOborCount ?? "",
    note: partial.note ?? "",
    averageStudents: partial.averageStudents ?? "",
    classCount: partial.classCount ?? "1",
  };
}

describe("findFirstSsDashboardFocusRowId", () => {
  it("preferuje řádek s chybou PHmax", () => {
    const rows = [
      row({ id: 1, educationField: "39-41-L/01", averageStudents: "17", classCount: "1" }),
      row({ id: 2, educationField: "39-41-L/01", averageStudents: "17", classCount: "1", oborCountInClass: "0" }),
    ];
    expect(findFirstSsDashboardFocusRowId(rows)).toBe(2);
  });
});
