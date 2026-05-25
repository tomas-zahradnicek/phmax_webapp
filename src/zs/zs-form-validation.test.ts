import { describe, expect, it } from "vitest";
import { buildZsValidationIssues, buildZsVerdict, buildZsWorkflow } from "./zs-form-validation";

describe("zs-form-validation", () => {
  it("prázdný PHmax formulář vrací issue na basic", () => {
    const issues = buildZsValidationIssues({
      tab: "phmax",
      basic1Classes: 0,
      basic1Pupils: 0,
      basic2Classes: 0,
      basic2Pupils: 0,
      incl1Classes: 0,
      incl2Classes: 0,
      psychRowCount: 0,
      healthRowCount: 0,
      minority1Classes: 0,
      gymRowCount: 0,
      mixedRowCount: 0,
      special1Classes: 0,
      special2Classes: 0,
      specialIIClasses: 0,
      prepClasses: 0,
      prepSpecialClasses: 0,
      phaRowCount: 0,
      phpYear1: 0,
      phpYear2: 0,
      phpYear3: 0,
      phpMethodMode: "three_year_avg",
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.section).toBe("basic");
  });

  it("buildZsVerdict při neúplných sekcích je warning", () => {
    const v = buildZsVerdict(2, 0);
    expect(v.tone).toBe("warning");
    expect(v.label).toContain("kompletní");
  });

  it("buildZsWorkflow má aktivní krok při varováních", () => {
    const w = buildZsWorkflow(0, 1);
    expect(w.steps[1]!.state).toBe("active");
  });
});
