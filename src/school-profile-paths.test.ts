import { describe, expect, it } from "vitest";
import { PROFIL_SKOLY_PATH } from "./calculator-ui-constants";
import { isProfilSkolyPathname } from "./school-profile-paths";

describe("school profile paths", () => {
  it("rozpozná /profil-skoly", () => {
    expect(PROFIL_SKOLY_PATH).toBe("/profil-skoly");
    expect(isProfilSkolyPathname("/profil-skoly")).toBe(true);
    expect(isProfilSkolyPathname("/profil-skoly/")).toBe(true);
    expect(isProfilSkolyPathname("/vyrocni-zprava")).toBe(false);
  });
});
