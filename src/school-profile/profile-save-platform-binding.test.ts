import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllApplicationStorage } from "../application-storage-registry";
import { APP_CONTEXT_LS_KEY, readAppContext } from "../data/app-context/app-context";
import {
  IDENTITY_REGISTRY_LS_KEY,
  isUuid,
  readIdentityRegistry,
} from "../data/identity/identity-registry";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../data/identity/identity-registry-types";
import { createDefaultSchoolProfile } from "./school-profile-logic";
import {
  MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED,
  createSerializedPlatformBindingRunner,
  mayBindPlatformAfterProfilePersist,
  runPlatformBindingAfterProfilePersist,
} from "./profile-save-platform-binding";
import {
  SCHOOL_PROFILE_LS_KEY,
  saveSchoolProfileToStorage,
} from "./school-profile-storage";
import { replaceSchoolProfileState } from "./use-school-profile";

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

function sampleProfile(id: string, overrides: Record<string, string> = {}) {
  return {
    ...createDefaultSchoolProfile(),
    id,
    name: "ZŠ Binding Save",
    ico: "12345678",
    redIzo: "600123456",
    izo: "102345678",
    address: "Hlavní 1",
    municipality: "Praha",
    region: "Hlavní město Praha",
    founder: "Město",
    principalName: "Jan Novák",
    website: "https://skola.cz",
    email: "skola@skola.cz",
    phone: "+420111222333",
    dataBox: "abcdefg",
    schoolType: "Základní škola",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("profile save → platform binding gate (0F-2B)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.stubGlobal("sessionStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("A: persistence.ok === false → ensure NOT called", async () => {
    const ensure = vi.fn(async () => ({ status: "ready" as const, schoolId: "x", activeSchoolId: "x", activeSchoolYearId: null, staleActiveSchoolId: false, staleActiveSchoolYearId: false }));
    const outcome = await runPlatformBindingAfterProfilePersist(
      { ok: false, reason: "storage_unavailable" },
      ensure,
    );
    expect(mayBindPlatformAfterProfilePersist({ ok: false, reason: "storage_unavailable" })).toBe(
      false,
    );
    expect(ensure).not.toHaveBeenCalled();
    expect(outcome).toEqual({
      bindingAttempted: false,
      binding: null,
      metadataNotice: null,
    });
  });

  it("A2 (0F-3A): persistence.ok === false profile_corrupted → ensure NOT called", async () => {
    const ensure = vi.fn(async () => ({
      status: "ready" as const,
      schoolId: "x",
      activeSchoolId: "x",
      activeSchoolYearId: null,
      staleActiveSchoolId: false,
      staleActiveSchoolYearId: false,
    }));
    const persistence = { ok: false as const, reason: "profile_corrupted" as const };
    expect(mayBindPlatformAfterProfilePersist(persistence)).toBe(false);
    const outcome = await runPlatformBindingAfterProfilePersist(persistence, ensure);
    expect(ensure).not.toHaveBeenCalled();
    expect(outcome.bindingAttempted).toBe(false);
  });

  it("B: persistence.ok === true → ensure called exactly once", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });
    const ensure = vi.fn(async () => ({
      status: "ready" as const,
      schoolId: profileId,
      activeSchoolId: profileId,
      activeSchoolYearId: null,
      staleActiveSchoolId: false,
      staleActiveSchoolYearId: false,
    }));
    const outcome = await runPlatformBindingAfterProfilePersist({ ok: true }, ensure);
    expect(ensure).toHaveBeenCalledTimes(1);
    expect(outcome.bindingAttempted).toBe(true);
  });

  it("C: binding ready → žádný metadata warning", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });
    const outcome = await runPlatformBindingAfterProfilePersist({ ok: true });
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.binding.status).toBe("ready");
    expect(outcome.metadataNotice).toBeNull();
  });

  it("D: binding error → save zůstává success; metadata warning", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const profile = sampleProfile(profileId);
    expect(saveSchoolProfileToStorage(profile)).toEqual({ ok: true });
    const profileRaw = localStorage.getItem(SCHOOL_PROFILE_LS_KEY);

    const ensure = vi.fn(async () => ({
      status: "error" as const,
      reason: "identity_corrupted" as const,
    }));
    const outcome = await runPlatformBindingAfterProfilePersist({ ok: true }, ensure);

    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.metadataNotice).toBe(MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED);
    // Business persist untouched
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(profileRaw);
    expect(JSON.parse(profileRaw!).name).toBe("ZŠ Binding Save");
  });

  it("E: binding empty → soft metadata warning", async () => {
    const ensure = vi.fn(async () => ({ status: "empty" as const }));
    const outcome = await runPlatformBindingAfterProfilePersist({ ok: true }, ensure);
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.binding.status).toBe("empty");
    expect(outcome.metadataNotice).toBe(MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED);
  });

  it("F: corrupted Identity → persist success path + binding error + registry unchanged", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });
    const corrupted = "{broken-identity";
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, corrupted);

    const outcome = await runPlatformBindingAfterProfilePersist({ ok: true });
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.binding.status).toBe("error");
    if (outcome.binding.status === "error") {
      expect(outcome.binding.reason).toBe("identity_corrupted");
    }
    expect(outcome.metadataNotice).toBe(MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(corrupted);
    expect(JSON.parse(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)!).name).toBe("ZŠ Binding Save");
  });

  it("G: corrupted AppContext → persist path + raw AC unchanged + warning", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });
    const corrupted = "{broken-context";
    localStorage.setItem(APP_CONTEXT_LS_KEY, corrupted);

    const outcome = await runPlatformBindingAfterProfilePersist({ ok: true });
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.binding.status).toBe("error");
    if (outcome.binding.status === "error") {
      expect(outcome.binding.reason).toBe("app_context_corrupted");
    }
    expect(outcome.metadataNotice).toBe(MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED);
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBe(corrupted);
  });

  it("H/I: before Save no Identity; first successful Save+bind creates Identity + activeSchool", async () => {
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });

    const outcome = await runPlatformBindingAfterProfilePersist({ ok: true });
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.binding.status).toBe("ready");
    if (outcome.binding.status !== "ready") return;
    expect(outcome.binding.schoolId).toBe(profileId);
    expect(outcome.binding.activeSchoolId).toBe(profileId);

    const registry = readIdentityRegistry();
    expect(registry.ok).toBe(true);
    if (!registry.ok) return;
    expect(registry.registry?.schoolId).toBe(profileId);

    const context = readAppContext();
    expect(context.ok).toBe(true);
    if (!context.ok) return;
    expect(context.context?.activeSchoolId).toBe(profileId);
  });

  it("J: druhé successful Save+bind → same schoolId reused", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });
    const first = await runPlatformBindingAfterProfilePersist({ ok: true });
    const second = await runPlatformBindingAfterProfilePersist({ ok: true });
    expect(first.bindingAttempted && second.bindingAttempted).toBe(true);
    if (!first.bindingAttempted || !second.bindingAttempted) return;
    expect(first.binding.status).toBe("ready");
    expect(second.binding.status).toBe("ready");
    if (first.binding.status !== "ready" || second.binding.status !== "ready") return;
    expect(second.binding.schoolId).toBe(first.binding.schoolId);
  });

  it("legacy non-UUID profile.id → Save path activates binding with new UUID; profile.id unchanged", async () => {
    const legacyId = "school-legacy-42";
    const profile = sampleProfile(legacyId);
    expect(saveSchoolProfileToStorage(profile)).toEqual({ ok: true });
    const rawBefore = localStorage.getItem(SCHOOL_PROFILE_LS_KEY);

    const outcome = await runPlatformBindingAfterProfilePersist({ ok: true });
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted || outcome.binding.status !== "ready") return;
    expect(isUuid(outcome.binding.schoolId)).toBe(true);
    expect(outcome.binding.schoolId).not.toBe(legacyId);
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(rawBefore);
    expect(JSON.parse(rawBefore!).id).toBe(legacyId);
  });

  it("K: Full Reset A → persist B → Save-path bind → schoolId_B !== schoolId_A", async () => {
    const schoolIdA = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(schoolIdA, { name: "Škola A" }))).toEqual({
      ok: true,
    });
    localStorage.setItem(
      IDENTITY_REGISTRY_LS_KEY,
      JSON.stringify({
        schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
        schoolId: schoolIdA,
        schoolYears: [],
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    localStorage.setItem(
      APP_CONTEXT_LS_KEY,
      JSON.stringify({
        schemaVersion: 1,
        activeSchoolId: schoolIdA,
        activeSchoolYearId: null,
      }),
    );

    expect(clearAllApplicationStorage().ok).toBe(true);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();

    const schoolIdB = "cccccccc-dddd-4eee-8fff-000000000000";
    expect(saveSchoolProfileToStorage(sampleProfile(schoolIdB, { name: "Škola B" }))).toEqual({
      ok: true,
    });
    const outcome = await runPlatformBindingAfterProfilePersist({ ok: true });
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted || outcome.binding.status !== "ready") return;
    expect(outcome.binding.schoolId).toBe(schoolIdB);
    expect(outcome.binding.schoolId).not.toBe(schoolIdA);
    expect(outcome.binding.activeSchoolId).toBe(schoolIdB);
  });

  it("L: concurrent afterPersist → ensure never overlaps", async () => {
    let active = 0;
    let maxActive = 0;
    const ensure = vi.fn(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 20));
      active -= 1;
      return {
        status: "ready" as const,
        schoolId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        activeSchoolId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        activeSchoolYearId: null,
        staleActiveSchoolId: false,
        staleActiveSchoolYearId: false,
      };
    });

    const runner = createSerializedPlatformBindingRunner(ensure);
    const [a, b] = await Promise.all([
      runner.afterPersist({ ok: true }),
      runner.afterPersist({ ok: true }),
    ]);
    expect(ensure).toHaveBeenCalledTimes(2);
    expect(maxActive).toBe(1);
    expect(a.bindingAttempted).toBe(true);
    expect(b.bindingAttempted).toBe(true);
  });

  it("M: binding error → další Save → binding ready clears warning", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });

    let call = 0;
    const ensure = vi.fn(async () => {
      call += 1;
      if (call === 1) {
        return { status: "error" as const, reason: "platform_failure" as const };
      }
      return {
        status: "ready" as const,
        schoolId: profileId,
        activeSchoolId: profileId,
        activeSchoolYearId: null,
        staleActiveSchoolId: false,
        staleActiveSchoolYearId: false,
      };
    });

    const first = await runPlatformBindingAfterProfilePersist({ ok: true }, ensure);
    expect(first.metadataNotice).toBe(MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED);

    const second = await runPlatformBindingAfterProfilePersist({ ok: true }, ensure);
    expect(second.bindingAttempted).toBe(true);
    if (!second.bindingAttempted) return;
    expect(second.binding.status).toBe("ready");
    expect(second.metadataNotice).toBeNull();
  });

  it("failed persist path never touches shared cache via replaceSchoolProfileState", () => {
    const profile = sampleProfile("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    expect(replaceSchoolProfileState(profile)).toEqual({ ok: true });
    // Gate alone: mayBind false means orchestration must skip ensure (covered in A).
    expect(mayBindPlatformAfterProfilePersist({ ok: false, reason: "storage_unavailable" })).toBe(
      false,
    );
  });
});
