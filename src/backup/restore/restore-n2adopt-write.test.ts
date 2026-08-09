import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readIdentityRegistry } from "../../data/identity/identity-registry-storage";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../../data/identity/identity-registry-types";
import { IDENTITY_REGISTRY_LS_KEY } from "../../data/identity/identity-registry-types";
import { buildScenarioLabelNamespacedKey } from "../../data/storage/scenario-label-migration/scenario-label-migration-protocol";
import { serializeScenarioLabelMigrationMarkerKey } from "../../data/storage/scenario-label-migration/scenario-label-migration-marker-key";
import { parseScenarioLabelMigrationMarkerPayloadJson } from "../../data/storage/scenario-label-migration/scenario-label-migration-marker-payload";
import { serializeScenarioLabelN3FenceKey } from "../../data/storage/scenario-label-migration/scenario-label-n3-fence-key";
import { parseScenarioLabelN3FenceRecordJson } from "../../data/storage/scenario-label-migration/scenario-label-n3-fence-record";
import { establishScenarioLabelSchoolShadowFromLegacy } from "../../data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime";
import { SCHOOL_PROFILE_LS_KEY } from "../../school-profile/school-profile-constants";
import {
  APP_BACKUP_FORMAT,
  APP_BACKUP_SCHEMA_VERSION,
  applyAppBackupRestore,
  validateAppBackupEnvelope,
  type ValidatedAppBackupEnvelope,
} from "./index";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "./restore-owned-keys";

const SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

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
    name: "ZŠ Restore Adopt",
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
    throw new Error(`expected validated, got ${result.status}`);
  }
  return result;
}

