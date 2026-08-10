import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyAppBackupRestore } from "../../../backup/restore/apply-app-backup-restore";
import { buildAppBackupRestorePlan } from "../../../backup/restore/build-app-backup-restore-plan";
import { validateAppBackupEnvelope } from "../../../backup/restore/validate-app-backup";
import { validateRestorePlanForApply } from "../../../backup/restore/validate-restore-plan-for-apply";
import { applyRestoreStorageTransaction } from "../../../backup/restore/apply-restore-storage-transaction";
import { rollbackRestoreTouchedKeys } from "../../../backup/restore/rollback-restore-touched-keys";
import { snapshotRestoreTouchedKeys } from "../../../backup/restore/snapshot-restore-touched-keys";
import type { RestoreEnvironment, RestorePlan } from "../../../backup/restore/restore-types";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { SCHOOL_PROFILE_LS_KEY } from "../../../school-profile/school-profile-constants";
import { IDENTITY_REGISTRY_LS_KEY } from "../../identity/identity-registry-types";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { isAllowedScenarioLabelRestoreDynamicKey } from "./scenario-label-restore-ops";
import { resolveScenarioLabelRestoreShadowPlan } from "./scenario-label-restore-target";

const SCHOOL_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SCHOOL_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const NON_UUID_PROFILE_ID = "legacy-school-id";

function emptyEnv(): RestoreEnvironment {
  return {
    identity: { status: "missing" },
    profile: { status: "missing" },
  };
}

function modulePayload(label: string, data: unknown) {
  return {
    label,
    schemaVersion: 1,
    exportedAt: "2026-01-01T00:00:00.000Z",
    data,
  };
}

function envelope(modules: Record<string, unknown>) {
  return {
    format: "reditelsky-pruvodce-backup",
    schemaVersion: 1,
    exportedAt: "2026-01-01T00:00:00.000Z",
    appVersion: "test",
    modules,
  };
}

