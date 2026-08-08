import { describe, expect, it } from "vitest";
import {
  createDefaultSchoolProfile,
  detectMissingSchoolProfileFields,
  resetSchoolProfileFields,
  SCHOOL_PROFILE_IDENTITY_SENSITIVE_FIELDS,
} from "./school-profile-logic";

describe("school-profile-logic", () => {
  it("detekuje chybějící povinná pole", () => {
    const profile = createDefaultSchoolProfile();
    const missing = detectMissingSchoolProfileFields(profile);
    expect(missing).toContain("Název školy");
    expect(missing).toContain("IČO");
  });

  it("nehlásí chybějící pole u kompletního profilu", () => {
    const profile = {
      ...createDefaultSchoolProfile(),
      name: "ZŠ Ukázková",
      ico: "12345678",
      redIzo: "123456789",
      address: "Hlavní 1",
      municipality: "Praha",
      region: "Hlavní město Praha",
      founder: "Město",
      principalName: "Jan Novák",
      website: "https://skola.cz",
      email: "skola@skola.cz",
      schoolType: "Základní škola",
    };
    expect(detectMissingSchoolProfileFields(profile)).toHaveLength(0);
  });

  it("identity-sensitive fields jsou IČO / RED IZO / IZO", () => {
    expect(SCHOOL_PROFILE_IDENTITY_SENSITIVE_FIELDS).toEqual(["ico", "redIzo", "izo"]);
  });

  it("resetSchoolProfileFields zachová id a identifikátory", () => {
    const profile = {
      ...createDefaultSchoolProfile(),
      id: "fixed-id-0001",
      ico: "11111111",
      redIzo: "600111111",
      izo: "102111111",
      name: "ZŠ",
    };
    const reset = resetSchoolProfileFields(profile);
    expect(reset.id).toBe("fixed-id-0001");
    expect(reset.ico).toBe("11111111");
    expect(reset.redIzo).toBe("600111111");
    expect(reset.izo).toBe("102111111");
    expect(reset.name).toBe("");
  });
});
