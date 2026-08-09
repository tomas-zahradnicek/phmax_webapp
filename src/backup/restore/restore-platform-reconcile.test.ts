import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_CONTEXT_LS_KEY, readAppContext } from "../../data/app-context/app-context";
import { readIdentityRegistry } from "../../data/identity/identity-registry-storage";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../../data/identity/identity-registry-types";
import { IDENTITY_REGISTRY_LS_KEY } from "../../data/identity/identity-registry-types";
import { SCHOOL_PROFILE_LS_KEY } from "../../school-profile/school-profile-constants";
import {
  APP_BACKUP_FORMAT,
  APP_BACKUP_SCHEMA_VERSION,
  applyAppBackupRestore,
  validateAppBackupEnvelope,
  type RestorePlan,
  type RestoreTransactionContext,
  type ValidatedAppBackupEnvelope,
} from "./index";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "./restore-owned-keys";

const SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const SCHOOL_B = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
const YEAR_ID = "cccccccc-dddd-4eee-8fff-000000000000";
const FOREIGN_KEY = "third-party-foreign-key";

function createLocalStorageMock(initial: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initial };
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
    name: "ZŠ Restore",
    ico: "12345678",
    redIzo: "600123456",
    izo: "102345678",
    schoolType: "Základní škola",
    address: "Hlavní 1",
    municipality: "Praha",
    region: "Hlavní město Praha",
    founder: "Město",
    principalName: "Jan Novák",
    website: "https://skola.cz",
    email: "a@b.cz",
    phone: "123",
    dataBox: "abcdefg",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  };
}

