import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllApplicationStorage } from "../application-storage-registry";
import {
  APP_CONTEXT_LS_KEY,
  readAppContext,
} from "../data/app-context/app-context";
import {
  IDENTITY_REGISTRY_LS_KEY,
  createEntityId,
  isUuid,
  readIdentityRegistry,
} from "../data/identity/identity-registry";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../data/identity/identity-registry-types";
import { LEGACY_ANNUAL_REPORT_STATE_LS_KEY } from "../data/legacy/legacy-school-year";
import { SCHOOL_PROFILE_LS_KEY } from "./school-profile-constants";
import { ensureSchoolPlatformBinding } from "./ensure-school-platform-binding";

function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    store,
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
    id,
    name: "ZŠ Binding",
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
    phone: "+420111222333",
    dataBox: "abcdefg",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    ...overrides,
  };
}

function persistProfile(id: string, overrides: Record<string, string> = {}) {
  const profile = sampleProfile(id, overrides);
  localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(profile));
  return profile;
}

function seedValidRegistry(schoolId: string) {
  localStorage.setItem(
    IDENTITY_REGISTRY_LS_KEY,
    JSON.stringify({
      schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
      schoolId,
      schoolYears: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
    }),
  );
}

function seedAppContext(activeSchoolId: string | null, activeSchoolYearId: string | null = null) {
  localStorage.setItem(
    APP_CONTEXT_LS_KEY,
    JSON.stringify({
      schemaVersion: 1,
      activeSchoolId,
      activeSchoolYearId,
    }),
  );
}

function setVzYear(label: string) {
  localStorage.setItem(
    LEGACY_ANNUAL_REPORT_STATE_LS_KEY,
    JSON.stringify({ version: 1, report: { schoolYear: label }, selectedSectionId: "s" }),
  );
}

