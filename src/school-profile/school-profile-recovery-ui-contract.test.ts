import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_CONTEXT_LS_KEY, readAppContext } from "../data/app-context/app-context";
import {
  IDENTITY_REGISTRY_LS_KEY,
  readIdentityRegistry,
} from "../data/identity/identity-registry";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../data/identity/identity-registry-types";
import {
  MSG_SCHOOL_PROFILE_CORRUPTED_BACKUP_HINT,
  MSG_SCHOOL_PROFILE_CORRUPTED_BODY,
  MSG_SCHOOL_PROFILE_CORRUPTED_CTA,
  MSG_SCHOOL_PROFILE_CORRUPTED_OTHER_DATA,
  MSG_SCHOOL_PROFILE_CORRUPTED_TITLE,
  MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED,
  MSG_SCHOOL_PROFILE_STORAGE_UNAVAILABLE_BODY,
  MSG_SCHOOL_PROFILE_STORAGE_UNAVAILABLE_TITLE,
  SCHOOL_PROFILE_DATA_MANAGEMENT_HASH,
} from "./school-profile-identity-policy";
import { createDefaultSchoolProfile } from "./school-profile-logic";
import { readSchoolProfilePersistenceStatus } from "./school-profile-persistence-status";
import { SCHOOL_PROFILE_LS_KEY, saveSchoolProfileToStorage } from "./school-profile-storage";
import { getSchoolProfileSnapshot, replaceSchoolProfileState } from "./use-school-profile";
import {
  mayBindPlatformAfterProfilePersist,
  runPlatformBindingAfterProfilePersist,
} from "./profile-save-platform-binding";

const root = path.resolve(__dirname, "../..");

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key]! : null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      for (const key of Object.keys(store)) delete store[key];
    },
    get length() {
      return Object.keys(store).length;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
  };
}

function sampleProfile(id: string) {
  return {
    ...createDefaultSchoolProfile(),
    id,
    name: "ZŠ Recovery",
    ico: "12345678",
    redIzo: "600123456",
    izo: "102345678",
    address: "Hlavní 1",
    municipality: "Praha",
    region: "Hlavní město Praha",
    founder: "Město",
    principalName: "Jan Novák",
    website: "https://recovery.cz",
    email: "info@recovery.cz",
    phone: "123",
    dataBox: "abcdxyz",
    schoolType: "Základní škola",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  };
}

