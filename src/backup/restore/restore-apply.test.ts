import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_CONTEXT_LS_KEY } from "../../data/app-context/app-context";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../../data/identity/identity-registry-types";
import { IDENTITY_REGISTRY_LS_KEY } from "../../data/identity/identity-registry-types";
import { SCHOOL_PROFILE_LS_KEY } from "../../school-profile/school-profile-constants";
import {
  APP_BACKUP_FORMAT,
  APP_BACKUP_SCHEMA_VERSION,
  applyRestoreStorageOperations,
  applyRestoreStorageTransaction,
  prepareFreshRestorePlan,
  rollbackRestoreTouchedKeys,
  snapshotRestoreTouchedKeys,
  validateAppBackupEnvelope,
  validateRestorePlanForApply,
  type RestoreEnvironment,
  type RestorePlan,
  type RestoreTransactionStorage,
  type ValidatedAppBackupEnvelope,
} from "./index";
import { RESTORE_APP_CONTEXT_KEY } from "./restore-owned-keys";

const SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const SCHOOL_B = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
const FOREIGN_KEY = "third-party-key";

function createStorageMock(initial: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initial };
  const setItem = vi.fn((key: string, value: string) => {
    store[key] = String(value);
  });
  const removeItem = vi.fn((key: string) => {
    delete store[key];
  });
  const getItem = vi.fn((key: string) =>
    Object.prototype.hasOwnProperty.call(store, key) ? store[key]! : null,
  );
  const clear = vi.fn(() => {
    for (const key of Object.keys(store)) delete store[key];
  });

  const storage: RestoreTransactionStorage & { clear: () => void; store: Record<string, string> } = {
    store,
    getItem,
    setItem,
    removeItem,
    clear,
  };

  return { storage, setItem, removeItem, getItem, clear };
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

function sampleIdentity(schoolId: string) {
  return {
    schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
    schoolId,
    schoolYears: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
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
    throw new Error(`expected validated backup, got ${result.status}`);
  }
  return result;
}

function emptyEnv(): RestoreEnvironment {
  return { identity: { status: "missing" }, profile: { status: "missing" } };
}

function envIdentity(schoolId: string): RestoreEnvironment {
  return {
    identity: { status: "valid", schoolId },
    profile: { status: "valid", schoolId },
  };
}

