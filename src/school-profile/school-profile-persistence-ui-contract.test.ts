import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  MSG_SCHOOL_PROFILE_PERSIST_FAILED,
  MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED,
  MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED,
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
      /if \(!result\.persistence\.ok\) \{[\s\S]*?profile_corrupted[\s\S]*?setPersistError\(MSG_SCHOOL_PROFILE_PERSIST_FAILED\)/,
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

  it("0F-3A: shared writers use guarded persistSchoolProfileToStorage", () => {
    const storageSource = readSource("src/school-profile/school-profile-storage.ts");
    expect(hookSource).toContain("persistSchoolProfileToStorage");
    expect(hookSource).toContain("const result = persistSchoolProfileToStorage(profile)");
    expect(hookSource).not.toMatch(
      /persist\s*=\s*true[\s\S]*?saveSchoolProfileToStorage\(profile\)/,
    );
    expect(storageSource).toContain("export function persistSchoolProfileToStorage");
    expect(storageSource).toContain('reason: "profile_corrupted"');
    expect(storageSource).toContain("readLegacySchoolProfile");
  });
});

describe("SchoolProfile save → platform binding UI contract (0F-2B)", () => {
  const pageSource = readSource("src/ProfilSkolyPage.tsx");
  const hookSource = readSource("src/school-profile/use-school-profile.ts");
  const vzReportSource = readSource("src/vyrocni-zprava/use-vyrocni-zprava-report.ts");

  it("produkční ensure entrypointy jsou pouze na ProfilSkolyPage (Save + mount)", () => {
    expect(pageSource).toContain("createSerializedPlatformBindingRunner");
    expect(pageSource).toContain("afterPersist(result.persistence)");
    expect(pageSource).toContain("const handleSave = useCallback(async () => {");
    expect(pageSource).not.toContain("ensureSchoolPlatformBinding(");
    expect(hookSource).not.toContain("ensureSchoolPlatformBinding");
    expect(hookSource).not.toContain("afterPersist");
    expect(hookSource).not.toContain("onMount");
    // Profile School binding must not be wired into VZ; 0G-2 adds a separate VZ year runner.
    expect(vzReportSource).not.toContain("ensureSchoolPlatformBinding");
    expect(vzReportSource).not.toContain("createSerializedPlatformBindingRunner");
    expect(vzReportSource).not.toContain("onMount()");
    expect(vzReportSource).not.toContain("afterPersist(result.persistence)");
  });

  it("resetProfile path nevolá platform binding", () => {
    const resetBlock = pageSource.match(
      /const handleReset = useCallback\(\(\) => \{[\s\S]*?\}, \[clearTransientNotices, profile, resetProfile\]\);/,
    );
    expect(resetBlock?.[0]).toBeTruthy();
    expect(resetBlock?.[0]).not.toContain("afterPersist");
    expect(resetBlock?.[0]).not.toContain("onMount");
    expect(resetBlock?.[0]).not.toContain("ensureSchoolPlatformBinding");
  });

  it("persistError a platformBindingNotice jsou oddělené stavy", () => {
    expect(pageSource).toContain("persistError");
    expect(pageSource).toContain("platformBindingNotice");
    expect(pageSource).toContain("{platformBindingNotice ? (");
    expect(MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED).toContain("byl uložen");
    expect(MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED).not.toBe(MSG_SCHOOL_PROFILE_PERSIST_FAILED);
  });

  it("Save binding failure copy zůstává save-specific", () => {
    const bindingSource = readSource("src/school-profile/profile-save-platform-binding.ts");
    expect(bindingSource).toMatch(
      /runPlatformBindingAfterProfilePersist[\s\S]*?MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED/,
    );
    expect(MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED).toContain("byl uložen");
  });

  it("metadata warning používá status/polite pattern (role=status)", () => {
    expect(pageSource).toMatch(
      /\{platformBindingNotice \? \([\s\S]*?role="status"[\s\S]*?platformBindingNotice/,
    );
  });

  it("failed persist path nevolá afterPersist / binding", () => {
    const failBranch = pageSource.match(
      /if \(!result\.persistence\.ok\) \{[\s\S]*?setPersistError\(MSG_SCHOOL_PROFILE_PERSIST_FAILED\);[\s\S]*?return;[\s\S]*?\}/,
    );
    expect(failBranch?.[0]).toBeTruthy();
    expect(failBranch?.[0]).not.toContain("afterPersist");
  });

  it("0F-3B: profile_corrupted Save rejection přepne recovery state, ne obecný persistError", () => {
    expect(pageSource).toContain('result.persistence.reason === "profile_corrupted"');
    expect(pageSource).toContain('setPersistenceStatus(');
    expect(pageSource).toMatch(
      /profile_corrupted[\s\S]*?setPersistenceStatus\([\s\S]*?corrupted/,
    );
    const corruptedBranch = pageSource.match(
      /if \(result\.persistence\.reason === "profile_corrupted"\) \{[\s\S]*?return;/,
    );
    expect(corruptedBranch?.[0]).toBeTruthy();
    expect(corruptedBranch?.[0]).not.toContain("MSG_SCHOOL_PROFILE_PERSIST_FAILED");
    expect(corruptedBranch?.[0]).not.toContain("afterPersist");
  });
});

describe("SchoolProfile mount → platform binding UI contract (0F-2C)", () => {
  const pageSource = readSource("src/ProfilSkolyPage.tsx");
  const appSource = readSource("src/App.tsx");
  const dashboardSource = readSource("src/PhmaxDashboardPage.tsx");

  it("mount effect volá shared runner.onMount s generation + cancel guard", () => {
    expect(pageSource).toContain("bindingRunnerRef.current.onMount()");
    expect(pageSource).toContain("let cancelled = false");
    expect(pageSource).toContain("generation !== bindingGenerationRef.current");
    expect(pageSource).toMatch(/useEffect\(\(\) => \{[\s\S]*?onMount\(\)[\s\S]*?\}, \[\]\);/);
  });

  it("mount a Save sdílejí stejný serialized runner a generation counter", () => {
    expect(pageSource).toContain("bindingRunnerRef");
    expect(pageSource).toContain("bindingGenerationRef");
    expect(pageSource).toContain("afterPersist(result.persistence)");
    expect(pageSource).toContain("onMount()");
  });

  it("mount binding není v App.tsx ani Dashboard", () => {
    expect(appSource).not.toContain("ensureSchoolPlatformBinding");
    expect(appSource).not.toContain("onMount()");
    expect(appSource).not.toContain("createSerializedPlatformBindingRunner");
    expect(dashboardSource).not.toContain("ensureSchoolPlatformBinding");
    expect(dashboardSource).not.toContain("createSerializedPlatformBindingRunner");
  });

  it("draft-sync effect zůstává oddělený od mount binding", () => {
    expect(pageSource).toMatch(
      /useEffect\(\(\) => \{\s*if \(blocksNormalEdit\) return;\s*setDraft\(profile\);\s*\}, \[profile, blocksNormalEdit\]\);/,
    );
    expect(pageSource).toContain("bindingRunnerRef.current.onMount()");
  });

  it("mount binding failure copy není save-specific a netvrdí uložení", () => {
    const bindingSource = readSource("src/school-profile/profile-save-platform-binding.ts");
    expect(bindingSource).toMatch(
      /runPlatformBindingOnMount[\s\S]*?MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED/,
    );
    expect(MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED).not.toContain("byl uložen");
    expect(MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED).not.toBe(
      MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED,
    );
    expect(MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED).toContain("propojení profilu školy");
  });
});
