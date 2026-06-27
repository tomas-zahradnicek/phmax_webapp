import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createDefaultSchoolProfile, isSchoolProfileEstablished } from "./school-profile/school-profile-logic";

const root = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("calculator school profile contract", () => {
  const calculatorPages = [
    "src/PhmaxPvPage.tsx",
    "src/PhmaxSdPage.tsx",
    "src/PhmaxZsPage.tsx",
    "src/PhmaxSsPage.tsx",
    "src/PhmaxNv75DeputyPage.tsx",
  ];

  it("kalkulačkové moduly zobrazují banner profilu školy", () => {
    for (const file of calculatorPages) {
      expect(readSource(file)).toContain("CalculatorSchoolProfileBanner");
    }
    expect(readSource("src/CalculatorSchoolProfileBanner.tsx")).toContain("useSchoolProfile");
  });

  it("prázdný profil spustí varování v banneru", () => {
    const profile = createDefaultSchoolProfile();
    expect(isSchoolProfileEstablished(profile)).toBe(false);
    expect(readSource("src/CalculatorSchoolProfileBanner.tsx")).toContain(
      "Profil školy není vyplněn",
    );
  });

  it("vyplněný profil se zobrazí v banneru", () => {
    const profile = { ...createDefaultSchoolProfile(), name: "ZŠ Test" };
    expect(isSchoolProfileEstablished(profile)).toBe(true);
    expect(readSource("src/CalculatorSchoolProfileBanner.tsx")).toContain("Název školy");
  });

  it("exportní helper je připraven pro budoucí exporty", () => {
    expect(readSource("src/school-profile/get-school-profile-for-export.ts")).toContain(
      "getSchoolProfileForExport",
    );
  });

  it("výpočtová logika PHmax/PHAmax zůstává beze změny", () => {
    expect(readSource("src/phmax-pv-logic.ts")).toContain("export function computePvPhmaxTotal");
    expect(readSource("src/phmax-sd-logic.ts")).toContain("export function calculateSchoolDruzinaPhmaxDetailed");
    expect(readSource("src/ss/phmax-ss-service.ts")).toContain("export function calculatePhmaxRow");
    expect(readSource("src/nv75-deputy-bank.ts")).toContain("export function calculateNv75DeputyBank");
    for (const file of calculatorPages) {
      expect(readSource(file)).not.toContain("getSchoolProfileForExport(");
    }
  });
});
