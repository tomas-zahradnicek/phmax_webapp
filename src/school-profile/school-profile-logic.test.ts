import { describe, expect, it } from "vitest";
import { createDefaultSchoolProfile, detectMissingSchoolProfileFields } from "./school-profile-logic";

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
});
