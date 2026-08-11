import { describe, expect, it } from "vitest";
import type { EntityId } from "../../../domain/shared/entity-id";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { serializeScenarioLabelMigrationMarkerPayload } from "./scenario-label-migration-marker-payload";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import {
  buildScenarioLabelN3NamespacedMarker,
  parseScenarioLabelN3AuthorityMarkerJson,
  serializeScenarioLabelN3AuthorityMarker,
} from "./scenario-label-n3-authority-marker";
import {
  prepareScenarioLabelN3LegacyFenceCertificate,
  type ScenarioLabelN3PrepStorage,
} from "./scenario-label-n3-prep";
import { serializeScenarioLabelN3FenceKey } from "./scenario-label-n3-fence-key";
import { assessScenarioLabelN3FenceState } from "./scenario-label-n3-fence-protocol";
import {
  buildScenarioLabelN3FenceRecord,
  parseScenarioLabelN3FenceRecordJson,
  serializeScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-record";
import {
  runScenarioLabelEstablishmentAfterSchoolReady,
  establishScenarioLabelSchoolShadowFromLegacy,
} from "./scenario-label-school-shadow-establishment-runtime";

const SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" as EntityId;
const SCHOOL_B = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff" as EntityId;
const V2_UNBOUND =
  "reditelsky-pruvodce:v2:unbound:module:phmax-scenario-label:resource:value";

class MemoryStorage implements ScenarioLabelN3PrepStorage {
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

function seedSyncedPresentEmpty(storage: MemoryStorage, schoolId: EntityId = SCHOOL_A) {
  const keys = schoolKeys(schoolId);
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
  return keys;
}

function assessFromStorage(storage: MemoryStorage, schoolId: EntityId = SCHOOL_A) {
  const keys = schoolKeys(schoolId);
  const legacyItem = storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
  const schoolItem = storage.getItem(keys.v2);
  return assessScenarioLabelN3FenceState({
    targetResolution: { status: "resolved", target: { kind: "school", schoolId } },
    fence: parseScenarioLabelN3FenceRecordJson(storage.getItem(keys.fence)),
    marker: parseScenarioLabelN3AuthorityMarkerJson(storage.getItem(keys.marker)),
    legacyRaw:
      legacyItem == null ? { exists: false } : { exists: true, value: legacyItem },
    schoolV2Raw:
      schoolItem == null ? { exists: false } : { exists: true, value: schoolItem },
  });
}

function countFenceWrites(storage: MemoryStorage, fenceKey: string) {
  const original = storage.setItem.bind(storage);
  let writes = 0;
  storage.setItem = (key: string, value: string) => {
    if (key === fenceKey) writes += 1;
    original(key, value);
  };
  return () => writes;
}

describe("N3-PREP prepareScenarioLabelN3LegacyFenceCertificate", () => {
  it("P1: healthy UNESTABLISHED present A → prepared + exact cert A", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "A");
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "prepared" });
    expect(assessFromStorage(storage).status).toBe("LEGACY_COMMITTED");
    const parsed = parseScenarioLabelN3FenceRecordJson(storage.getItem(keys.fence));
    expect(parsed).toEqual({
      status: "valid",
      record: expect.objectContaining({
        authority: "legacy",
        markerSchemaVersion: 1,
        schoolId: SCHOOL_A,
        committedRaw: { exists: true, value: "A" },
      }),
    });
  });

  it("P2: healthy UNESTABLISHED missing → prepared + exists:false", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedAbsent(storage);
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "prepared" });
    const parsed = parseScenarioLabelN3FenceRecordJson(storage.getItem(keys.fence));
    expect(parsed.status === "valid" && parsed.record.committedRaw).toEqual({
      exists: false,
    });
    expect(assessFromStorage(storage).status).toBe("LEGACY_COMMITTED");
  });

  it('P3: healthy UNESTABLISHED present "" → prepared', () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresentEmpty(storage);
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "prepared" });
    const parsed = parseScenarioLabelN3FenceRecordJson(storage.getItem(keys.fence));
    expect(parsed.status === "valid" && parsed.record.committedRaw).toEqual({
      exists: true,
      value: "",
    });
  });

  it("P4: LEGACY_COMMITTED → already_prepared + 0 writes", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "A");
    storage.setItem(
      keys.fence,
      serializeScenarioLabelN3FenceRecord(
        buildScenarioLabelN3FenceRecord({
          authority: "legacy",
          schoolId: SCHOOL_A,
          committedRaw: { exists: true, value: "A" },
        }),
      ),
    );
    const writes = countFenceWrites(storage, keys.fence);
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "already_prepared" });
    expect(writes()).toBe(0);
  });

  it("P5: VIOLATED → blocked_violation + 0 writes", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "B");
    storage.setItem(
      keys.fence,
      serializeScenarioLabelN3FenceRecord(
        buildScenarioLabelN3FenceRecord({
          authority: "legacy",
          schoolId: SCHOOL_A,
          committedRaw: { exists: true, value: "A" },
        }),
      ),
    );
    expect(assessFromStorage(storage).status).toBe("VIOLATED");
    const before = storage.getItem(keys.fence);
    const writes = countFenceWrites(storage, keys.fence);
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "blocked_violation" });
    expect(writes()).toBe(0);
    expect(storage.getItem(keys.fence)).toBe(before);
  });

  it("P6: INVALID → blocked_invalid + 0 writes", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "A");
    storage.setItem(keys.fence, "{broken");
    expect(assessFromStorage(storage).status).toBe("INVALID");
    const before = storage.getItem(keys.fence);
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "blocked_invalid" });
    expect(storage.getItem(keys.fence)).toBe(before);
  });

  it("P7: UNAVAILABLE → storage_unavailable + 0 writes", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "A");
    const keys = schoolKeys();
    storage.getItem = () => {
      throw new Error("boom");
    };
    const writes = countFenceWrites(storage, keys.fence);
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "storage_unavailable" });
    expect(writes()).toBe(0);
  });

  it("P8: seeded namespaced → unsupported_authority + 0 writes", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "A");
    storage.setItem(keys.v2, "A");
    storage.setItem(
      keys.marker,
      serializeScenarioLabelN3AuthorityMarker(
        buildScenarioLabelN3NamespacedMarker({
          mirrorHealth: "synced",
          authoritativePresence: "present",
        }),
      ),
    );
    const writes = countFenceWrites(storage, keys.fence);
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "unsupported_authority" });
    expect(writes()).toBe(0);
    expect(storage.getItem(keys.fence)).toBeNull();
  });

  it("P9: missing Identity / invalid schoolId → skipped_identity + no fence", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "A");
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({
        storage,
        schoolId: "not-a-uuid" as EntityId,
      }),
    ).toEqual({ status: "skipped_identity" });
    expect(storage.getItem(schoolKeys().fence)).toBeNull();
  });

  it("P10: corrupted Identity shape (non-canonical UUID) → fail closed / skipped", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "A");
    // Uppercase UUID is non-canonical after normalizeUuid mismatch.
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({
        storage,
        schoolId: "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE" as EntityId,
      }),
    ).toEqual({ status: "skipped_identity" });
    expect(storage.getItem(schoolKeys().fence)).toBeNull();
  });

  it("P11: legacy A / v2 missing → not_preparable + 0 writes", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "A");
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
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "not_preparable", reason: "raw_mismatch" });
    expect(storage.getItem(keys.fence)).toBeNull();
  });

  it("P12: legacy A / v2 B → not_preparable", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "A");
    storage.setItem(keys.v2, "B");
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
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "not_preparable", reason: "raw_mismatch" });
    expect(storage.getItem(keys.fence)).toBeNull();
  });

  it("P13: marker missing → not_preparable", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "A");
    storage.setItem(keys.v2, "A");
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "not_preparable", reason: "marker_missing" });
    expect(storage.getItem(keys.fence)).toBeNull();
  });

  it("P14: marker dirty → not_preparable", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "A");
    storage.setItem(keys.v2, "A");
    storage.setItem(
      keys.marker,
      serializeScenarioLabelMigrationMarkerPayload({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "dirty",
        authoritativePresence: "present",
      }),
    );
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "not_preparable", reason: "marker_not_synced" });
    expect(storage.getItem(keys.fence)).toBeNull();
  });

  it("P15: marker presence mismatch → not_preparable", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "A");
    storage.setItem(keys.v2, "A");
    storage.setItem(
      keys.marker,
      serializeScenarioLabelMigrationMarkerPayload({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "absent",
      }),
    );
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "not_preparable", reason: "presence_mismatch" });
    expect(storage.getItem(keys.fence)).toBeNull();
  });

  it("P16: unbound residue present → ignored; school fence prepared", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "A");
    storage.setItem(V2_UNBOUND, "UNBOUND-OTHER");
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "prepared" });
    expect(storage.getItem(V2_UNBOUND)).toBe("UNBOUND-OTHER");
    expect(assessFromStorage(storage).status).toBe("LEGACY_COMMITTED");
    expect(storage.getItem(keys.fence)).toBeTruthy();
  });

  it("P17: payload/current target mismatch (foreign school fence key unused)", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "A", SCHOOL_A);
    // PREP for SCHOOL_B with no healthy B tuple → not preparable; A fence untouched.
    const keysA = schoolKeys(SCHOOL_A);
    const keysB = schoolKeys(SCHOOL_B);
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_B }),
    ).toEqual({ status: "not_preparable", reason: "marker_missing" });
    expect(storage.getItem(keysA.fence)).toBeNull();
    expect(storage.getItem(keysB.fence)).toBeNull();
  });

  it("P18: fence write throws → write_failed", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "A");
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key === keys.fence) throw new Error("quota");
      originalSet(key, value);
    };
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "write_failed" });
  });

  it("P19: read-back malformed → verify_failed", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "A");
    const originalGet = storage.getItem.bind(storage);
    let wrote = false;
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key === keys.fence) wrote = true;
      originalSet(key, value);
    };
    storage.getItem = (key: string) => {
      if (wrote && key === keys.fence) return "{broken-after-write";
      return originalGet(key);
    };
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "verify_failed", reason: "read_back_malformed" });
  });

  it("P20: post-write raw drift → concurrent_change", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "A");
    const originalGet = storage.getItem.bind(storage);
    let wrote = false;
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key === keys.fence) wrote = true;
      originalSet(key, value);
    };
    storage.getItem = (key: string) => {
      if (wrote && key === PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY) return "DRIFTED";
      if (wrote && key === keys.v2) return "DRIFTED";
      return originalGet(key);
    };
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "concurrent_change" });
  });
});