function sampleIdentity(schoolId: string, startYear?: number) {
  return {
    schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
    schoolId,
    schoolYears:
      startYear == null
        ? []
        : [{ id: YEAR_ID, schoolId, startYear }],
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function sampleVzMain(schoolYear = "2026/2027") {
  return {
    version: 1,
    report: {
      schoolYear,
      sections: [{ id: "01", title: "Základní údaje" }],
    },
    selectedSectionId: "01",
  };
}

function modulePayload(label: string, data: unknown) {
  return {
    label,
    schemaVersion: 1,
    exportedAt: "2026-08-08T12:00:00.000Z",
    data,
  };
}

function envelope(modules: Record<string, ReturnType<typeof modulePayload>>) {
  return {
    format: APP_BACKUP_FORMAT,
    schemaVersion: APP_BACKUP_SCHEMA_VERSION,
    exportedAt: "2026-08-08T12:00:00.000Z",
    modules,
  };
}

function validatedBackup(
  modules: Record<string, ReturnType<typeof modulePayload>>,
): ValidatedAppBackupEnvelope {
  const result = validateAppBackupEnvelope(envelope(modules));
  if (result.status !== "validated") {
    throw new Error(`expected validated, got ${result.status}`);
  }
  return result;
}

describe("Restore-2B platform reconcile + verification", () => {
  let ls: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    ls = createLocalStorageMock();
    vi.stubGlobal("localStorage", ls);
    vi.stubGlobal("sessionStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("A: business-only PHmax → success without School/VZ helpers", async () => {
    const ensureSchool = vi.fn(async () => ({ status: "empty" as const }));
    const ensureVzYear = vi.fn(async () => ({ status: "empty" as const }));

    const result = await applyAppBackupRestore(
      validatedBackup({
        "phmax-scenario-label": modulePayload("Label", "Scénář A"),
      }),
      { ensureSchool, ensureVzYear },
    );

    expect(result.status).toBe("success");
    expect(ensureSchool).not.toHaveBeenCalled();
    expect(ensureVzYear).not.toHaveBeenCalled();
    expect(ls.store[PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]).toBe("Scénář A");
    expect(ls.store[IDENTITY_REGISTRY_LS_KEY]).toBeUndefined();
    expect(ls.store[APP_CONTEXT_LS_KEY]).toBeUndefined();
  });

  it("B: modern full restore → Identity A + AppContext + year 2026", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "annual-report": modulePayload("VZ", { main: sampleVzMain("2026/2027") }),
      }),
    );

    expect(result.status).toBe("success");
    const identity = readIdentityRegistry();
    expect(identity.ok).toBe(true);
    if (!identity.ok || !identity.registry) return;
    expect(identity.registry.schoolId).toBe(SCHOOL_A);
    expect(identity.registry.schoolYears.some((y) => y.startYear === 2026)).toBe(true);

    const ctx = readAppContext();
    expect(ctx.ok).toBe(true);
    if (!ctx.ok || !ctx.context) return;
    expect(ctx.context.activeSchoolId).toBe(SCHOOL_A);
    const year = identity.registry.schoolYears.find((y) => y.startYear === 2026);
    expect(ctx.context.activeSchoolYearId).toBe(year?.id);
  });

  it("C: legacy full restore → Identity bootstrap + year bound", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "annual-report": modulePayload("VZ", { main: sampleVzMain("2025/2026") }),
      }),
    );

    expect(result.status).toBe("success");
    const identity = readIdentityRegistry();
    expect(identity.ok).toBe(true);
    if (!identity.ok || !identity.registry) return;
    expect(identity.registry.schoolId).toBe(SCHOOL_A);
    expect(identity.registry.schoolYears.some((y) => y.startYear === 2025)).toBe(true);

    const ctx = readAppContext();
    expect(ctx.ok && ctx.context?.activeSchoolId).toBe(SCHOOL_A);
  });

  it("D: same-school restore → success; rollback restores original local snapshot", async () => {
    ls.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(SCHOOL_A)));
    ls.setItem(IDENTITY_REGISTRY_LS_KEY, JSON.stringify(sampleIdentity(SCHOOL_A, 2024)));
    ls.setItem(
      APP_CONTEXT_LS_KEY,
      JSON.stringify({
        schemaVersion: 1,
        activeSchoolId: SCHOOL_A,
        activeSchoolYearId: YEAR_ID,
      }),
    );
    const originalIdentity = ls.getItem(IDENTITY_REGISTRY_LS_KEY);

    const success = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "annual-report": modulePayload("VZ", { main: sampleVzMain("2026/2027") }),
      }),
    );
    expect(success.status).toBe("success");

    // Re-seed local A and force reconcile failure → rollback to original local bytes.
    ls.setItem(IDENTITY_REGISTRY_LS_KEY, originalIdentity!);
    const originalProfile = JSON.stringify(sampleProfile(SCHOOL_A));
    ls.setItem(SCHOOL_PROFILE_LS_KEY, originalProfile);

    const failed = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
      }),
      {
        ensureSchool: async () => ({
          status: "error",
          reason: "platform_failure",
          detail: "forced",
        }),
      },
    );
    expect(failed.status).toBe("rolled_back");
    if (failed.status !== "rolled_back") return;
    expect(failed.failurePhase).toBe("school_reconcile");
    expect(ls.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(originalProfile);
    expect(ls.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(originalIdentity);
  });

  it("E: School reconcile error → rolled_back / school_reconcile", async () => {
    const original = JSON.stringify(sampleProfile(SCHOOL_A));
    ls.setItem(SCHOOL_PROFILE_LS_KEY, original);

    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_B)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_B)),
      }),
      {
        ensureSchool: async () => ({
          status: "error",
          reason: "storage_unavailable",
        }),
      },
    );

    expect(result).toEqual({
      status: "rolled_back",
      failurePhase: "school_reconcile",
      cause: "storage_unavailable",
    });
    expect(ls.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(original);
  });

  it("F: VZ reconcile error → rolled_back / vz_reconcile", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "annual-report": modulePayload("VZ", { main: sampleVzMain("2026/2027") }),
      }),
      {
        ensureVzYear: async () => ({
          status: "error",
          reason: "platform_failure",
          detail: "vz_fail",
        }),
      },
    );

    expect(result.status).toBe("rolled_back");
    if (result.status !== "rolled_back") return;
    expect(result.failurePhase).toBe("vz_reconcile");
    expect(ls.getItem(SCHOOL_PROFILE_LS_KEY)).toBeNull();
  });

  it("G: verification error → rolled_back / verification", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
      }),
      {
        ensureSchool: async () => ({
          status: "ready",
          schoolId: SCHOOL_A,
          activeSchoolId: SCHOOL_A,
          activeSchoolYearId: null,
          staleActiveSchoolId: false,
          staleActiveSchoolYearId: false,
        }),
        verify: () => ({ ok: false, detail: "forced_verification_fail" }),
      },
    );

    expect(result).toEqual({
      status: "rolled_back",
      failurePhase: "verification",
      cause: "forced_verification_fail",
    });
  });

  it("H/I: rollback failure after reconcile error → fatal_partial", async () => {
    const storage = {
      getItem: (key: string) => ls.getItem(key),
      setItem: (key: string, value: string) => {
        if (key === SCHOOL_PROFILE_LS_KEY && value.includes(SCHOOL_A)) {
          throw new Error("rollback_blocked");
        }
        ls.setItem(key, value);
      },
      removeItem: (key: string) => ls.removeItem(key),
    };

    ls.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(SCHOOL_A)));

    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_B)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_B)),
      }),
      {
        storage,
        ensureSchool: async () => ({
          status: "error",
          reason: "platform_failure",
        }),
      },
    );

    expect(result.status).toBe("fatal_partial");
    if (result.status !== "fatal_partial") return;
    expect(result.failurePhase).toBe("school_reconcile");
    expect(result.failedRollbackKeys).toContain(SCHOOL_PROFILE_LS_KEY);
  });

  it("J/K: empty/invalid VZ year → no fake SchoolYear", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "annual-report": modulePayload("VZ", { main: sampleVzMain("") }),
      }),
    );

    expect(result.status).toBe("success");
    const identity = readIdentityRegistry();
    expect(identity.ok && identity.registry?.schoolYears).toEqual([]);
    const ctx = readAppContext();
    expect(ctx.ok && ctx.context?.activeSchoolYearId).toBeNull();
  });

  it("L: valid VZ year → matching Identity year + active pointer", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "annual-report": modulePayload("VZ", { main: sampleVzMain("2026/2027") }),
      }),
    );
    expect(result.status).toBe("success");

    const identity = readIdentityRegistry();
    const ctx = readAppContext();
    if (!identity.ok || !identity.registry || !ctx.ok || !ctx.context) return;
    const year = identity.registry.schoolYears.find((y) => y.startYear === 2026);
    expect(year).toBeTruthy();
    expect(ctx.context.activeSchoolYearId).toBe(year!.id);
    expect(year!.schoolId).toBe(SCHOOL_A);
  });

  it("M: Identity.schoolId ≠ Profile.id legacy mismatch allowed", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile("legacy-school-1")),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
      }),
    );

    expect(result.status).toBe("success");
    const identity = readIdentityRegistry();
    expect(identity.ok && identity.registry?.schoolId).toBe(SCHOOL_A);
    expect(JSON.parse(ls.getItem(SCHOOL_PROFILE_LS_KEY)!).id).toBe("legacy-school-1");
    const ctx = readAppContext();
    expect(ctx.ok && ctx.context?.activeSchoolId).toBe(SCHOOL_A);
  });

  it("N: School expected → activeSchoolId === Identity.schoolId", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
      }),
    );
    expect(result.status).toBe("success");
    const identity = readIdentityRegistry();
    const ctx = readAppContext();
    expect(ctx.ok && ctx.context?.activeSchoolId).toBe(
      identity.ok ? identity.registry?.schoolId : null,
    );
  });

  it("O: activeSchoolYear ownership invariant", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "annual-report": modulePayload("VZ", { main: sampleVzMain("2026/2027") }),
      }),
    );
    expect(result.status).toBe("success");
    const identity = readIdentityRegistry();
    const ctx = readAppContext();
    if (!identity.ok || !identity.registry || !ctx.ok || !ctx.context?.activeSchoolYearId) return;
    const year = identity.registry.schoolYears.find(
      (y) => y.id === ctx.context!.activeSchoolYearId,
    );
    expect(year?.schoolId).toBe(ctx.context.activeSchoolId);
  });

  it("P: no_storage_changes → final no_changes, no helpers", async () => {
    const ensureSchool = vi.fn(async () => ({ status: "empty" as const }));
    const ensureVzYear = vi.fn(async () => ({ status: "empty" as const }));

    const result = await applyAppBackupRestore(validatedBackup({}), {
      ensureSchool,
      ensureVzYear,
    });

    expect(result.status).toBe("no_changes");
    expect(ensureSchool).not.toHaveBeenCalled();
    expect(ensureVzYear).not.toHaveBeenCalled();
  });

  it("Q: defensive inconsistent no_storage_changes + platform flags → reject", async () => {
    const fakePlan: RestorePlan = {
      envelope: { schemaVersion: 1, exportedAt: "2026-01-01T00:00:00.000Z" },
      modules: [],
      operations: [],
      warnings: [],
      conflict: null,
      platform: {
        requiresAppContextReset: true,
        requiresIdentityBootstrap: false,
        requiresPlatformReconcile: true,
        requiresVzSchoolYearReconcile: false,
      },
      touchedKeys: [],
      sameSchool: null,
      canApply: true,
      expectedScenarioLabelTarget: null,
    };
    const transaction: RestoreTransactionContext = { plan: fakePlan, snapshot: {} };

    const result = await applyAppBackupRestore(validatedBackup({}), {
      applyStorageTransaction: () => ({
        status: "no_storage_changes",
        transaction,
      }),
      ensureSchool: async () => {
        throw new Error("must_not_run");
      },
    });

    expect(result).toEqual({
      status: "rejected_plan",
      reason: "inconsistent_no_storage_changes",
      detail: "platform_work_without_snapshot",
    });
  });

  it("R: verification required read failure → rollback", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
      }),
      {
        ensureSchool: async () => ({
          status: "ready",
          schoolId: SCHOOL_A,
          activeSchoolId: SCHOOL_A,
          activeSchoolYearId: null,
          staleActiveSchoolId: false,
          staleActiveSchoolYearId: false,
        }),
        verifyDependencies: {
          readIdentity: () => {
            throw new Error("read_boom");
          },
        },
      },
    );

    expect(result.status).toBe("rolled_back");
    if (result.status !== "rolled_back") return;
    expect(result.failurePhase).toBe("verification");
  });

  it("S: foreign key untouched through success + rollback paths", async () => {
    ls.setItem(FOREIGN_KEY, "keep-me");

    const ok = await applyAppBackupRestore(
      validatedBackup({
        "phmax-scenario-label": modulePayload("Label", "X"),
      }),
    );
    expect(ok.status).toBe("success");
    expect(ls.getItem(FOREIGN_KEY)).toBe("keep-me");

    const rolled = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
      }),
      {
        ensureSchool: async () => ({
          status: "error",
          reason: "platform_failure",
        }),
      },
    );
    expect(rolled.status).toBe("rolled_back");
    expect(ls.getItem(FOREIGN_KEY)).toBe("keep-me");
  });

  it("T: engine source does not call reload / location assignment", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const file = path.join(
      process.cwd(),
      "src/backup/restore/apply-app-backup-restore.ts",
    );
    const source = await fs.readFile(file, "utf8");
    expect(source).not.toMatch(/\blocation\.reload\s*\(/);
    expect(source).not.toMatch(/\blocation\.href\s*=/);
    expect(source).not.toMatch(/\bwindow\.location\b/);
  });

  it("double year path: ensureSchool bootstrap year + ensureVz reuse same yearId", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "annual-report": modulePayload("VZ", { main: sampleVzMain("2026/2027") }),
      }),
    );
    expect(result.status).toBe("success");

    const identity = readIdentityRegistry();
    expect(identity.ok).toBe(true);
    if (!identity.ok || !identity.registry) return;
    const years2026 = identity.registry.schoolYears.filter((y) => y.startYear === 2026);
    expect(years2026).toHaveLength(1);
  });

  it("requiresIdentityBootstrap + ensureSchool empty → rollback", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
      {
        ensureSchool: async () => ({ status: "empty" }),
      },
    );
    expect(result.status).toBe("rolled_back");
    if (result.status !== "rolled_back") return;
    expect(result.failurePhase).toBe("school_reconcile");
  });

  it("cross-school rejected before platform phase", async () => {
    ls.setItem(IDENTITY_REGISTRY_LS_KEY, JSON.stringify(sampleIdentity(SCHOOL_B)));
    ls.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(SCHOOL_B)));

    const ensureSchool = vi.fn(async () => ({ status: "empty" as const }));
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
      }),
      { ensureSchool },
    );

    expect(result.status).toBe("rejected_plan");
    expect(ensureSchool).not.toHaveBeenCalled();
  });

  it("does not call ensureSchool for annual-report when only VZ path (ensureVz covers school)", async () => {
    const ensureSchool = vi.fn(async () => ({ status: "empty" as const }));
    const ensureVzYear = vi.fn(async () => ({
      status: "ready" as const,
      schoolId: SCHOOL_A,
      schoolYearId: YEAR_ID,
      startYear: 2026,
    }));

    // Inject verify to accept schoolReady from VZ path without real AppContext writes.
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "annual-report": modulePayload("VZ", { main: sampleVzMain("2026/2027") }),
      }),
      {
        ensureSchool,
        ensureVzYear,
        verify: () => ({ ok: true }),
      },
    );

    expect(result.status).toBe("success");
    expect(ensureVzYear).toHaveBeenCalledTimes(1);
    expect(ensureSchool).not.toHaveBeenCalled();
  });

  it("VZ empty with Profile SET is unexpected → rollback", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "annual-report": modulePayload("VZ", { main: sampleVzMain("2026/2027") }),
      }),
      {
        ensureVzYear: async () => ({ status: "empty" }),
      },
    );
    expect(result.status).toBe("rolled_back");
    if (result.status !== "rolled_back") return;
    expect(result.failurePhase).toBe("vz_reconcile");
  });

  it("source documents Dashboard-only / multi-tab / crash limitations", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const source = await fs.readFile(
      path.join(process.cwd(), "src/backup/restore/apply-app-backup-restore.ts"),
      "utf8",
    );
    expect(source).toMatch(/Dashboard-only/);
    expect(source).toMatch(/multi-tab|Multi-tab/);
    expect(source).toMatch(/crash|in-memory snapshot/i);
  });

});
