import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MSG_SCHOOL_PROFILE_PERSIST_FAILED } from "./school-profile-identity-policy";

const root = path.resolve(__dirname, "../..");

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("SchoolProfile persistence UI contract (0F-2A)", () => {
  const pageSource = readSource("src/ProfilSkolyPage.tsx");
  const hookSource = readSource("src/school-profile/use-school-profile.ts");

  it("M/N: failed Save nenastaví savedAt a zobrazí persistence error copy", () => {
    expect(pageSource).toContain("MSG_SCHOOL_PROFILE_PERSIST_FAILED");
    expect(pageSource).toContain("result.persistence.ok");
    expect(pageSource).toContain("setPersistError(MSG_SCHOOL_PROFILE_PERSIST_FAILED)");
    expect(pageSource).toContain("setSavedAt(new Date().toLocaleString(\"cs-CZ\"))");
    // savedAt only inside persistence.ok branch
    expect(pageSource).toMatch(
      /if \(result\.persistence\.ok\) \{[\s\S]*?setSavedAt\([\s\S]*?\}/,
    );
    expect(MSG_SCHOOL_PROFILE_PERSIST_FAILED).toBe(
      "Profil školy se nepodařilo uložit do tohoto prohlížeče.",
    );
    expect(pageSource).toContain("{persistError ? (");
  });

  it("O: úspěšný Save maže persistError a nastaví savedAt", () => {
    expect(pageSource).toMatch(
      /if \(result\.persistence\.ok\) \{[\s\S]*?setSavedAt\([\s\S]*?setPersistError\(null\)/,
    );
  });

  it("P: failed Reset není prezentován jako úspěšný reset", () => {
    expect(pageSource).toContain("const result = resetProfile()");
    expect(pageSource).toMatch(
      /const result = resetProfile\(\);[\s\S]*?if \(result\.persistence\.ok\) \{[\s\S]*?setSavedAt\(null\)/,
    );
    expect(pageSource).toContain("setDraft(profile)");
    expect(pageSource).toContain("setPersistError(MSG_SCHOOL_PROFILE_PERSIST_FAILED)");
  });

  it("identity notice a persistence error jsou oddělené", () => {
    expect(pageSource).toContain("identityGuardNotice");
    expect(pageSource).toContain("persistError");
    expect(pageSource).toContain("setIdentityGuardNotice(messageForIdentityBlockReason");
  });

  it("ensureSchoolPlatformBinding není zapojen v Profile UI / hook", () => {
    expect(pageSource).not.toContain("ensureSchoolPlatformBinding");
    expect(hookSource).not.toContain("ensureSchoolPlatformBinding");
  });

  it("saveProfile / resetProfile / updateProfile propagují persistence", () => {
    expect(hookSource).toContain("persistence: SchoolProfileStorageSaveResult");
    expect(hookSource).toContain("const persistence = replaceSchoolProfileState(next)");
    expect(hookSource).toContain("const persistence = replaceSchoolProfileState(cleared)");
  });
});
