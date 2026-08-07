import { beforeEach, describe, expect, it, vi } from "vitest";
import { SCHOOL_PROFILE_LS_KEY } from "../../school-profile/school-profile-constants";
import {
  IDENTITY_REGISTRY_LS_KEY,
  createEntityId,
  getOrCreateSchoolId,
  getOrCreateSchoolYearId,
  IdentityRegistryError,
  isUuid,
  peekLegacySchoolProfileId,
  readIdentityRegistry,
} from "./identity-registry";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "./identity-registry-types";

const PHMAX_KEYS = [
  "edu-cz-pv-calculator-state",
  "edu-cz-sd-calculator-state",
  "edu-cz-zs-calculator-state",
  "phmax-ss-units-draft",
  "edu-cz-nv75-deputy-bank-state",
  "vyrocni-zprava-state-v1",
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
    name: "ZŠ Test",
    ico: "12345678",
    redIzo: "600123456",
    izo: "",
    schoolType: "Základní škola",
    address: "Ulice 1",
    municipality: "Praha",
    region: "Hlavní město Praha",
    founder: "Město",
    principalName: "Jan Novák",
    website: "",
    email: "",
    phone: "",
    dataBox: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };
}

describe("identity-registry", () => {
  let memory: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    memory = createLocalStorageMock();
    vi.stubGlobal("localStorage", memory);
  });

  it("první bootstrap vytvoří schoolId", () => {
    const id = getOrCreateSchoolId();
    expect(isUuid(id)).toBe(true);
    const read = readIdentityRegistry();
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect(read.registry?.schoolId).toBe(id);
    }
  });

  it("druhý bootstrap vrátí stejné schoolId", () => {
    const first = getOrCreateSchoolId();
    const second = getOrCreateSchoolId();
    expect(second).toBe(first);
  });

  it("simulované nové načtení zachová stejné schoolId", () => {
    const first = getOrCreateSchoolId();
    const afterReload = getOrCreateSchoolId();
    expect(afterReload).toBe(first);
    expect(memory.getItem(IDENTITY_REGISTRY_LS_KEY)).toContain(first);
  });

  it("validní legacy UUID je reused", () => {
    const legacyId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(legacyId)));
    expect(peekLegacySchoolProfileId()).toBe(legacyId);
    expect(getOrCreateSchoolId()).toBe(legacyId.toLowerCase());
  });

  it("non-UUID legacy SchoolProfile.id NENÍ reused", () => {
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile("school-123-not-uuid")));
    expect(peekLegacySchoolProfileId()).toBeNull();
    const schoolId = getOrCreateSchoolId();
    expect(isUuid(schoolId)).toBe(true);
    expect(schoolId).not.toBe("school-123-not-uuid");
  });

  it("non-UUID legacy id nevede ke změně SchoolProfile storage", () => {
    const profileJson = JSON.stringify(sampleProfile("profile-id-stable-0001"));
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, profileJson);

    const schoolId = getOrCreateSchoolId();
    getOrCreateSchoolYearId(schoolId, 2026);

    expect(isUuid(schoolId)).toBe(true);
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(profileJson);
  });

  it("nově vytvořené schoolId je validní UUID", () => {
    expect(isUuid(getOrCreateSchoolId())).toBe(true);
    expect(isUuid(createEntityId())).toBe(true);
  });

  it("nově vytvořené schoolYearId je validní UUID", () => {
    const schoolId = getOrCreateSchoolId();
    const yearId = getOrCreateSchoolYearId(schoolId, 2026);
    expect(isUuid(yearId)).toBe(true);
  });

  it("schoolYear 2026 dostane schoolYearId a opakované 2026 je stejné", () => {
    const schoolId = getOrCreateSchoolId();
    const yearId = getOrCreateSchoolYearId(schoolId, 2026);
    expect(getOrCreateSchoolYearId(schoolId, 2026)).toBe(yearId);
  });

  it("2027 dostane jiné schoolYearId než 2026", () => {
    const schoolId = getOrCreateSchoolId();
    const y2026 = getOrCreateSchoolYearId(schoolId, 2026);
    const y2027 = getOrCreateSchoolYearId(schoolId, 2027);
    expect(y2027).not.toBe(y2026);
  });

  it("registry s SchoolYear.schoolId != registry.schoolId → corrupted", () => {
    const rootSchoolId = "11111111-1111-4111-8111-111111111111";
    const otherSchoolId = "99999999-9999-4999-8999-999999999999";
    const payload = {
      schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
      schoolId: rootSchoolId,
      schoolYears: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          schoolId: otherSchoolId,
          startYear: 2026,
        },
      ],
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, JSON.stringify(payload));
    const read = readIdentityRegistry();
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.code).toBe("corrupted");
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(JSON.stringify(payload));
  });

  it("getOrCreateSchoolYearId pro jiné schoolId než registry.schoolId → chyba a žádný zápis", () => {
    const schoolId = getOrCreateSchoolId();
    getOrCreateSchoolYearId(schoolId, 2026);
    const before = localStorage.getItem(IDENTITY_REGISTRY_LS_KEY);
    const otherSchoolId = createEntityId();

    try {
      getOrCreateSchoolYearId(otherSchoolId, 2026);
      expect.unreachable("expected IdentityRegistryError");
    } catch (error) {
      expect(error).toBeInstanceOf(IdentityRegistryError);
      expect((error as IdentityRegistryError).code).toBe("school_id_mismatch");
    }
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(before);
  });

  it("invalidní startYear je odmítnut", () => {
    const schoolId = getOrCreateSchoolId();
    expect(() => getOrCreateSchoolYearId(schoolId, 2026.5)).toThrow(IdentityRegistryError);
    expect(() => getOrCreateSchoolYearId(schoolId, Number.NaN)).toThrow(IdentityRegistryError);
    expect(() => getOrCreateSchoolYearId(schoolId, 26)).toThrow(IdentityRegistryError);
  });

  it("legacy SchoolProfile storage zůstane strukturálně nezměněn", () => {
    const profileJson = JSON.stringify(sampleProfile("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"));
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, profileJson);

    const schoolId = getOrCreateSchoolId();
    getOrCreateSchoolYearId(schoolId, 2026);

    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(profileJson);
  });

  it("žádné PHmax/VZ/NV75 storage klíče nejsou modifikovány", () => {
    for (const key of PHMAX_KEYS) {
      localStorage.setItem(key, JSON.stringify({ marker: key, value: 42 }));
    }
    const before = Object.fromEntries(PHMAX_KEYS.map((key) => [key, localStorage.getItem(key)]));

    const schoolId = getOrCreateSchoolId();
    getOrCreateSchoolYearId(schoolId, 2026);

    for (const key of PHMAX_KEYS) {
      expect(localStorage.getItem(key)).toBe(before[key]);
    }
  });

  it("corrupted registry se bezpečně ohlásí a není tiše přepsána", () => {
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, "{not-json");
    const read = readIdentityRegistry();
    expect(read.ok).toBe(false);
    if (!read.ok) {
      expect(read.code).toBe("corrupted");
    }
    expect(() => getOrCreateSchoolId()).toThrow(IdentityRegistryError);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe("{not-json");
  });

  it("corrupted shape (valid JSON) není přepsána", () => {
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, JSON.stringify({ schemaVersion: 1, schoolId: "" }));
    expect(readIdentityRegistry().ok).toBe(false);
    expect(() => getOrCreateSchoolId()).toThrow(IdentityRegistryError);
    expect(JSON.parse(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)!)).toEqual({
      schemaVersion: 1,
      schoolId: "",
    });
  });

  it("duplicitní schoolId + startYear je corrupted", () => {
    const schoolId = "11111111-1111-4111-8111-111111111111";
    const payload = {
      schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
      schoolId,
      schoolYears: [
        { id: "22222222-2222-4222-8222-222222222222", schoolId, startYear: 2026 },
        { id: "33333333-3333-4333-8333-333333333333", schoolId, startYear: 2026 },
      ],
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, JSON.stringify(payload));
    const read = readIdentityRegistry();
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.code).toBe("corrupted");
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(JSON.stringify(payload));
  });

  it("duplicitní schoolYear id je corrupted", () => {
    const schoolId = "11111111-1111-4111-8111-111111111111";
    const dupId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const payload = {
      schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
      schoolId,
      schoolYears: [
        { id: dupId, schoolId, startYear: 2026 },
        { id: dupId, schoolId, startYear: 2027 },
      ],
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, JSON.stringify(payload));
    const read = readIdentityRegistry();
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.code).toBe("corrupted");
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(JSON.stringify(payload));
  });
});
