import { describe, expect, it } from "vitest";
import { assessScenarioLabelRuntimeAuthority } from "./scenario-label-n3-aware-assessment";
import { readScenarioLabelAwareLogical } from "./scenario-label-n3-aware-read";
import {
  MemoryStorage,
  SCHOOL_A,
  seedConflictingAuthority,
  seedLegacyReady,
  seedLegacyUnprepared,
  seedLegacyViolatedRecoverable,
  seedNamespacedDegraded,
  seedNamespacedMissingFence,
  seedNamespacedReady,
  schoolKeys,
} from "./scenario-label-n3-aware-test-helpers";
import {
  buildScenarioLabelN3LegacyMarker,
  serializeScenarioLabelN3AuthorityMarker,
} from "./scenario-label-n3-authority-marker";
import {
  buildScenarioLabelN3FenceRecord,
  serializeScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-record";
import { rawPresent } from "./scenario-label-n3-aware-test-helpers";

describe("N3-AWARE-CORE authority assessment (A1–A12)", () => {
  it("A1 LEGACY_READY", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "Alpha");
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("LEGACY_READY");
    if (a.kind === "LEGACY_READY") {
      expect(a.legacyRaw).toEqual({ exists: true, value: "Alpha" });
      expect(a.fenceAssessment.status).toBe("LEGACY_COMMITTED");
    }
  });

  it("A2 LEGACY_COMPAT_UNPREPARED — healthy + missing fence", () => {
    const storage = new MemoryStorage();
    seedLegacyUnprepared(storage, "Alpha");
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("LEGACY_COMPAT_UNPREPARED");
    if (a.kind === "LEGACY_COMPAT_UNPREPARED") {
      expect(a.reason).toBe("fence_missing");
    }
  });

  it("A3 LEGACY_VIOLATED_RECOVERABLE — stale legacy fence, no namespaced evidence", () => {
    const storage = new MemoryStorage();
    seedLegacyViolatedRecoverable(storage);
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("LEGACY_VIOLATED_RECOVERABLE");
  });

  it("A4 NAMESPACED_READY", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "NS");
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("NAMESPACED_READY");
    if (a.kind === "NAMESPACED_READY") {
      expect(a.schoolV2Raw).toEqual({ exists: true, value: "NS" });
      expect(a.fenceAssessment.status).toBe("NAMESPACED_COMMITTED");
    }
  });

  it("A5 NAMESPACED_DEGRADED — mirror dirty / mismatch", () => {
    const storage = new MemoryStorage();
    seedNamespacedDegraded(storage);
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("NAMESPACED_DEGRADED");
  });

  it("A6 AUTHORITY_BLOCKED — invalid marker", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    storage.setItem(keys.legacy, "A");
    storage.setItem(keys.v2, "A");
    storage.setItem(keys.marker, "{not-json");
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("AUTHORITY_BLOCKED");
    if (a.kind === "AUTHORITY_BLOCKED") {
      expect(a.reason).toBe("malformed_marker");
    }
  });

  it("A7 namespaced marker + missing fence → AUTHORITY_BLOCKED", () => {
    const storage = new MemoryStorage();
    seedNamespacedMissingFence(storage, "NS");
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("AUTHORITY_BLOCKED");
    if (a.kind === "AUTHORITY_BLOCKED") {
      expect(a.reason).toBe("namespaced_without_fence");
    }
  });

  it("A8 conflicting v1/v2/fence → AUTHORITY_BLOCKED", () => {
    const storage = new MemoryStorage();
    seedConflictingAuthority(storage);
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("AUTHORITY_BLOCKED");
  });

  it("A9 UNBOUND", () => {
    const storage = new MemoryStorage();
    storage.setItem(schoolKeys().legacy, "U");
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: null });
    expect(a.kind).toBe("UNBOUND");
    if (a.kind === "UNBOUND") {
      expect(a.legacyRaw).toEqual({ exists: true, value: "U" });
    }
  });

  it("A10 STORAGE_UNAVAILABLE", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    storage.failGetKeys.add(keys.legacy);
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("STORAGE_UNAVAILABLE");
  });

  it("A11 missing vs empty preserved in assessment raws", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    // present empty
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
          schoolId: SCHOOL_A,
          committedRaw: rawPresent(""),
        }),
      ),
    );
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("LEGACY_READY");
    if (a.kind === "LEGACY_READY") {
      expect(a.legacyRaw).toEqual({ exists: true, value: "" });
    }
  });

  it("A12 assessment never exposes fence.committedRaw as business routing field", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "NS");
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("NAMESPACED_READY");
    if (a.kind === "NAMESPACED_READY") {
      // Logical value surface is schoolV2Raw, not fence.committedRaw.
      expect(a.schoolV2Raw).toEqual({ exists: true, value: "NS" });
      expect(a.fence.committedRaw).toEqual(a.schoolV2Raw);
    }
  });

  it("legacy-known violation ≠ generic VIOLATED allow when namespaced evidence exists", () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
    // Legacy marker + namespaced fence → blocked, not recoverable.
    storage.setItem(keys.legacy, "A");
    storage.setItem(keys.v2, "A");
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
          authority: "namespaced",
          schoolId: SCHOOL_A,
          committedRaw: rawPresent("A"),
        }),
      ),
    );
    const a = assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(a.kind).toBe("AUTHORITY_BLOCKED");
  });
});

