import { describe, expect, it, vi } from "vitest";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { parseScenarioLabelMigrationMarkerPayloadJson } from "./scenario-label-migration-marker-payload";
import {
  establishScenarioLabelSchoolShadowFromLegacy,
  runScenarioLabelEstablishmentAfterSchoolReady,
} from "./scenario-label-school-shadow-establishment-runtime";

const SCHOOL_A = "11111111-1111-4111-8111-111111111111";
const SCHOOL_UPPER = "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE";

const schoolTarget = { kind: "school" as const, schoolId: SCHOOL_A };
const schoolKey = buildScenarioLabelNamespacedKey(schoolTarget);
const schoolMarkerKey = serializeScenarioLabelMigrationMarkerKey(schoolTarget);
const unboundKey = buildScenarioLabelNamespacedKey({ kind: "unbound" });
const unboundMarkerKey = serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" });

function createMemoryStorage(initial: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initial };
  let setCount = 0;
  let removeCount = 0;
  return {
    store,
    get setCount() {
      return setCount;
    },
    get removeCount() {
      return removeCount;
    },
    get writeCount() {
      return setCount + removeCount;
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key]! : null;
    },
    setItem(key: string, value: string) {
      setCount += 1;
      store[key] = String(value);
    },
    removeItem(key: string) {
      removeCount += 1;
      delete store[key];
    },
  };
}

function syncedPresent() {
  return JSON.stringify({
    schemaVersion: 1,
    authority: "legacy",
    mirrorHealth: "synced",
    authoritativePresence: "present",
  });
}

function syncedAbsent() {
  return JSON.stringify({
    schemaVersion: 1,
    authority: "legacy",
    mirrorHealth: "synced",
    authoritativePresence: "absent",
  });
}

function dirtyPresent() {
  return JSON.stringify({
    schemaVersion: 1,
    authority: "legacy",
    mirrorHealth: "dirty",
    authoritativePresence: "present",
  });
}

