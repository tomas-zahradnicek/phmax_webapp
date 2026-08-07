import { beforeEach, describe, expect, it, vi } from "vitest";
import { DOMAIN_DATA_SCHEMA_VERSION } from "../../domain/shared/data-schema-version";
import type { School } from "../../domain/school/school-types";
import type { SchoolYear } from "../../domain/school-year/school-year-types";
import type { EntityId } from "../../domain/shared/entity-id";
import { SCHOOL_PROFILE_LS_KEY } from "../../school-profile/school-profile-constants";
import {
  APP_CONTEXT_LS_KEY,
  AppContextError,
  bootstrapAppContext,
  readAppContext,
  setActiveSchool,
  setActiveSchoolYear,
  writeAppContext,
  type AppContext,
} from "./app-context";
import { IDENTITY_REGISTRY_LS_KEY, createEntityId } from "../identity/identity-registry";
import { LEGACY_ANNUAL_REPORT_STATE_LS_KEY } from "../legacy/legacy-school-year";
import type { DataRepository } from "../repository/data-repository";
import { createLocalStorageRepository } from "../repository/local-storage-repository";

const MODULE_KEYS = [
  "edu-cz-pv-calculator-state",
  "edu-cz-sd-calculator-state",
  "edu-cz-zs-calculator-state",
  "phmax-ss-units-draft",
  "edu-cz-nv75-deputy-bank-state",
  "vyrocni-zprava-personnel-data-v1",
] as const;

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

function sampleProfile(id: string) {
  return {
    id,
    name: "ZŠ AppContext",
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
  };
}

function setVzYear(label: string) {
  localStorage.setItem(
    LEGACY_ANNUAL_REPORT_STATE_LS_KEY,
    JSON.stringify({ version: 1, report: { schoolYear: label }, selectedSectionId: "s" }),
  );
}

function snapshotProtectedKeys(): Record<string, string | null> {
  const keys = [SCHOOL_PROFILE_LS_KEY, LEGACY_ANNUAL_REPORT_STATE_LS_KEY, ...MODULE_KEYS];
  return Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)]));
}

