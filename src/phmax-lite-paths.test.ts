import { describe, expect, it } from "vitest";
import {
  isPvLitePathname,
  isSdLitePathname,
  isZsLitePathname,
  PHMAX_PV_LITE_PATH,
  PHMAX_SD_LITE_PATH,
  PHMAX_ZS_LITE_PATH,
} from "./phmax-lite-paths";

describe("phmax-lite-paths", () => {
  it("rozpozná URL rychlého PHmax pro ŠD", () => {
    expect(PHMAX_SD_LITE_PATH).toBe("/phmax-skolni-druzina/rychly");
    expect(isSdLitePathname("/phmax-skolni-druzina/rychly")).toBe(true);
    expect(isSdLitePathname("/phmax-skolni-druzina/rychly/")).toBe(true);
    expect(isSdLitePathname("/phmax-skolni-druzina")).toBe(false);
  });

  it("rozpozná URL rychlého PHmax pro PV", () => {
    expect(PHMAX_PV_LITE_PATH).toBe("/phmax-predskolni-vzdelavani/rychly");
    expect(isPvLitePathname("/phmax-predskolni-vzdelavani/rychly")).toBe(true);
    expect(isPvLitePathname("/phmax-predskolni-vzdelavani/rychly/")).toBe(true);
    expect(isPvLitePathname("/phmax-predskolni-vzdelavani")).toBe(false);
  });

  it("rozpozná URL rychlého PHmax pro ZŠ", () => {
    expect(PHMAX_ZS_LITE_PATH).toBe("/phmax-zakladni-skola/rychly");
    expect(isZsLitePathname("/phmax-zakladni-skola/rychly")).toBe(true);
    expect(isZsLitePathname("/phmax-zakladni-skola/rychly/")).toBe(true);
    expect(isZsLitePathname("/phmax-zakladni-skola")).toBe(false);
  });
});
