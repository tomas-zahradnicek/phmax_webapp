import { describe, expect, it } from "vitest";
import { zsPhmaxWizardStepForTocSection } from "./zs-toc-sections";

describe("zsPhmaxWizardStepForTocSection", () => {
  it("mapuje stabilní id obsahu na krok průvodce PHmax", () => {
    expect(zsPhmaxWizardStepForTocSection("setup")).toBe(1);
    expect(zsPhmaxWizardStepForTocSection("basic")).toBe(2);
    expect(zsPhmaxWizardStepForTocSection("zs-phmax-exceptions")).toBe(3);
    expect(zsPhmaxWizardStepForTocSection("phmax-summary")).toBe(4);
    expect(zsPhmaxWizardStepForTocSection("overview")).toBe(5);
  });

  it("neznámé id nechává na scrollu obsahu", () => {
    expect(zsPhmaxWizardStepForTocSection("guide")).toBeNull();
    expect(zsPhmaxWizardStepForTocSection("pha")).toBeNull();
    expect(zsPhmaxWizardStepForTocSection("sec16")).toBeNull();
  });
});
