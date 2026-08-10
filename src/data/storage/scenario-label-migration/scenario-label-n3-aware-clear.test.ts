import { describe, expect, it } from "vitest";
import { assessScenarioLabelRuntimeAuthority } from "./scenario-label-n3-aware-assessment";
import {
  clearScenarioLabelAwareLogical,
  clearScenarioLabelNamespaced,
} from "./scenario-label-n3-aware-clear";
import {
  MemoryStorage,
  SCHOOL_A,
  seedConflictingAuthority,
  seedLegacyReady,
  seedNamespacedReady,
  schoolKeys,
} from "./scenario-label-n3-aware-test-helpers";
import {
  parseScenarioLabelN3AuthorityMarkerJson,
} from "./scenario-label-n3-authority-marker";
import { parseScenarioLabelN3FenceRecordJson } from "./scenario-label-n3-fence-record";

describe("N3-AWARE-CORE clear (C1–C11)", () => {
  it("C1 legacy clear adapter semantics", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "L");
    const result = clearScenarioLabelAwareLogical({
      storage,
      schoolId: SCHOOL_A,
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
    expect(storage.getItem(schoolKeys().legacy)).toBeNull();
  });

  it("C2/C3 namespaced clear — v2 removed first, then legacy", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "NS");
    const order: string[] = [];
    const originalRemove = storage.removeItem.bind(storage);
    storage.removeItem = (key: string) => {
      order.push(key);
      return originalRemove(key);
    };
    const result = clearScenarioLabelNamespaced({ storage, schoolId: SCHOOL_A });
    expect(result.status).toBe("success");
    expect(order.indexOf(keys.v2)).toBeLessThan(order.indexOf(keys.legacy));
    expect(storage.getItem(keys.v2)).toBeNull();
    expect(storage.getItem(keys.legacy)).toBeNull();
  });

  it("C4/C5 legacy mirror remove fail → rollback", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "NS");
    storage.failRemoveKeys.add(keys.legacy);
    const result = clearScenarioLabelNamespaced({ storage, schoolId: SCHOOL_A });
    expect(result.status).toBe("rollback_succeeded");
    expect(storage.getItem(keys.v2)).toBe("NS");
  });

  it("C6 rollback fatal", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "NS");
    storage.failRemoveKeys.add(keys.legacy);
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key === keys.v2) throw new Error("rollback_fail");
      return originalSet(key, value);
    };
    const result = clearScenarioLabelNamespaced({ storage, schoolId: SCHOOL_A });
    expect(result.status).toBe("fatal_partial");
  });

  it("C7 schema2 absent marker preserved (no v1)", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "NS");
    const result = clearScenarioLabelNamespaced({ storage, schoolId: SCHOOL_A });
    expect(result.status).toBe("success");
    const marker = parseScenarioLabelN3AuthorityMarkerJson(
      storage.getItem(schoolKeys().marker),
    );
    expect(marker.status).toBe("valid");
    if (marker.status === "valid") {
      expect(marker.payload.schemaVersion).toBe(2);
      expect(marker.payload.authority).toBe("namespaced");
      expect(marker.payload.authoritativePresence).toBe("absent");
    }
  });

  it("C8 namespaced fence absent/committed for cleared state", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "NS");
    clearScenarioLabelNamespaced({ storage, schoolId: SCHOOL_A });
    const fence = parseScenarioLabelN3FenceRecordJson(storage.getItem(schoolKeys().fence));
    expect(fence.status).toBe("valid");
    if (fence.status === "valid") {
      expect(fence.record.authority).toBe("namespaced");
      expect(fence.record.committedRaw).toEqual({ exists: false });
    }
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("NAMESPACED_READY");
  });

  it("C9 fence fail → fence_incomplete", () => {
    const storage = new MemoryStorage();
    const keys = seedNamespacedReady(storage, "NS");
    storage.failSetKeys.add(keys.fence);
    const result = clearScenarioLabelNamespaced({ storage, schoolId: SCHOOL_A });
    expect(result.status).toBe("fence_incomplete");
    expect(storage.getItem(keys.v2)).toBeNull();
    expect(storage.getItem(keys.legacy)).toBeNull();
  });

  it("C10 blocked authority → 0 writes", () => {
    const storage = new MemoryStorage();
    seedConflictingAuthority(storage);
    storage.writeCount = 0;
    const result = clearScenarioLabelAwareLogical({
      storage,
      schoolId: SCHOOL_A,
    });
    expect(result.status).toBe("blocked_authority");
    expect(storage.writeCount).toBe(0);
    expect(storage.getItem(schoolKeys().legacy)).toBe("A");
  });

  it("C11 no v1 downgrade", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "NS");
    clearScenarioLabelNamespaced({ storage, schoolId: SCHOOL_A });
    const marker = parseScenarioLabelN3AuthorityMarkerJson(
      storage.getItem(schoolKeys().marker),
    );
    expect(marker.status).toBe("valid");
    if (marker.status === "valid") {
      expect(marker.payload.schemaVersion).not.toBe(1);
      expect(marker.payload.authority).toBe("namespaced");
    }
    // Ensure we never wrote a v1 builder payload shape via clear path.
    expect(storage.getItem(schoolKeys().marker)).toContain('"schemaVersion":2');
  });
});
