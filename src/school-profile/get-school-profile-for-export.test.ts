import { describe, expect, it } from "vitest";
import { createDefaultSchoolProfile } from "./school-profile-logic";
import { getSchoolProfileForExport } from "./get-school-profile-for-export";

describe("getSchoolProfileForExport", () => {
  it("vrátí exportní pole profilu školy", () => {
    const profile = {
      ...createDefaultSchoolProfile(),
      name: "ZŠ Ukázková",
      ico: "12345678",
      redIzo: "123456789",
      izo: "987654321",
      schoolType: "Základní škola",
      address: "Hlavní 1",
      municipality: "Praha",
      region: "Hlavní město Praha",
      founder: "Město",
      principalName: "Jan Novák",
      website: "https://skola.cz",
      email: "skola@skola.cz",
      phone: "+420 123 456 789",
      dataBox: "abc1234",
    };

    expect(getSchoolProfileForExport(profile)).toEqual({
      name: "ZŠ Ukázková",
      ico: "12345678",
      redIzo: "123456789",
      izo: "987654321",
      schoolType: "Základní škola",
      address: "Hlavní 1",
      municipality: "Praha",
      region: "Hlavní město Praha",
      founder: "Město",
      principalName: "Jan Novák",
      website: "https://skola.cz",
      email: "skola@skola.cz",
      phone: "+420 123 456 789",
      dataBox: "abc1234",
    });
  });
});
