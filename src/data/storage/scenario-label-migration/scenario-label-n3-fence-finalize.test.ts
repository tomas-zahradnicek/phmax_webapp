import { describe, expect, it, vi } from "vitest";
import type { EntityId } from "../../../domain/shared/entity-id";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { serializeScenarioLabelMigrationMarkerPayload } from "./scenario-label-migration-marker-payload";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import {
  finalizeScenarioLabelLegacyFenceCertificate,
  type ScenarioLabelFenceFinalizeStorage,
} from "./scenario-label-n3-fence-finalize";
import { serializeScenarioLabelN3FenceKey } from "./scenario-label-n3-fence-key";
import { assessScenarioLabelN3FenceState } from "./scenario-label-n3-fence-protocol";
import {
  buildScenarioLabelN3FenceRecord,
  parseScenarioLabelN3FenceRecordJson,
  serializeScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-record";
import { parseScenarioLabelN3AuthorityMarkerJson } from "./scenario-label-n3-authority-marker";

const SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" as EntityId;

class MemoryStorage implements ScenarioLabelFenceFinalizeStorage {
  store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
}

function schoolKeys(schoolId: EntityId = SCHOOL_A) {
  const target = { kind: "school" as const, schoolId };
  return {
    target,
    v2: buildScenarioLabelNamespacedKey(target),
    marker: serializeScenarioLabelMigrationMarkerKey(target),
    fence: serializeScenarioLabelN3FenceKey(target),
  };
}

function seedSyncedPresent(
  storage: MemoryStorage,
  label: string,
  schoolId: EntityId = SCHOOL_A,
) {
  const keys = schoolKeys(schoolId);
  storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, label);
  storage.setItem(keys.v2, label);
  storage.setItem(
    keys.marker,
    serializeScenarioLabelMigrationMarkerPayload({
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "present",
    }),
  );
  return keys;
}

function seedSyncedAbsent(storage: MemoryStorage, schoolId: EntityId = SCHOOL_A) {
  const keys = schoolKeys(schoolId);
  storage.removeItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
  storage.removeItem(keys.v2);
  storage.setItem(
    keys.marker,
    serializeScenarioLabelMigrationMarkerPayload({
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "absent",
    }),
  );
  return keys;
}

function assessFromStorage(storage: MemoryStorage, schoolId: EntityId = SCHOOL_A) {
  const keys = schoolKeys(schoolId);
  const legacyRaw =
    storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY) == null
      ? ({ exists: false } as const)
      : ({ exists: true, value: storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)! } as const);
  const schoolV2Raw =
    storage.getItem(keys.v2) == null
      ? ({ exists: false } as const)
      : ({ exists: true, value: storage.getItem(keys.v2)! } as const);
  return assessScenarioLabelN3FenceState({
    targetResolution: { status: "resolved", target: { kind: "school", schoolId } },
    fence: parseScenarioLabelN3FenceRecordJson(storage.getItem(keys.fence)),
    marker: parseScenarioLabelN3AuthorityMarkerJson(storage.getItem(keys.marker)),
    legacyRaw,
    schoolV2Raw,
  });
}