describe("AppContext", () => {
  let repo: ReturnType<typeof createLocalStorageRepository>;

  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    repo = createLocalStorageRepository();
  });

  it("empty storage + no profile → null/null", async () => {
    const result = await bootstrapAppContext(repo);
    expect(result.context.activeSchoolId).toBeNull();
    expect(result.context.activeSchoolYearId).toBeNull();
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
  });

  it("valid profile → activeSchoolId bootstrap", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    const result = await bootstrapAppContext(repo);
    expect(result.context.activeSchoolId).toBe(profileId);
    expect(result.context.activeSchoolYearId).toBeNull();
  });

  it("valid profile + valid year hint → activeSchoolId + activeSchoolYearId", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    setVzYear("2026/2027");
    const result = await bootstrapAppContext(repo);
    expect(result.context.activeSchoolId).toBe(profileId);
    expect(result.context.activeSchoolYearId).toBeTruthy();
    const year = await repo.getSchoolYear(result.context.activeSchoolYearId!);
    expect(year?.startYear).toBe(2026);
    expect(year?.schoolId).toBe(profileId);
    expect(year?.createdAt).toBeUndefined();
    expect(year?.updatedAt).toBeUndefined();
  });

  it("no year hint → activeSchoolYearId null", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    const result = await bootstrapAppContext(repo);
    expect(result.context.activeSchoolId).toBe(profileId);
    expect(result.context.activeSchoolYearId).toBeNull();
  });

  it("invalid year hint → null, žádný date fallback", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    setVzYear("2026-2027");
    const result = await bootstrapAppContext(repo);
    expect(result.context.activeSchoolId).toBe(profileId);
    expect(result.context.activeSchoolYearId).toBeNull();
  });

  it("bootstrap opakovaně zachová stejná IDs", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    setVzYear("2026/2027");
    const first = await bootstrapAppContext(repo);
    const second = await bootstrapAppContext(repo);
    expect(second.context.activeSchoolId).toBe(first.context.activeSchoolId);
    expect(second.context.activeSchoolYearId).toBe(first.context.activeSchoolYearId);
  });

  it("valid existing AppContext se zachová", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    setVzYear("2026/2027");
    const boot = await bootstrapAppContext(repo);
    const before = localStorage.getItem(APP_CONTEXT_LS_KEY);
    const again = await bootstrapAppContext(repo);
    expect(again.context).toEqual(boot.context);
    expect(again.staleActiveSchoolId).toBe(false);
    expect(again.staleActiveSchoolYearId).toBe(false);
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBe(before);
  });

  it("stale School → bootstrap null/null (year nesmí přežít)", async () => {
    localStorage.setItem(
      APP_CONTEXT_LS_KEY,
      JSON.stringify({
        schemaVersion: 1,
        activeSchoolId: createEntityId(),
        activeSchoolYearId: createEntityId(),
      }),
    );
    const result = await bootstrapAppContext(repo);
    expect(result.staleActiveSchoolId).toBe(true);
    expect(result.staleActiveSchoolYearId).toBe(true);
    expect(result.context.activeSchoolId).toBeNull();
    expect(result.context.activeSchoolYearId).toBeNull();
  });

  it("valid School + stale SchoolYear → School zachována, year null", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    const boot = await bootstrapAppContext(repo);
    writeAppContext({
      schemaVersion: 1,
      activeSchoolId: boot.context.activeSchoolId,
      activeSchoolYearId: createEntityId(),
    });
    const result = await bootstrapAppContext(repo);
    expect(result.staleActiveSchoolYearId).toBe(true);
    expect(result.context.activeSchoolId).toBe(profileId);
    expect(result.context.activeSchoolYearId).toBeNull();
  });

  it("activeSchoolId null + yearId non-null → corrupted / invalid", () => {
    localStorage.setItem(
      APP_CONTEXT_LS_KEY,
      JSON.stringify({
        schemaVersion: 1,
        activeSchoolId: null,
        activeSchoolYearId: createEntityId(),
      }),
    );
    const read = readAppContext();
    expect(read.ok).toBe(false);
    if (!read.ok) {
      expect(read.code).toBe("corrupted");
    }
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toContain("activeSchoolYearId");
  });

  it("write null school + non-null year → odmítnuto, storage beze změny", () => {
    writeAppContext({
      schemaVersion: 1,
      activeSchoolId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      activeSchoolYearId: null,
    });
    const before = localStorage.getItem(APP_CONTEXT_LS_KEY);
    const result = writeAppContext({
      schemaVersion: 1,
      activeSchoolId: null,
      activeSchoolYearId: createEntityId(),
    } as AppContext);
    expect(result).toEqual({ ok: false, code: "invalid_context" });
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBe(before);
  });

  it("year jiné školy nelze aktivovat", async () => {
    const schoolId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const otherSchoolId = "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const yearId = "cccccccc-cccc-4ccc-8ddd-eeeeeeeeeeee";
    writeAppContext({
      schemaVersion: 1,
      activeSchoolId: schoolId,
      activeSchoolYearId: null,
    });

    const fakeRepo: DataRepository = {
      async getSchool(id: EntityId): Promise<School | null> {
        if (id !== schoolId) return null;
        return {
          id: schoolId,
          schemaVersion: DOMAIN_DATA_SCHEMA_VERSION,
          name: "A",
          ico: "",
          redIzo: "",
          izo: "",
          schoolType: "",
          address: "",
          municipality: "",
          region: "",
          founder: "",
          principalName: "",
          website: "",
          email: "",
          phone: "",
          dataBox: "",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        };
      },
      async getSchoolYear(id: EntityId): Promise<SchoolYear | null> {
        if (id !== yearId) return null;
        return {
          id: yearId,
          schemaVersion: DOMAIN_DATA_SCHEMA_VERSION,
          schoolId: otherSchoolId,
          startYear: 2026,
          status: "unknown",
        };
      },
      async listSchoolYears(): Promise<SchoolYear[]> {
        return [];
      },
    };

    await expect(setActiveSchoolYear(fakeRepo, yearId)).rejects.toMatchObject({
      code: "school_year_school_mismatch",
    });
    const read = readAppContext();
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect(read.context?.activeSchoolYearId).toBeNull();
    }
  });

  it("corrupted AppContext není silent-reset", async () => {
    localStorage.setItem(APP_CONTEXT_LS_KEY, "{broken");
    await expect(bootstrapAppContext(repo)).rejects.toBeInstanceOf(AppContextError);
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBe("{broken");
  });

  it("bootstrap nemění SchoolProfile", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const json = JSON.stringify(sampleProfile(profileId));
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, json);
    setVzYear("2026/2027");
    await bootstrapAppContext(repo);
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(json);
  });

  it("bootstrap nemění VZ payload", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    setVzYear("2026/2027");
    const before = localStorage.getItem(LEGACY_ANNUAL_REPORT_STATE_LS_KEY);
    await bootstrapAppContext(repo);
    expect(localStorage.getItem(LEGACY_ANNUAL_REPORT_STATE_LS_KEY)).toBe(before);
  });

  it("bootstrap nemění PHmax/NV75 payloady", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    setVzYear("2026/2027");
    for (const key of MODULE_KEYS) {
      localStorage.setItem(key, JSON.stringify({ marker: key }));
    }
    const before = Object.fromEntries(MODULE_KEYS.map((key) => [key, localStorage.getItem(key)]));
    await bootstrapAppContext(repo);
    for (const key of MODULE_KEYS) {
      expect(localStorage.getItem(key)).toBe(before[key]);
    }
  });

  it("jedinými možnými novými writes jsou Identity Registry + AppContext", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    setVzYear("2026/2027");
    for (const key of MODULE_KEYS) {
      localStorage.setItem(key, JSON.stringify({ marker: key }));
    }
    const protectedBefore = snapshotProtectedKeys();
    const keysBefore = new Set(Object.keys((localStorage as unknown as { store: Record<string, string> }).store));

    await bootstrapAppContext(repo);

    const store = (localStorage as unknown as { store: Record<string, string> }).store;
    const keysAfter = Object.keys(store);
    for (const key of keysAfter) {
      if (!keysBefore.has(key)) {
        expect([IDENTITY_REGISTRY_LS_KEY, APP_CONTEXT_LS_KEY]).toContain(key);
      }
    }
    const protectedAfter = snapshotProtectedKeys();
    expect(protectedAfter).toEqual(protectedBefore);
  });

  it("setActiveSchoolYear vyžaduje activeSchoolId", async () => {
    writeAppContext({
      schemaVersion: 1,
      activeSchoolId: null,
      activeSchoolYearId: null,
    });
    await expect(setActiveSchoolYear(repo, createEntityId())).rejects.toMatchObject({
      code: "active_school_required",
    });
  });

  it("setActiveSchool null vyčistí i activeSchoolYearId", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    setVzYear("2026/2027");
    const boot = await bootstrapAppContext(repo);
    expect(boot.context.activeSchoolYearId).toBeTruthy();
    const cleared = await setActiveSchool(repo, null);
    expect(cleared.activeSchoolId).toBeNull();
    expect(cleared.activeSchoolYearId).toBeNull();
  });
});
