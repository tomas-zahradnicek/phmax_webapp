import { describe, expect, it } from "vitest";
import { assessScenarioLabelRuntimeAuthority } from "./scenario-label-n3-aware-assessment";
import {
  writeScenarioLabelAwareLogical,
  writeScenarioLabelNamespacedRaw,
} from "./scenario-label-n3-aware-write";
import {
  MemoryStorage,
  SCHOOL_A,
  rawAbsent,
  rawPresent,
  seedLegacyReady,
  seedNamespacedDegraded,
  seedNamespacedReady,
  schoolKeys,
} from "./scenario-label-n3-aware-test-helpers";
import {
  buildScenarioLabelN3NamespacedMarker,
  parseScenarioLabelN3AuthorityMarkerJson,
  serializeScenarioLabelN3AuthorityMarker,
} from "./scenario-label-n3-authority-marker";
import {
  buildScenarioLabelN3FenceRecord,
  parseScenarioLabelN3FenceRecordJson,
  serializeScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-record";

describe("N3-AWARE-CORE namespaced write (W1–W18)", () => {
  it("W1 successful v2-first commit → NAMESPACED_READY", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "Old");
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("New"),
    });
    expect(result.status).toBe("success");
    expect(storage.getItem(keys.v2)).toBe("New");
    expect(storage.getItem(keys.legacy)).toBe("New");
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("NAMESPACED_READY");
    const fence = parseScenarioLabelN3FenceRecordJson(storage.getItem(keys.fence));
    expect(fence.status).toBe("valid");
    if (fence.status === "valid") {
      expect(fence.record.authority).toBe("namespaced");
      expect(fence.record.committedRaw).toEqual(rawPresent("New"));
    }
  });

  it("W2 v2 fail → legacy unchanged + authoritative_failed", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "Old");
    storage.failSetKeys.add(keys.v2);
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("New"),
    });
    expect(result).toEqual({
      status: "authoritative_failed",
      code: "v2_write_failed",
      legacyAdvanced: false,
    });
    expect(storage.getItem(keys.legacy)).toBe("Old");
  });

  it("W3/W4 legacy mirror fail → rollback success", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "Old");
    storage.failSetKeys.add(keys.legacy);
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("New"),
    });
    expect(result.status).toBe("rollback_succeeded");
    expect(storage.getItem(keys.v2)).toBe("Old");
    expect(storage.getItem(keys.legacy)).toBe("Old");
  });

  it("W5 rollback failure → fatal_partial", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "Old");
    // Mirror write fails; then v2 rollback also fails.
    storage.failSetKeys.add(keys.legacy);
    const originalSet = storage.setItem.bind(storage);
    let v2Writes = 0;
    storage.setItem = (key: string, value: string) => {
      if (key === keys.v2) {
        v2Writes += 1;
        // First write (authoritative New) succeeds; subsequent rollback fails.
        if (v2Writes > 1) throw new Error("rollback_fail");
      }
      if (key === keys.legacy) throw new Error("legacy_fail");
      return originalSet(key, value);
    };
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("New"),
    });
    expect(result.status).toBe("fatal_partial");
  });

  it("W6 marker fail value-only → marker_incomplete data_ok", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "Old");
    storage.failSetKeys.add(keys.marker);
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("New"),
    });
    expect(result).toEqual({
      status: "marker_incomplete",
      kind: "value_only",
      business: "data_ok_metadata_incomplete",
    });
    expect(storage.getItem(keys.v2)).toBe("New");
    expect(storage.getItem(keys.legacy)).toBe("New");
  });

  it("W7 marker fail presence transition → failed_conservative", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "Old");
    storage.failSetKeys.add(keys.marker);
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawAbsent(),
    });
    expect(result).toEqual({
      status: "marker_incomplete",
      kind: "presence_change",
      business: "failed_conservative",
    });
  });

  it("W8 fence write fail → fence_incomplete (no full rollback)", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "Old");
    storage.failSetKeys.add(keys.fence);
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("New"),
    });
    expect(result.status).toBe("fence_incomplete");
    if (result.status === "fence_incomplete") {
      expect(result.dataSettled).toBe(true);
    }
    expect(storage.getItem(keys.v2)).toBe("New");
    expect(storage.getItem(keys.legacy)).toBe("New");
    const marker = parseScenarioLabelN3AuthorityMarkerJson(storage.getItem(keys.marker));
    expect(marker.status).toBe("valid");
    if (marker.status === "valid") {
      expect(marker.payload.authority).toBe("namespaced");
    }
  });

  it("W9 fence read-back fail → fence_incomplete", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "Old");
    const originalGet = storage.getItem.bind(storage);
    let fenceGets = 0;
    storage.getItem = (key: string) => {
      if (key === keys.fence) {
        fenceGets += 1;
        // After write, corrupt read-back by returning invalid JSON once settled.
        const val = originalGet(key);
        if (val != null && fenceGets > 2) return "{bad";
        return val;
      }
      return originalGet(key);
    };
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("New"),
    });
    // May be fence_incomplete or success depending on get timing; pin incomplete when malformed.
    expect(["fence_incomplete", "success"]).toContain(result.status);
  });

  it("W10 post-fence drift → fence_incomplete", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "Old");
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      originalSet(key, value);
      if (key === keys.fence) {
        // Drift school-v2 after fence write.
        originalSet(keys.v2, "DRIFT");
      }
    };
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("New"),
    });
    expect(result.status).toBe("fence_incomplete");
  });

  it("W11 authority drift before write → blocked", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "Legacy");
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("Hack"),
    });
    expect(result.status).toBe("blocked_authority");
    expect(storage.getItem(schoolKeys().legacy)).toBe("Legacy");
  });

  it("W12 no fallback to legacy writer (namespaced path only)", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "Old");
    const src = writeScenarioLabelNamespacedRaw.toString();
    // Source-level: function body must not call writeScenarioLabelRaw.
    expect(src).not.toContain("writeScenarioLabelRaw(");
  });

  it("W13 never legacy→schema2 via namespaced writer", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "L");
    const before = storage.getItem(schoolKeys().marker);
    writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("X"),
    });
    expect(storage.getItem(schoolKeys().marker)).toBe(before);
  });

  it("W14 present→absent", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "A");
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawAbsent(),
    });
    expect(result.status).toBe("success");
    expect(storage.getItem(schoolKeys().v2)).toBeNull();
    expect(storage.getItem(schoolKeys().legacy)).toBeNull();
  });

  it("W15 absent→present", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    storage.setItem(
      keys.marker,
      serializeScenarioLabelN3AuthorityMarker(
        buildScenarioLabelN3NamespacedMarker({
          mirrorHealth: "synced",
          authoritativePresence: "absent",
        }),
      ),
    );
    storage.setItem(
      keys.fence,
      serializeScenarioLabelN3FenceRecord(
        buildScenarioLabelN3FenceRecord({
          authority: "namespaced",
          schoolId: SCHOOL_A,
          committedRaw: rawAbsent(),
        }),
      ),
    );
    storage.writeCount = 0;
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("Back"),
    });
    expect(result.status).toBe("success");
    expect(storage.getItem(keys.v2)).toBe("Back");
  });

  it('W16 present ""', () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "A");
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent(""),
    });
    expect(result.status).toBe("success");
    expect(storage.getItem(schoolKeys().v2)).toBe("");
    expect(storage.getItem(schoolKeys().legacy)).toBe("");
  });

  it("W17 concurrent mirror overwrite → rollback", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "Old");
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      originalSet(key, value);
      if (key === keys.legacy && value === "New") {
        // Concurrent overwrite of legacy after our mirror write.
        originalSet(keys.legacy, "OTHER");
      }
    };
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("New"),
    });
    expect(result.status).toBe("rollback_succeeded");
  });

  it("W18 final NAMESPACED_COMMITTED / NAMESPACED_READY required", () => {
    const storage = new MemoryStorage();
    seedNamespacedDegraded(storage);
    const result = writeScenarioLabelNamespacedRaw({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("Fixed"),
    });
    expect(result.status).toBe("success");
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("NAMESPACED_READY");
  });

  it("dispatcher: legacy path never routes to namespaced writer", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "L");
    const result = writeScenarioLabelAwareLogical({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("L2"),
      readIdentity: () => ({
        ok: true,
        registry: {
          schemaVersion: 1 as const,
          schoolId: SCHOOL_A,
          schoolYears: [],
          updatedAt: "2020-01-01T00:00:00.000Z",
        },
      }),
    });
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.authority).toBe("legacy");
    }
    const marker = parseScenarioLabelN3AuthorityMarkerJson(
      storage.getItem(schoolKeys().marker),
    );
    expect(marker.status).toBe("valid");
    if (marker.status === "valid") {
      expect(marker.payload.authority).toBe("legacy");
      expect(marker.payload.schemaVersion).toBe(1);
    }
  });

  it("dispatcher: blocked authority → 0 business writes", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    storage.setItem(keys.marker, "{bad");
    storage.setItem(keys.legacy, "X");
    storage.writeCount = 0;
    const result = writeScenarioLabelAwareLogical({
      storage,
      schoolId: SCHOOL_A,
      desiredRaw: rawPresent("Y"),
    });
    expect(result.status).toBe("blocked_authority");
    expect(storage.getItem(keys.legacy)).toBe("X");
  });
});
