import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllApplicationStorage } from "../application-storage-registry";
import { APP_CONTEXT_LS_KEY, readAppContext } from "../data/app-context/app-context";
import {
  IDENTITY_REGISTRY_LS_KEY,
  isUuid,
  readIdentityRegistry,
} from "../data/identity/identity-registry";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../data/identity/identity-registry-types";
import { LEGACY_ANNUAL_REPORT_STATE_LS_KEY } from "../data/legacy/legacy-school-year";
import { createDefaultSchoolProfile } from "./school-profile-logic";
import {
  MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED,
  MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED,
  createSerializedPlatformBindingRunner,
  runPlatformBindingAfterProfilePersist,
  runPlatformBindingOnMount,
} from "./profile-save-platform-binding";
import {
  SCHOOL_PROFILE_LS_KEY,
  saveSchoolProfileToStorage,
} from "./school-profile-storage";

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
    name: "ZŠ Mount Binding",
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

function setVzYear(label: string) {
  localStorage.setItem(
    LEGACY_ANNUAL_REPORT_STATE_LS_KEY,
    JSON.stringify({ version: 1, report: { schoolYear: label }, selectedSectionId: "s" }),
  );
}

describe("profile mount → platform binding (0F-2C)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.stubGlobal("sessionStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("A: empty browser → mount empty, no Identity, no school-bound AppContext, no warning", async () => {
    const outcome = await runPlatformBindingOnMount();
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.binding.status).toBe("empty");
    expect(outcome.metadataNotice).toBeNull();
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBeNull();
  });

  it("B: Full Reset → mount empty, no ghost identity", async () => {
    const schoolIdA = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(schoolIdA))).toEqual({ ok: true });
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

    const outcome = await runPlatformBindingOnMount();
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.binding.status).toBe("empty");
    expect(outcome.metadataNotice).toBeNull();
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBeNull();
  });

  it("C: persisted legacy UUID profile → mount creates Identity = profile.id", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });

    const outcome = await runPlatformBindingOnMount();
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted || outcome.binding.status !== "ready") return;
    expect(outcome.metadataNotice).toBeNull();
    expect(outcome.binding.schoolId).toBe(profileId);
    expect(outcome.binding.activeSchoolId).toBe(profileId);

    const registry = readIdentityRegistry();
    expect(registry.ok && registry.registry?.schoolId).toBe(profileId);
  });

  it("D: non-UUID legacy profile → mount creates UUID identity; profile unchanged", async () => {
    const legacyId = "school-legacy-mount";
    expect(saveSchoolProfileToStorage(sampleProfile(legacyId))).toEqual({ ok: true });
    const rawBefore = localStorage.getItem(SCHOOL_PROFILE_LS_KEY);

    const outcome = await runPlatformBindingOnMount();
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted || outcome.binding.status !== "ready") return;
    expect(isUuid(outcome.binding.schoolId)).toBe(true);
    expect(outcome.binding.schoolId).not.toBe(legacyId);
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(rawBefore);
    expect(JSON.parse(rawBefore!).id).toBe(legacyId);
  });

  it("E: second mount / StrictMode-like second ensure → same identity reused", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });
    const first = await runPlatformBindingOnMount();
    const second = await runPlatformBindingOnMount();
    expect(first.bindingAttempted && second.bindingAttempted).toBe(true);
    if (!first.bindingAttempted || !second.bindingAttempted) return;
    expect(first.binding.status).toBe("ready");
    expect(second.binding.status).toBe("ready");
    if (first.binding.status !== "ready" || second.binding.status !== "ready") return;
    expect(second.binding.schoolId).toBe(first.binding.schoolId);
  });

  it("F: corrupted SchoolProfile → no Identity, no rewrite, metadata warning", async () => {
    const corrupted = "{not-json-profile";
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, corrupted);

    const outcome = await runPlatformBindingOnMount();
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.binding.status).toBe("error");
    if (outcome.binding.status === "error") {
      expect(outcome.binding.reason).toBe("profile_corrupted");
    }
    expect(outcome.metadataNotice).toBe(MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED);
    expect(outcome.metadataNotice).not.toContain("byl uložen");
    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(corrupted);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
  });

  it("G: corrupted Identity → raw unchanged + metadata warning", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });
    const corrupted = "{broken-identity";
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, corrupted);

    const outcome = await runPlatformBindingOnMount();
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.binding.status).toBe("error");
    if (outcome.binding.status === "error") {
      expect(outcome.binding.reason).toBe("identity_corrupted");
    }
    expect(outcome.metadataNotice).toBe(MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(corrupted);
  });

  it("H: corrupted AppContext → raw unchanged + metadata warning", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });
    const corrupted = "{broken-context";
    localStorage.setItem(APP_CONTEXT_LS_KEY, corrupted);

    const outcome = await runPlatformBindingOnMount();
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.binding.status).toBe("error");
    if (outcome.binding.status === "error") {
      expect(outcome.binding.reason).toBe("app_context_corrupted");
    }
    expect(outcome.metadataNotice).toBe(MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED);
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBe(corrupted);
  });

  it("I: no VZ hint → activeSchoolYearId null", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });
    const outcome = await runPlatformBindingOnMount();
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted || outcome.binding.status !== "ready") return;
    expect(outcome.binding.activeSchoolYearId).toBeNull();
    const registry = readIdentityRegistry();
    expect(registry.ok && registry.registry?.schoolYears).toEqual([]);
  });

  it("J: valid VZ hint → 0D SchoolYear metadata behavior", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });
    setVzYear("2026/2027");

    const outcome = await runPlatformBindingOnMount();
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted || outcome.binding.status !== "ready") return;
    expect(outcome.binding.activeSchoolYearId).toBeTruthy();
    const registry = readIdentityRegistry();
    expect(registry.ok).toBe(true);
    if (!registry.ok || !registry.registry) return;
    expect(registry.registry.schoolYears).toHaveLength(1);
    expect(registry.registry.schoolYears[0]?.startYear).toBe(2026);
  });

  it("K: mount error pending → Save ready → delayed mount must not restore warning", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });

    let resolveMountEnsure!: (value: {
      status: "error";
      reason: "platform_failure";
    }) => void;
    const mountEnsurePromise = new Promise<{ status: "error"; reason: "platform_failure" }>(
      (resolve) => {
        resolveMountEnsure = resolve;
      },
    );

    let call = 0;
    const ensure = vi.fn(async () => {
      call += 1;
      if (call === 1) {
        return mountEnsurePromise;
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

    const runner = createSerializedPlatformBindingRunner(ensure);
    // Page-level generation simulation (same pattern as ProfilSkolyPage)
    let generation = 0;
    let notice: string | null = null;

    const mountGen = ++generation;
    const mountPromise = runner.onMount().then((outcome) => {
      if (mountGen !== generation) return;
      if (outcome.bindingAttempted) notice = outcome.metadataNotice;
    });

    const saveGen = ++generation;
    const savePromise = runner.afterPersist({ ok: true }).then((outcome) => {
      if (saveGen !== generation) return;
      if (outcome.bindingAttempted) notice = outcome.metadataNotice;
    });

    resolveMountEnsure({ status: "error", reason: "platform_failure" });
    await Promise.all([mountPromise, savePromise]);
    // Save bumped generation; stale mount error must not restore warning after Save ready.
    expect(notice).toBeNull();
    expect(ensure).toHaveBeenCalledTimes(2);
  });

  it("L: mount + Save concurrent → stable single schoolId + valid AppContext", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });

    const runner = createSerializedPlatformBindingRunner();
    const [mountOutcome, saveOutcome] = await Promise.all([
      runner.onMount(),
      runner.afterPersist({ ok: true }),
    ]);

    expect(mountOutcome.bindingAttempted).toBe(true);
    expect(saveOutcome.bindingAttempted).toBe(true);
    if (!mountOutcome.bindingAttempted || !saveOutcome.bindingAttempted) return;
    expect(mountOutcome.binding.status).toBe("ready");
    expect(saveOutcome.binding.status).toBe("ready");
    if (mountOutcome.binding.status !== "ready" || saveOutcome.binding.status !== "ready") return;
    expect(mountOutcome.binding.schoolId).toBe(profileId);
    expect(saveOutcome.binding.schoolId).toBe(profileId);

    const registry = readIdentityRegistry();
    expect(registry.ok && registry.registry?.schoolId).toBe(profileId);
    const context = readAppContext();
    expect(context.ok && context.context?.activeSchoolId).toBe(profileId);
  });

  it("M: mount error → later successful Save binding → warning disappears", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, "{broken");

    const mount = await runPlatformBindingOnMount();
    expect(mount.metadataNotice).toBe(MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED);
    expect(mount.metadataNotice).not.toContain("byl uložen");

    // Repair registry (user cannot; simulate recovery path after storage fixed + Save)
    localStorage.removeItem(IDENTITY_REGISTRY_LS_KEY);
    const save = await runPlatformBindingAfterProfilePersist({ ok: true });
    expect(save.bindingAttempted).toBe(true);
    if (!save.bindingAttempted) return;
    expect(save.binding.status).toBe("ready");
    expect(save.metadataNotice).toBeNull();
  });

  it("mount empty ≠ Save empty: Save empty still warns with save-specific copy", async () => {
    const ensureEmpty = vi.fn(async () => ({ status: "empty" as const }));
    const mount = await runPlatformBindingOnMount(ensureEmpty);
    expect(mount.metadataNotice).toBeNull();

    const save = await runPlatformBindingAfterProfilePersist({ ok: true }, ensureEmpty);
    expect(save.metadataNotice).toBe(MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED);
    expect(save.metadataNotice).toContain("byl uložen");
    expect(MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED).not.toContain("byl uložen");
    expect(MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED).not.toBe(
      MSG_SCHOOL_PROFILE_PLATFORM_BINDING_FAILED,
    );
  });

  it("existing valid metadata → mount ready, reuse, no warning", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(saveSchoolProfileToStorage(sampleProfile(profileId))).toEqual({ ok: true });
    localStorage.setItem(
      IDENTITY_REGISTRY_LS_KEY,
      JSON.stringify({
        schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
        schoolId: profileId,
        schoolYears: [],
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    localStorage.setItem(
      APP_CONTEXT_LS_KEY,
      JSON.stringify({
        schemaVersion: 1,
        activeSchoolId: profileId,
        activeSchoolYearId: null,
      }),
    );
    const registryBefore = localStorage.getItem(IDENTITY_REGISTRY_LS_KEY);

    const outcome = await runPlatformBindingOnMount();
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted || outcome.binding.status !== "ready") return;
    expect(outcome.metadataNotice).toBeNull();
    expect(outcome.binding.schoolId).toBe(profileId);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(registryBefore);
  });

  it("R: Profile mount ready → establish 1×", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const ensure = vi.fn(async () => ({
      status: "ready" as const,
      schoolId: profileId,
      activeSchoolId: profileId,
      activeSchoolYearId: null,
      staleActiveSchoolId: false,
      staleActiveSchoolYearId: false,
    }));
    const establish = vi.fn(() => ({ status: "already_ready" as const }));
    const outcome = await runPlatformBindingOnMount(ensure, establish);
    expect(establish).toHaveBeenCalledTimes(1);
    expect(outcome.metadataNotice).toBeNull();
  });

  it("S: already_ready → zero establishment writes (silent)", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const ensure = vi.fn(async () => ({
      status: "ready" as const,
      schoolId: profileId,
      activeSchoolId: profileId,
      activeSchoolYearId: null,
      staleActiveSchoolId: false,
      staleActiveSchoolYearId: false,
    }));
    const establish = vi.fn(() => ({ status: "already_ready" as const }));
    const outcome = await runPlatformBindingOnMount(ensure, establish);
    expect(establish).toHaveBeenCalledTimes(1);
    expect(outcome.metadataNotice).toBeNull();
  });

  it("mount establishment throw → soft warning only", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const ensure = vi.fn(async () => ({
      status: "ready" as const,
      schoolId: profileId,
      activeSchoolId: profileId,
      activeSchoolYearId: null,
      staleActiveSchoolId: false,
      staleActiveSchoolYearId: false,
    }));
    const establish = vi.fn(() => {
      throw new Error("boom");
    });
    const outcome = await runPlatformBindingOnMount(ensure, establish);
    expect(outcome.metadataNotice).toBe(MSG_SCHOOL_PROFILE_PLATFORM_MOUNT_BINDING_FAILED);
  });
});