describe("SchoolProfile recovery UI contract (0F-3B)", () => {
  const pageSource = readSource("src/ProfilSkolyPage.tsx");
  const dashCardSource = readSource("src/dashboard/DashboardBackupExportCard.tsx");

  it("A: missing profile → normal form, no recovery UI wiring for missing", () => {
    expect(pageSource).toContain("readSchoolProfilePersistenceStatus");
    expect(pageSource).toContain('persistenceStatus === "corrupted"');
    expect(pageSource).toContain("!blocksNormalEdit");
    expect(pageSource).toContain("Uložit profil školy");
    expect(pageSource).not.toContain("Přepsat poškozený profil");
    expect(pageSource).not.toContain("force");
  });

  it("B/C: corrupted recovery UI replaces normal Save/Reset form", () => {
    expect(pageSource).toContain('data-testid="school-profile-corrupted-recovery"');
    expect(pageSource).toContain("MSG_SCHOOL_PROFILE_CORRUPTED_TITLE");
    expect(pageSource).toMatch(
      /isCorruptedRecovery \? \([\s\S]*?school-profile-corrupted-recovery[\s\S]*?\) : null/,
    );
    expect(pageSource).toMatch(
      /\{!blocksNormalEdit \? \([\s\S]*?Uložit profil školy[\s\S]*?Vymazat údaje profilu/,
    );
  });

  it("D: default draft is not presented as normal profile in recovery", () => {
    expect(pageSource).toContain("blocksNormalEdit");
    expect(pageSource).toMatch(
      /isCorruptedRecovery[\s\S]*?blocksNormalEdit[\s\S]*?\{!blocksNormalEdit \?/,
    );
  });

  it("E: recovery copy is truthful and non-technical", () => {
    expect(MSG_SCHOOL_PROFILE_CORRUPTED_TITLE).toBe("Profil školy se nepodařilo načíst");
    expect(MSG_SCHOOL_PROFILE_CORRUPTED_BODY).toContain("poškozená");
    expect(MSG_SCHOOL_PROFILE_CORRUPTED_BODY).toContain("nechtěnému přepsání");
    expect(MSG_SCHOOL_PROFILE_CORRUPTED_OTHER_DATA).toContain("kalkulaček");
    expect(MSG_SCHOOL_PROFILE_CORRUPTED_BACKUP_HINT).toContain("nemusí být do zálohy");
    expect(MSG_SCHOOL_PROFILE_CORRUPTED_BODY).not.toMatch(/JSON|localStorage|schoolId|Identity|AppContext/i);
    expect(MSG_SCHOOL_PROFILE_CORRUPTED_BACKUP_HINT).not.toMatch(/JSON|localStorage|schoolId/i);
  });

  it("F: recovery CTA targets Dashboard data management section", () => {
    expect(pageSource).toContain("SCHOOL_PROFILE_DATA_MANAGEMENT_HASH");
    expect(pageSource).toContain("school-profile-recovery-cta");
    expect(MSG_SCHOOL_PROFILE_CORRUPTED_CTA).toBe("Přejít ke správě dat");
    expect(SCHOOL_PROFILE_DATA_MANAGEMENT_HASH).toBe("sprava-dat-prohlizece");
    expect(dashCardSource).toContain('id="sprava-dat-prohlizece"');
    expect(pageSource).toMatch(/#\$\{SCHOOL_PROFILE_DATA_MANAGEMENT_HASH\}|#sprava-dat-prohlizece/);
    expect(pageSource).not.toContain('data-testid="full-reset-open"');
  });

  it("G: no force overwrite / recovery save action", () => {
    expect(pageSource).not.toContain("Přepsat poškozený profil");
    expect(pageSource).not.toContain("Pokračovat přesto");
    expect(pageSource).not.toContain("forceOverwrite");
    expect(pageSource).not.toContain("ignoreCorruption");
    expect(pageSource).not.toContain("saveSchoolProfileToStorage(");
  });

  it("K: corrupted recovery suppresses generic mount platform warning presentation", () => {
    expect(pageSource).toContain("blocksNormalEdit");
    expect(pageSource).toMatch(
      /status === "corrupted" \|\| status === "storage_unavailable"[\s\S]*?setPlatformBindingNotice\(null\)/,
    );
    expect(pageSource).toMatch(
      /\{!blocksNormalEdit \? \([\s\S]*?platformBindingNotice/,
    );
    expect(MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED).toContain("propojení");
  });

  it("L: valid profile path still renders platformBindingNotice (metadata-only errors)", () => {
    expect(pageSource).toContain("{platformBindingNotice ? (");
    expect(pageSource).toContain("role=\"status\"");
    expect(pageSource).toContain("afterPersist(result.persistence)");
    expect(pageSource).toContain("onMount()");
  });

  it("M: storage unavailable is distinct from corrupted and does not promise Full Reset", () => {
    expect(pageSource).toContain('data-testid="school-profile-storage-unavailable"');
    expect(MSG_SCHOOL_PROFILE_STORAGE_UNAVAILABLE_TITLE).toContain("nelze načíst");
    expect(MSG_SCHOOL_PROFILE_STORAGE_UNAVAILABLE_BODY).toContain("nelze bezpečně načíst ani uložit");
    expect(MSG_SCHOOL_PROFILE_STORAGE_UNAVAILABLE_BODY).not.toContain("Full Reset");
    expect(MSG_SCHOOL_PROFILE_STORAGE_UNAVAILABLE_BODY).not.toContain("odstranit");
    expect(pageSource).toContain("school-profile-storage-reload");
    expect(pageSource).toContain("Znovu načíst stránku");
  });

  it("recovery panel uses alert semantics", () => {
    expect(pageSource).toMatch(
      /school-profile-corrupted-recovery[\s\S]*?role="alert"|role="alert"[\s\S]*?school-profile-corrupted-recovery/,
    );
  });
});

describe("SchoolProfile persistence status helper (0F-3B)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("A: missing → missing", () => {
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBeNull();
    expect(readSchoolProfilePersistenceStatus()).toBe("missing");
  });

  it("B: valid → valid", () => {
    expect(saveSchoolProfileToStorage(sampleProfile("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"))).toEqual(
      { ok: true },
    );
    expect(readSchoolProfilePersistenceStatus()).toBe("valid");
  });

  it("C: corrupted → corrupted", () => {
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, "{broken-profile");
    expect(readSchoolProfilePersistenceStatus()).toBe("corrupted");
  });

  it("M: storage unavailable → storage_unavailable", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(readSchoolProfilePersistenceStatus()).toBe("storage_unavailable");
  });
});

describe("SchoolProfile recovery write-race contract (0F-3B)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.stubGlobal("sessionStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("H/I/J: valid start → external corruption → Save rejected → bytes/Identity/AppContext unchanged", async () => {
    const schoolIdA = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(replaceSchoolProfileState(sampleProfile(schoolIdA))).toEqual({ ok: true });
    expect(readSchoolProfilePersistenceStatus()).toBe("valid");

    const identityRaw = JSON.stringify({
      schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
      schoolId: schoolIdA,
      schoolYears: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, identityRaw);
    const contextRaw = JSON.stringify({
      schemaVersion: 1,
      activeSchoolId: schoolIdA,
      activeSchoolYearId: null,
    });
    localStorage.setItem(APP_CONTEXT_LS_KEY, contextRaw);

    const corrupted = "{external-tab-corrupted-profile";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, corrupted);
    expect(readSchoolProfilePersistenceStatus()).toBe("corrupted");

    const cacheBefore = getSchoolProfileSnapshot();
    const persistence = replaceSchoolProfileState({
      ...cacheBefore,
      name: "Stale draft overwrite",
    });
    expect(persistence).toEqual({ ok: false, reason: "profile_corrupted" });
    expect(mayBindPlatformAfterProfilePersist(persistence)).toBe(false);

    const ensure = vi.fn(async () => ({
      status: "ready" as const,
      schoolId: schoolIdA,
      activeSchoolId: schoolIdA,
      activeSchoolYearId: null,
      staleActiveSchoolId: false,
      staleActiveSchoolYearId: false,
    }));
    const outcome = await runPlatformBindingAfterProfilePersist(persistence, ensure);
    expect(outcome.bindingAttempted).toBe(false);
    expect(ensure).not.toHaveBeenCalled();

    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(corrupted);
    expect(getSchoolProfileSnapshot()).toBe(cacheBefore);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(identityRaw);
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBe(contextRaw);
    expect(readIdentityRegistry()).toEqual({
      ok: true,
      registry: expect.objectContaining({ schoolId: schoolIdA }),
    });
    expect(readAppContext()).toEqual({
      ok: true,
      context: expect.objectContaining({ activeSchoolId: schoolIdA }),
    });
  });
});
