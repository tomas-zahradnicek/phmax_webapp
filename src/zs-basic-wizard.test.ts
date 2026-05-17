import { describe, expect, it } from "vitest";
import {
  clampZsBasicWizardStep,
  readZsBasicWizardStep,
  resolveZsWizardScrollSection,
} from "./zs-basic-wizard";

describe("zs-basic-wizard", () => {
  it("clampZsBasicWizardStep drží rozsah 1–4", () => {
    expect(clampZsBasicWizardStep(0)).toBe(1);
    expect(clampZsBasicWizardStep(3)).toBe(3);
    expect(clampZsBasicWizardStep(9)).toBe(4);
  });

  it("resolveZsWizardScrollSection vybere první viditelnou výjimku", () => {
    expect(resolveZsWizardScrollSection(3, ["psych", "gym"])).toBe("psych");
    expect(resolveZsWizardScrollSection(3, [])).toBe("phmax-summary");
    expect(resolveZsWizardScrollSection(1, [])).toBe("setup");
    expect(resolveZsWizardScrollSection(2, [])).toBe("basic");
    expect(resolveZsWizardScrollSection(4, [])).toBe("phmax-summary");
  });

  it("readZsBasicWizardStep vrací platný krok", () => {
    expect(readZsBasicWizardStep()).toBeGreaterThanOrEqual(1);
    expect(readZsBasicWizardStep()).toBeLessThanOrEqual(4);
  });
});
