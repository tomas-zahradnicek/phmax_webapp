import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../../data/identity/identity-registry-types";
import { APP_CONTEXT_LS_KEY } from "../../data/app-context/app-context";
import { IDENTITY_REGISTRY_LS_KEY } from "../../data/identity/identity-registry-types";
import { SCHOOL_PROFILE_LS_KEY } from "../../school-profile/school-profile-constants";
import {
  APP_BACKUP_FORMAT,
  APP_BACKUP_SCHEMA_VERSION,
  buildAppBackupRestorePlan,
  parseAppBackup,
  planAppBackupRestore,
  readCurrentRestoreEnvironment,
  validateAppBackupEnvelope,
  type RestoreEnvironment,
} from "./index";
import {
  ownedKeysForModule,
  PV_AUTOSAVE_KEY,
  PV_NAMED_SNAPSHOTS_KEY,
  RESTORE_APP_CONTEXT_KEY,
  RESTORE_IDENTITY_KEY,
  VYROCNI_ZPRAVA_LS_KEY,
  VYROCNI_ZPRAVA_PERSONNEL_LS_KEY,
} from "./restore-owned-keys";

const SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const SCHOOL_B = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";

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
        : [{ id: "cccccccc-dddd-4eee-8fff-000000000000", schoolId, startYear }],
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

function modulePayload(label: string, data: unknown, schemaVersion = 1) {
  return {
    label,
    schemaVersion,
    exportedAt: "2026-08-08T12:00:00.000Z",
    data,
  };
}

function envelope(modules: Record<string, ReturnType<typeof modulePayload>>) {
  return {
    format: APP_BACKUP_FORMAT,
    schemaVersion: APP_BACKUP_SCHEMA_VERSION,
    exportedAt: "2026-08-08T12:00:00.000Z",
    appVersion: "0.3.16",
    modules,
  };
}

function emptyEnv(): RestoreEnvironment {
  return {
    identity: { status: "missing" },
    profile: { status: "missing" },
  };
}

function envIdentity(schoolId: string): RestoreEnvironment {
  return {
    identity: { status: "valid", schoolId },
    profile: { status: "valid", schoolId },
  };
}