describe("Restore-2A storage transaction kernel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("A: valid rebuild → storage_applied", () => {
    const { storage } = createStorageMock();
    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
    });

    const result = applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });

    expect(result.status).toBe("storage_applied");
    if (result.status !== "storage_applied") return;
    expect(storage.store[SCHOOL_PROFILE_LS_KEY]).toBeTruthy();
    expect(storage.store[IDENTITY_REGISTRY_LS_KEY]).toBeTruthy();
    expect(storage.store[APP_CONTEXT_LS_KEY]).toBeUndefined();
  });

  it("B: SET + REMOVE exact", () => {
    const { storage } = createStorageMock({
      [SCHOOL_PROFILE_LS_KEY]: JSON.stringify(sampleProfile(SCHOOL_A)),
    });
    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
      "phmax-scenario-label": modulePayload("Label", "Scénář A"),
    });

    const result = applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });

    expect(result.status).toBe("storage_applied");
    expect(storage.store["phmax-school-scenario-label"]).toBe("Scénář A");
  });

  it("C: snapshot všech touchedKeys", () => {
    const { storage } = createStorageMock({
      [APP_CONTEXT_LS_KEY]: '{"schemaVersion":1}',
    });
    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
    });
    const plan = prepareFreshRestorePlan(validated, () => emptyEnv());

    const snap = snapshotRestoreTouchedKeys(plan.touchedKeys, storage);
    expect(snap.ok).toBe(true);
    if (!snap.ok) return;
    for (const key of plan.touchedKeys) {
      expect(snap.snapshot[key]).toBeDefined();
    }
    expect(snap.snapshot[APP_CONTEXT_LS_KEY]).toEqual({
      existed: true,
      value: '{"schemaVersion":1}',
    });
  });

  it("D: AppContext side-effect key in snapshot", () => {
    const { storage } = createStorageMock({ [APP_CONTEXT_LS_KEY]: "ctx-raw" });
    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
    });
    const plan = prepareFreshRestorePlan(validated, () => emptyEnv());
    const snap = snapshotRestoreTouchedKeys(plan.touchedKeys, storage);
    expect(snap.ok).toBe(true);
    if (!snap.ok) return;
    expect(snap.snapshot[RESTORE_APP_CONTEXT_KEY]).toEqual({
      existed: true,
      value: "ctx-raw",
    });
  });

  it("E: snapshot read failure → 0 writes", () => {
    const { storage, setItem, removeItem } = createStorageMock();
    storage.getItem = vi.fn(() => {
      throw new Error("SecurityError");
    });

    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
    });

    const result = applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });

    expect(result.status).toBe("snapshot_failed");
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });

  it("F: SET failure midway → full rollback", () => {
    const originalProfile = JSON.stringify(sampleProfile(SCHOOL_A));
    const { storage, setItem } = createStorageMock({
      [SCHOOL_PROFILE_LS_KEY]: originalProfile,
      [IDENTITY_REGISTRY_LS_KEY]: JSON.stringify(sampleIdentity(SCHOOL_A)),
    });

    let setCalls = 0;
    setItem.mockImplementation((key: string, value: string) => {
      setCalls += 1;
      if (setCalls === 2) throw new Error("QuotaExceededError");
      storage.store[key] = value;
    });

    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_B)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_B)),
      "phmax-scenario-label": modulePayload("Label", "X"),
    });

    const result = applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });

    expect(result.status).toBe("rolled_back");
    expect(storage.store[SCHOOL_PROFILE_LS_KEY]).toBe(originalProfile);
    expect(storage.store["phmax-school-scenario-label"]).toBeUndefined();
  });

  it("G: REMOVE failure → full rollback", () => {
    const { storage, removeItem } = createStorageMock({
      [SCHOOL_PROFILE_LS_KEY]: JSON.stringify(sampleProfile(SCHOOL_A)),
    });

    let firstRemove = true;
    removeItem.mockImplementation((key: string) => {
      if (firstRemove) {
        firstRemove = false;
        throw new Error("remove_failed");
      }
      delete storage.store[key];
    });

    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
      "phmax-pv": modulePayload("PV", { autosave: { x: 1 } }),
    });

    const result = applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });

    expect(result.status).toBe("rolled_back");
    expect(storage.store[SCHOOL_PROFILE_LS_KEY]).toBe(JSON.stringify(sampleProfile(SCHOOL_A)));
  });

  it("H: AppContext reset failure → full rollback", () => {
    const originalProfile = JSON.stringify(sampleProfile(SCHOOL_A));
    const { storage, removeItem } = createStorageMock({
      [SCHOOL_PROFILE_LS_KEY]: originalProfile,
      [APP_CONTEXT_LS_KEY]: "ctx-before",
    });

    let removeCalls = 0;
    removeItem.mockImplementation((key: string) => {
      removeCalls += 1;
      if (key === APP_CONTEXT_LS_KEY) throw new Error("ctx_remove_failed");
      delete storage.store[key];
    });

    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_B)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_B)),
    });

    const result = applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });

    expect(result.status).toBe("rolled_back");
    expect(storage.store[SCHOOL_PROFILE_LS_KEY]).toBe(originalProfile);
    expect(storage.store[APP_CONTEXT_LS_KEY]).toBe("ctx-before");
    expect(removeCalls).toBeGreaterThan(0);
  });

  it("I: originally missing key restored as missing", () => {
    const { storage } = createStorageMock();
    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
      "phmax-scenario-label": modulePayload("Label", "X"),
    });
    const plan = prepareFreshRestorePlan(validated, () => emptyEnv());
    const snap = snapshotRestoreTouchedKeys(plan.touchedKeys, storage);
    expect(snap.ok).toBe(true);
    if (!snap.ok) return;

    applyRestoreStorageOperations(plan, storage);
    rollbackRestoreTouchedKeys(snap.snapshot, storage);

    expect(storage.store["phmax-school-scenario-label"]).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(storage.store, "phmax-school-scenario-label")).toBe(
      false,
    );
  });

  it("J: corrupted raw bytes exact rollback", () => {
    const corrupted = "{totally-invalid-json";
    const { storage } = createStorageMock({
      [SCHOOL_PROFILE_LS_KEY]: corrupted,
    });

    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
    });
    const plan = prepareFreshRestorePlan(validated, () => emptyEnv());
    const snap = snapshotRestoreTouchedKeys(plan.touchedKeys, storage);
    expect(snap.ok).toBe(true);
    if (!snap.ok) return;

    const applyResult = applyRestoreStorageOperations(plan, storage);
    expect(applyResult.ok).toBe(true);
    expect(storage.store[SCHOOL_PROFILE_LS_KEY]).not.toBe(corrupted);

    rollbackRestoreTouchedKeys(snap.snapshot, storage);
    expect(storage.store[SCHOOL_PROFILE_LS_KEY]).toBe(corrupted);
  });

  it("K: rollback failure → fatal_partial", () => {
    const { storage, setItem } = createStorageMock({
      [SCHOOL_PROFILE_LS_KEY]: JSON.stringify(sampleProfile(SCHOOL_A)),
    });

    setItem.mockImplementation((key: string, value: string) => {
      storage.store[key] = value;
    });

    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_B)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_B)),
    });
    const plan = prepareFreshRestorePlan(validated, () => emptyEnv());
    const snap = snapshotRestoreTouchedKeys(plan.touchedKeys, storage);
    expect(snap.ok).toBe(true);
    if (!snap.ok) return;

    applyRestoreStorageOperations(plan, storage);

    let rollbackSetCalls = 0;
    setItem.mockImplementation((key: string, value: string) => {
      rollbackSetCalls += 1;
      if (key === SCHOOL_PROFILE_LS_KEY && rollbackSetCalls === 1) {
        throw new Error("rollback_failed");
      }
      storage.store[key] = value;
    });

    const rollback = rollbackRestoreTouchedKeys(snap.snapshot, storage);
    expect(rollback.ok).toBe(false);
    if (rollback.ok) return;
    expect(rollback.failedKeys).toContain(SCHOOL_PROFILE_LS_KEY);
  });

  it("L: rollback continues after one failure", () => {
    const { storage, setItem } = createStorageMock({
      [SCHOOL_PROFILE_LS_KEY]: "profile-a",
      [IDENTITY_REGISTRY_LS_KEY]: "identity-a",
    });

    const snapshot = {
      [SCHOOL_PROFILE_LS_KEY]: { existed: true as const, value: "profile-a" },
      [IDENTITY_REGISTRY_LS_KEY]: { existed: true as const, value: "identity-a" },
      [APP_CONTEXT_LS_KEY]: { existed: false as const },
    };

    storage.store[SCHOOL_PROFILE_LS_KEY] = "mutated";
    storage.store[IDENTITY_REGISTRY_LS_KEY] = "mutated";

    let calls = 0;
    setItem.mockImplementation((key: string, value: string) => {
      calls += 1;
      if (key === SCHOOL_PROFILE_LS_KEY) throw new Error("k1_fail");
      storage.store[key] = value;
    });

    const result = rollbackRestoreTouchedKeys(snapshot, storage);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failedKeys).toEqual([SCHOOL_PROFILE_LS_KEY]);
    expect(storage.store[IDENTITY_REGISTRY_LS_KEY]).toBe("identity-a");
    expect(calls).toBeGreaterThan(1);
  });

  it("M: foreign key untouched", () => {
    const { storage, getItem } = createStorageMock({ [FOREIGN_KEY]: "foreign-value" });
    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
    });

    applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });

    expect(storage.store[FOREIGN_KEY]).toBe("foreign-value");
    for (const call of getItem.mock.calls) {
      expect(call[0]).not.toBe(FOREIGN_KEY);
    }
  });

  it("N: no localStorage.clear()", () => {
    const { storage, clear } = createStorageMock();
    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
    });

    applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });

    expect(clear).not.toHaveBeenCalled();
  });

  it("O: stale cross-school drift → 0 writes", () => {
    const { storage, setItem, removeItem } = createStorageMock();
    const validated = validatedBackup({
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
    });

    const result = applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => envIdentity(SCHOOL_B),
    });

    expect(result.status).toBe("rejected_plan");
    if (result.status !== "rejected_plan") return;
    expect(result.reason).toBe("fresh_plan_blocked");
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });

  it("P: storage unavailable → 0 writes", () => {
    const result = applyRestoreStorageTransaction(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
      { storage: null as unknown as RestoreTransactionStorage },
    );
    expect(result.status).toBe("snapshot_failed");
  });

  it("Q: operations=[] and no AppContext reset → no_storage_changes", () => {
    const { storage, setItem } = createStorageMock();
    const validated = validatedBackup({});
    const result = applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });
    expect(result.status).toBe("no_storage_changes");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("R: retry after rolled_back", () => {
    const { storage, setItem } = createStorageMock({
      [SCHOOL_PROFILE_LS_KEY]: JSON.stringify(sampleProfile(SCHOOL_A)),
    });

    let failOnce = true;
    setItem.mockImplementation((key: string, value: string) => {
      if (failOnce && key === SCHOOL_PROFILE_LS_KEY) {
        failOnce = false;
        throw new Error("transient");
      }
      storage.store[key] = value;
    });

    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_B)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_B)),
    });

    const first = applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });
    expect(first.status).toBe("rolled_back");

    setItem.mockImplementation((key: string, value: string) => {
      storage.store[key] = value;
    });

    const second = applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });
    expect(second.status).toBe("storage_applied");
  });

  it("S: touchedKeys incomplete → rejected before snapshot/write", () => {
    const plan: RestorePlan = {
      envelope: { schemaVersion: 1, exportedAt: "2026-01-01T00:00:00.000Z" },
      modules: [],
      operations: [
        {
          action: "set",
          storage: "localStorage",
          key: SCHOOL_PROFILE_LS_KEY,
          serializedValue: "{}",
          moduleId: "school-profile",
        },
      ],
      warnings: [],
      conflict: null,
      platform: {
        requiresAppContextReset: false,
        requiresIdentityBootstrap: false,
        requiresPlatformReconcile: false,
        requiresVzSchoolYearReconcile: false,
      },
      touchedKeys: [],
      sameSchool: null,
      canApply: true,
      expectedScenarioLabelTarget: null,
    };

    const validation = validateRestorePlanForApply(plan);
    expect(validation.ok).toBe(false);
    if (validation.ok) return;
    expect(validation.reason).toBe("touched_keys_incomplete");
  });

  it("T: unowned operation key → rejected before write", () => {
    const plan: RestorePlan = {
      envelope: { schemaVersion: 1, exportedAt: "2026-01-01T00:00:00.000Z" },
      modules: [],
      operations: [
        {
          action: "set",
          storage: "localStorage",
          key: FOREIGN_KEY,
          serializedValue: "1",
          moduleId: "school-profile",
        },
      ],
      warnings: [],
      conflict: null,
      platform: {
        requiresAppContextReset: false,
        requiresIdentityBootstrap: false,
        requiresPlatformReconcile: false,
        requiresVzSchoolYearReconcile: false,
      },
      touchedKeys: [FOREIGN_KEY],
      sameSchool: null,
      canApply: true,
      expectedScenarioLabelTarget: null,
    };

    const validation = validateRestorePlanForApply(plan);
    expect(validation.ok).toBe(false);
    if (validation.ok) return;
    expect(validation.reason).toBe("unowned_operation_key");
  });

  it("fatal_partial via orchestration when rollback fails", () => {
    const { storage, setItem } = createStorageMock({
      [SCHOOL_PROFILE_LS_KEY]: JSON.stringify(sampleProfile(SCHOOL_A)),
    });

    const validated = validatedBackup({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_B)),
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_B)),
    });

    let phase: "apply" | "rollback" = "apply";
    setItem.mockImplementation((key: string, value: string) => {
      if (phase === "apply") {
        storage.store[key] = value;
        if (key === IDENTITY_REGISTRY_LS_KEY) {
          phase = "rollback";
          throw new Error("apply_fail_after_partial");
        }
        return;
      }
      if (key === SCHOOL_PROFILE_LS_KEY) throw new Error("rollback_fail");
      storage.store[key] = value;
    });

    const result = applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });

    expect(result.status).toBe("fatal_partial");
    if (result.status !== "fatal_partial") return;
    expect(result.failedRollbackKeys).toContain(SCHOOL_PROFILE_LS_KEY);
  });

  it("AppContext key must be in touchedKeys when reset required", () => {
    const plan: RestorePlan = {
      envelope: { schemaVersion: 1, exportedAt: "2026-01-01T00:00:00.000Z" },
      modules: [],
      operations: [],
      warnings: [],
      conflict: null,
      platform: {
        requiresAppContextReset: true,
        requiresIdentityBootstrap: false,
        requiresPlatformReconcile: false,
        requiresVzSchoolYearReconcile: false,
      },
      touchedKeys: [],
      sameSchool: null,
      canApply: true,
      expectedScenarioLabelTarget: null,
    };

    const validation = validateRestorePlanForApply(plan);
    expect(validation.ok).toBe(false);
    if (validation.ok) return;
    expect(validation.reason).toBe("platform_side_effect_key_missing");
  });

  it("AppContext cannot be operation target", () => {
    const plan: RestorePlan = {
      envelope: { schemaVersion: 1, exportedAt: "2026-01-01T00:00:00.000Z" },
      modules: [],
      operations: [
        {
          action: "set",
          storage: "localStorage",
          key: RESTORE_APP_CONTEXT_KEY,
          serializedValue: "{}",
          moduleId: "identity-registry",
        },
      ],
      warnings: [],
      conflict: null,
      platform: {
        requiresAppContextReset: false,
        requiresIdentityBootstrap: false,
        requiresPlatformReconcile: false,
        requiresVzSchoolYearReconcile: false,
      },
      touchedKeys: [RESTORE_APP_CONTEXT_KEY],
      sameSchool: null,
      canApply: true,
      expectedScenarioLabelTarget: null,
    };

    const validation = validateRestorePlanForApply(plan);
    expect(validation.ok).toBe(false);
    if (validation.ok) return;
    expect(validation.reason).toBe("unowned_operation_key");
  });
});
