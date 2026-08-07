import { beforeEach, describe, expect, it, vi } from "vitest";
import { fromSchoolProfile, toSchoolProfile } from "../../domain/school/school-mappers";
import { SCHOOL_PROFILE_LS_KEY } from "../../school-profile/school-profile-constants";
import {
  IDENTITY_REGISTRY_LS_KEY,
  createEntityId,
  getOrCreateSchoolId,
  isUuid,
  readIdentityRegistry,
} from "../identity/identity-registry";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../identity/identity-registry-types";
import { getLegacySchoolProfileStorageKey } from "../legacy/legacy-school-profile";
import { LEGACY_ANNUAL_REPORT_STATE_LS_KEY, readLegacySchoolYearHint } from "../legacy/legacy-school-year";
import { DataRepositoryError } from "./data-repository";
import {
  LocalStorageRepository,
  SCHOOL_YEAR_PROJECTION_STATUS,
  createLocalStorageRepository,
} from "./local-storage-repository";

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
    name: "ZŠ Repository",
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

describe("LocalStorageRepository", () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    repo = createLocalStorageRepository();
  });

  it("getSchool vrátí doménový School ze současného SchoolProfile", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));

    const school = await repo.getSchool(profileId);
    expect(school).not.toBeNull();
    expect(school?.name).toBe("ZŠ Repository");
    expect(school?.ico).toBe("12345678");
    expect(school?.id).toBe(profileId);
    expect(school?.schemaVersion).toBe(1);
  });

  it("School mapper zachová všechna data", async () => {
    const profile = sampleProfile("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(profile));
    const school = await repo.getSchool(profile.id);
    expect(school).not.toBeNull();
    expect(school).toEqual(fromSchoolProfile(profile));
    expect(toSchoolProfile(school!)).toEqual(profile);
  });

  it("getSchool s jiným schoolId nevrátí cizí školu", async () => {
    localStorage.setItem(
      SCHOOL_PROFILE_LS_KEY,
      JSON.stringify(sampleProfile("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee")),
    );
    await repo.getSchool("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    const other = await repo.getSchool(createEntityId());
    expect(other).toBeNull();
  });

  it("chybějící SchoolProfile → null a nevytvoří Identity Registry", async () => {
    expect(await repo.getSchool(createEntityId())).toBeNull();
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
  });

  it("repository read nepřepisuje SchoolProfile storage", async () => {
    const json = JSON.stringify(sampleProfile("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"));
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, json);
    await repo.getSchool("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    await repo.listSchoolYears("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(json);
    expect(getLegacySchoolProfileStorageKey()).toBe(SCHOOL_PROFILE_LS_KEY);
  });

  it("repository read nepřepisuje PHmax/VZ/NV75 klíče", async () => {
    localStorage.setItem(
      SCHOOL_PROFILE_LS_KEY,
      JSON.stringify(sampleProfile("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee")),
    );
    for (const key of MODULE_KEYS) {
      localStorage.setItem(key, JSON.stringify({ marker: key }));
    }
    localStorage.setItem(
      LEGACY_ANNUAL_REPORT_STATE_LS_KEY,
      JSON.stringify({
        version: 1,
        report: { schoolYear: "2026/2027", sections: [], id: "r1", createdAt: "", updatedAt: "", status: "ROZPRACOVANA" },
        selectedSectionId: "x",
      }),
    );
    const before = Object.fromEntries(
      [...MODULE_KEYS, LEGACY_ANNUAL_REPORT_STATE_LS_KEY].map((key) => [key, localStorage.getItem(key)]),
    );

    const schoolId = await repo.getSchool("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    await repo.listSchoolYears(schoolId!.id);

    for (const key of [...MODULE_KEYS, LEGACY_ANNUAL_REPORT_STATE_LS_KEY]) {
      expect(localStorage.getItem(key)).toBe(before[key]);
    }
  });

  it("známý validní VZ schoolYear label lze převést na startYear", () => {
    localStorage.setItem(
      LEGACY_ANNUAL_REPORT_STATE_LS_KEY,
      JSON.stringify({
        version: 1,
        report: { schoolYear: "2026/2027" },
        selectedSectionId: "s",
      }),
    );
    const hint = readLegacySchoolYearHint();
    expect(hint.ok).toBe(true);
    if (hint.ok) {
      expect(hint.label).toBe("2026/2027");
      expect(hint.startYear).toBe(2026);
    }
  });

  it("vytvoření schoolYear identity vytvoří pouze Identity Registry změnu", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    localStorage.setItem(
      LEGACY_ANNUAL_REPORT_STATE_LS_KEY,
      JSON.stringify({ version: 1, report: { schoolYear: "2026/2027" }, selectedSectionId: "s" }),
    );
    const profileBefore = localStorage.getItem(SCHOOL_PROFILE_LS_KEY);
    const vzBefore = localStorage.getItem(LEGACY_ANNUAL_REPORT_STATE_LS_KEY);

    const years = await repo.listSchoolYears(profileId);
    expect(years).toHaveLength(1);
    expect(years[0]?.startYear).toBe(2026);
    expect(years[0]?.status).toBe(SCHOOL_YEAR_PROJECTION_STATUS);
    expect(isUuid(years[0]!.id)).toBe(true);

    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(profileBefore);
    expect(localStorage.getItem(LEGACY_ANNUAL_REPORT_STATE_LS_KEY)).toBe(vzBefore);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeTruthy();
  });

  it("opakované čtení stejného roku vrací stejné schoolYearId", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    localStorage.setItem(
      LEGACY_ANNUAL_REPORT_STATE_LS_KEY,
      JSON.stringify({ version: 1, report: { schoolYear: "2026/2027" }, selectedSectionId: "s" }),
    );
    const first = await repo.listSchoolYears(profileId);
    const second = await repo.listSchoolYears(profileId);
    expect(second[0]?.id).toBe(first[0]?.id);
    const byId = await repo.getSchoolYear(first[0]!.id);
    expect(byId?.id).toBe(first[0]?.id);
  });

  it("invalidní year label nevytvoří SchoolYear", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    localStorage.setItem(
      LEGACY_ANNUAL_REPORT_STATE_LS_KEY,
      JSON.stringify({ version: 1, report: { schoolYear: "2026-2027" }, selectedSectionId: "s" }),
    );
    const years = await repo.listSchoolYears(profileId);
    expect(years).toEqual([]);
    const registry = readIdentityRegistry();
    expect(registry.ok).toBe(true);
    if (registry.ok) {
      expect(registry.registry?.schoolYears ?? []).toEqual([]);
    }
  });

  it("žádný current-date fallback školního roku", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(profileId)));
    // no VZ state at all
    const years = await repo.listSchoolYears(profileId);
    expect(years).toEqual([]);
  });

  it("corrupted Identity Registry je bezpečně propagována", async () => {
    localStorage.setItem(
      SCHOOL_PROFILE_LS_KEY,
      JSON.stringify(sampleProfile("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee")),
    );
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, "{broken");
    await expect(repo.getSchool("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee")).rejects.toBeInstanceOf(
      DataRepositoryError,
    );
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe("{broken");
  });

  it("corrupted legacy SchoolProfile → error a nevytvoří Identity Registry", async () => {
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, "{not-json");
    await expect(repo.getSchool(createEntityId())).rejects.toBeInstanceOf(DataRepositoryError);
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe("{not-json");
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
  });

  it("listSchoolYears vrátí stabilní známé roky identity registry pro schoolId", async () => {
    const schoolId = getOrCreateSchoolId();
    localStorage.setItem(
      IDENTITY_REGISTRY_LS_KEY,
      JSON.stringify({
        schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
        schoolId,
        schoolYears: [
          { id: "22222222-2222-4222-8222-222222222222", schoolId, startYear: 2025 },
          { id: "33333333-3333-4333-8333-333333333333", schoolId, startYear: 2026 },
        ],
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    const years = await repo.listSchoolYears(schoolId);
    expect(years.map((y) => y.startYear).sort()).toEqual([2025, 2026]);
  });

  it("listSchoolYears pro jinou schoolId nevrací data", async () => {
    const schoolId = getOrCreateSchoolId();
    localStorage.setItem(
      LEGACY_ANNUAL_REPORT_STATE_LS_KEY,
      JSON.stringify({ version: 1, report: { schoolYear: "2026/2027" }, selectedSectionId: "s" }),
    );
    await repo.listSchoolYears(schoolId);
    const other = await repo.listSchoolYears(createEntityId());
    expect(other).toEqual([]);
  });
});