describe("N3-FENCE-WRITE finalizeScenarioLabelLegacyFenceCertificate", () => {
  it("F1: canonical committed → LEGACY_COMMITTED", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "A");
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "committed" });
    expect(storage.getItem(keys.fence)).toBeTruthy();
    expect(assessFromStorage(storage).status).toBe("LEGACY_COMMITTED");
    const parsed = parseScenarioLabelN3FenceRecordJson(storage.getItem(keys.fence));
    expect(parsed).toEqual({
      status: "valid",
      record: expect.objectContaining({
        authority: "legacy",
        markerSchemaVersion: 1,
        committedRaw: { exists: true, value: "A" },
      }),
    });
  });

  it("F2: already_committed = 0 writes", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "A");
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "committed" });
    const setItem = vi.spyOn(storage, "setItem");
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "already_committed" });
    expect(setItem).not.toHaveBeenCalled();
    expect(storage.getItem(keys.fence)).toBeTruthy();
  });

  it("F3: invalid school id → skipped", () => {
    const storage = new MemoryStorage();
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({
        storage,
        schoolId: "NOT-A-UUID" as EntityId,
      }),
    ).toEqual({ status: "skipped", reason: "invalid_school_id" });
  });

  it("F4: shadow dirty / raw mismatch → not_certifiable", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "A");
    storage.setItem(schoolKeys().v2, "B");
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "not_certifiable", reason: "raw_mismatch" });
    expect(storage.getItem(schoolKeys().fence)).toBeNull();
  });

  it("F5: marker missing → not_certifiable", () => {
    const storage = new MemoryStorage();
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "A");
    storage.setItem(schoolKeys().v2, "A");
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "not_certifiable", reason: "marker_missing" });
  });

  it("F6: marker dirty → not_certifiable", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "A");
    storage.setItem(
      schoolKeys().marker,
      serializeScenarioLabelMigrationMarkerPayload({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "dirty",
        authoritativePresence: "present",
      }),
    );
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "not_certifiable", reason: "marker_not_synced" });
  });

  it("F7: schema2 namespaced marker → not_certifiable (no downgrade)", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "A");
    storage.setItem(
      schoolKeys().marker,
      JSON.stringify({
        schemaVersion: 2,
        authority: "namespaced",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    );
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "not_certifiable", reason: "namespaced_marker" });
    expect(storage.getItem(schoolKeys().fence)).toBeNull();
  });

  it("F8: fence write throw → incomplete", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "A");
    const original = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key.includes("protocol-commit")) throw new Error("quota");
      return original(key, value);
    };
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "incomplete", reason: "fence_write_failed" });
  });

  it("F9: read-back malformed → verify_failed", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "A");
    const keys = schoolKeys();
    const originalGet = storage.getItem.bind(storage);
    let wrote = false;
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      originalSet(key, value);
      if (key === keys.fence) wrote = true;
    };
    storage.getItem = (key: string) => {
      if (wrote && key === keys.fence) return "{not-json";
      return originalGet(key);
    };
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "verify_failed", reason: "read_back_malformed" });
  });

  it("F10: concurrent drift after set → concurrent_drift", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "A");
    const keys = schoolKeys();
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      originalSet(key, value);
      if (key === keys.fence) {
        // Concurrent tab changes business tuple after fence write.
        originalSet(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "B");
        originalSet(keys.v2, "B");
        originalSet(
          keys.marker,
          serializeScenarioLabelMigrationMarkerPayload({
            schemaVersion: 1,
            authority: "legacy",
            mirrorHealth: "synced",
            authoritativePresence: "present",
          }),
        );
      }
    };
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "concurrent_drift" });
  });

  it("F11: missing raw (absent) → committed", () => {
    const storage = new MemoryStorage();
    seedSyncedAbsent(storage);
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "committed" });
    expect(assessFromStorage(storage).status).toBe("LEGACY_COMMITTED");
  });

  it("F12: present empty string certifiable", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "");
    storage.setItem(keys.v2, "");
    storage.setItem(
      keys.marker,
      serializeScenarioLabelMigrationMarkerPayload({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    );
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "committed" });
    const parsed = parseScenarioLabelN3FenceRecordJson(storage.getItem(keys.fence));
    expect(parsed.status === "valid" && parsed.record.committedRaw).toEqual({
      exists: true,
      value: "",
    });
  });

  it("F13: INVALID old fence + explicit mutation → new cert", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "C");
    storage.setItem(keys.fence, "{broken");
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "committed" });
    expect(assessFromStorage(storage).status).toBe("LEGACY_COMMITTED");
  });

  it("F14: VIOLATED old fence + explicit mutation → new cert", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "C");
    storage.setItem(
      keys.fence,
      serializeScenarioLabelN3FenceRecord(
        buildScenarioLabelN3FenceRecord({
          authority: "legacy",
          schoolId: SCHOOL_A,
          committedRaw: { exists: true, value: "OLD" },
        }),
      ),
    );
    expect(assessFromStorage(storage).status).toBe("VIOLATED");
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "committed" });
    expect(assessFromStorage(storage).status).toBe("LEGACY_COMMITTED");
  });

  it("F15: same-storage DI — injected storage is used for fence key", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "DI");
    expect(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "committed" });
    expect(storage.getItem(keys.fence)).toBeTruthy();
  });
});