describe("N3-AWARE-CORE logical read (R1–R12)", () => {
  it("R1 legacy ready → legacy raw", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "L");
    const r = readScenarioLabelAwareLogical({ storage, schoolId: SCHOOL_A });
    expect(r).toEqual({ status: "ok", authority: "legacy", raw: { exists: true, value: "L" } });
  });

  it("R2 legacy unprepared → legacy + compat signal", () => {
    const storage = new MemoryStorage();
    seedLegacyUnprepared(storage, "L");
    const r = readScenarioLabelAwareLogical({ storage, schoolId: SCHOOL_A });
    expect(r.status).toBe("ok");
    if (r.status === "ok" && r.authority === "legacy") {
      expect(r.signal).toBe("compat_unprepared");
      expect(r.raw).toEqual({ exists: true, value: "L" });
    }
  });

  it("R3 recoverable legacy violation → legacy + warning", () => {
    const storage = new MemoryStorage();
    seedLegacyViolatedRecoverable(storage);
    const r = readScenarioLabelAwareLogical({ storage, schoolId: SCHOOL_A });
    expect(r.status).toBe("ok");
    if (r.status === "ok" && r.authority === "legacy") {
      expect(r.signal).toBe("legacy_violation_warning");
      expect(r.raw).toEqual({ exists: true, value: "B" });
    }
  });

  it("R4 namespaced ready → school-v2", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "V2");
    const r = readScenarioLabelAwareLogical({ storage, schoolId: SCHOOL_A });
    expect(r).toMatchObject({
      status: "ok",
      authority: "namespaced",
      raw: { exists: true, value: "V2" },
      source: "school_v2",
    });
  });

  it("R5 namespaced degraded → v2 + degraded (no legacy fallback)", () => {
    const storage = new MemoryStorage();
    seedNamespacedDegraded(storage);
    const r = readScenarioLabelAwareLogical({ storage, schoolId: SCHOOL_A });
    expect(r.status).toBe("ok");
    if (r.status === "ok" && r.authority === "namespaced") {
      expect(r.raw).toEqual({ exists: true, value: "A" });
      expect(r.signal).toBe("degraded");
      expect(r.source).toBe("school_v2");
    }
  });

  it("R6 namespaced marker + missing fence → blocked", () => {
    const storage = new MemoryStorage();
    seedNamespacedMissingFence(storage, "NS");
    const r = readScenarioLabelAwareLogical({ storage, schoolId: SCHOOL_A });
    expect(r.status).toBe("blocked");
  });

  it("R7 invalid → blocked", () => {
    const storage = new MemoryStorage();
    seedConflictingAuthority(storage);
    const r = readScenarioLabelAwareLogical({ storage, schoolId: SCHOOL_A });
    expect(r.status).toBe("blocked");
  });

  it("R8 unavailable", () => {
    const storage = new MemoryStorage();
    storage.failGetKeys.add(schoolKeys().legacy);
    const r = readScenarioLabelAwareLogical({ storage, schoolId: SCHOOL_A });
    expect(r.status).toBe("unavailable");
  });

  it("R9 unbound", () => {
    const storage = new MemoryStorage();
    const r = readScenarioLabelAwareLogical({ storage, schoolId: null });
    expect(r.status).toBe("unbound");
    if (r.status === "unbound") {
      expect(r.raw).toEqual({ exists: false });
    }
  });

  it("R10 missing", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "X");
    storage.removeItem(schoolKeys().legacy);
    storage.removeItem(schoolKeys().v2);
    // After removing both, fence/marker still claim present → violated recoverable or unprepared
    const r = readScenarioLabelAwareLogical({ storage, schoolId: SCHOOL_A });
    // Must not invent a value; if blocked that's fine; if ok then raw must be missing.
    if (r.status === "ok") {
      expect(r.raw).toEqual({ exists: false });
    } else {
      expect(["blocked", "unavailable"]).toContain(r.status);
    }
  });

  it('R11 present ""', () => {
    const storage = new MemoryStorage();
    const keys = schoolKeys();
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
          schoolId: SCHOOL_A,
          committedRaw: rawPresent(""),
        }),
      ),
    );
    const r = readScenarioLabelAwareLogical({ storage, schoolId: SCHOOL_A });
    expect(r.status).toBe("ok");
    if (r.status === "ok") {
      expect(r.raw).toEqual({ exists: true, value: "" });
    }
  });

  it("R12 zero writes on read", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "NS");
    const before = storage.writeCount;
    readScenarioLabelAwareLogical({ storage, schoolId: SCHOOL_A });
    assessScenarioLabelRuntimeAuthority({ storage, schoolId: SCHOOL_A });
    expect(storage.writeCount).toBe(before);
    expect(storage.writeCount).toBe(0);
  });

  it("no fence.committedRaw routing — degraded still returns school-v2", () => {
    const storage = new MemoryStorage();
    seedNamespacedDegraded(storage);
    const r = readScenarioLabelAwareLogical({ storage, schoolId: SCHOOL_A });
    expect(r.status).toBe("ok");
    if (r.status === "ok" && r.authority === "namespaced") {
      expect(r.raw).toEqual({ exists: true, value: "A" });
      expect(r.source).toBe("school_v2");
      // Fence certified A; legacy is B — must not return fence field as value source.
      expect(JSON.stringify(r)).not.toContain("committedRaw");
    }
  });
});
