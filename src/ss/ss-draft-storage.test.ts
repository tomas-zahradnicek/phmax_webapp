import { describe, expect, it } from "vitest";
import { buildSsDraftStoragePayload, parseSsDraftRowsFromSnapshot } from "./ss-draft-storage";

const sampleRow = {
  id: 1,
  label: "",
  educationField: "39-41-L/01",
  studyForm: "denni" as const,
  phmaxMode: "" as const,
  oborCountInClass: "1",
  additionalOborCodes: "",
  oborStudentCountsRaw: "",
  isArt82TalentClass: false,
  classType: "",
  isPar16Class: false,
  isLegacyMultioborClass: false,
  legacyMaxOborCount: "",
  note: "",
  averageStudents: "17",
  classCount: "2",
};

describe("ss-draft-storage", () => {
  it("legacy pole řádků", () => {
    expect(parseSsDraftRowsFromSnapshot([sampleRow])).toHaveLength(1);
  });

  it("obal s audit totals", () => {
    const payload = buildSsDraftStoragePayload([sampleRow], 100);
    expect(payload).toMatchObject({ _phmaxAuditTotals: { totalPhmax: 100, tab: "phmax" } });
    expect(parseSsDraftRowsFromSnapshot(payload)).toHaveLength(1);
  });

  it("bez PHmax vrací legacy pole", () => {
    expect(buildSsDraftStoragePayload([sampleRow], null)).toEqual([sampleRow]);
  });
});
