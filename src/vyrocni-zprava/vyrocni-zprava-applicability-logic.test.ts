import { describe, expect, it } from "vitest";
import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { toSchoolTypeStorageValue } from "../school-profile/school-profile-school-type";
import { getAnnualReportApplicability } from "./vyrocni-zprava-applicability-logic";
import { annualReportRequiredItems } from "./vyrocni-zprava-legal-constants";

function buildProfile(schoolType?: string) {
  return {
    ...createDefaultSchoolProfile(),
    schoolType: schoolType ?? "",
  };
}

describe("vyrocni-zprava-applicability-logic", () => {
  it("ZAKLADNI_SKOLA vrací DIRECTLY_APPLICABLE", () => {
    expect(
      getAnnualReportApplicability(buildProfile(toSchoolTypeStorageValue("ZAKLADNI_SKOLA"))).level,
    ).toBe("DIRECTLY_APPLICABLE");
  });

  it("STREDNI_SKOLA vrací DIRECTLY_APPLICABLE", () => {
    expect(
      getAnnualReportApplicability(buildProfile(toSchoolTypeStorageValue("STREDNI_SKOLA"))).level,
    ).toBe("DIRECTLY_APPLICABLE");
  });

  it("KONZERVATOR vrací DIRECTLY_APPLICABLE", () => {
    expect(
      getAnnualReportApplicability(buildProfile(toSchoolTypeStorageValue("KONZERVATOR"))).level,
    ).toBe("DIRECTLY_APPLICABLE");
  });

  it("VYSSI_ODBORNA_SKOLA vrací DIRECTLY_APPLICABLE", () => {
    expect(
      getAnnualReportApplicability(buildProfile(toSchoolTypeStorageValue("VYSSI_ODBORNA_SKOLA"))).level,
    ).toBe("DIRECTLY_APPLICABLE");
  });

  it("MATERSKA_SKOLA vrací NOT_STANDARDLY_REQUIRED", () => {
    expect(
      getAnnualReportApplicability(buildProfile(toSchoolTypeStorageValue("MATERSKA_SKOLA"))).level,
    ).toBe("NOT_STANDARDLY_REQUIRED");
  });

  it("ZAKLADNI_UMELECKA_SKOLA vrací NOT_STANDARDLY_REQUIRED", () => {
    expect(
      getAnnualReportApplicability(buildProfile(toSchoolTypeStorageValue("ZAKLADNI_UMELECKA_SKOLA"))).level,
    ).toBe("NOT_STANDARDLY_REQUIRED");
  });

  it("JAZYKOVA_SKOLA_S_PRAVEM_STATNI_JAZYKOVE_ZKOUSKY vrací NOT_STANDARDLY_REQUIRED", () => {
    expect(
      getAnnualReportApplicability(buildProfile(toSchoolTypeStorageValue("JAZYKOVA_SKOLA_S_PRAVEM_STATNI_JAZYKOVE_ZKOUSKY"))).level,
    ).toBe("NOT_STANDARDLY_REQUIRED");
  });

  it("SKOLSKE_ZARIZENI vrací NOT_STANDARDLY_REQUIRED", () => {
    expect(
      getAnnualReportApplicability(buildProfile(toSchoolTypeStorageValue("SKOLSKE_ZARIZENI"))).level,
    ).toBe("NOT_STANDARDLY_REQUIRED");
  });

  it("chybějící schoolType vrací UNKNOWN", () => {
    expect(getAnnualReportApplicability(buildProfile("")).level).toBe("UNKNOWN");
  });

  it("annualReportRequiredItems obsahuje přesně 11 bodů", () => {
    expect(annualReportRequiredItems).toHaveLength(11);
  });

  it("bod g) obsahuje prevenci, opatření, rizikové chování, SVP, nadané a jazykovou přípravu", () => {
    const itemG = annualReportRequiredItems[6].toLowerCase();
    expect(itemG).toContain("prevenci");
    expect(itemG).toContain("opatřen");
    expect(itemG).toContain("rizikového chování");
    expect(itemG).toContain("speciálními vzdělávacími potřebami");
    expect(itemG).toContain("nadaných");
    expect(itemG).toContain("jazykové přípravy");
  });

  it("legacy free-text hodnoty typu školy mapuje bezpečně", () => {
    expect(getAnnualReportApplicability(buildProfile("Základní škola")).level).toBe("DIRECTLY_APPLICABLE");
    expect(getAnnualReportApplicability(buildProfile("Školní družina")).level).toBe("NOT_STANDARDLY_REQUIRED");
    expect(getAnnualReportApplicability(buildProfile("Neznámý interní typ")).level).toBe("UNKNOWN");
  });
});
