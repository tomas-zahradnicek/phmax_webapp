import { describe, expect, it } from "vitest";
import { buildZsWizardVisibleExceptionIds } from "./zs-wizard-choices";

describe("buildZsWizardVisibleExceptionIds", () => {
  it("vrátí sec16 a psych když jsou sekce viditelné", () => {
    const ids = buildZsWizardVisibleExceptionIds((id) => id === "sec16_first" || id === "psych_groups");
    expect(ids).toEqual(["sec16", "psych"]);
  });

  it("vrátí prázdné pole bez výjimek", () => {
    expect(buildZsWizardVisibleExceptionIds(() => false)).toEqual([]);
  });
});
