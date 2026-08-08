import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllApplicationStorage } from "../application-storage-registry";
import { APP_CONTEXT_LS_KEY, readAppContext } from "../data/app-context/app-context";
import {
  IDENTITY_REGISTRY_LS_KEY,
  readIdentityRegistry,
} from "../data/identity/identity-registry";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../data/identity/identity-registry-types";
import { createDefaultSchoolProfile } from "./school-profile-logic";
import { ensureSchoolPlatformBinding } from "./ensure-school-platform-binding";
import {
  mayBindPlatformAfterProfilePersist,
  runPlatformBindingAfterProfilePersist,
} from "./profile-save-platform-binding";
import { SCHOOL_PROFILE_LS_KEY } from "./school-profile-storage";
import { replaceSchoolProfileState } from "./use-school-profile";

/**
 * 0F closure integration: Full Reset → empty mount → truthful Save → binding → reload reuse.
 * Exercises public contracts from 0E (clear) + 0F (persist + ensure), not hand-seeded Identity B.
 */
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
    name: "ZŠ Integration",
    ico: "12345678",
    redIzo: "600123456",
    izo: "102345678",
    address: "Hlavní 1",
    municipality: "Praha",
    region: "Hlavní město Praha",
    founder: "Město",
    principalName: "Jan Novák",
    website: "https://integration.cz",
    email: "info@integration.cz",
    phone: "123",
    dataBox: "abcdxyz",
    schoolType: "Základní škola",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("0F Profile platform integration (closure)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.stubGlobal("sessionStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Full Reset A → empty mount → Save B → Identity/AppContext B → reload reuses schoolId_B", async () => {
    // A. Seed School A via truthful write + platform metadata
    const schoolIdA = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(replaceSchoolProfileState(sampleProfile(schoolIdA, { name: "Škola A" }))).toEqual({
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

    // B. Full Reset storage clear
    expect(clearAllApplicationStorage().ok).toBe(true);
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBeNull();
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBeNull();

    // C. Profile mount before first Save → empty (no ghost identity)
    const mountEmpty = await ensureSchoolPlatformBinding();
    expect(mountEmpty).toEqual({ status: "empty" });
    expect(readIdentityRegistry()).toEqual({ ok: true, registry: null });
    expect(readAppContext()).toEqual({ ok: true, context: null });

    // D. Persist School B through truthful shared writer (Save path)
    const schoolIdB = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
    const persistence = replaceSchoolProfileState(
      sampleProfile(schoolIdB, { name: "Škola B", ico: "87654321" }),
    );
    expect(persistence).toEqual({ ok: true });
    expect(mayBindPlatformAfterProfilePersist(persistence)).toBe(true);

    // E. Same binding flow as explicit Save (0F-2B)
    const saveBind = await runPlatformBindingAfterProfilePersist(persistence);
    expect(saveBind.bindingAttempted).toBe(true);
    expect(saveBind.binding?.status).toBe("ready");
    if (saveBind.binding?.status !== "ready") return;

    expect(saveBind.binding.schoolId).toBe(schoolIdB);
    expect(saveBind.binding.schoolId).not.toBe(schoolIdA);
    expect(saveBind.binding.activeSchoolId).toBe(schoolIdB);
    expect(saveBind.binding.activeSchoolYearId).toBeNull();

    const identityAfterSave = readIdentityRegistry();
    expect(identityAfterSave.ok).toBe(true);
    if (!identityAfterSave.ok || !identityAfterSave.registry) return;
    expect(identityAfterSave.registry.schoolId).toBe(schoolIdB);
    expect(identityAfterSave.registry.schoolId).not.toBe(schoolIdA);
    expect(identityAfterSave.registry.schoolYears).toEqual([]);

    const contextAfterSave = readAppContext();
    expect(contextAfterSave.ok).toBe(true);
    if (!contextAfterSave.ok || !contextAfterSave.context) return;
    expect(contextAfterSave.context.activeSchoolId).toBe(schoolIdB);
    expect(contextAfterSave.context.activeSchoolYearId).toBeNull();

    // F. Reload / subsequent mount ensure → reuse, no duplicate Identity, no invented year
    const remount = await ensureSchoolPlatformBinding();
    expect(remount.status).toBe("ready");
    if (remount.status !== "ready") return;
    expect(remount.schoolId).toBe(schoolIdB);
    expect(remount.activeSchoolId).toBe(schoolIdB);
    expect(remount.activeSchoolYearId).toBeNull();

    const identityAfterReload = readIdentityRegistry();
    expect(identityAfterReload.ok).toBe(true);
    if (!identityAfterReload.ok || !identityAfterReload.registry) return;
    expect(identityAfterReload.registry.schoolId).toBe(schoolIdB);
    expect(identityAfterReload.registry.schoolYears).toEqual([]);
  });
});
