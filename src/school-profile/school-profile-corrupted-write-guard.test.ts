import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllApplicationStorage } from "../application-storage-registry";
import { APP_CONTEXT_LS_KEY, readAppContext } from "../data/app-context/app-context";
import {
  IDENTITY_REGISTRY_LS_KEY,
  readIdentityRegistry,
} from "../data/identity/identity-registry";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../data/identity/identity-registry-types";
import {
  mayBindPlatformAfterProfilePersist,
  runPlatformBindingAfterProfilePersist,
} from "./profile-save-platform-binding";
import {
  applySchoolProfileEdits,
  createDefaultSchoolProfile,
  patchSchoolProfile,
  resetSchoolProfileFields,
} from "./school-profile-logic";
import {
  identitySensitiveLockMode,
  readIdentityRegistryPresence,
} from "./school-profile-identity-policy";
import {
  loadSchoolProfileFromStorage,
  migrateLegacySchoolProfileIfNeeded,
  persistSchoolProfileToStorage,
  saveSchoolProfileToStorage,
  SCHOOL_PROFILE_LS_KEY,
} from "./school-profile-storage";
import { getSchoolProfileSnapshot, replaceSchoolProfileState } from "./use-school-profile";

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
    name: "ZŠ Guard",
    ico: "12345678",
    redIzo: "600123456",
    izo: "102345678",
    address: "Hlavní 1",
    municipality: "Praha",
    region: "Hlavní město Praha",
    founder: "Město",
    principalName: "Jan Novák",
    website: "https://guard.cz",
    email: "info@guard.cz",
    phone: "123",
    dataBox: "abcdxyz",
    schoolType: "Základní škola",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    ...overrides,
  };
}

const CORRUPTED_RAW = "{not-json-school-profile";

function seedCorruptedProfile(): string {
  localStorage.setItem(SCHOOL_PROFILE_LS_KEY, CORRUPTED_RAW);
  // Align shared cache with forgiving loader (production module-init asymmetry).
  replaceSchoolProfileState(loadSchoolProfileFromStorage(), false);
  return CORRUPTED_RAW;
}

