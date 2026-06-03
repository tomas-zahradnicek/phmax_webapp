import { describe, expect, it } from "vitest";
import {
  buildNv75Bonus4cGeneralHint,
  buildNv75Bonus4cSec16Hint,
  countNv75PracticalGeneralForBonus4c,
} from "./nv75-bonus4c-sensitivity";

describe("nv75-bonus4c-sensitivity", () => {
  it("§4c odst. 1: pod 121 žáky navrhne další pásmo", () => {
    const hint = buildNv75Bonus4cGeneralHint(100);
    expect(hint).toContain("121");
    expect(hint).toContain("§4c");
  });

  it("§4c §16: pod 43 žáky navrhne další pásmo", () => {
    const hint = buildNv75Bonus4cSec16Hint(30);
    expect(hint).toContain("43");
  });

  it("započtení OV při méně než 10 skupinách", () => {
    expect(
      countNv75PracticalGeneralForBonus4c({
        practicalGeneralNonOv: 50,
        practicalOvEhl0: 20,
        ovGroupsSchool: 4,
        ovGroupsInstructor: 0,
      }),
    ).toBe(70);
    expect(
      countNv75PracticalGeneralForBonus4c({
        practicalGeneralNonOv: 50,
        practicalOvEhl0: 20,
        ovGroupsSchool: 10,
        ovGroupsInstructor: 0,
      }),
    ).toBe(50);
  });
});