function sampleIdentity(schoolId: string) {
  return {
    schemaVersion: 1,
    schoolId,
    schoolYears: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function sampleProfile(id: string) {
  return {
    id,
    name: "Škola",
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
}

describe("scenario-label Restore N2-WRITE", () => {
  it("T: scenario-only + empty → legacy + unbound + marker", () => {
    const validated = validateAppBackupEnvelope(
      envelope({ "phmax-scenario-label": modulePayload("Label", "Scénář A") }),
    );
    if (validated.status !== "validated") throw new Error("expected validated");
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.canApply).toBe(true);
    expect(plan.expectedScenarioLabelTarget).toEqual({ kind: "unbound" });
    expect(plan.operations).toHaveLength(3);
    expect(plan.operations.map((o) => o.key).sort()).toEqual(
      [
        PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
        buildScenarioLabelNamespacedKey({ kind: "unbound" }),
        serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" }),
      ].sort(),
    );
    expect(plan.platform.requiresIdentityBootstrap).toBe(false);
    expect(plan.platform.requiresAppContextReset).toBe(false);
  });

  it("U: modern full Identity A + empty → school:A, no unbound op", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "phmax-scenario-label": modulePayload("Label", "NEW"),
      }),
    );
    if (validated.status !== "validated") throw new Error("expected validated");
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.canApply).toBe(true);
    expect(plan.expectedScenarioLabelTarget).toEqual({ kind: "school", schoolId: SCHOOL_A });
    const scenarioOps = plan.operations.filter((o) => o.moduleId === "phmax-scenario-label");
    expect(scenarioOps).toHaveLength(3);
    expect(scenarioOps.some((o) => o.key.includes(":unbound:"))).toBe(false);
    expect(
      scenarioOps.some(
        (o) => o.key === buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A }),
      ),
    ).toBe(true);
  });

  it("V: same-school A → school:A", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "phmax-scenario-label": modulePayload("Label", "NEW"),
      }),
    );
    if (validated.status !== "validated") throw new Error("expected validated");
    const plan = buildAppBackupRestorePlan(validated, {
      identity: { status: "valid", schoolId: SCHOOL_A },
      profile: { status: "missing" },
    });
    expect(plan.canApply).toBe(true);
    expect(plan.sameSchool).toBe(true);
    expect(plan.expectedScenarioLabelTarget).toEqual({ kind: "school", schoolId: SCHOOL_A });
  });

  it("W: cross-school blocked", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_B)),
        "phmax-scenario-label": modulePayload("Label", "NEW"),
      }),
    );
    if (validated.status !== "validated") throw new Error("expected validated");
    const plan = buildAppBackupRestorePlan(validated, {
      identity: { status: "valid", schoolId: SCHOOL_A },
      profile: { status: "missing" },
    });
    expect(plan.canApply).toBe(false);
    expect(plan.conflict?.kind).toBe("cross_school");
    expect(plan.operations).toHaveLength(0);
    expect(plan.expectedScenarioLabelTarget).toBeNull();
  });

  it("X: Profile canonical UUID / no Identity → school:Profile.id", () => {
    expect(
      resolveScenarioLabelRestoreShadowPlan({
        backupIdentity: null,
        identityModuleStatus: "missing",
        backupProfileId: SCHOOL_A,
      }),
    ).toEqual({ mode: "shadow", target: { kind: "school", schoolId: SCHOOL_A } });

    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "phmax-scenario-label": modulePayload("Label", "NEW"),
      }),
    );
    if (validated.status !== "validated") throw new Error("expected validated");
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.expectedScenarioLabelTarget).toEqual({ kind: "school", schoolId: SCHOOL_A });
    const scenarioOps = plan.operations.filter((o) => o.moduleId === "phmax-scenario-label");
    expect(scenarioOps).toHaveLength(3);
    expect(scenarioOps.some((o) => o.key.includes(":unbound:"))).toBe(false);
  });

  it("Y: Profile non-UUID / no Identity → legacy-only", () => {
    expect(
      resolveScenarioLabelRestoreShadowPlan({
        backupIdentity: null,
        identityModuleStatus: "missing",
        backupProfileId: NON_UUID_PROFILE_ID,
      }),
    ).toEqual({ mode: "legacy_only" });

    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(NON_UUID_PROFILE_ID)),
        "phmax-scenario-label": modulePayload("Label", "NEW"),
      }),
    );
    if (validated.status !== "validated") throw new Error("expected validated");
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    const scenarioOps = plan.operations.filter((o) => o.moduleId === "phmax-scenario-label");
    expect(scenarioOps).toHaveLength(1);
    expect(scenarioOps[0]?.key).toBe(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
    expect(plan.expectedScenarioLabelTarget).toBeNull();
  });

  it("Z: scenario validator still rejects empty/whitespace", () => {
    for (const data of ["", "   "]) {
      const validated = validateAppBackupEnvelope(
        envelope({ "phmax-scenario-label": modulePayload("Label", data) }),
      );
      if (validated.status !== "validated") throw new Error("expected validated envelope");
      const plan = buildAppBackupRestorePlan(validated, emptyEnv());
      expect(plan.canApply).toBe(false);
    }
  });

  it("AA: module missing → zero scenario ops / preserve", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
    );
    if (validated.status !== "validated") throw new Error("expected validated");
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.operations.every((o) => o.moduleId !== "phmax-scenario-label")).toBe(true);
    const scenarioModule = plan.modules.find((m) => m.moduleId === "phmax-scenario-label");
    expect(scenarioModule?.kind).toBe("missing_preserve");
  });

  it("AB: touchedKeys includes legacy+v2+marker", () => {
    const validated = validateAppBackupEnvelope(
      envelope({ "phmax-scenario-label": modulePayload("Label", "Scénář A") }),
    );
    if (validated.status !== "validated") throw new Error("expected validated");
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    for (const op of plan.operations) {
      expect(plan.touchedKeys).toContain(op.key);
    }
  });

  it("AC/AD: other-school shadow/marker rejected", () => {
    const expected = { kind: "school" as const, schoolId: SCHOOL_A };
    expect(
      isAllowedScenarioLabelRestoreDynamicKey(
        buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_B }),
        expected,
      ),
    ).toBe(false);
    expect(
      isAllowedScenarioLabelRestoreDynamicKey(
        serializeScenarioLabelMigrationMarkerKey({ kind: "school", schoolId: SCHOOL_B }),
        expected,
      ),
    ).toBe(false);

    const plan: RestorePlan = {
      envelope: { schemaVersion: 1, exportedAt: "2026-01-01T00:00:00.000Z" },
      modules: [],
      operations: [
        {
          action: "set",
          storage: "localStorage",
          key: buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_B }),
          serializedValue: "X",
          moduleId: "phmax-scenario-label",
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
      touchedKeys: [
        buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_B }),
      ],
      sameSchool: null,
      canApply: true,
      expectedScenarioLabelTarget: expected,
      scenarioLabelRequiresNamespacedFence: false,
      scenarioLabelRequiresNamespacedFence: false,
    };
    const validation = validateRestorePlanForApply(plan);
    expect(validation.ok).toBe(false);
    if (!validation.ok) expect(validation.reason).toBe("unowned_operation_key");
  });

  it("AE: rollback restores raw legacy/v2/marker byte-for-byte", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size;
      },
    };

    const legacy = PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY;
    const v2 = buildScenarioLabelNamespacedKey({ kind: "unbound" });
    const marker = serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" });
    store.set(legacy, "OLD-L");
    store.set(v2, "OLD-V");
    store.set(marker, "OLD-M-raw-not-json");

    const snap = snapshotRestoreTouchedKeys([legacy, v2, marker], storage);
    expect(snap.ok).toBe(true);
    if (!snap.ok) return;
    store.set(legacy, "NEW-L");
    store.set(v2, "NEW-V");
    store.set(marker, "NEW-M");
    const rollback = rollbackRestoreTouchedKeys(snap.snapshot, storage);
    expect(rollback.ok).toBe(true);
    expect(store.get(legacy)).toBe("OLD-L");
    expect(store.get(v2)).toBe("OLD-V");
    expect(store.get(marker)).toBe("OLD-M-raw-not-json");
  });

  it("AF: business-only restore does not bootstrap Identity/AppContext", () => {
    const validated = validateAppBackupEnvelope(
      envelope({ "phmax-scenario-label": modulePayload("Label", "Only") }),
    );
    if (validated.status !== "validated") throw new Error("expected validated");
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.platform.requiresIdentityBootstrap).toBe(false);
    expect(plan.platform.requiresAppContextReset).toBe(false);
    expect(plan.platform.requiresPlatformReconcile).toBe(false);
    expect(plan.operations.every((o) => o.key !== IDENTITY_REGISTRY_LS_KEY)).toBe(true);
    expect(plan.operations.every((o) => o.key !== SCHOOL_PROFILE_LS_KEY)).toBe(true);
  });

  it("apply transaction writes all three keys for scenario-only", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size;
      },
    };

    const validated = validateAppBackupEnvelope(
      envelope({ "phmax-scenario-label": modulePayload("Label", "Round") }),
    );
    if (validated.status !== "validated") throw new Error("expected validated");

    const result = applyRestoreStorageTransaction(validated, {
      storage,
      readEnvironment: () => emptyEnv(),
    });
    expect(result.status).toBe("storage_applied");
    expect(store.get(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("Round");
    expect(store.get(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBe("Round");
    expect(store.has(serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" }))).toBe(true);
  });
});

describe("scenario-label Restore N2-HARDEN transaction rollback", () => {
  function createStorage(initial: Record<string, string> = {}) {
    const store = new Map<string, string>(Object.entries(initial));
    return {
      store,
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size;
      },
    };
  }

  beforeEach(() => {
    vi.stubGlobal("sessionStorage", createStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("S: applyAppBackupRestore post-apply failure restores exact raw×3", async () => {
    const legacy = PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY;
    const v2 = buildScenarioLabelNamespacedKey({ kind: "unbound" });
    const marker = serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" });
    const storage = createStorage({
      [legacy]: "OLD-L",
      [v2]: "OLD-V",
      [marker]: "OLD-M",
    });
    vi.stubGlobal("localStorage", storage);

    const validated = validateAppBackupEnvelope(
      envelope({ "phmax-scenario-label": modulePayload("Label", "NEW-L") }),
    );
    if (validated.status !== "validated") throw new Error("expected validated");

    const result = await applyAppBackupRestore(validated, {
      storage,
      verify: () => ({ ok: false, detail: "forced_verification_fail" }),
    });

    expect(result.status).toBe("rolled_back");
    expect(storage.getItem(legacy)).toBe("OLD-L");
    expect(storage.getItem(v2)).toBe("OLD-V");
    expect(storage.getItem(marker)).toBe("OLD-M");
  });

  it("T: pre-missing v2/marker restored to missing after post-apply failure", async () => {
    const legacy = PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY;
    const v2 = buildScenarioLabelNamespacedKey({ kind: "unbound" });
    const marker = serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" });
    const storage = createStorage({
      [legacy]: "OLD-L",
    });
    vi.stubGlobal("localStorage", storage);

    expect(storage.getItem(v2)).toBeNull();
    expect(storage.getItem(marker)).toBeNull();

    const validated = validateAppBackupEnvelope(
      envelope({ "phmax-scenario-label": modulePayload("Label", "NEW-L") }),
    );
    if (validated.status !== "validated") throw new Error("expected validated");

    const result = await applyAppBackupRestore(validated, {
      storage,
      verify: () => ({ ok: false, detail: "forced_verification_fail" }),
    });

    expect(result.status).toBe("rolled_back");
    expect(storage.getItem(legacy)).toBe("OLD-L");
    expect(storage.getItem(v2)).toBeNull();
    expect(storage.getItem(marker)).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(Object.fromEntries(storage.store), v2)).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(Object.fromEntries(storage.store), marker)).toBe(
      false,
    );
  });
});
