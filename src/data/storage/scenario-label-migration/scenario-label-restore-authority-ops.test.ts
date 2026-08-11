/**
 * N3-AWARE-WIRING — Restore T2 authority ops + fence rollback unit coverage.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  APP_BACKUP_FORMAT,
  APP_BACKUP_SCHEMA_VERSION,
  applyAppBackupRestore,
  validateAppBackupEnvelope,
  type ValidatedAppBackupEnvelope,
} from "../../../backup/restore/index";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../../identity/identity-registry-types";
import { IDENTITY_REGISTRY_LS_KEY } from "../../identity/identity-registry-types";
import type { EntityId } from "../../../domain/shared/entity-id";
import { buildScenarioLabelRestoreAuthorityOps } from "./scenario-label-restore-authority-ops";
import { isAllowedScenarioLabelRestoreDynamicKey } from "./scenario-label-restore-ops";
import {
  MemoryStorage,
  SCHOOL_A,
  schoolKeys,
  seedConflictingAuthority,
  seedLegacyReady,
  seedNamespacedReady,
} from "./scenario-label-n3-aware-test-helpers";
import { parseScenarioLabelN3AuthorityMarkerJson } from "./scenario-label-n3-authority-marker";
import { serializeScenarioLabelN3FenceKey } from "./scenario-label-n3-fence-key";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { SCHOOL_PROFILE_LS_KEY } from "../../../school-profile/school-profile-constants";

const SCHOOL = SCHOOL_A;

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
    name: "ZŠ Restore Aware",
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

function validatedBackup(
  modules: Record<string, ReturnType<typeof modulePayload>>,
): ValidatedAppBackupEnvelope {
  const result = validateAppBackupEnvelope({
    format: APP_BACKUP_FORMAT,
    schemaVersion: APP_BACKUP_SCHEMA_VERSION,
    exportedAt: "2026-08-08T12:00:00.000Z",
    modules,
  });
  expect(result.status).toBe("validated");
  return result as ValidatedAppBackupEnvelope;
}

describe("buildScenarioLabelRestoreAuthorityOps", () => {
  it("legacy ready → legacy marker ops, no namespaced fence requirement", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "LEG");
    const plan = buildScenarioLabelRestoreAuthorityOps({
      storage,
      logicalLabel: "RESTORED",
      shadowPlan: { mode: "shadow", target: { kind: "school", schoolId: SCHOOL } },
      currentSchoolId: SCHOOL,
    });
    expect(plan.status).toBe("planned");
    if (plan.status !== "planned") return;
    expect(plan.authority).toBe("legacy");
    expect(plan.requiresNamespacedFenceCommit).toBe(false);
    const markerOp = plan.ops.operations.find(
      (op) => op.action === "set" && op.key.includes("migration-state"),
    );
    expect(markerOp && markerOp.action === "set" ? markerOp.serializedValue : null).toContain(
      '"authority":"legacy"',
    );
  });

  it("namespaced ready → schema2 marker + fence snapshot key", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "A");
    const plan = buildScenarioLabelRestoreAuthorityOps({
      storage,
      logicalLabel: "B",
      shadowPlan: { mode: "shadow", target: { kind: "school", schoolId: SCHOOL } },
      currentSchoolId: SCHOOL,
    });
    expect(plan.status).toBe("planned");
    if (plan.status !== "planned") return;
    expect(plan.authority).toBe("namespaced");
    expect(plan.requiresNamespacedFenceCommit).toBe(true);
    expect(plan.fenceSnapshotKey).toBe(
      serializeScenarioLabelN3FenceKey({ kind: "school", schoolId: SCHOOL }),
    );
  });

  it("empty/new defaults to legacy — never first schema2", () => {
    const storage = new MemoryStorage();
    const plan = buildScenarioLabelRestoreAuthorityOps({
      storage,
      logicalLabel: "FROM-BACKUP",
      shadowPlan: { mode: "shadow", target: { kind: "school", schoolId: SCHOOL } },
      currentSchoolId: SCHOOL,
    });
    expect(plan.status).toBe("planned");
    if (plan.status !== "planned") return;
    expect(plan.authority).toBe("legacy");
    const markerOp = plan.ops.operations.find(
      (op) => op.action === "set" && op.key.includes("migration-state"),
    );
    expect(markerOp && markerOp.action === "set" ? markerOp.serializedValue : null).not.toContain(
      '"schemaVersion":2',
    );
  });

  it("AUTHORITY_BLOCKED conflict → blocked", () => {
    const storage = new MemoryStorage();
    seedConflictingAuthority(storage);
    const plan = buildScenarioLabelRestoreAuthorityOps({
      storage,
      logicalLabel: "X",
      shadowPlan: { mode: "shadow", target: { kind: "school", schoolId: SCHOOL } },
      currentSchoolId: SCHOOL,
    });
    expect(plan.status).toBe("blocked");
  });

  it("ambiguous_marker_loss (legacy-only residue) → legacy restore ops, not blocked", () => {
    const storage = new MemoryStorage();
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "LOCAL-OLD");
    const plan = buildScenarioLabelRestoreAuthorityOps({
      storage,
      logicalLabel: "FROM-BACKUP",
      shadowPlan: { mode: "shadow", target: { kind: "school", schoolId: SCHOOL } },
      currentSchoolId: SCHOOL,
    });
    expect(plan.status).toBe("planned");
    if (plan.status !== "planned") return;
    expect(plan.authority).toBe("legacy");
    expect(plan.requiresNamespacedFenceCommit).toBe(false);
  });

  it("allowlist accepts canonical fence key for expected school only", () => {
    const target = { kind: "school" as const, schoolId: SCHOOL };
    const fence = serializeScenarioLabelN3FenceKey(target);
    expect(isAllowedScenarioLabelRestoreDynamicKey(fence, target)).toBe(true);
    expect(
      isAllowedScenarioLabelRestoreDynamicKey(fence, {
        kind: "school",
        schoolId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" as EntityId,
      }),
    ).toBe(false);
  });
});

describe("Restore namespaced fence failure → rollback", () => {
  let ls: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    ls = createLocalStorageMock();
    vi.stubGlobal("localStorage", ls);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("inject namespaced fence failure → rolled_back, prior namespaced preserved", async () => {
    const mem = new MemoryStorage();
    seedNamespacedReady(mem, "PRIOR");
    for (const [k, v] of mem.store.entries()) {
      ls.setItem(k, v);
    }
    ls.setItem(IDENTITY_REGISTRY_LS_KEY, JSON.stringify(sampleIdentity(SCHOOL)));
    ls.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(SCHOOL)));

    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL)),
        "phmax-scenario-label": modulePayload("Label", "RESTORED-NS"),
      }),
      {
        storage: ls,
        finalizeScenarioNamespacedFence: () => ({
          status: "incomplete",
          reason: "fence_write_failed",
        }),
        ensureSchool: async () => ({
          status: "ready",
          schoolId: SCHOOL,
          activeSchoolId: SCHOOL,
          activeSchoolYearId: null,
          staleActiveSchoolId: false,
          staleActiveSchoolYearId: false,
        }),
        verify: () => ({ ok: true }),
      },
    );

    expect(result.status).toBe("rolled_back");
    if (result.status === "rolled_back") {
      expect(result.failurePhase).toBe("namespaced_fence");
    }
    const keys = schoolKeys(SCHOOL);
    expect(ls.store[keys.v2]).toBe("PRIOR");
    expect(ls.store[PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]).toBe("PRIOR");
    const marker = parseScenarioLabelN3AuthorityMarkerJson(ls.store[keys.marker] ?? null);
    expect(marker.status).toBe("valid");
    if (marker.status === "valid") {
      expect(marker.payload.authority).toBe("namespaced");
    }
  });

  it("T2 blocked authority → rejected_plan / 0 scenario overwrite", async () => {
    const mem = new MemoryStorage();
    seedConflictingAuthority(mem);
    for (const [k, v] of mem.store.entries()) {
      ls.setItem(k, v);
    }
    ls.setItem(IDENTITY_REGISTRY_LS_KEY, JSON.stringify(sampleIdentity(SCHOOL)));
    ls.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(SCHOOL)));
    const before = JSON.stringify(ls.store);

    const result = await applyAppBackupRestore(
      validatedBackup({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL)),
        "phmax-scenario-label": modulePayload("Label", "SHOULD-NOT-APPLY"),
      }),
      {
        storage: ls,
        ensureSchool: async () => ({
          status: "ready",
          schoolId: SCHOOL,
          activeSchoolId: SCHOOL,
          activeSchoolYearId: null,
          staleActiveSchoolId: false,
          staleActiveSchoolYearId: false,
        }),
        verify: () => ({ ok: true }),
      },
    );

    expect(result.status).toBe("rejected_plan");
    expect(JSON.stringify(ls.store)).toBe(before);
  });
});
