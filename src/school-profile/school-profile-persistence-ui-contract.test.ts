import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  MSG_SCHOOL_PROFILE_PERSIST_FAILED,
  MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED,
} from "./school-profile-identity-policy";

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
    expect(pageSource).toMatch(
      /if \(!result\.persistence\.ok\) \{[\s\S]*?setPersistError\(MSG_SCHOOL_PROFILE_PERSIST_FAILED\)/,
    );
    expect(MSG_SCHOOL_PROFILE_PERSIST_FAILED).toBe(
      "Profil školy se nepodařilo uložit do tohoto prohlížeče.",
    );
    expect(pageSource).toContain("{persistError ? (");
  });

  it("O: úspěšný Save maže persistError a nastaví savedAt před bindingem", () => {
    expect(pageSource).toMatch(
      /setSavedAt\(new Date\(\)\.toLocaleString\("cs-CZ"\)\);[\s\S]*?setPersistError\(null\);/,
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

  it("saveProfile / resetProfile / updateProfile propagují persistence", () => {
    expect(hookSource).toContain("persistence: SchoolProfileStorageSaveResult");
    expect(hookSource).toContain("const persistence = replaceSchoolProfileState(next)");
    expect(hookSource).toContain("const persistence = replaceSchoolProfileState(cleared)");
  });
});

describe("SchoolProfile save → platform binding UI contract (0F-2B)", () => {
  const pageSource = readSource("src/ProfilSkolyPage.tsx");
  const hookSource = readSource("src/school-profile/use-school-profile.ts");
  const vzReportSource = readSource("src/vyrocni-zprava/use-vyrocni-zprava-report.ts");

  it("jediný produkční ensure entrypoint je explicitní Save na ProfilSkolyPage", () => {
    expect(pageSource).toContain("createSerializedPlatformBindingRunner");
    expect(pageSource).toContain("afterPersist(result.persistence)");
    expect(pageSource).toContain("const handleSave = useCallback(async () => {");
    expect(pageSource).not.toContain("ensureSchoolPlatformBinding(");
    // Mount effect only syncs draft — no binding call inside useEffect bodies.
    const effectBodies = [...pageSource.matchAll(/useEffect\(\(\) => \{([\s\S]*?)\},/g)].map(
      (m) => m[1] ?? "",
    );
    expect(effectBodies.length).toBeGreaterThan(0);
    for (const body of effectBodies) {
      expect(body).not.toContain("afterPersist");
      expect(body).not.toContain("ensureSchoolPlatformBinding");
    }
    expect(hookSource).not.toContain("ensureSchoolPlatformBinding");
    expect(hookSource).not.toContain("afterPersist");
    expect(vzReportSource).not.toContain("ensureSchoolPlatformBinding");
    expect(vzReportSource).not.toContain("afterPersist");
  });

  it("resetProfile path nevolá platform binding", () => {
    const resetBlock = pageSource.match(
      /const handleReset = useCallback\(\(\) => \{[\s\S]*?\}, \[profile, resetProfile\]\);/,
    );
    expect(resetBlock?.[0]).toBeTruthy();
    expect(resetBlock?.[0]).not.toContain("afterPersist");
    expect(resetBlock?.[0]).not.toContain("ensureSchoolPlatformBinding");
  });

  it("persistError a platformBindingNotice jsou oddělené stavy", () => {
    expect(pageSource).toContain("persistError");
    expect(pageSource).toContain("platformBindingNotice");
    expect(pageSource).toContain("{platformBindingNotice ? (");
    expect(MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED).toContain("byl uložen");
    expect(MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED).not.toBe(MSG_SCHOOL_PROFILE_PERSIST_FAILED);
  });

  it("metadata warning používá status/polite pattern (role=status)", () => {
    expect(pageSource).toMatch(
      /\{platformBindingNotice \? \([\s\S]*?role="status"[\s\S]*?platformBindingNotice/,
    );
  });

  it("failed persist path nevolá afterPersist / binding", () => {
    expect(pageSource).toMatch(
      /if \(!result\.persistence\.ok\) \{[\s\S]*?setPersistError\(MSG_SCHOOL_PROFILE_PERSIST_FAILED\);[\s\S]*?return;[\s\S]*\}/,
    );
    const failBranch = pageSource.match(
      /if \(!result\.persistence\.ok\) \{[\s\S]*?return;[\s\S]*?\}/,
    );
    expect(failBranch?.[0]).not.toContain("afterPersist");
  });

  it("mount binding stále není implementován", () => {
    expect(pageSource).toMatch(/useEffect\(\(\) => \{\s*setDraft\(profile\);\s*\}, \[profile\]\);/);
    expect(pageSource).not.toContain("ensureSchoolPlatformBinding(");
  });
});
