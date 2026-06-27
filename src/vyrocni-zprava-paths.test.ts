import { describe, expect, it } from "vitest";
import { VYROCNI_ZPRAVA_NAHLED_PATH, VYROCNI_ZPRAVA_PATH } from "./calculator-ui-constants";
import { isVyrocniZpravaPathname, isVyrocniZpravaPreviewPathname } from "./vyrocni-zprava-paths";

describe("vyrocni zprava paths", () => {
  it("rozpozná /vyrocni-zprava", () => {
    expect(VYROCNI_ZPRAVA_PATH).toBe("/vyrocni-zprava");
    expect(VYROCNI_ZPRAVA_NAHLED_PATH).toBe("/vyrocni-zprava/nahled");
    expect(isVyrocniZpravaPathname("/vyrocni-zprava")).toBe(true);
    expect(isVyrocniZpravaPathname("/vyrocni-zprava/")).toBe(true);
    expect(isVyrocniZpravaPathname("/vyrocni-zprava/nahled")).toBe(true);
    expect(isVyrocniZpravaPreviewPathname("/vyrocni-zprava/nahled")).toBe(true);
    expect(isVyrocniZpravaPreviewPathname("/vyrocni-zprava")).toBe(false);
    expect(isVyrocniZpravaPathname("/prehled")).toBe(false);
  });
});