describe("N2-ADOPT-WRITE Restore post-success establishment", () => {
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

  it("AE: Profile non-UUID + no Identity → new schoolId receives school shadow from legacy", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile("legacy-school-code")),
        "phmax-scenario-label": modulePayload("Label", "LEGACY-NONUUID"),
      }),
    );
    expect(result.status).toBe("success");
    const identity = readIdentityRegistry();
    expect(identity.ok && identity.registry != null).toBe(true);
    if (!identity.ok || identity.registry == null) return;
    const schoolId = identity.registry.schoolId;
    expect(schoolId).not.toBe("legacy-school-code");
    const schoolKey = buildScenarioLabelNamespacedKey({ kind: "school", schoolId });
    const markerKey = serializeScenarioLabelMigrationMarkerKey({ kind: "school", schoolId });
    expect(ls.store[PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]).toBe("LEGACY-NONUUID");
    expect(ls.store[schoolKey]).toBe("LEGACY-NONUUID");
    expect(parseScenarioLabelMigrationMarkerPayloadJson(ls.store[markerKey] ?? null)).toMatchObject({
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "present",
    });
  });

  it("AD: scenario module absent → preserved local legacy mirrored after success", async () => {
    ls.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "PRESERVED");
    ls.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(SCHOOL_A)));
    ls.setItem(IDENTITY_REGISTRY_LS_KEY, JSON.stringify(sampleIdentity(SCHOOL_A)));
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
      }),
    );
    expect(result.status).toBe("success");
    expect(ls.store[PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]).toBe("PRESERVED");
    const schoolKey = buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A });
    expect(ls.store[schoolKey]).toBe("PRESERVED");
  });

  it("AF: full modern restore → post-success already_ready (no rewrite on second call)", async () => {
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "phmax-scenario-label": modulePayload("Label", "MODERN"),
      }),
    );
    expect(result.status).toBe("success");
    const schoolKey = buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A });
    expect(ls.store[schoolKey]).toBe("MODERN");
    const before = JSON.stringify(ls.store);
    expect(establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage: ls })).toEqual({
      status: "already_ready",
    });
    expect(JSON.stringify(ls.store)).toBe(before);
  });

  it("N3-FENCE-WRITE: successful school Restore → fence LAST + LEGACY_COMMITTED payload", async () => {
    const fenceKey = serializeScenarioLabelN3FenceKey({
      kind: "school",
      schoolId: SCHOOL_A,
    });
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "phmax-scenario-label": modulePayload("Label", "RESTORED-L"),
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
        verify: () => ({ ok: true }),
      },
    );
    expect(result.status).toBe("success");
    expect(ls.store[PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]).toBe("RESTORED-L");
    const parsed = parseScenarioLabelN3FenceRecordJson(ls.store[fenceKey] ?? null);
    expect(parsed).toMatchObject({
      status: "valid",
      record: {
        authority: "legacy",
        protocolGeneration: 3,
        markerSchemaVersion: 1,
        committedRaw: { exists: true, value: "RESTORED-L" },
      },
    });
  });

  it("N3-FENCE-WRITE: verification fail → rolled_back + zero fence orphan", async () => {
    const fenceKey = serializeScenarioLabelN3FenceKey({
      kind: "school",
      schoolId: SCHOOL_A,
    });
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "phmax-scenario-label": modulePayload("Label", "SHOULD-ROLLBACK"),
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
    expect(ls.store[fenceKey]).toBeUndefined();
    expect(
      Object.keys(ls.store).some((k) => k.includes("protocol-commit")),
    ).toBe(false);
  });

  it("N3-FENCE-WRITE O8: establishment + Restore finalizer → at most one fence setItem", async () => {
    const fenceKey = serializeScenarioLabelN3FenceKey({
      kind: "school",
      schoolId: SCHOOL_A,
    });
    let fenceSetCount = 0;
    const storage = {
      getItem: (key: string) => ls.getItem(key),
      setItem: (key: string, value: string) => {
        if (key === fenceKey) fenceSetCount += 1;
        ls.setItem(key, value);
      },
      removeItem: (key: string) => ls.removeItem(key),
    };
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "phmax-scenario-label": modulePayload("Label", "ONCE"),
      }),
      {
        storage,
        ensureSchool: async () => ({
          status: "ready",
          schoolId: SCHOOL_A,
          activeSchoolId: SCHOOL_A,
          activeSchoolYearId: null,
          staleActiveSchoolId: false,
          staleActiveSchoolYearId: false,
        }),
        verify: () => ({ ok: true }),
      },
    );
    expect(result.status).toBe("success");
    // Establishment mutates → writes fence; Restore finalizer then already_committed (0 extra).
    expect(fenceSetCount).toBe(1);
  });

  it("N3-FENCE-WRITE S5: fence throw after verify → Restore still success", async () => {
    const fenceKey = serializeScenarioLabelN3FenceKey({
      kind: "school",
      schoolId: SCHOOL_A,
    });
    const storage = {
      getItem: (key: string) => ls.getItem(key),
      setItem: (key: string, value: string) => {
        if (key === fenceKey) throw new Error("fence_blocked");
        ls.setItem(key, value);
      },
      removeItem: (key: string) => ls.removeItem(key),
    };
    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "phmax-scenario-label": modulePayload("Label", "SOFT-FENCE"),
      }),
      {
        storage,
        ensureSchool: async () => ({
          status: "ready",
          schoolId: SCHOOL_A,
          activeSchoolId: SCHOOL_A,
          activeSchoolYearId: null,
          staleActiveSchoolId: false,
          staleActiveSchoolYearId: false,
        }),
        verify: () => ({ ok: true }),
      },
    );
    expect(result.status).toBe("success");
    expect(ls.store[PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]).toBe("SOFT-FENCE");
    expect(ls.store[fenceKey]).toBeUndefined();
  });

  it("N3-FENCE-WRITE: scenario module absent + already_ready → no PREP fence invent", async () => {
    const fenceKey = serializeScenarioLabelN3FenceKey({
      kind: "school",
      schoolId: SCHOOL_A,
    });
    // Healthy synced school tuple already present (no Restore scenario mutation).
    ls.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "PRESERVED");
    ls.setItem(
      buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A }),
      "PRESERVED",
    );
    ls.setItem(
      serializeScenarioLabelMigrationMarkerKey({ kind: "school", schoolId: SCHOOL_A }),
      JSON.stringify({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    );
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
        verify: () => ({ ok: true }),
        establishScenarioSchoolShadow: () => ({ status: "already_ready" }),
      },
    );
    expect(result.status).toBe("success");
    expect(ls.store[fenceKey]).toBeUndefined();
  });
});
