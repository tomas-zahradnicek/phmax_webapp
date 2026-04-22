import { describe, expect, it } from "vitest";
import { buildZsConnectedBlocks, type BuildZsConnectedBlocksInput } from "./phmax-zs-connected-blocks";

function makeInput(
  overrides: Partial<BuildZsConnectedBlocksInput> = {},
): BuildZsConnectedBlocksInput {
  const enabledSections = new Set<string>(["basic_first"]);
  return {
    hasSection: (section) => enabledSections.has(section),
    basicType: "full_more_than_2",
    basic1Classes: 1,
    basic2Classes: 1,
    incl1Classes: 0,
    incl2Classes: 0,
    hasHealthRows: false,
    hasPsychRows: false,
    minorityType: "minority1",
    minority1Classes: 0,
    hasGymRows: false,
    special1Classes: 0,
    special2Classes: 0,
    specialIIClasses: 0,
    hasMixedLegacyInput: false,
    hasMixedMethodTableData: false,
    mixedForTotal: 0,
    prepClasses: 0,
    prepSpecialClasses: 0,
    p38First: 0,
    p38Second: 0,
    p41First: 0,
    p41Second: 0,
    hasPhaUi: false,
    hasPhaSec16Row: false,
    hasPhaZssRow: false,
    hasPhpUi: false,
    phpExcludedSchool: false,
    ...overrides,
  };
}

describe("buildZsConnectedBlocks", () => {
  it("vrací basic_b1b2 pro úplnou ZŠ s daty", () => {
    const out = buildZsConnectedBlocks(makeInput());
    expect(out.connectedBlocks).toEqual(["basic_b1b2"]);
    expect(out.mixedReferenceNote).toBeUndefined();
  });

  it("přidá mixed_explain a poznámku při smíšených datech", () => {
    const out = buildZsConnectedBlocks(
      makeInput({
        hasSection: (s) => s === "basic_first" || s === "dominant_c_first",
        hasMixedMethodTableData: true,
        mixedForTotal: 2.5,
      }),
    );
    expect(out.connectedBlocks).toContain("mixed_explain");
    expect(out.mixedReferenceNote).toEqual({ total: 2.5, usesMethodTable: true });
  });

  it("přidá PHA a PHP bloky jen při splnění podmínek", () => {
    const out = buildZsConnectedBlocks(
      makeInput({
        hasPhaUi: true,
        hasPhaSec16Row: true,
        hasPhaZssRow: true,
        hasPhpUi: true,
      }),
    );
    expect(out.connectedBlocks).toContain("pha_b35_38");
    expect(out.connectedBlocks).toContain("pha_b39_45");
    expect(out.connectedBlocks).toContain("php_b46");
  });

  it("nepřidá php_b46 při vyloučené škole", () => {
    const out = buildZsConnectedBlocks(
      makeInput({
        hasPhpUi: true,
        phpExcludedSchool: true,
      }),
    );
    expect(out.connectedBlocks).not.toContain("php_b46");
  });
});
