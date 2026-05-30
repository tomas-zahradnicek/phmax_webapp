import { describe, expect, it } from "vitest";
import { buildBusinessRulesInputForRow } from "./phmax-ss-brules-row-build";
import { evaluateBusinessRules } from "./phmax-ss-business-rules";
import { phmaxSsDataset } from "./phmax-ss-dataset";
import { createEmptyPhmaxSsUnitRow } from "./phmax-ss-types";

describe("legacy multiobor business rules", () => {
  it("předá isLegacyMultioborClass a legacyMaxOborCount do evaluateBusinessRules", () => {
    const row = {
      ...createEmptyPhmaxSsUnitRow(1),
      educationField: "39-41-L/01",
      oborCountInClass: "3",
      additionalOborCodes: "39-41-L/02, 39-41-L/51",
      isLegacyMultioborClass: true,
      legacyMaxOborCount: "2",
      averageStudents: "15",
      classCount: "1",
    };
    const input = buildBusinessRulesInputForRow(row);
    expect(input?.isLegacyMultioborClass).toBe(true);
    expect(input?.legacyMaxOborCount).toBe(2);
    const result = evaluateBusinessRules(phmaxSsDataset, input!);
    expect(result.errors.some((e) => e.code === "LEGACY_OVER_LIMIT")).toBe(true);
  });
});