function seedIdentityA(schoolId: string): string {
  const raw = JSON.stringify({
    schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
    schoolId,
    schoolYears: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
  localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, raw);
  return raw;
}

function seedAppContextA(schoolId: string): string {
  const raw = JSON.stringify({
    schemaVersion: 1,
    activeSchoolId: schoolId,
    activeSchoolYearId: null,
  });
  localStorage.setItem(APP_CONTEXT_LS_KEY, raw);
  return raw;
}

/** Mirrors useSchoolProfile.updateProfile / VZ-style patch writer. */
function updateProfileLikeHook(patch: Partial<ReturnType<typeof sampleProfile>>) {
  const patched = patchSchoolProfile(getSchoolProfileSnapshot(), patch);
  const status = readIdentityRegistryPresence();
  const { profile: next, identityChangeBlocked, identityBlockReason } = applySchoolProfileEdits(
    getSchoolProfileSnapshot(),
    patched,
    { identityLockMode: identitySensitiveLockMode(status) },
  );
  const persistence = replaceSchoolProfileState(next);
  return { identityChangeBlocked, identityBlockReason, persistence };
}

describe("corrupted SchoolProfile write guard (0F-3A)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.stubGlobal("sessionStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("A: missing persisted profile → first Save allowed", () => {
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBeNull();
    const profile = sampleProfile("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    expect(persistSchoolProfileToStorage(profile)).toEqual({ ok: true });
    expect(replaceSchoolProfileState(profile)).toEqual({ ok: true });
    expect(JSON.parse(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)!).name).toBe("ZŠ Guard");
  });

  it("B: valid persisted profile → Save allowed", () => {
    const profile = sampleProfile("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    expect(saveSchoolProfileToStorage(profile)).toEqual({ ok: true });
    const next = { ...profile, name: "ZŠ Updated Guard" };
    expect(replaceSchoolProfileState(next)).toEqual({ ok: true });
    expect(loadSchoolProfileFromStorage().name).toBe("ZŠ Updated Guard");
  });

  it("C: corrupted persisted profile → Save rejected → raw bytes unchanged", () => {
    const raw = seedCorruptedProfile();
    const attempt = sampleProfile("bbbbbbbb-cccc-4ddd-8eee-ffffffffffff", {
      name: "Škola B overwrite",
    });
    expect(replaceSchoolProfileState(attempt)).toEqual({
      ok: false,
      reason: "profile_corrupted",
    });
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(raw);
  });

  it("D: corrupted profile → shared cache unchanged → no emit", () => {
    seedCorruptedProfile();
    const before = getSchoolProfileSnapshot();
    expect(
      replaceSchoolProfileState({ ...before, name: "Emit Probe" }),
    ).toEqual({ ok: false, reason: "profile_corrupted" });
    // emitSchoolProfileChange only runs after successful persist; snapshot identity stays.
    expect(getSchoolProfileSnapshot()).toBe(before);
    expect(getSchoolProfileSnapshot().name).not.toBe("Emit Probe");
  });

  it("E: corrupted profile → reset rejected", () => {
    const raw = seedCorruptedProfile();
    const cleared = resetSchoolProfileFields(getSchoolProfileSnapshot());
    expect(replaceSchoolProfileState(cleared)).toEqual({
      ok: false,
      reason: "profile_corrupted",
    });
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(raw);
  });

  it("F: corrupted profile → updateProfile (VZ-style) rejected", () => {
    const raw = seedCorruptedProfile();
    const cacheBefore = getSchoolProfileSnapshot();
    const result = updateProfileLikeHook({ website: "https://vz-overwrite.cz" });
    expect(result.persistence).toEqual({ ok: false, reason: "profile_corrupted" });
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(raw);
    expect(getSchoolProfileSnapshot()).toBe(cacheBefore);
    expect(getSchoolProfileSnapshot().website).not.toBe("https://vz-overwrite.cz");
  });

  it("G: corrupted profile + valid Identity A → Identity unchanged + no platform binding", async () => {
    const schoolIdA = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const rawProfile = seedCorruptedProfile();
    const rawIdentity = seedIdentityA(schoolIdA);

    const ensure = vi.fn(async () => ({
      status: "ready" as const,
      schoolId: schoolIdA,
      activeSchoolId: schoolIdA,
      activeSchoolYearId: null,
      staleActiveSchoolId: false,
      staleActiveSchoolYearId: false,
    }));

    const persistence = replaceSchoolProfileState(
      sampleProfile("bbbbbbbb-cccc-4ddd-8eee-ffffffffffff", { name: "Škola B" }),
    );
    expect(persistence).toEqual({ ok: false, reason: "profile_corrupted" });
    expect(mayBindPlatformAfterProfilePersist(persistence)).toBe(false);

    const outcome = await runPlatformBindingAfterProfilePersist(persistence, ensure);
    expect(outcome.bindingAttempted).toBe(false);
    expect(ensure).not.toHaveBeenCalled();

    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(rawProfile);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(rawIdentity);
    expect(readIdentityRegistry()).toEqual({
      ok: true,
      registry: expect.objectContaining({ schoolId: schoolIdA }),
    });
  });

  it("H: corrupted profile + valid AppContext A → AppContext unchanged", () => {
    const schoolIdA = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const rawProfile = seedCorruptedProfile();
    const rawContext = seedAppContextA(schoolIdA);

    expect(
      replaceSchoolProfileState(
        sampleProfile("bbbbbbbb-cccc-4ddd-8eee-ffffffffffff", { name: "Škola B" }),
      ),
    ).toEqual({ ok: false, reason: "profile_corrupted" });

    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(rawProfile);
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBe(rawContext);
    expect(readAppContext()).toEqual({
      ok: true,
      context: expect.objectContaining({ activeSchoolId: schoolIdA }),
    });
  });

  it("I: corrupted profile + corrupted Identity → no silent repair", () => {
    const rawProfile = seedCorruptedProfile();
    const rawIdentity = "{broken-identity";
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, rawIdentity);

    expect(
      replaceSchoolProfileState(sampleProfile("bbbbbbbb-cccc-4ddd-8eee-ffffffffffff")),
    ).toEqual({ ok: false, reason: "profile_corrupted" });

    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(rawProfile);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(rawIdentity);
    expect(readIdentityRegistry().ok).toBe(false);
  });

  it("J: corrupted profile + corrupted AppContext → no silent repair", () => {
    const rawProfile = seedCorruptedProfile();
    const rawContext = "{broken-context";
    localStorage.setItem(APP_CONTEXT_LS_KEY, rawContext);

    expect(
      replaceSchoolProfileState(sampleProfile("bbbbbbbb-cccc-4ddd-8eee-ffffffffffff")),
    ).toEqual({ ok: false, reason: "profile_corrupted" });

    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(rawProfile);
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBe(rawContext);
    expect(readAppContext().ok).toBe(false);
  });

  it("K: corrupted profile cannot accidentally return persistence.ok true", () => {
    seedCorruptedProfile();
    const viaOrchestrator = persistSchoolProfileToStorage(
      sampleProfile("bbbbbbbb-cccc-4ddd-8eee-ffffffffffff"),
    );
    const viaReplace = replaceSchoolProfileState(
      sampleProfile("cccccccc-dddd-4eee-8fff-000000000000"),
    );
    expect(viaOrchestrator).toEqual({ ok: false, reason: "profile_corrupted" });
    expect(viaReplace).toEqual({ ok: false, reason: "profile_corrupted" });
    expect(mayBindPlatformAfterProfilePersist(viaReplace)).toBe(false);
  });

  it("L: missing profile after Full Reset → first Save B + binding B allowed", async () => {
    const schoolIdA = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(schoolIdA, { name: "Škola A" }))).toEqual({
      ok: true,
    });
    seedIdentityA(schoolIdA);
    seedAppContextA(schoolIdA);

    clearAllApplicationStorage();
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBeNull();
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBeNull();

    const schoolIdB = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
    const profileB = sampleProfile(schoolIdB, { name: "Škola B" });
    const persistence = replaceSchoolProfileState(profileB);
    expect(persistence).toEqual({ ok: true });
    expect(mayBindPlatformAfterProfilePersist(persistence)).toBe(true);

    const outcome = await runPlatformBindingAfterProfilePersist(persistence);
    expect(outcome.bindingAttempted).toBe(true);
    expect(outcome.binding?.status).toBe("ready");
    if (outcome.binding?.status === "ready") {
      expect(outcome.binding.schoolId).toBe(schoolIdB);
      expect(outcome.binding.activeSchoolId).toBe(schoolIdB);
    }
  });

  it("M: existing valid profile happy path does not regress", async () => {
    const schoolId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const persistence = replaceSchoolProfileState(sampleProfile(schoolId));
    expect(persistence).toEqual({ ok: true });
    expect(getSchoolProfileSnapshot().name).toBe("ZŠ Guard");

    const again = replaceSchoolProfileState({
      ...getSchoolProfileSnapshot(),
      phone: "999",
    });
    expect(again).toEqual({ ok: true });
    expect(loadSchoolProfileFromStorage().phone).toBe("999");

    const outcome = await runPlatformBindingAfterProfilePersist(again);
    expect(outcome.bindingAttempted).toBe(true);
    expect(outcome.binding?.status).toBe("ready");
  });

  it("migrateLegacy: corrupted persisted profile is not overwritten", () => {
    const raw = seedCorruptedProfile();
    const legacy = sampleProfile("dddddddd-eeee-4fff-8000-111111111111");
    expect(migrateLegacySchoolProfileIfNeeded(legacy)).toBeNull();
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(raw);
  });

  it("migrateLegacy: missing profile still migrates valid legacy", () => {
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBeNull();
    const legacy = sampleProfile("dddddddd-eeee-4fff-8000-111111111111");
    expect(migrateLegacySchoolProfileIfNeeded(legacy)?.id).toBe(legacy.id);
    expect(loadSchoolProfileFromStorage().id).toBe(legacy.id);
  });

  it("low-level saveSchoolProfileToStorage remains unguarded for future recovery API", () => {
    seedCorruptedProfile();
    expect(
      saveSchoolProfileToStorage(sampleProfile("eeeeeeee-ffff-4aaa-8bbb-222222222222")),
    ).toEqual({ ok: true });
    expect(JSON.parse(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)!).name).toBe("ZŠ Guard");
  });
});
