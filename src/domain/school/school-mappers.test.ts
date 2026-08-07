import { describe, expect, it } from "vitest";
import { fromSchoolProfile, toSchoolProfile } from "./school-mappers";
import { DOMAIN_DATA_SCHEMA_VERSION } from "../shared/data-schema-version";
import type { SchoolProfile } from "../../school-profile/school-profile-types";

function sampleProfile(): SchoolProfile {
  return {
    id: "11111111-2222-4333-8444-555555555555",
    name: "ZŠ Ukázková",
    ico: "12345678",
    redIzo: "600123456",
    izo: "102345678",
    schoolType: "Základní škola",
    address: "Hlavní 1",
    municipality: "Praha",
    region: "Hlavní město Praha",
    founder: "Město Praha",
    principalName: "Jan Novák",
    website: "https://skola.cz",
    email: "skola@skola.cz",
    phone: "+420123456789",
    dataBox: "abcdefg",
    createdAt: "2026-01-02T03:04:05.000Z",
    updatedAt: "2026-02-03T04:05:06.000Z",
  };
}

describe("school-mappers", () => {
  it("SchoolProfile → School → SchoolProfile roundtrip zachová všechna pole", () => {
    const original = sampleProfile();
    const school = fromSchoolProfile(original);
    const back = toSchoolProfile(school);

    expect(back).toEqual(original);
  });

  it("fromSchoolProfile zachová všechny hodnoty SchoolProfile a přidá schemaVersion", () => {
    const original = sampleProfile();
    const school = fromSchoolProfile(original);

    expect(school.schemaVersion).toBe(DOMAIN_DATA_SCHEMA_VERSION);
    expect(school.id).toBe(original.id);
    expect(school.name).toBe(original.name);
    expect(school.ico).toBe(original.ico);
    expect(school.redIzo).toBe(original.redIzo);
    expect(school.izo).toBe(original.izo);
    expect(school.schoolType).toBe(original.schoolType);
    expect(school.address).toBe(original.address);
    expect(school.municipality).toBe(original.municipality);
    expect(school.region).toBe(original.region);
    expect(school.founder).toBe(original.founder);
    expect(school.principalName).toBe(original.principalName);
    expect(school.website).toBe(original.website);
    expect(school.email).toBe(original.email);
    expect(school.phone).toBe(original.phone);
    expect(school.dataBox).toBe(original.dataBox);
    expect(school.createdAt).toBe(original.createdAt);
    expect(school.updatedAt).toBe(original.updatedAt);
  });

  it("toSchoolProfile neobsahuje schemaVersion a nemění hodnoty", () => {
    const school = fromSchoolProfile(sampleProfile());
    const profile = toSchoolProfile(school);

    expect(profile).not.toHaveProperty("schemaVersion");
    expect(Object.keys(profile).sort()).toEqual(
      [
        "id",
        "name",
        "ico",
        "redIzo",
        "izo",
        "schoolType",
        "address",
        "municipality",
        "region",
        "founder",
        "principalName",
        "website",
        "email",
        "phone",
        "dataBox",
        "createdAt",
        "updatedAt",
      ].sort(),
    );
  });

  it("roundtrip nemění prázdné řetězce ani whitespace hodnoty", () => {
    const original: SchoolProfile = {
      ...sampleProfile(),
      name: "",
      phone: "  ",
      website: "",
    };
    expect(toSchoolProfile(fromSchoolProfile(original))).toEqual(original);
  });
});
