import { describe, expect, it } from "vitest";
import {
  clampZsBasicWizardStep,
  readZsBasicWizardStep,
  resolveZsWizardScrollSection,
  ZS_BASIC_WIZARD_STEP_COUNT,
} from "./zs-basic-wizard";

describe("zs-basic-wizard", () => {
  it("clampZsBasicWizardStep drží rozsah 1–5", () => {
    expect(clampZsBasicWizardStep(0)).toBe(1);
    expect(clampZsBasicWizardStep(3)).toBe(3);
    expect(clampZsBasicWizardStep(9)).toBe(5);
    expect(ZS_BASIC_WIZARD_STEP_COUNT).toBe(5);
  });

  it("resolveZsWizardScrollSection vybere první viditelnou výjimku nebo souhrn", () => {
    expect(resolveZsWizardScrollSection(3, ["psych", "gym"])).toBe("psych");
    expect(resolveZsWizardScrollSection(3, [])).toBe("phmax-summary");
    expect(resolveZsWizardScrollSection(1, [])).toBe("setup");
    expect(resolveZsWizardScrollSection(2, [])).toBe("basic");
    expect(resolveZsWizardScrollSection(4, [])).toBe("phmax-summary");
    expect(resolveZsWizardScrollSection(5, [])).toBe("overview");
  });

  it("readZsBasicWizardStep vrací platný krok", () => {
    expect(readZsBasicWizardStep()).toBeGreaterThanOrEqual(1);
    expect(readZsBasicWizardStep()).toBeLessThanOrEqual(ZS_BASIC_WIZARD_STEP_COUNT);
  });
});
