import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  identitySensitiveLockMode,
  readIdentityRegistryPresence,
} from "./school-profile-identity-policy";
import {
  applySchoolProfileEdits,
  createDefaultSchoolProfile,
  patchSchoolProfile,
  resetSchoolProfileFields,
} from "./school-profile-logic";
import {
  loadSchoolProfileFromStorage,
  migrateLegacySchoolProfileIfNeeded,
  saveSchoolProfileToStorage,
  SCHOOL_PROFILE_LS_KEY,
} from "./school-profile-storage";
import {
  getSchoolProfileSnapshot,
  replaceSchoolProfileState,
} from "./use-school-profile";

function createLocalStorageMock(overrides: Partial<Storage> = {}) {
  const store: Record<string, string> = {};
  return {
    store,
    storage: {
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
      ...overrides,
    } as Storage,
  };
}

function failingWriteStorage(existingRaw: string | null): Storage {
  const store: Record<string, string> = {};
  if (existingRaw != null) store[SCHOOL_PROFILE_LS_KEY] = existingRaw;
  return {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key]! : null;
    },
    setItem() {
      throw new Error("storage write failed");
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

function sampleProfile(id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee") {
  return {
    ...createDefaultSchoolProfile(),
    id,
    name: "ZŠ Persist",
    ico: "12345678",
    redIzo: "600123456",
    izo: "102345678",
    address: "Hlavní 1",
    municipality: "Praha",
    region: "Hlavní město Praha",
    founder: "Město",
    principalName: "Jan Novák",
    website: "https://persist.cz",
    email: "info@persist.cz",
    phone: "123",
    dataBox: "abcd",
    schoolType: "Základní škola",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };
}

describe("saveSchoolProfileToStorage (0F-2A)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("A: setItem success → { ok:true }", () => {
    vi.stubGlobal("localStorage", createLocalStorageMock().storage);
    expect(saveSchoolProfileToStorage(sampleProfile())).toEqual({ ok: true });
    expect(JSON.parse(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)!).name).toBe("ZŠ Persist");
  });

  it("B: setItem throw → { ok:false, reason:storage_unavailable }", () => {
    vi.stubGlobal(
      "localStorage",
      createLocalStorageMock({
        setItem() {
          throw new DOMException("Quota exceeded", "QuotaExceededError");
        },
      }).storage,
    );
    expect(saveSchoolProfileToStorage(sampleProfile())).toEqual({
      ok: false,
      reason: "storage_unavailable",
    });
  });

  it("C: storage unavailable → failure", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(saveSchoolProfileToStorage(sampleProfile())).toEqual({
      ok: false,
      reason: "storage_unavailable",
    });
  });

  it("D: localStorage getter throw → failure", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Access denied", "SecurityError");
      },
    });
    try {
      expect(saveSchoolProfileToStorage(sampleProfile())).toEqual({
        ok: false,
        reason: "storage_unavailable",
      });
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, "localStorage", descriptor);
      } else {
        Reflect.deleteProperty(globalThis, "localStorage");
      }
    }
  });
});