describe("N3-PREP races", () => {
  it("R1: concurrent LEGACY_COMMITTED before write → already_prepared, no overwrite", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "A");
    const originalGet = storage.getItem.bind(storage);
    let fencePass = 0;
    storage.getItem = (key: string) => {
      // Passes 1–2: initial parse + physical-missing. From fresh re-check onward: committed.
      if (key === keys.fence) {
        fencePass += 1;
        if (fencePass >= 3) {
          return serializeScenarioLabelN3FenceRecord(
            buildScenarioLabelN3FenceRecord({
              authority: "legacy",
              schoolId: SCHOOL_A,
              committedRaw: { exists: true, value: "A" },
            }),
          );
        }
      }
      return originalGet(key);
    };
    const writes = countFenceWrites(storage, keys.fence);
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "already_prepared" });
    expect(writes()).toBe(0);
  });

  it("R2: concurrent VIOLATED fence → blocked, no overwrite", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "B");
    const violated = serializeScenarioLabelN3FenceRecord(
      buildScenarioLabelN3FenceRecord({
        authority: "legacy",
        schoolId: SCHOOL_A,
        committedRaw: { exists: true, value: "A" },
      }),
    );
    const originalGet = storage.getItem.bind(storage);
    let fencePass = 0;
    storage.getItem = (key: string) => {
      if (key === keys.fence) {
        fencePass += 1;
        if (fencePass >= 3) return violated;
      }
      return originalGet(key);
    };
    const writes = countFenceWrites(storage, keys.fence);
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "blocked_violation" });
    expect(writes()).toBe(0);
  });

  it("R3: concurrent INVALID fence → blocked, no overwrite", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "A");
    const originalGet = storage.getItem.bind(storage);
    let fencePass = 0;
    storage.getItem = (key: string) => {
      if (key === keys.fence) {
        fencePass += 1;
        if (fencePass >= 3) return "{broken";
      }
      return originalGet(key);
    };
    const writes = countFenceWrites(storage, keys.fence);
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "blocked_invalid" });
    expect(writes()).toBe(0);
  });

  it("R4: raw changes healthy A→B while fence missing → may certify fresh B", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "A");
    const originalGet = storage.getItem.bind(storage);
    let fencePass = 0;
    storage.getItem = (key: string) => {
      if (key === keys.fence) fencePass += 1;
      // After initial admission (parse + physical missing), fresh tuple is B/B.
      if (fencePass >= 2 && (key === PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY || key === keys.v2)) {
        return "B";
      }
      return originalGet(key);
    };
    expect(
      prepareScenarioLabelN3LegacyFenceCertificate({ storage, schoolId: SCHOOL_A }),
    ).toEqual({ status: "prepared" });
    const parsed = parseScenarioLabelN3FenceRecordJson(storage.getItem(keys.fence));
    expect(parsed.status === "valid" && parsed.record.committedRaw).toEqual({
      exists: true,
      value: "B",
    });
  });

  it("R5: two concurrent PREP attempts → final LEGACY_COMMITTED", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "A");
    const first = prepareScenarioLabelN3LegacyFenceCertificate({
      storage,
      schoolId: SCHOOL_A,
    });
    const second = prepareScenarioLabelN3LegacyFenceCertificate({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(first).toEqual({ status: "prepared" });
    expect(second).toEqual({ status: "already_prepared" });
    expect(assessFromStorage(storage).status).toBe("LEGACY_COMMITTED");
  });
});

