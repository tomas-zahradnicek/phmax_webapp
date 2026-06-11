import { describe, expect, it } from "vitest";
import { isUserGuidePathname } from "./phmax-user-guide-paths";
import { USER_GUIDE_PATH } from "./calculator-ui-constants";

describe("user guide paths", () => {
  it("rozpozná /navod", () => {
    expect(USER_GUIDE_PATH).toBe("/navod");
    expect(isUserGuidePathname("/navod")).toBe(true);
    expect(isUserGuidePathname("/navod/")).toBe(true);
    expect(isUserGuidePathname("/prehled")).toBe(false);
  });
});
