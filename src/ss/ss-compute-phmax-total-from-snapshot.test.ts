import { describe, expect, it } from "vitest";
import { computeSsPhmaxTotalFromSnapshot } from "./ss-compute-phmax-total-from-snapshot";

describe("computeSsPhmaxTotalFromSnapshot", () => {
  it("sčítá PHmax z platných řádků draftu", () => {
    const total = computeSsPhmaxTotalFromSnapshot([
      {
        id: 1,
        label: "",
        educationField: "39-41-L/01",
        studyForm: "denni",
        phmaxMode: "",
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
      },
    ]);
    expect(total).not.toBeNull();
    expect(total).toBeGreaterThan(0);
  });

  it("prázdný draft vrací null", () => {
    expect(computeSsPhmaxTotalFromSnapshot([])).toBeNull();
  });
});