describe("N2-ADOPT-WRITE establishScenarioLabelSchoolShadowFromLegacy", () => {
  it("A: legacy L, school missing → established L", () => {
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "L",
    });
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result).toEqual({ status: "established" });
    expect(storage.getItem(schoolKey)).toBe("L");
    expect(parseScenarioLabelMigrationMarkerPayloadJson(storage.getItem(schoolMarkerKey))).toEqual({
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "present",
    });
  });

  it("B: unbound U, legacy L → school L; unbound unchanged", () => {
    const unboundMarker = syncedPresent();
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "L",
      [unboundKey]: "U",
      [unboundMarkerKey]: unboundMarker,
    });
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result.status).toBe("established");
    expect(storage.getItem(schoolKey)).toBe("L");
    expect(storage.getItem(unboundKey)).toBe("U");
    expect(storage.getItem(unboundMarkerKey)).toBe(unboundMarker);
  });

  it("C: legacy missing, stale unbound U → school absence; no resurrection", () => {
    const unboundMarker = syncedPresent();
    const storage = createMemoryStorage({
      [unboundKey]: "U",
      [unboundMarkerKey]: unboundMarker,
    });
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result.status).toBe("established");
    expect(storage.getItem(schoolKey)).toBeNull();
    expect(parseScenarioLabelMigrationMarkerPayloadJson(storage.getItem(schoolMarkerKey))).toEqual({
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "absent",
    });
    expect(storage.getItem(unboundKey)).toBe("U");
    expect(storage.getItem(unboundMarkerKey)).toBe(unboundMarker);
  });

  it('D: legacy present "" → school present ""', () => {
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "",
    });
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result.status).toBe("established");
    expect(Object.prototype.hasOwnProperty.call(storage.store, schoolKey)).toBe(true);
    expect(storage.getItem(schoolKey)).toBe("");
    expect(parseScenarioLabelMigrationMarkerPayloadJson(storage.getItem(schoolMarkerKey))).toMatchObject({
      mirrorHealth: "synced",
      authoritativePresence: "present",
    });
  });

  it("E: school stale S → repair L", () => {
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "L",
      [schoolKey]: "S",
      [schoolMarkerKey]: syncedPresent(),
    });
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result.status).toBe("established");
    expect(storage.getItem(schoolKey)).toBe("L");
  });

  it("F: healthy school → already_ready → 0 writes", () => {
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "L",
      [schoolKey]: "L",
      [schoolMarkerKey]: syncedPresent(),
    });
    const beforeSet = storage.setCount;
    const beforeRemove = storage.removeCount;
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result).toEqual({ status: "already_ready" });
    expect(storage.setCount).toBe(beforeSet);
    expect(storage.removeCount).toBe(beforeRemove);
    expect(storage.writeCount).toBe(0);
  });

  it("G: marker missing → establish marker", () => {
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "L",
      [schoolKey]: "L",
    });
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result.status).toBe("established");
    expect(storage.getItem(schoolMarkerKey)).toContain('"mirrorHealth":"synced"');
  });

  it("H: marker dirty → repair", () => {
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "L",
      [schoolKey]: "L",
      [schoolMarkerKey]: dirtyPresent(),
    });
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result.status).toBe("established");
    expect(parseScenarioLabelMigrationMarkerPayloadJson(storage.getItem(schoolMarkerKey))).toMatchObject({
      mirrorHealth: "synced",
    });
  });

  it("I: marker invalid → repair", () => {
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "L",
      [schoolKey]: "L",
      [schoolMarkerKey]: "{not-json",
    });
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result.status).toBe("established");
    expect(parseScenarioLabelMigrationMarkerPayloadJson(storage.getItem(schoolMarkerKey))).toMatchObject({
      mirrorHealth: "synced",
      authoritativePresence: "present",
    });
  });

  it("J: shadow write fail → shadow_dirty", () => {
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "L",
    });
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key === schoolKey) throw new Error("quota");
      return originalSet(key, value);
    };
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result.status).toBe("shadow_dirty");
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("L");
  });

  it("K: verify mismatch → shadow_dirty", () => {
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "L",
    });
    const originalGet = storage.getItem.bind(storage);
    let schoolReads = 0;
    storage.getItem = (key: string) => {
      if (key === schoolKey) {
        schoolReads += 1;
        // After write, lie on verify read-back.
        if (schoolReads >= 2) return "TAMPERED";
      }
      return originalGet(key);
    };
    // Also need setItem to succeed for school
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result.status).toBe("shadow_dirty");
  });

  it("L: final legacy drift → shadow_dirty; no healthy synced marker", () => {
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "A",
    });
    const originalGet = storage.getItem.bind(storage);
    let legacyReads = 0;
    storage.getItem = (key: string) => {
      if (key === PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY) {
        legacyReads += 1;
        if (legacyReads >= 2) return "B";
        return "A";
      }
      return originalGet(key);
    };
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result.status).toBe("shadow_dirty");
    const marker = parseScenarioLabelMigrationMarkerPayloadJson(storage.getItem(schoolMarkerKey));
    expect(marker?.mirrorHealth).not.toBe("synced");
  });

  it("M: marker persist fail → marker_incomplete", () => {
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "L",
    });
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key === schoolMarkerKey) throw new Error("marker_fail");
      return originalSet(key, value);
    };
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result.status).toBe("marker_incomplete");
    expect(storage.getItem(schoolKey)).toBe("L");
  });

  it("N: invalid/noncanonical schoolId → fail closed", () => {
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "L",
    });
    expect(establishScenarioLabelSchoolShadowFromLegacy("not-uuid", { storage }).status).toBe(
      "skipped_identity",
    );
    expect(establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_UPPER, { storage }).status).toBe(
      "skipped_identity",
    );
    expect(establishScenarioLabelSchoolShadowFromLegacy(` ${SCHOOL_A} `, { storage }).status).toBe(
      "skipped_identity",
    );
    expect(storage.getItem(schoolKey)).toBeNull();
  });

  it("O: unbound raw + marker exactly unchanged", () => {
    const unboundMarker = syncedPresent();
    const storage = createMemoryStorage({
      [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY]: "L",
      [unboundKey]: "KEEP-U",
      [unboundMarkerKey]: unboundMarker,
    });
    establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(storage.getItem(unboundKey)).toBe("KEEP-U");
    expect(storage.getItem(unboundMarkerKey)).toBe(unboundMarker);
  });

  it("healthy absence already_ready → 0 writes", () => {
    const storage = createMemoryStorage({
      [schoolMarkerKey]: syncedAbsent(),
    });
    const result = establishScenarioLabelSchoolShadowFromLegacy(SCHOOL_A, { storage });
    expect(result).toEqual({ status: "already_ready" });
    expect(storage.writeCount).toBe(0);
  });

  it("runScenarioLabelEstablishmentAfterSchoolReady maps throw to storage_unavailable", () => {
    const establish = vi.spyOn(
      { establishScenarioLabelSchoolShadowFromLegacy },
      "establishScenarioLabelSchoolShadowFromLegacy",
    );
    // Direct throw path via bad storage that throws on getItem
    const storage = {
      getItem(): string | null {
        throw new Error("boom");
      },
      setItem() {
        throw new Error("boom");
      },
      removeItem() {
        throw new Error("boom");
      },
    };
    // Executor catches read errors as storage_unavailable; helper catch wraps unexpected throws.
    const result = runScenarioLabelEstablishmentAfterSchoolReady(
      { status: "ready", schoolId: SCHOOL_A },
      { storage },
    );
    expect(result.status).toBe("storage_unavailable");
    void establish;
  });

  it("not-ready binding → skipped_not_ready", () => {
    expect(runScenarioLabelEstablishmentAfterSchoolReady({ status: "empty" })).toEqual({
      status: "skipped_not_ready",
    });
  });
});