describe("N3-PREP owner orchestration", () => {
  it("O1: establishment established → FENCE-WRITE path; PREP not required on that outcome", () => {
    const storage = new MemoryStorage();
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "NEW");
    // Direct establish (allowCutover default false) — legacy fence only, no ACTIVATE cutover.
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result.status).toBe("established");
    expect(assessFromStorage(storage).status).toBe("LEGACY_COMMITTED");
  });

  it("O2: already_ready + no fence → PREP then ACTIVATE cutover via post-ready owner", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "READY");
    expect(storage.getItem(schoolKeys().fence)).toBeNull();
    const result = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage },
    );
    expect(result.status).toBe("already_ready");
    expect(result).toMatchObject({
      cutover: { attempted: true, status: "cutover_success", notice: "silent" },
    });
    expect(assessFromStorage(storage).status).toBe("NAMESPACED_COMMITTED");
  });

  it("O3/O4: duplicate post-ready → first cutover, second namespaced no-op (0 fence writes)", () => {
    const storage = new MemoryStorage();
    const keys = seedSyncedPresent(storage, "READY");
    runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage },
    );
    const afterFirst = storage.getItem(keys.fence);
    expect(afterFirst).toBeTruthy();
    const writes = countFenceWrites(storage, keys.fence);
    const second = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage },
    );
    expect(second).toEqual({ status: "skipped_namespaced" });
    expect(writes()).toBe(0);
    expect(storage.getItem(keys.fence)).toBe(afterFirst);
  });

  it("O5: established owner path cutovers; second call is namespaced no-op", () => {
    const storage = new MemoryStorage();
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "EST");
    const established = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage },
    );
    expect(established.status).toBe("established");
    expect(established).toMatchObject({
      cutover: { attempted: true, status: "cutover_success", notice: "silent" },
    });
    expect(assessFromStorage(storage).status).toBe("NAMESPACED_COMMITTED");
    const again = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage },
    );
    expect(again).toEqual({ status: "skipped_namespaced" });
  });

  it("O6: VZ-equivalent post-ready already_ready → PREP then cutover", () => {
    const storage = new MemoryStorage();
    seedSyncedPresent(storage, "VZ");
    const result = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "noop", schoolId: SCHOOL_A },
      { storage },
    );
    expect(result.status).toBe("already_ready");
    expect(result).toMatchObject({
      cutover: { attempted: true, status: "cutover_success", notice: "silent" },
    });
    expect(assessFromStorage(storage).status).toBe("NAMESPACED_COMMITTED");
  });

  it("O7: PREP failure leaves establishment already_ready (soft) and skips cutover", () => {
    const storage = new MemoryStorage();
    // Dirty marker → already_ready is false for establishment; use healthy then break prep.
    // Instead: healthy already_ready path where fence write fails.
    const keys = seedSyncedPresent(storage, "SOFT");
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key === keys.fence) throw new Error("quota");
      originalSet(key, value);
    };
    const result = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage },
    );
    expect(result).toEqual({ status: "already_ready" });
    expect(storage.getItem(keys.fence)).toBeNull();
    const marker = storage.getItem(keys.marker);
    expect(marker).toContain('"schemaVersion":1');
    expect(marker).toContain('"authority":"legacy"');
  });

  it("O8–O10: Dashboard/Backup/Restore do not import PREP helper (source-level covered separately)", () => {
    // Behavioral: prepare is only invoked from post-ready chain under test here.
    expect(typeof prepareScenarioLabelN3LegacyFenceCertificate).toBe("function");
    expect(typeof runScenarioLabelEstablishmentAfterSchoolReady).toBe("function");
  });
});
