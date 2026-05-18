import { describe, expect, it } from "vitest";
import { evaluateBusinessRules } from "./phmax-ss-business-rules";
import { buildBusinessRulesInputForRow } from "./phmax-ss-brules-row-build";
import { phmaxSsDataset } from "./phmax-ss-dataset";
import { createEmptyPhmaxSsUnitRow } from "./phmax-ss-types";

describe("SŠ § 16 business rules", () => {
  it("předá isPar16Class do evaluateBusinessRules a označí výpočet § 16", () => {
    const row = {
      ...createEmptyPhmaxSsUnitRow(1),
      educationField: "79-41-K/41",
      averageStudents: "18",
      classCount: "1",
      isPar16Class: true,
    };
    const input = buildBusinessRulesInputForRow(row);
    expect(input?.isPar16Class).toBe(true);
    const result = evaluateBusinessRules(phmaxSsDataset, input!);
    expect(result.suggestedComputation).toBe("par16");
    expect(result.info.some((w) => w.code === "PAR16_CALC_APPLIED")).toBe(true);
    expect(result.warnings.some((w) => w.code === "PAR16_CALC_PREVIEW_ONLY")).toBe(false);
  });
});
