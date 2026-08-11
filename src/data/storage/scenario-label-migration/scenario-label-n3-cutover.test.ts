/**
 * N3-CUTOVER-CORE — executor unit / concurrency / crash-state matrix (C1–C24).
 */

import { describe, expect, it } from "vitest";
import type { EntityId } from "../../../domain/shared/entity-id";
import {
  buildScenarioLabelN3LegacyMarker,
  buildScenarioLabelN3NamespacedMarker,
  serializeScenarioLabelN3AuthorityMarker,
} from "./scenario-label-n3-authority-marker";
import { assessScenarioLabelRuntimeAuthority } from "./scenario-label-n3-aware-assessment";
import {
  MemoryStorage,
  SCHOOL_A,
  rawAbsent,
  rawPresent,
  schoolKeys,
  seedLegacyReady,
  seedLegacyUnprepared,
  seedLegacyViolatedRecoverable,
  seedNamespacedDegraded,
  seedNamespacedReady,
} from "./scenario-label-n3-aware-test-helpers";
import { executeScenarioLabelN3AuthorityCutover } from "./scenario-label-n3-cutover";
import {
  SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION,
  SCENARIO_LABEL_N3_FENCE_RESOURCE,
  SCENARIO_LABEL_N3_FENCE_SCHEMA_VERSION,
} from "./scenario-label-n3-fence-types";
import {
  buildScenarioLabelN3FenceRecord,
  serializeScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-record";

const SCHOOL_B = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff" as EntityId;

/** Tracks physical setItem/removeItem order + counts (business vs metadata). */
class InstrumentedStorage extends MemoryStorage {
  writes: Array<{ op: "set" | "remove"; key: string }> = [];
  businessWriteCount = 0;
  metadataWriteCount = 0;

  private classify(key: string, keys: ReturnType<typeof schoolKeys>) {
    if (key === keys.legacy || key === keys.v2) return "business" as const;
    return "metadata" as const;
  }

  trackKeys(keys: ReturnType<typeof schoolKeys>) {
    this._keys = keys;
  }

  private _keys: ReturnType<typeof schoolKeys> | null = null;

  override setItem(key: string, value: string): void {
    this.writes.push({ op: "set", key });
    if (this._keys) {
      if (this.classify(key, this._keys) === "business") this.businessWriteCount += 1;
      else this.metadataWriteCount += 1;
    }
    super.setItem(key, value);
  }

  override removeItem(key: string): void {
    this.writes.push({ op: "remove", key });
    if (this._keys) {
      if (this.classify(key, this._keys) === "business") this.businessWriteCount += 1;
      else this.metadataWriteCount += 1;
    }
    super.removeItem(key);
  }

  resetTracking() {
    this.writes = [];
    this.businessWriteCount = 0;
    this.metadataWriteCount = 0;
    this.writeCount = 0;
  }
}

function seedLegacyReadyAbsent(storage: MemoryStorage, schoolId: EntityId = SCHOOL_A) {
  const keys = schoolKeys(schoolId);
  const raw = rawAbsent();
  storage.setItem(
    keys.marker,
    serializeScenarioLabelN3AuthorityMarker(
      buildScenarioLabelN3LegacyMarker({
        mirrorHealth: "synced",
        authoritativePresence: "absent",
      }),
    ),
  );
  storage.setItem(
    keys.fence,
    serializeScenarioLabelN3FenceRecord(
      buildScenarioLabelN3FenceRecord({
        authority: "legacy",
        schoolId,
        committedRaw: raw,
      }),
    ),
  );
  storage.writeCount = 0;
  return keys;
}

function seedLegacyReadyEmpty(storage: MemoryStorage, schoolId: EntityId = SCHOOL_A) {
  const keys = schoolKeys(schoolId);
  storage.setItem(keys.legacy, "");
  storage.setItem(keys.v2, "");
  storage.setItem(
    keys.marker,
    serializeScenarioLabelN3AuthorityMarker(
      buildScenarioLabelN3LegacyMarker({
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    ),
  );
  storage.setItem(
    keys.fence,
    serializeScenarioLabelN3FenceRecord(
      buildScenarioLabelN3FenceRecord({
        authority: "legacy",
        schoolId,
        committedRaw: rawPresent(""),
      }),
    ),
  );
  storage.writeCount = 0;
  return keys;
}

describe("N3-CUTOVER-CORE executeScenarioLabelN3AuthorityCutover", () => {
  it("C1 eligible normal value success — business unchanged, only metadata", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "Scenario A");
    storage.trackKeys(keys);
    storage.resetTracking();

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });

    expect(result).toEqual({ status: "cutover_success", schoolId: SCHOOL_A });
    expect(storage.getItem(keys.legacy)).toBe("Scenario A");
    expect(storage.getItem(keys.v2)).toBe("Scenario A");
    expect(storage.businessWriteCount).toBe(0);
    expect(storage.metadataWriteCount).toBeGreaterThanOrEqual(2);

    const post = assessScenarioLabelRuntimeAuthority({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(post.kind).toBe("NAMESPACED_READY");
  });

  it("C2 present empty success — presence stays PRESENT", () => {
    const storage = new MemoryStorage();
    const keys = seedLegacyReadyEmpty(storage);

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("cutover_success");
    expect(storage.getItem(keys.legacy)).toBe("");
    expect(storage.getItem(keys.v2)).toBe("");
    expect(storage.store.has(keys.legacy)).toBe(true);
    expect(storage.store.has(keys.v2)).toBe(true);

    const post = assessScenarioLabelRuntimeAuthority({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(post.kind).toBe("NAMESPACED_READY");
    if (post.kind === "NAMESPACED_READY") {
      expect(post.marker.authoritativePresence).toBe("present");
      expect(post.fence.committedRaw).toEqual({ exists: true, value: "" });
    }
  });

  it("C3 synchronized absence success", () => {
    const storage = new MemoryStorage();
    const keys = seedLegacyReadyAbsent(storage);

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("cutover_success");
    expect(storage.getItem(keys.legacy)).toBeNull();
    expect(storage.getItem(keys.v2)).toBeNull();

    const post = assessScenarioLabelRuntimeAuthority({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(post.kind).toBe("NAMESPACED_READY");
    if (post.kind === "NAMESPACED_READY") {
      expect(post.marker.authoritativePresence).toBe("absent");
      expect(post.fence.committedRaw).toEqual({ exists: false });
    }
  });

  it("C4 missing fence → 0 writes", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyUnprepared(storage, "A");
    storage.trackKeys(keys);
    storage.resetTracking();

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result).toEqual({ status: "not_eligible", reason: "legacy_unprepared" });
    expect(storage.writes).toEqual([]);
  });

  it("C5 dirty marker → 0 writes", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.setItem(
      keys.marker,
      serializeScenarioLabelN3AuthorityMarker(
        buildScenarioLabelN3LegacyMarker({
          mirrorHealth: "dirty",
          authoritativePresence: "present",
        }),
      ),
    );
    storage.trackKeys(keys);
    storage.resetTracking();

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("not_eligible");
    expect(storage.writes).toEqual([]);
  });

  it("C6 raw mismatch → 0 writes", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.setItem(keys.v2, "B");
    storage.trackKeys(keys);
    storage.resetTracking();

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("not_eligible");
    expect(storage.writes).toEqual([]);
  });

  it("C7 unbound → 0 writes", () => {
    const storage = new InstrumentedStorage();
    const keys = schoolKeys(SCHOOL_A);
    storage.trackKeys(keys);
    storage.resetTracking();

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    // No school keys → not LEGACY_READY
    expect(result.status).toBe("not_eligible");
    expect(storage.writes).toEqual([]);
  });

  it("C8 invalid Identity/target → skipped_identity, 0 writes", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.trackKeys(keys);
    storage.resetTracking();

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: "NOT-A-UUID" as EntityId,
    });
    expect(result).toEqual({ status: "skipped_identity" });
    expect(storage.writes).toEqual([]);
  });

  it("C8b non-canonical uppercase UUID → skipped_identity", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.trackKeys(keys);
    storage.resetTracking();

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A.toUpperCase() as EntityId,
    });
    expect(result).toEqual({ status: "skipped_identity" });
    expect(storage.writes).toEqual([]);
  });

  it("C9 already namespaced → 0 writes", () => {
    const storage = new InstrumentedStorage();
    const keys = seedNamespacedReady(storage, "A");
    storage.trackKeys(keys);
    storage.resetTracking();

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result).toEqual({
      status: "already_namespaced",
      schoolId: SCHOOL_A,
      kind: "NAMESPACED_READY",
    });
    expect(storage.writes).toEqual([]);
  });

  it("C10 namespaced degraded → 0 writes (not a cutover target)", () => {
    const storage = new InstrumentedStorage();
    const keys = seedNamespacedDegraded(storage);
    storage.trackKeys(keys);
    storage.resetTracking();

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result).toEqual({
      status: "already_namespaced",
      schoolId: SCHOOL_A,
      kind: "NAMESPACED_DEGRADED",
    });
    expect(storage.writes).toEqual([]);
  });

  it("C11 marker write fail → marker_write_failed, legacy metadata remain", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.trackKeys(keys);
    storage.failSetKeys.add(keys.marker);
    storage.resetTracking();

    const priorMarker = storage.getItem(keys.marker);
    const priorFence = storage.getItem(keys.fence);

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result).toEqual({ status: "marker_write_failed" });
    expect(storage.getItem(keys.marker)).toBe(priorMarker);
    expect(storage.getItem(keys.fence)).toBe(priorFence);
    expect(storage.getItem(keys.legacy)).toBe("A");
    expect(storage.businessWriteCount).toBe(0);
  });

  it("C12 marker verify fail → rollback to legacy", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.trackKeys(keys);
    storage.resetTracking();

    const priorMarker = storage.getItem(keys.marker)!;
    const priorFence = storage.getItem(keys.fence)!;

    let markerSets = 0;
    const origSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key === keys.marker) {
        markerSets += 1;
        if (markerSets === 1) {
          // First cutover marker write succeeds physically but corrupts verify.
          origSet(key, "{not-valid-marker");
          storage.writes.push({ op: "set", key });
          storage.metadataWriteCount += 1;
          storage.writeCount += 1;
          return;
        }
      }
      return origSet(key, value);
    };

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("rolled_back");
    if (result.status === "rolled_back") {
      expect(result.from).toBe("marker_verify_failed");
    }
    expect(storage.getItem(keys.marker)).toBe(priorMarker);
    expect(storage.getItem(keys.fence)).toBe(priorFence);
    expect(storage.businessWriteCount).toBe(0);
    expect(assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A }).kind).toBe(
      "LEGACY_READY",
    );
  });

  it("C13 fence write fail → rollback", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.trackKeys(keys);
    storage.failSetKeys.add(keys.fence);
    storage.resetTracking();

    const priorMarker = storage.getItem(keys.marker)!;
    const priorFence = storage.getItem(keys.fence)!;

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("rolled_back");
    if (result.status === "rolled_back") {
      expect(result.from).toBe("fence_write_failed");
    }
    expect(storage.getItem(keys.marker)).toBe(priorMarker);
    expect(storage.getItem(keys.fence)).toBe(priorFence);
    expect(storage.businessWriteCount).toBe(0);
  });

  it("C14 fence verify fail → rollback", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.trackKeys(keys);
    storage.resetTracking();

    const priorMarker = storage.getItem(keys.marker)!;
    const priorFence = storage.getItem(keys.fence)!;

    let fenceSets = 0;
    const origSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key === keys.fence) {
        fenceSets += 1;
        if (fenceSets === 1) {
          origSet(key, "{bad-fence");
          storage.writes.push({ op: "set", key });
          storage.metadataWriteCount += 1;
          storage.writeCount += 1;
          return;
        }
      }
      return origSet(key, value);
    };

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("rolled_back");
    if (result.status === "rolled_back") {
      expect(result.from).toBe("fence_verify_failed");
    }
    expect(storage.getItem(keys.marker)).toBe(priorMarker);
    expect(storage.getItem(keys.fence)).toBe(priorFence);
    expect(storage.businessWriteCount).toBe(0);
  });

  it("C15 rollback fail → fatal_partial", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.trackKeys(keys);
    storage.resetTracking();

    let markerSets = 0;
    const origSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key === keys.marker) {
        markerSets += 1;
        if (markerSets === 1) {
          origSet(key, "{bad");
          storage.writes.push({ op: "set", key });
          storage.metadataWriteCount += 1;
          storage.writeCount += 1;
          // Subsequent rollback setItem for marker will fail.
          storage.failSetKeys.add(keys.marker);
          return;
        }
      }
      return origSet(key, value);
    };

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("fatal_partial");
    if (result.status === "fatal_partial") {
      expect(result.phase).toBe("marker_verify");
    }
  });

  it("C16 pre-marker drift → 0 writes / concurrent_drift", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.trackKeys(keys);
    storage.resetTracking();

    // First evaluateFreshEligibility: assess + readFreshTuple ⇒ 2 fence reads.
    // Third fence read begins pre-marker readFreshTuple — inject business drift there.
    let fenceReads = 0;
    const origGet = storage.getItem.bind(storage);
    storage.getItem = (key: string) => {
      if (key === keys.fence) {
        fenceReads += 1;
        if (fenceReads === 3) {
          storage.store.set(keys.legacy, "DRIFTED");
          storage.store.set(keys.v2, "DRIFTED");
        }
      }
      return origGet(key);
    };

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("concurrent_drift");
    if (result.status === "concurrent_drift") {
      expect(result.phase).toBe("pre_marker");
    }
    expect(storage.writes.filter((w) => w.key === keys.marker || w.key === keys.fence)).toEqual(
      [],
    );
  });

  it("C17 post-marker drift → no namespaced fence", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.trackKeys(keys);
    storage.resetTracking();

    const priorFence = storage.getItem(keys.fence)!;
    let markerWritten = false;
    const origSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      const out = origSet(key, value);
      if (key === keys.marker) {
        markerWritten = true;
        // Concurrent external business write to B after marker v2.
        storage.store.set(keys.legacy, "B");
        storage.store.set(keys.v2, "B");
      }
      return out;
    };

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });

    expect(markerWritten).toBe(true);
    // Must not finalize namespaced fence for drifted B while snapshot certified A.
    const fenceNow = storage.getItem(keys.fence);
    if (fenceNow) {
      const parsed = JSON.parse(fenceNow) as { authority?: string; committedRaw?: unknown };
      expect(parsed.authority).not.toBe("namespaced");
    }
    expect(["cutover_degraded", "rolled_back", "fatal_partial"]).toContain(result.status);
    // Stale A fence must not be claimed as healthy success path.
    expect(result.status).not.toBe("cutover_success");
    void priorFence;
  });

  it("C18 stale-fence resurrection forbidden", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.trackKeys(keys);
    storage.resetTracking();

    const origSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      const out = origSet(key, value);
      if (key === keys.marker) {
        storage.store.set(keys.legacy, "B");
        storage.store.set(keys.v2, "B");
      }
      return out;
    };

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });

    expect(result.status).not.toBe("cutover_success");
    expect(result.status).not.toBe("rolled_back"); // cannot safely prove coherent legacy+fence A
    expect(result).toMatchObject({
      status: "cutover_degraded",
      reason: "stale_fence_resurrection_forbidden",
    });

    const post = assessScenarioLabelRuntimeAuthority({
      storage,
      schoolId: SCHOOL_A,
    });
    // Intermediate / violated — never healthy LEGACY_COMMITTED success claim via stale A fence.
    expect(post.kind).not.toBe("LEGACY_READY");
    expect(post.kind).not.toBe("NAMESPACED_READY");
  });

  it("C19 wrong-school fence → 0 writes", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A", SCHOOL_A);
    // Overwrite fence to bind SCHOOL_B while keys remain SCHOOL_A.
    storage.setItem(
      keys.fence,
      serializeScenarioLabelN3FenceRecord(
        buildScenarioLabelN3FenceRecord({
          authority: "legacy",
          schoolId: SCHOOL_B,
          committedRaw: rawPresent("A"),
        }),
      ),
    );
    storage.trackKeys(keys);
    storage.resetTracking();

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("not_eligible");
    expect(storage.writes).toEqual([]);
  });

  it("C20 wrong-resource fence → 0 writes", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.setItem(
      keys.fence,
      JSON.stringify({
        schemaVersion: SCENARIO_LABEL_N3_FENCE_SCHEMA_VERSION,
        protocolGeneration: SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION,
        authority: "legacy",
        markerSchemaVersion: 1,
        schoolId: SCHOOL_A,
        resource: "wrong/resource",
        committedRaw: { exists: true, value: "A" },
      }),
    );
    storage.trackKeys(keys);
    storage.resetTracking();

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("not_eligible");
    expect(storage.writes).toEqual([]);
    void SCENARIO_LABEL_N3_FENCE_RESOURCE;
  });

  it("C21 exact marker-before-fence ordering", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.trackKeys(keys);
    storage.resetTracking();

    const result = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("cutover_success");

    const markerIdx = storage.writes.findIndex(
      (w) => w.op === "set" && w.key === keys.marker,
    );
    const fenceIdx = storage.writes.findIndex(
      (w) => w.op === "set" && w.key === keys.fence,
    );
    expect(markerIdx).toBeGreaterThanOrEqual(0);
    expect(fenceIdx).toBeGreaterThan(markerIdx);
    // Fence is last physical write on successful path.
    expect(fenceIdx).toBe(storage.writes.length - 1);
  });

  it("C22 successful path has 0 business writes", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "Value");
    storage.trackKeys(keys);
    storage.resetTracking();

    executeScenarioLabelN3AuthorityCutover({ storage, schoolId: SCHOOL_A });
    expect(storage.businessWriteCount).toBe(0);
    expect(
      storage.writes.every((w) => w.key === keys.marker || w.key === keys.fence),
    ).toBe(true);
  });

  it("C23 intermediate crash states fail-closed (AWARE)", () => {
    const cases: Array<() => MemoryStorage> = [
      () => {
        // v2 marker + old legacy fence
        const s = new MemoryStorage();
        const keys = seedLegacyReady(s, "A");
        s.setItem(
          keys.marker,
          serializeScenarioLabelN3AuthorityMarker(
            buildScenarioLabelN3NamespacedMarker({
              mirrorHealth: "synced",
              authoritativePresence: "present",
            }),
          ),
        );
        return s;
      },
      () => {
        // v2 marker + missing fence
        const s = new MemoryStorage();
        const keys = seedLegacyReady(s, "A");
        s.setItem(
          keys.marker,
          serializeScenarioLabelN3AuthorityMarker(
            buildScenarioLabelN3NamespacedMarker({
              mirrorHealth: "synced",
              authoritativePresence: "present",
            }),
          ),
        );
        s.removeItem(keys.fence);
        return s;
      },
      () => {
        // v2 marker + malformed fence
        const s = new MemoryStorage();
        const keys = seedLegacyReady(s, "A");
        s.setItem(
          keys.marker,
          serializeScenarioLabelN3AuthorityMarker(
            buildScenarioLabelN3NamespacedMarker({
              mirrorHealth: "synced",
              authoritativePresence: "present",
            }),
          ),
        );
        s.setItem(keys.fence, "{nope");
        return s;
      },
      () => {
        // legacy marker + namespaced fence
        const s = new MemoryStorage();
        const keys = seedLegacyReady(s, "A");
        s.setItem(
          keys.fence,
          serializeScenarioLabelN3FenceRecord(
            buildScenarioLabelN3FenceRecord({
              authority: "namespaced",
              schoolId: SCHOOL_A,
              committedRaw: rawPresent("A"),
            }),
          ),
        );
        return s;
      },
    ];

    for (const make of cases) {
      const storage = make();
      const assessment = assessScenarioLabelRuntimeAuthority({
        storage,
        schoolId: SCHOOL_A,
      });
      expect(["AUTHORITY_BLOCKED", "NAMESPACED_DEGRADED", "LEGACY_VIOLATED_RECOVERABLE"]).toContain(
        assessment.kind,
      );
      expect(assessment.kind).not.toBe("NAMESPACED_READY");
      expect(assessment.kind).not.toBe("LEGACY_READY");

      const cut = executeScenarioLabelN3AuthorityCutover({
        storage,
        schoolId: SCHOOL_A,
      });
      expect(cut.status).not.toBe("cutover_success");
    }
  });

  it("C24 repeated already-namespaced → 0 writes", () => {
    const storage = new InstrumentedStorage();
    const keys = seedLegacyReady(storage, "A");
    storage.trackKeys(keys);
    storage.resetTracking();

    expect(
      executeScenarioLabelN3AuthorityCutover({ storage, schoolId: SCHOOL_A }).status,
    ).toBe("cutover_success");

    storage.resetTracking();
    const second = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(second).toEqual({
      status: "already_namespaced",
      schoolId: SCHOOL_A,
      kind: "NAMESPACED_READY",
    });
    expect(storage.writes).toEqual([]);

    storage.resetTracking();
    const third = executeScenarioLabelN3AuthorityCutover({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(third.status).toBe("already_namespaced");
    expect(storage.writes).toEqual([]);
  });

  describe("concurrency matrix", () => {
    it("A pre-marker external marker mutation → concurrent_drift / not_eligible, 0 success", () => {
      const storage = new InstrumentedStorage();
      const keys = seedLegacyReady(storage, "A");
      storage.trackKeys(keys);
      storage.resetTracking();

      let reads = 0;
      const origGet = storage.getItem.bind(storage);
      storage.getItem = (key: string) => {
        reads += 1;
        if (reads === 8) {
          storage.store.set(
            keys.marker,
            serializeScenarioLabelN3AuthorityMarker(
              buildScenarioLabelN3LegacyMarker({
                mirrorHealth: "dirty",
                authoritativePresence: "present",
              }),
            ),
          );
        }
        return origGet(key);
      };

      const result = executeScenarioLabelN3AuthorityCutover({
        storage,
        schoolId: SCHOOL_A,
      });
      expect(result.status).not.toBe("cutover_success");
    });

    it("C same-value external rewrite may remain safe when eligibility holds", () => {
      const storage = new InstrumentedStorage();
      const keys = seedLegacyReady(storage, "A");
      storage.trackKeys(keys);
      storage.resetTracking();

      const origSet = storage.setItem.bind(storage);
      // External rewrite of same byte value on business keys before cutover — observable state equal.
      storage.store.set(keys.legacy, "A");
      storage.store.set(keys.v2, "A");

      const result = executeScenarioLabelN3AuthorityCutover({
        storage,
        schoolId: SCHOOL_A,
      });
      expect(result.status).toBe("cutover_success");
      expect(storage.businessWriteCount).toBe(0);
      void origSet;
    });

    it("D presence change before marker → not eligible / drift", () => {
      const storage = new InstrumentedStorage();
      const keys = seedLegacyReady(storage, "A");
      storage.removeItem(keys.legacy);
      storage.removeItem(keys.v2);
      // marker still says present — dirty / mismatch
      storage.trackKeys(keys);
      storage.resetTracking();

      const result = executeScenarioLabelN3AuthorityCutover({
        storage,
        schoolId: SCHOOL_A,
      });
      expect(result.status).toBe("not_eligible");
      expect(storage.writes).toEqual([]);
    });

    it("E external fence mutation before write → not eligible", () => {
      const storage = new InstrumentedStorage();
      const keys = seedLegacyReady(storage, "A");
      storage.removeItem(keys.fence);
      storage.trackKeys(keys);
      storage.resetTracking();

      const result = executeScenarioLabelN3AuthorityCutover({
        storage,
        schoolId: SCHOOL_A,
      });
      expect(result.status).toBe("not_eligible");
      expect(storage.writes).toEqual([]);
    });

    it("F violated recoverable never cut over", () => {
      const storage = new InstrumentedStorage();
      const keys = seedLegacyViolatedRecoverable(storage);
      storage.trackKeys(keys);
      storage.resetTracking();

      const result = executeScenarioLabelN3AuthorityCutover({
        storage,
        schoolId: SCHOOL_A,
      });
      expect(result).toEqual({ status: "not_eligible", reason: "legacy_violated" });
      expect(storage.writes).toEqual([]);
    });
  });
});