describe("ensureSchoolPlatformBinding (0F-1)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.stubGlobal("sessionStorage", createLocalStorageMock());
  });

  it("A: missing SchoolProfile → empty, no Identity, no school-bound AppContext", async () => {
    const result = await ensureSchoolPlatformBinding();
    expect(result).toEqual({ status: "empty" });
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBeNull();
  });

  it("B: legacy UUID profile, no Registry → ready, schoolId === profile.id", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);

    const result = await ensureSchoolPlatformBinding();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.schoolId).toBe(profileId);
    expect(result.activeSchoolId).toBe(profileId);
    expect(result.activeSchoolYearId).toBeNull();

    const registry = readIdentityRegistry();
    expect(registry.ok).toBe(true);
    if (!registry.ok) return;
    expect(registry.registry?.schoolId).toBe(profileId);
  });

  it("C: legacy non-UUID profile.id → new UUID schoolId; profile fields unchanged", async () => {
    const legacyId = "school-legacy-42";
    const profile = persistProfile(legacyId, { name: "ZŠ Legacy" });
    const profileRawBefore = localStorage.getItem(SCHOOL_PROFILE_LS_KEY);

    const result = await ensureSchoolPlatformBinding();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(isUuid(result.schoolId)).toBe(true);
    expect(result.schoolId).not.toBe(legacyId);
    expect(result.activeSchoolId).toBe(result.schoolId);

    const stored = JSON.parse(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)!);
    expect(stored.id).toBe(legacyId);
    expect(stored.name).toBe("ZŠ Legacy");
    expect(stored.ico).toBe(profile.ico);
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(profileRawBefore);
  });

  it("D: existing valid Registry → schoolId reused", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const registrySchoolId = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
    persistProfile(profileId);
    seedValidRegistry(registrySchoolId);

    const result = await ensureSchoolPlatformBinding();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.schoolId).toBe(registrySchoolId);
    expect(result.activeSchoolId).toBe(registrySchoolId);

    const storedProfile = JSON.parse(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)!);
    expect(storedProfile.id).toBe(profileId);
  });

  it("E: missing AppContext → activeSchoolId = registry.schoolId", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBeNull();

    const result = await ensureSchoolPlatformBinding();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.activeSchoolId).toBe(result.schoolId);

    const context = readAppContext();
    expect(context.ok).toBe(true);
    if (!context.ok) return;
    expect(context.context?.activeSchoolId).toBe(result.schoolId);
  });

  it("F: druhé ensure → stejné schoolId, žádná duplicitní identity", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);

    const first = await ensureSchoolPlatformBinding();
    const registryRaw = localStorage.getItem(IDENTITY_REGISTRY_LS_KEY);
    const second = await ensureSchoolPlatformBinding();

    expect(first.status).toBe("ready");
    expect(second.status).toBe("ready");
    if (first.status !== "ready" || second.status !== "ready") return;
    expect(second.schoolId).toBe(first.schoolId);
    expect(second.activeSchoolId).toBe(first.activeSchoolId);

    const registry = readIdentityRegistry();
    expect(registry.ok).toBe(true);
    if (!registry.ok || !registry.registry) return;
    expect(registry.registry.schoolId).toBe(first.schoolId);
    expect(registry.registry.schoolYears).toHaveLength(0);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(registryRaw);
  });

  it("G: corrupted Identity Registry → error, raw value beze změny", async () => {
    persistProfile("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    const corrupted = "{broken-identity";
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, corrupted);

    const result = await ensureSchoolPlatformBinding();
    expect(result).toEqual({ status: "error", reason: "identity_corrupted" });
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(corrupted);
  });

  it("H: corrupted AppContext → error, raw value beze změny", async () => {
    persistProfile("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    const corrupted = "{broken-context";
    localStorage.setItem(APP_CONTEXT_LS_KEY, corrupted);

    const result = await ensureSchoolPlatformBinding();
    expect(result).toEqual({ status: "error", reason: "app_context_corrupted" });
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBe(corrupted);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
  });

  it("I: corrupted SchoolProfile → error, žádná Identity, žádný silent rewrite", async () => {
    const corrupted = "{not-json";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, corrupted);

    const result = await ensureSchoolPlatformBinding();
    expect(result).toEqual({ status: "error", reason: "profile_corrupted" });
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(corrupted);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBeNull();
  });

  it("J: storage unavailable → fail-safe error, žádná ghost identity", async () => {
    const result = await ensureSchoolPlatformBinding({
      readProfile: () => ({ ok: false, code: "storage_unavailable" }),
    });
    expect(result).toEqual({ status: "error", reason: "storage_unavailable" });
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
  });

  it("K: no VZ year hint → activeSchoolYearId null, žádný current-year default", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);

    const result = await ensureSchoolPlatformBinding();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.activeSchoolYearId).toBeNull();

    const registry = readIdentityRegistry();
    expect(registry.ok).toBe(true);
    if (!registry.ok || !registry.registry) return;
    expect(registry.registry.schoolYears).toEqual([]);
  });

  it("L: valid VZ year hint → stávající 0D SchoolYear metadata behavior", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    setVzYear("2026/2027");

    const result = await ensureSchoolPlatformBinding();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.activeSchoolId).toBe(profileId);
    expect(result.activeSchoolYearId).toBeTruthy();

    const registry = readIdentityRegistry();
    expect(registry.ok).toBe(true);
    if (!registry.ok || !registry.registry) return;
    expect(registry.registry.schoolYears).toHaveLength(1);
    expect(registry.registry.schoolYears[0]?.startYear).toBe(2026);
    expect(registry.registry.schoolYears[0]?.schoolId).toBe(profileId);
    expect(registry.registry.schoolYears[0]?.id).toBe(result.activeSchoolYearId);
  });

  it("M: Full Reset A → fresh profile B → schoolId_B !== schoolId_A", async () => {
    const schoolIdA = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(schoolIdA, { name: "Škola A", ico: "11111111" });
    seedValidRegistry(schoolIdA);
    seedAppContext(schoolIdA);

    const clearResult = clearAllApplicationStorage();
    expect(clearResult.ok).toBe(true);
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBeNull();
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBeNull();

    const schoolIdBCandidate = "cccccccc-dddd-4eee-8fff-000000000000";
    persistProfile(schoolIdBCandidate, { name: "Škola B", ico: "22222222" });

    const result = await ensureSchoolPlatformBinding();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.schoolId).toBe(schoolIdBCandidate);
    expect(result.schoolId).not.toBe(schoolIdA);
    expect(result.activeSchoolId).toBe(schoolIdBCandidate);

    const registry = readIdentityRegistry();
    expect(registry.ok).toBe(true);
    if (!registry.ok || !registry.registry) return;
    expect(registry.registry.schoolId).toBe(schoolIdBCandidate);
    expect(registry.registry.schoolId).not.toBe(schoolIdA);

    const storedProfile = JSON.parse(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)!);
    expect(storedProfile.name).toBe("Škola B");
    expect(storedProfile.ico).toBe("22222222");
  });

  it("corrupted Identity with DI seam does not call bootstrap", async () => {
    persistProfile(createEntityId());
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, "{broken");
    const bootstrap = vi.fn();

    const result = await ensureSchoolPlatformBinding({ bootstrap });
    expect(result).toEqual({ status: "error", reason: "identity_corrupted" });
    expect(bootstrap).not.toHaveBeenCalled();
  });
});
