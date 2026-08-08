import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllApplicationStorage } from "../application-storage-registry";
import {
  APP_CONTEXT_LS_KEY,
  readAppContext,
} from "../data/app-context/app-context";
import {
  IDENTITY_REGISTRY_LS_KEY,
  createEntityId,
  getOrCreateSchoolYearId,
  readIdentityRegistry,
} from "../data/identity/identity-registry";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../data/identity/identity-registry-types";
import { LEGACY_ANNUAL_REPORT_STATE_LS_KEY } from "../data/legacy/legacy-school-year";
import { ensureSchoolPlatformBinding } from "../school-profile/ensure-school-platform-binding";
import { SCHOOL_PROFILE_LS_KEY } from "../school-profile/school-profile-constants";
import { ensureVzSchoolYearPlatformBinding } from "./ensure-vz-school-year-platform-binding";
import { createDefaultAnnualReport } from "./vyrocni-zprava-logic";
import { saveVyrocniZpravaStorage } from "./vyrocni-zprava-storage";

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
    name: "ZŠ VZ Year Binding",
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

function seedValidRegistry(schoolId: string, schoolYears: Array<{ id: string; schoolId: string; startYear: number }> = []) {
  localStorage.setItem(
    IDENTITY_REGISTRY_LS_KEY,
    JSON.stringify({
      schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
      schoolId,
      schoolYears,
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

function persistVzSchoolYear(label: string) {
  const report = createDefaultAnnualReport(label);
  expect(
    saveVyrocniZpravaStorage({
      version: 1,
      report,
      selectedSectionId: report.sections[0]?.id ?? "01",
    }),
  ).toEqual({ ok: true });
  return localStorage.getItem(LEGACY_ANNUAL_REPORT_STATE_LS_KEY)!;
}

function readActiveSchoolYearId(): string | null {
  const context = readAppContext();
  expect(context.ok).toBe(true);
  if (!context.ok) return null;
  return context.context?.activeSchoolYearId ?? null;
}

function readSchoolYears() {
  const registry = readIdentityRegistry();
  expect(registry.ok).toBe(true);
  if (!registry.ok || !registry.registry) return [];
  return registry.registry.schoolYears;
}

describe("ensureVzSchoolYearPlatformBinding (0G-1)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.stubGlobal("sessionStorage", createLocalStorageMock());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("A: valid profile + valid persisted VZ year + no year identity → stable SchoolYear metadata", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    persistVzSchoolYear("2026/2027");

    const result = await ensureVzSchoolYearPlatformBinding();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.schoolId).toBe(profileId);
    expect(result.startYear).toBe(2026);
    expect(result.schoolYearId).toBeTruthy();

    const years = readSchoolYears();
    expect(years).toHaveLength(1);
    expect(years[0]?.id).toBe(result.schoolYearId);
    expect(years[0]?.startYear).toBe(2026);
    expect(years[0]?.schoolId).toBe(profileId);
    expect(readActiveSchoolYearId()).toBe(result.schoolYearId);
  });

  it("B: second sync same year → same yearId, no duplicate registry entry", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    persistVzSchoolYear("2026/2027");

    const first = await ensureVzSchoolYearPlatformBinding();
    const registryRaw = localStorage.getItem(IDENTITY_REGISTRY_LS_KEY);
    const second = await ensureVzSchoolYearPlatformBinding();

    expect(first.status).toBe("ready");
    expect(second.status).toBe("ready");
    if (first.status !== "ready" || second.status !== "ready") return;
    expect(second.schoolYearId).toBe(first.schoolYearId);
    expect(second.schoolId).toBe(first.schoolId);
    expect(second.startYear).toBe(2026);
    expect(readSchoolYears()).toHaveLength(1);
    expect(readActiveSchoolYearId()).toBe(first.schoolYearId);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(registryRaw);
  });

  it("C: year A → B → B active, A preserved in Identity Registry", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    persistVzSchoolYear("2025/2026");

    const first = await ensureVzSchoolYearPlatformBinding();
    expect(first.status).toBe("ready");
    if (first.status !== "ready") return;
    const yearA = first.schoolYearId;

    persistVzSchoolYear("2026/2027");
    const second = await ensureVzSchoolYearPlatformBinding();
    expect(second.status).toBe("ready");
    if (second.status !== "ready") return;

    expect(second.startYear).toBe(2026);
    expect(second.schoolYearId).not.toBe(yearA);
    expect(readActiveSchoolYearId()).toBe(second.schoolYearId);

    const years = readSchoolYears();
    expect(years).toHaveLength(2);
    expect(years.find((y) => y.id === yearA)?.startYear).toBe(2025);
    expect(years.find((y) => y.id === second.schoolYearId)?.startYear).toBe(2026);
    expect(years.find((y) => y.id === yearA)?.id).toBe(yearA);
  });

  it("D: empty year → no create, active pointer unchanged", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    persistVzSchoolYear("2025/2026");
    const bound = await ensureVzSchoolYearPlatformBinding();
    expect(bound.status).toBe("ready");
    if (bound.status !== "ready") return;
    const yearA = bound.schoolYearId;
    const registryRaw = localStorage.getItem(IDENTITY_REGISTRY_LS_KEY);

    persistVzSchoolYear("");
    const result = await ensureVzSchoolYearPlatformBinding();
    expect(result).toEqual({ status: "noop", reason: "no_valid_year" });
    expect(readActiveSchoolYearId()).toBe(yearA);
    expect(readSchoolYears()).toHaveLength(1);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(registryRaw);
  });

  it("E: invalid year → no create, no current-date fallback, active pointer unchanged", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    persistVzSchoolYear("2025/2026");
    const bound = await ensureVzSchoolYearPlatformBinding();
    expect(bound.status).toBe("ready");
    if (bound.status !== "ready") return;
    const yearA = bound.schoolYearId;

    persistVzSchoolYear("not-a-year");
    const result = await ensureVzSchoolYearPlatformBinding();
    expect(result).toEqual({ status: "noop", reason: "no_valid_year" });
    expect(readActiveSchoolYearId()).toBe(yearA);

    const years = readSchoolYears();
    expect(years).toHaveLength(1);
    expect(years[0]?.startYear).toBe(2025);
    // Fake timers are in 2026 — must not invent 2026/2027
    expect(years.every((y) => y.startYear === 2025)).toBe(true);
  });

  it("F: missing Profile → no SchoolYear", async () => {
    persistVzSchoolYear("2026/2027");

    const result = await ensureVzSchoolYearPlatformBinding();
    expect(result).toEqual({ status: "empty" });
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBeNull();
  });

  it("G: corrupted Profile → no SchoolYear", async () => {
    const corrupted = "{not-json-profile";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, corrupted);
    persistVzSchoolYear("2026/2027");

    const result = await ensureVzSchoolYearPlatformBinding();
    expect(result).toEqual({ status: "error", reason: "profile_corrupted" });
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(corrupted);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
  });

  it("H: corrupted Identity → no repair", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    persistVzSchoolYear("2026/2027");
    const corrupted = "{broken-identity";
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, corrupted);

    const result = await ensureVzSchoolYearPlatformBinding();
    expect(result).toEqual({ status: "error", reason: "identity_corrupted" });
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(corrupted);
  });

  it("I: corrupted AppContext → no repair", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    persistVzSchoolYear("2026/2027");
    const corrupted = "{broken-context";
    localStorage.setItem(APP_CONTEXT_LS_KEY, corrupted);

    const result = await ensureVzSchoolYearPlatformBinding();
    expect(result).toEqual({ status: "error", reason: "app_context_corrupted" });
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBe(corrupted);
  });

  it("J: storage unavailable → fail-safe", async () => {
    const result = await ensureVzSchoolYearPlatformBinding({
      ensureSchool: async () => ({ status: "error", reason: "storage_unavailable" }),
    });
    expect(result).toEqual({ status: "error", reason: "storage_unavailable" });
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
  });

  it("K: Full Reset → no SchoolYear metadata", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    persistVzSchoolYear("2026/2027");
    await ensureVzSchoolYearPlatformBinding();

    const clearResult = clearAllApplicationStorage();
    expect(clearResult.ok).toBe(true);
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBeNull();
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_ANNUAL_REPORT_STATE_LS_KEY)).toBeNull();

    const result = await ensureVzSchoolYearPlatformBinding();
    expect(result).toEqual({ status: "empty" });
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
  });

  it("L: Profile bootstrap + VZ helper → same yearId (convergence)", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    persistVzSchoolYear("2026/2027");

    const school = await ensureSchoolPlatformBinding();
    expect(school.status).toBe("ready");
    if (school.status !== "ready") return;
    expect(school.activeSchoolYearId).toBeTruthy();
    const bootYearId = school.activeSchoolYearId!;

    const vz = await ensureVzSchoolYearPlatformBinding();
    expect(vz.status).toBe("ready");
    if (vz.status !== "ready") return;
    expect(vz.schoolYearId).toBe(bootYearId);
    expect(vz.startYear).toBe(2026);
    expect(readSchoolYears()).toHaveLength(1);
    expect(readActiveSchoolYearId()).toBe(bootYearId);
  });

  it("M: reload / second invocation → same yearId", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    persistVzSchoolYear("2024/2025");

    const first = await ensureVzSchoolYearPlatformBinding();
    expect(first.status).toBe("ready");
    if (first.status !== "ready") return;

    // Simulate reload: Identity + AppContext + VZ persist, call helper again.
    const second = await ensureVzSchoolYearPlatformBinding();
    expect(second.status).toBe("ready");
    if (second.status !== "ready") return;
    expect(second.schoolYearId).toBe(first.schoolYearId);
    expect(getOrCreateSchoolYearId(profileId, 2024)).toBe(first.schoolYearId);
  });

  it("N: fresh VZ schoolYear=\"\" (0G-0) → no year identity", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    persistVzSchoolYear("");

    const result = await ensureVzSchoolYearPlatformBinding();
    expect(result).toEqual({ status: "noop", reason: "no_valid_year" });

    const registry = readIdentityRegistry();
    expect(registry.ok).toBe(true);
    if (!registry.ok || !registry.registry) return;
    expect(registry.registry.schoolYears).toEqual([]);
    expect(readActiveSchoolYearId()).toBeNull();
  });

  it("does not mutate persisted VZ business payload", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    const vzRaw = persistVzSchoolYear("2026/2027");

    const result = await ensureVzSchoolYearPlatformBinding();
    expect(result.status).toBe("ready");
    expect(localStorage.getItem(LEGACY_ANNUAL_REPORT_STATE_LS_KEY)).toBe(vzRaw);
  });

  it("whitespace-only year → noop, no current-year invent", async () => {
    const profileId = createEntityId();
    persistProfile(profileId);
    seedValidRegistry(profileId);
    seedAppContext(profileId, null);
    persistVzSchoolYear("   ");

    const result = await ensureVzSchoolYearPlatformBinding();
    expect(result).toEqual({ status: "noop", reason: "no_valid_year" });
    expect(readSchoolYears()).toEqual([]);
    expect(readActiveSchoolYearId()).toBeNull();
  });

  it("corrupted VZ year storage → error, no year create", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    localStorage.setItem(LEGACY_ANNUAL_REPORT_STATE_LS_KEY, "{broken-vz");

    const result = await ensureVzSchoolYearPlatformBinding();
    expect(result).toEqual({
      status: "error",
      reason: "platform_failure",
      detail: "vz_year_corrupted",
    });
    expect(readSchoolYears()).toEqual([]);
  });

  it("year hint storage unavailable → fail-safe error", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);

    const result = await ensureVzSchoolYearPlatformBinding({
      readYearHint: () => ({ ok: false, code: "storage_unavailable" }),
    });
    expect(result).toEqual({ status: "error", reason: "storage_unavailable" });
  });
});