describe("Restore-1 parse / validate / plan (NO WRITES)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.stubGlobal("sessionStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("A: valid v1 envelope → parsed", () => {
    const result = parseAppBackup(JSON.stringify(envelope({})));
    expect(result.status).toBe("parsed");
    if (result.status !== "parsed") return;
    expect(result.envelope.schemaVersion).toBe(1);
    expect(result.envelope.modules).toEqual({});
  });

  it("B: invalid JSON → invalid_json", () => {
    expect(parseAppBackup("{broken")).toEqual({ status: "invalid_json" });
  });

  it("C: wrong format → invalid_envelope", () => {
    const result = parseAppBackup({
      format: "other",
      schemaVersion: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      modules: {},
    });
    expect(result).toEqual({ status: "invalid_envelope", reason: "wrong_format" });
  });

  it("D: unsupported schema → unsupported_schema", () => {
    const result = parseAppBackup({
      format: APP_BACKUP_FORMAT,
      schemaVersion: 99,
      exportedAt: "2026-01-01T00:00:00.000Z",
      modules: {},
    });
    expect(result).toEqual({ status: "unsupported_schema", schemaVersion: 99 });
  });

  it("E: empty modules object → valid partial backup", () => {
    const validated = validateAppBackupEnvelope(envelope({}));
    expect(validated.status).toBe("validated");
    if (validated.status !== "validated") return;
    expect(validated.modules.every((m) => m.status === "missing" || m.status === "unknown")).toBe(
      true,
    );
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.canApply).toBe(true);
    expect(plan.operations).toEqual([]);
    expect(plan.warnings.some((w) => w.code === "partial_backup")).toBe(true);
  });

  it("F: valid known module → present_valid", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
    );
    expect(validated.status).toBe("validated");
    if (validated.status !== "validated") return;
    const profile = validated.modules.find((m) => m.moduleId === "school-profile");
    expect(profile?.status).toBe("present_valid");
  });

  it("G: known invalid module → canApply false", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", "not-an-object"),
      }),
    );
    expect(validated.status).toBe("validated");
    if (validated.status !== "validated") return;
    expect(validated.hasInvalidKnownModule).toBe(true);
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.canApply).toBe(false);
    expect(plan.conflict?.kind).toBe("known_module_invalid");
  });

  it("H: missing known module → preserve", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    const pv = plan.modules.find((m) => m.moduleId === "phmax-pv");
    expect(pv?.kind).toBe("missing_preserve");
    expect(pv?.keySemantics.every((k) => k.effect === "preserve")).toBe(true);
    expect(plan.operations.every((op) => !ownedKeysForModule("phmax-pv").includes(op.key))).toBe(
      true,
    );
  });

  it("I: unknown module → warning, not blocking", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "future-module-x": modulePayload("Future", { anything: true }),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.warnings.some((w) => w.code === "unknown_module")).toBe(true);
    expect(plan.canApply).toBe(true);
    expect(plan.operations.every((op) => op.moduleId !== ("future-module-x" as never))).toBe(true);
  });

  it("J: invalid identity module ≠ missing identity", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "identity-registry": modulePayload("Identita", { broken: true }),
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
    );
    if (validated.status !== "validated") return;
    const identity = validated.modules.find((m) => m.moduleId === "identity-registry");
    expect(identity?.status).toBe("present_invalid");
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.conflict?.kind).toBe("backup_identity_invalid");
    expect(plan.canApply).toBe(false);
    expect(plan.platform.requiresIdentityBootstrap).toBe(false);
  });

  it("K: empty local + Identity A → canApply", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.canApply).toBe(true);
    expect(plan.conflict).toBeNull();
    expect(plan.operations.some((op) => op.key === RESTORE_IDENTITY_KEY && op.action === "set")).toBe(
      true,
    );
  });

  it("L: local A + backup A → same-school canApply", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, envIdentity(SCHOOL_A));
    expect(plan.sameSchool).toBe(true);
    expect(plan.canApply).toBe(true);
    expect(plan.conflict).toBeNull();
  });

  it("M: local A + backup B → cross_school canApply false", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_B)),
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_B)),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, envIdentity(SCHOOL_A));
    expect(plan.conflict?.kind).toBe("cross_school");
    expect(plan.canApply).toBe(false);
    expect(plan.operations).toEqual([]);
  });

  it("N: backup no Identity + empty local → legacy canApply + bootstrap", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.canApply).toBe(true);
    expect(plan.platform.requiresIdentityBootstrap).toBe(true);
    expect(plan.platform.requiresAppContextReset).toBe(true);
    expect(plan.touchedKeys).toContain(RESTORE_IDENTITY_KEY);
    expect(plan.touchedKeys).toContain(RESTORE_APP_CONTEXT_KEY);
  });

  it("O: backup no Identity + local valid Identity → legacy_identity_unverifiable blocked", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, envIdentity(SCHOOL_A));
    expect(plan.conflict?.kind).toBe("legacy_identity_unverifiable");
    expect(plan.canApply).toBe(false);
  });

  it("P: local corrupted Identity + backup valid → fail-closed, no silent repair", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, {
      identity: { status: "corrupted" },
      profile: { status: "corrupted" },
    });
    expect(plan.conflict).toEqual({
      kind: "local_identity_corrupted",
      recoverableWithTrustedRestore: false,
    });
    expect(plan.canApply).toBe(false);
    expect(plan.operations).toEqual([]);
    expect(plan.platform.requiresIdentityBootstrap).toBe(false);
  });

  it("Q: whole module absent → no operations for its keys", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    for (const key of ownedKeysForModule("annual-report")) {
      expect(plan.operations.some((op) => op.key === key)).toBe(false);
    }
  });

  it("R: present calculator module → set present members, remove absent members", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "phmax-pv": modulePayload("PV", {
          autosave: { pupils: 10 },
        }),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.canApply).toBe(true);
    expect(
      plan.operations.find((op) => op.key === PV_AUTOSAVE_KEY && op.action === "set"),
    ).toBeTruthy();
    expect(
      plan.operations.find((op) => op.key === PV_NAMED_SNAPSHOTS_KEY && op.action === "remove"),
    ).toBeTruthy();
  });

  it("S: partial backup → only present modules planned", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "phmax-scenario-label": modulePayload("Label", "Scénář A"),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    // N2-WRITE: legacy + unbound v2 + unbound marker
    expect(plan.operations).toHaveLength(3);
    expect(plan.operations.every((op) => op.action === "set")).toBe(true);
    expect(plan.expectedScenarioLabelTarget).toEqual({ kind: "unbound" });
    expect(plan.modules.filter((m) => m.kind === "present_valid")).toHaveLength(1);
  });

  it("T: foreign local keys are not in operations/touched owned set", () => {
    localStorage.setItem("totally-foreign-key", "1");
    const validated = validateAppBackupEnvelope(
      envelope({
        "phmax-scenario-label": modulePayload("Label", "X"),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.operations.every((op) => op.key !== "totally-foreign-key")).toBe(true);
    expect(plan.touchedKeys.includes("totally-foreign-key")).toBe(false);
  });

  it("U: modern backup with Identity → AppContext reset/reconcile planned", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.platform.requiresAppContextReset).toBe(true);
    expect(plan.platform.requiresPlatformReconcile).toBe(true);
    expect(plan.touchedKeys).toContain(APP_CONTEXT_LS_KEY);
  });

  it("V: legacy backup → Identity bootstrap + AppContext reconcile planned", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.platform.requiresIdentityBootstrap).toBe(true);
    expect(plan.platform.requiresAppContextReset).toBe(true);
    expect(plan.touchedKeys).toContain(IDENTITY_REGISTRY_LS_KEY);
  });

  it("W: valid VZ year → VZ year reconcile planned", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "annual-report": modulePayload("VZ", {
          main: sampleVzMain("2024/2025"),
        }),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.platform.requiresVzSchoolYearReconcile).toBe(true);
  });

  it("X: empty VZ year → no fake Year creation plan", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "annual-report": modulePayload("VZ", {
          main: sampleVzMain(""),
        }),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.platform.requiresVzSchoolYearReconcile).toBe(false);
  });

  it("annual-report absent subkeys become REMOVE (module snapshot replace)", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "annual-report": modulePayload("VZ", {
          main: sampleVzMain("2026/2027"),
        }),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(
      plan.operations.find((op) => op.key === VYROCNI_ZPRAVA_LS_KEY && op.action === "set"),
    ).toBeTruthy();
    expect(
      plan.operations.find(
        (op) => op.key === VYROCNI_ZPRAVA_PERSONNEL_LS_KEY && op.action === "remove",
      ),
    ).toBeTruthy();
  });

  it("no-write proof: parse/validate/plan never mutates storage", () => {
    const ls = createLocalStorageMock();
    vi.stubGlobal("localStorage", ls);
    const setSpy = vi.spyOn(ls, "setItem");
    const removeSpy = vi.spyOn(ls, "removeItem");
    const clearSpy = vi.spyOn(ls, "clear");

    ls.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(SCHOOL_A)));
    ls.setItem(IDENTITY_REGISTRY_LS_KEY, JSON.stringify(sampleIdentity(SCHOOL_A)));
    setSpy.mockClear();

    const env = readCurrentRestoreEnvironment();
    expect(env.identity.status).toBe("valid");

    const result = planAppBackupRestore(
      envelope({
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "phmax-pv": modulePayload("PV", {
          autosave: { x: 1 },
          namedSnapshots: { items: [] },
        }),
      }),
      env,
    );
    expect(result.status).toBe("planned");

    expect(setSpy).not.toHaveBeenCalled();
    expect(removeSpy).not.toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(ls.getItem(SCHOOL_PROFILE_LS_KEY)).toBeTruthy();
    expect(ls.getItem(APP_CONTEXT_LS_KEY)).toBeNull();
  });

  it("invalid namedSnapshots in calculator blocks apply", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "phmax-zs": modulePayload("ZŠ", {
          autosave: { ok: true },
          namedSnapshots: { items: "nope" },
        }),
      }),
    );
    if (validated.status !== "validated") return;
    expect(validated.hasInvalidKnownModule).toBe(true);
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    expect(plan.canApply).toBe(false);
  });

  it("personnel invalid envelope blocks annual-report", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "annual-report": modulePayload("VZ", {
          main: sampleVzMain(),
          personnel: { version: 1, data: null },
        }),
      }),
    );
    if (validated.status !== "validated") return;
    const ar = validated.modules.find((m) => m.moduleId === "annual-report");
    expect(ar?.status).toBe("present_invalid");
  });

  describe("hardening: strict SchoolProfile restore validator", () => {
    it("A: valid persisted SchoolProfile → present_valid", () => {
      const validated = validateAppBackupEnvelope(
        envelope({
          "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        }),
      );
      expect(validated.status).toBe("validated");
      if (validated.status !== "validated") return;
      const profile = validated.modules.find((m) => m.moduleId === "school-profile");
      expect(profile?.status).toBe("present_valid");
      if (profile?.status !== "present_valid") return;
      expect(profile.data).toEqual(sampleProfile(SCHOOL_A));
    });

    it("B: legacy/non-UUID profile.id preserved exactly", () => {
      const legacy = sampleProfile("legacy-school-1");
      const validated = validateAppBackupEnvelope(
        envelope({
          "school-profile": modulePayload("Profil", legacy),
        }),
      );
      if (validated.status !== "validated") return;
      const profile = validated.modules.find((m) => m.moduleId === "school-profile");
      expect(profile?.status).toBe("present_valid");
      if (profile?.status !== "present_valid") return;
      expect((profile.data as { id: string }).id).toBe("legacy-school-1");
      const plan = buildAppBackupRestorePlan(validated, emptyEnv());
      const set = plan.operations.find(
        (op) => op.key === SCHOOL_PROFILE_LS_KEY && op.action === "set",
      );
      expect(set?.action === "set" ? JSON.parse(set.serializedValue).id : null).toBe(
        "legacy-school-1",
      );
    });

    it("C–F: garbage / wrong-type SchoolProfile payloads → present_invalid", () => {
      for (const data of [{}, { foo: "bar" }, { id: 123 }, { ...sampleProfile(SCHOOL_A), ico: [] }]) {
        const validated = validateAppBackupEnvelope(
          envelope({
            "school-profile": modulePayload("Profil", data),
          }),
        );
        if (validated.status !== "validated") return;
        const profile = validated.modules.find((m) => m.moduleId === "school-profile");
        expect(profile?.status).toBe("present_invalid");
        const plan = buildAppBackupRestorePlan(validated, emptyEnv());
        expect(plan.canApply).toBe(false);
      }
    });

    it("G–H: planning is deterministic — no UUID generation", () => {
      const input = envelope({
        "school-profile": modulePayload("Profil", sampleProfile("school-fixed-id")),
      });
      const v1 = validateAppBackupEnvelope(input);
      const v2 = validateAppBackupEnvelope(input);
      expect(v1).toEqual(v2);
      if (v1.status !== "validated" || v2.status !== "validated") return;
      const p1 = buildAppBackupRestorePlan(v1, emptyEnv());
      const p2 = buildAppBackupRestorePlan(v2, emptyEnv());
      expect(p1.operations).toEqual(p2.operations);
      const set = p1.operations.find(
        (op) => op.key === SCHOOL_PROFILE_LS_KEY && op.action === "set",
      );
      expect(set?.action === "set" ? JSON.parse(set.serializedValue).id : null).toBe(
        "school-fixed-id",
      );
    });
  });

  describe("hardening: corrupted local Identity fail-closed", () => {
    it("I–J: corrupted local + backup valid Identity → canApply false, operations=[]", () => {
      const validated = validateAppBackupEnvelope(
        envelope({
          "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_B)),
          "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_B)),
        }),
      );
      if (validated.status !== "validated") return;
      const plan = buildAppBackupRestorePlan(validated, {
        identity: { status: "corrupted" },
        profile: { status: "missing" },
      });
      expect(plan.conflict?.kind).toBe("local_identity_corrupted");
      expect(plan.canApply).toBe(false);
      expect(plan.operations).toEqual([]);
    });

    it("K–L: valid local profile must not rescue via profile.id / IČO heuristics", () => {
      const validated = validateAppBackupEnvelope(
        envelope({
          "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_B)),
          "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_B)),
        }),
      );
      if (validated.status !== "validated") return;
      const plan = buildAppBackupRestorePlan(validated, {
        identity: { status: "corrupted" },
        profile: { status: "valid", schoolId: SCHOOL_B },
      });
      expect(plan.canApply).toBe(false);
      expect(plan.operations).toEqual([]);
      expect(plan.sameSchool).toBeNull();
    });

    it("M: corrupted local + backup missing Identity → not legacy empty-browser restore", () => {
      const validated = validateAppBackupEnvelope(
        envelope({
          "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
          "phmax-scenario-label": modulePayload("Label", "X"),
        }),
      );
      if (validated.status !== "validated") return;
      const plan = buildAppBackupRestorePlan(validated, {
        identity: { status: "corrupted" },
        profile: { status: "missing" },
      });
      expect(plan.conflict?.kind).toBe("local_identity_corrupted");
      expect(plan.canApply).toBe(false);
      expect(plan.operations).toEqual([]);
      expect(plan.platform.requiresIdentityBootstrap).toBe(false);
    });
  });

  describe("hardening: touchedKeys rollback scope", () => {
    it("operations keys are subset of touchedKeys", () => {
      const validated = validateAppBackupEnvelope(
        envelope({
          "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
          "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
          "phmax-pv": modulePayload("PV", { autosave: { pupils: 1 } }),
        }),
      );
      if (validated.status !== "validated") return;
      const plan = buildAppBackupRestorePlan(validated, emptyEnv());
      expect(plan.canApply).toBe(true);
      for (const op of plan.operations) {
        expect(plan.touchedKeys).toContain(op.key);
      }
    });

    it("VZ reconcile + local profile / missing Identity includes Identity + AppContext", () => {
      const validated = validateAppBackupEnvelope(
        envelope({
          "annual-report": modulePayload("VZ", {
            main: sampleVzMain("2026/2027"),
          }),
        }),
      );
      if (validated.status !== "validated") return;
      const plan = buildAppBackupRestorePlan(validated, {
        identity: { status: "missing" },
        profile: { status: "valid", schoolId: SCHOOL_A },
      });
      expect(plan.canApply).toBe(true);
      expect(plan.platform.requiresVzSchoolYearReconcile).toBe(true);
      expect(plan.touchedKeys).toContain(IDENTITY_REGISTRY_LS_KEY);
      expect(plan.touchedKeys).toContain(APP_CONTEXT_LS_KEY);
      expect(plan.touchedKeys).toContain(RESTORE_IDENTITY_KEY);
      expect(plan.touchedKeys).toContain(RESTORE_APP_CONTEXT_KEY);
    });

    it("platform reconcile / identity bootstrap cover Identity + AppContext", () => {
      const validated = validateAppBackupEnvelope(
        envelope({
          "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        }),
      );
      if (validated.status !== "validated") return;
      const plan = buildAppBackupRestorePlan(validated, emptyEnv());
      expect(plan.platform.requiresIdentityBootstrap).toBe(true);
      expect(plan.platform.requiresPlatformReconcile).toBe(true);
      expect(plan.touchedKeys).toContain(IDENTITY_REGISTRY_LS_KEY);
      expect(plan.touchedKeys).toContain(APP_CONTEXT_LS_KEY);
    });
  });
});