describe("persist-first cache / writers (0F-2A)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock().storage);
    expect(replaceSchoolProfileState(sampleProfile())).toEqual({ ok: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("F: successful save → cachedProfile updated to saved profile", () => {
    const before = getSchoolProfileSnapshot();
    const next = { ...before, name: "ZŠ Updated", website: "https://new.cz" };
    expect(replaceSchoolProfileState(next)).toEqual({ ok: true });
    expect(getSchoolProfileSnapshot()).not.toBe(before);
    expect(getSchoolProfileSnapshot().name).toBe("ZŠ Updated");
    expect(loadSchoolProfileFromStorage().name).toBe("ZŠ Updated");
  });

  it("G: failed save → cachedProfile zůstane původní", () => {
    const beforeCache = getSchoolProfileSnapshot();
    const beforeStorage = localStorage.getItem(SCHOOL_PROFILE_LS_KEY);
    vi.stubGlobal("localStorage", failingWriteStorage(beforeStorage));

    const result = replaceSchoolProfileState({
      ...beforeCache,
      name: "SHOULD NOT PERSIST",
    });
    expect(result).toEqual({ ok: false, reason: "storage_unavailable" });
    expect(getSchoolProfileSnapshot()).toBe(beforeCache);
    expect(getSchoolProfileSnapshot().name).toBe("ZŠ Persist");
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(beforeStorage);
  });

  it("H: load po failed save → stará persistovaná data", () => {
    const beforeStorage = localStorage.getItem(SCHOOL_PROFILE_LS_KEY);
    vi.stubGlobal("localStorage", failingWriteStorage(beforeStorage));
    expect(
      replaceSchoolProfileState({ ...getSchoolProfileSnapshot(), name: "Ghost" }),
    ).toEqual({ ok: false, reason: "storage_unavailable" });
    expect(loadSchoolProfileFromStorage().name).toBe("ZŠ Persist");
  });

  it("I: failed updateProfile-style write → cache/storage staré", () => {
    const before = getSchoolProfileSnapshot();
    const beforeStorage = localStorage.getItem(SCHOOL_PROFILE_LS_KEY)!;
    vi.stubGlobal("localStorage", failingWriteStorage(beforeStorage));

    const patched = patchSchoolProfile(before, { website: "https://vz-fail.cz" });
    const status = readIdentityRegistryPresence();
    const { profile: next } = applySchoolProfileEdits(before, patched, {
      identityLockMode: identitySensitiveLockMode(status),
    });
    expect(replaceSchoolProfileState(next).ok).toBe(false);
    expect(getSchoolProfileSnapshot().website).toBe(before.website);
    expect(JSON.parse(beforeStorage).website).toBe(before.website);
  });

  it("J: failed resetProfile → cache/storage staré", () => {
    const before = getSchoolProfileSnapshot();
    const beforeStorage = localStorage.getItem(SCHOOL_PROFILE_LS_KEY)!;
    vi.stubGlobal("localStorage", failingWriteStorage(beforeStorage));

    const cleared = resetSchoolProfileFields(before);
    expect(replaceSchoolProfileState(cleared)).toEqual({
      ok: false,
      reason: "storage_unavailable",
    });
    expect(getSchoolProfileSnapshot().name).toBe("ZŠ Persist");
    expect(getSchoolProfileSnapshot().ico).toBe("12345678");
    expect(JSON.parse(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)!).name).toBe("ZŠ Persist");
  });

  it("K: successful reset → cache/storage reset profile", () => {
    const cleared = resetSchoolProfileFields(getSchoolProfileSnapshot());
    expect(replaceSchoolProfileState(cleared)).toEqual({ ok: true });
    expect(getSchoolProfileSnapshot().name).toBe("");
    expect(getSchoolProfileSnapshot().ico).toBe("12345678");
    expect(loadSchoolProfileFromStorage().name).toBe("");
    expect(loadSchoolProfileFromStorage().ico).toBe("12345678");
  });

  it("L: identity-sensitive blocked edit → persistuje reconciled hodnotu", () => {
    const current = getSchoolProfileSnapshot();
    localStorage.setItem(
      "reditelsky-pruvodce-identity-registry-v1",
      JSON.stringify({
        schemaVersion: 1,
        schoolId: current.id,
        schoolYears: [],
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    const { profile, identityChangeBlocked } = applySchoolProfileEdits(
      current,
      { ...current, ico: "87654321", website: "https://reconciled.cz" },
      { identityLockMode: "established_only" },
    );
    expect(identityChangeBlocked).toBe(true);
    expect(profile.ico).toBe("12345678");
    expect(replaceSchoolProfileState(profile)).toEqual({ ok: true });
    expect(loadSchoolProfileFromStorage().ico).toBe("12345678");
    expect(loadSchoolProfileFromStorage().website).toBe("https://reconciled.cz");
  });

  it("binding gate: persistence.ok dovoluje / zakazuje budoucí binding", () => {
    const ok = replaceSchoolProfileState({
      ...getSchoolProfileSnapshot(),
      phone: "111",
    });
    expect(ok.ok).toBe(true);
    // 0F-2B: if (persistResult.ok) ensureSchoolPlatformBinding()

    vi.stubGlobal(
      "localStorage",
      failingWriteStorage(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)),
    );
    const fail = replaceSchoolProfileState({
      ...getSchoolProfileSnapshot(),
      phone: "222",
    });
    expect(fail.ok).toBe(false);
    // 0F-2B: if (!persistResult.ok) binding forbidden
  });

  it("failed save nemění snapshot referenci (žádný emit side-effect na cache)", () => {
    const snap = getSchoolProfileSnapshot();
    vi.stubGlobal(
      "localStorage",
      failingWriteStorage(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)),
    );
    expect(replaceSchoolProfileState({ ...snap, phone: "x" }).ok).toBe(false);
    expect(getSchoolProfileSnapshot()).toBe(snap);
  });
});

describe("migrateLegacySchoolProfileIfNeeded persistence honesty", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persist success → returns normalized profile", () => {
    vi.stubGlobal("localStorage", createLocalStorageMock().storage);
    const legacy = sampleProfile("bbbbbbbb-cccc-4ddd-8eee-ffffffffffff");
    const result = migrateLegacySchoolProfileIfNeeded(legacy);
    expect(result?.name).toBe("ZŠ Persist");
    expect(loadSchoolProfileFromStorage().id).toBe(legacy.id);
  });

  it("persist failure → null (neclaimuje storage migraci)", () => {
    vi.stubGlobal(
      "localStorage",
      createLocalStorageMock({
        setItem() {
          throw new Error("quota");
        },
      }).storage,
    );
    expect(migrateLegacySchoolProfileIfNeeded(sampleProfile())).toBeNull();
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBeNull();
  });
});
