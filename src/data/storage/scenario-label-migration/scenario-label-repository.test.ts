import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDENTITY_REGISTRY_LS_KEY } from "../../identity/identity-registry-types";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { parseScenarioLabelMigrationMarkerPayloadJson } from "./scenario-label-migration-marker-payload";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import { serializeScenarioLabelN3FenceKey } from "./scenario-label-n3-fence-key";
import { parseScenarioLabelN3FenceRecordJson } from "./scenario-label-n3-fence-record";
import {
  clearScenarioLabelLifecycle,
  readScenarioLabelRaw,
  readScenarioLabelUi,
  writeScenarioLabelFromUiInput,
  writeScenarioLabelRaw,
  type ScenarioLabelStorage,
} from "./scenario-label-repository";

const SCHOOL_A = "11111111-1111-4111-8111-111111111111";
const SCHOOL_B = "22222222-2222-4222-8222-222222222222";

class MemoryStorage implements ScenarioLabelStorage {
  store = new Map<string, string>();
  failSetKeys = new Set<string>();
  failRemoveKeys = new Set<string>();
  setCalls: string[] = [];
  removeCalls: string[] = [];

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.setCalls.push(key);
    if (this.failSetKeys.has(key)) throw new Error(`fail set ${key}`);
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.removeCalls.push(key);
    if (this.failRemoveKeys.has(key)) throw new Error(`fail remove ${key}`);
    this.store.delete(key);
  }
}

function identityJson(schoolId: string): string {
  return JSON.stringify({
    schemaVersion: 1,
    schoolId,
    schoolYears: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
}

describe("scenario-label repository (N2-WRITE)", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("A: legacy set fail → shadow not attempted", () => {
    storage.failSetKeys.add(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
    const result = writeScenarioLabelFromUiInput("NEW", { storage });
    expect(result).toEqual({ status: "authoritative_failed", code: "legacy_write_failed" });
    expect(storage.store.has(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBe(false);
  });

  it("B: legacy OK / v2 set fail → success dirty", () => {
    const v2 = buildScenarioLabelNamespacedKey({ kind: "unbound" });
    storage.failSetKeys.add(v2);
    const result = writeScenarioLabelFromUiInput("NEW", {
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "dirty" });
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("NEW");
  });

  it("C: legacy OK / shadow verify mismatch → success dirty", () => {
    const v2 = buildScenarioLabelNamespacedKey({ kind: "unbound" });
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key === v2) {
        originalSet(key, "OTHER");
        return;
      }
      originalSet(key, value);
    };
    const result = writeScenarioLabelFromUiInput("NEW", {
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "dirty" });
  });

  it("D: legacy+v2+verify+marker OK → success synced", () => {
    const result = writeScenarioLabelFromUiInput("NEW", {
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "synced" });
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("NEW");
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBe("NEW");
    const marker = storage.getItem(
      serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" }),
    );
    expect(parseScenarioLabelMigrationMarkerPayloadJson(marker)).toEqual({
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "present",
    });
  });

  it("E: marker fail after verified shadow → success synced", () => {
    const markerKey = serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" });
    storage.failSetKeys.add(markerKey);
    const result = writeScenarioLabelFromUiInput("NEW", {
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "synced" });
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBe("NEW");
    expect(storage.getItem(markerKey)).toBeNull();
  });

  it("F: target skipped → legacy success, no v2/marker", () => {
    const result = writeScenarioLabelFromUiInput("NEW", {
      storage,
      readIdentity: () => ({ ok: false, code: "corrupted", detail: "invalid_json" }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "skipped" });
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("NEW");
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBeNull();
  });

  it("G: clear legacy fail → shadow untouched", () => {
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "OLD");
    const v2 = buildScenarioLabelNamespacedKey({ kind: "unbound" });
    storage.setItem(v2, "OLD");
    storage.failRemoveKeys.add(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
    const result = clearScenarioLabelLifecycle({
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(result.status).toBe("authoritative_failed");
    expect(storage.getItem(v2)).toBe("OLD");
  });

  it("H: clear shadow fail → success dirty + no healthy synced marker", () => {
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "OLD");
    const v2 = buildScenarioLabelNamespacedKey({ kind: "unbound" });
    const markerKey = serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" });
    storage.setItem(v2, "OLD");
    storage.setItem(
      markerKey,
      JSON.stringify({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    );
    storage.failRemoveKeys.add(v2);
    const result = clearScenarioLabelLifecycle({
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "dirty" });
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBeNull();
    const marker = parseScenarioLabelMigrationMarkerPayloadJson(storage.getItem(markerKey));
    // Fail-closed: either absent or PROTO dirty — never leftover healthy synced.
    expect(marker == null || marker.mirrorHealth === "dirty").toBe(true);
  });

  it("I: clear all OK → synced absent marker", () => {
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "OLD");
    storage.setItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }), "OLD");
    const result = clearScenarioLabelLifecycle({
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "synced" });
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBeNull();
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBeNull();
    const marker = parseScenarioLabelMigrationMarkerPayloadJson(
      storage.getItem(serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" })),
    );
    expect(marker).toEqual({
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "absent",
    });
  });

  it("J: existing healthy marker + new shadow failure → old synced invalidated / dirty", () => {
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "A");
    const v2 = buildScenarioLabelNamespacedKey({ kind: "unbound" });
    const markerKey = serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" });
    storage.setItem(v2, "A");
    storage.setItem(
      markerKey,
      JSON.stringify({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    );
    storage.failSetKeys.add(v2);
    const result = writeScenarioLabelFromUiInput("B", {
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "dirty" });
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("B");
    const marker = parseScenarioLabelMigrationMarkerPayloadJson(storage.getItem(markerKey));
    expect(marker?.mirrorHealth).toBe("dirty");
    expect(marker?.authoritativePresence).toBe("present");
  });

  it("I-harden: marker invalidation fail + shadow fail → dirty, not synced", () => {
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "A");
    const v2 = buildScenarioLabelNamespacedKey({ kind: "unbound" });
    const markerKey = serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" });
    storage.setItem(v2, "A");
    storage.setItem(
      markerKey,
      JSON.stringify({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    );
    storage.failRemoveKeys.add(markerKey);
    storage.failSetKeys.add(v2);
    // Dirty overwrite may still succeed via setItem on marker key.
    const result = writeScenarioLabelFromUiInput("B", {
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "dirty" });
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("B");
    const marker = parseScenarioLabelMigrationMarkerPayloadJson(storage.getItem(markerKey));
    expect(marker?.mirrorHealth).not.toBe("synced");
  });

  it("J2: invalidation fail + verified shadow + new synced marker → synced allowed", () => {
    const markerKey = serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" });
    storage.setItem(
      markerKey,
      JSON.stringify({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    );
    storage.failRemoveKeys.add(markerKey);
    const result = writeScenarioLabelFromUiInput("B", {
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "synced" });
    expect(parseScenarioLabelMigrationMarkerPayloadJson(storage.getItem(markerKey))).toEqual({
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "present",
    });
  });

  it("M: concurrent legacy overwrite after successful set is NOT authoritative_failed", () => {
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      originalSet(key, value);
      if (key === PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY && value === "A") {
        // Concurrent tab overwrites after our write succeeded.
        originalSet(key, "B");
      }
    };
    const result = writeScenarioLabelFromUiInput("A", {
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    // Legacy API write did not throw — business success (last-writer-wins on storage).
    expect(result.status).toBe("success");
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("B");
  });

  it("N: shadow read mismatch → dirty", () => {
    const v2 = buildScenarioLabelNamespacedKey({ kind: "unbound" });
    const originalSet = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      if (key === v2) {
        originalSet(key, "OTHER");
        return;
      }
      originalSet(key, value);
    };
    const result = writeScenarioLabelFromUiInput("A", {
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "dirty" });
  });

  it("O: corrupted Identity clear — school residue untouched; unbound synced+absent", () => {
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "L");
    storage.setItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }), "U");
    storage.setItem(
      serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" }),
      JSON.stringify({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    );
    storage.setItem(
      buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A }),
      "SCHOOL-OLD",
    );
    storage.setItem(
      serializeScenarioLabelMigrationMarkerKey({ kind: "school", schoolId: SCHOOL_A }),
      "SCHOOL-M-raw",
    );

    const result = clearScenarioLabelLifecycle({
      storage,
      readIdentity: () => ({ ok: false, code: "corrupted", detail: "invalid_json" }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "skipped" });
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBeNull();
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBeNull();
    expect(
      parseScenarioLabelMigrationMarkerPayloadJson(
        storage.getItem(serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" })),
      ),
    ).toEqual({
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "absent",
    });
    expect(
      storage.getItem(buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A })),
    ).toBe("SCHOOL-OLD");
    expect(
      storage.getItem(serializeScenarioLabelMigrationMarkerKey({ kind: "school", schoolId: SCHOOL_A })),
    ).toBe("SCHOOL-M-raw");
  });

  it("P: valid Identity clear — RAW final state both markers synced+absent", () => {
    storage.setItem(IDENTITY_REGISTRY_LS_KEY, identityJson(SCHOOL_A));
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "L");
    storage.setItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }), "U");
    storage.setItem(
      buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A }),
      "S",
    );
    storage.setItem(
      buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_B }),
      "OTHER",
    );

    const result = clearScenarioLabelLifecycle({ storage });
    expect(result).toMatchObject({ status: "success", shadow: "synced" });
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBeNull();
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBeNull();
    expect(
      storage.getItem(buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A })),
    ).toBeNull();
    expect(
      parseScenarioLabelMigrationMarkerPayloadJson(
        storage.getItem(serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" })),
      ),
    ).toEqual({
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "absent",
    });
    expect(
      parseScenarioLabelMigrationMarkerPayloadJson(
        storage.getItem(
          serializeScenarioLabelMigrationMarkerKey({ kind: "school", schoolId: SCHOOL_A }),
        ),
      ),
    ).toEqual({
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "absent",
    });
    expect(
      storage.getItem(buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_B })),
    ).toBe("OTHER");
  });

  it("R: synced absence even if no prior v2 value", () => {
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBeNull();
    const result = clearScenarioLabelLifecycle({
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "synced" });
    expect(
      parseScenarioLabelMigrationMarkerPayloadJson(
        storage.getItem(serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" })),
      ),
    ).toEqual({
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "absent",
    });
  });

  it("DI: Identity is read from injected storage (not global)", () => {
    storage.setItem(IDENTITY_REGISTRY_LS_KEY, identityJson(SCHOOL_A));
    writeScenarioLabelFromUiInput("X", { storage });
    expect(
      storage.getItem(buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A })),
    ).toBe("X");
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBeNull();
  });

  it("K: Identity missing → unbound", () => {
    writeScenarioLabelFromUiInput("X", {
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBe("X");
    expect(
      storage.getItem(buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A })),
    ).toBeNull();
  });

  it("L: Identity A → school:A", () => {
    storage.setItem(IDENTITY_REGISTRY_LS_KEY, identityJson(SCHOOL_A));
    writeScenarioLabelFromUiInput("X", { storage });
    expect(
      storage.getItem(buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A })),
    ).toBe("X");
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBeNull();
  });

  it("M: Identity corrupted → skipped", () => {
    const result = writeScenarioLabelFromUiInput("X", {
      storage,
      readIdentity: () => ({ ok: false, code: "corrupted", detail: "x" }),
    });
    expect(result).toMatchObject({ status: "success", shadow: "skipped" });
  });

  it("N: Profile-only runtime → unbound (no Profile fallback)", () => {
    writeScenarioLabelFromUiInput("X", {
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBe("X");
  });

  it("UI empty → clear (remove), never present-empty", () => {
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "OLD");
    writeScenarioLabelFromUiInput("   ", {
      storage,
      readIdentity: () => ({ ok: true, registry: null }),
    });
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(Object.fromEntries(storage.store), PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe(
      false,
    );
  });

  it("read remains legacy-only", () => {
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, " LEG ");
    storage.setItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }), "SHADOW");
    expect(readScenarioLabelRaw({ storage })).toEqual({ exists: true, value: " LEG " });
    expect(readScenarioLabelUi({ storage })).toBe("LEG");
  });

  it("writeScenarioLabelRaw can represent present-empty distinct from missing", () => {
    writeScenarioLabelRaw(
      { exists: true, value: "" },
      { storage, readIdentity: () => ({ ok: true, registry: null }) },
    );
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("");
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBe("");
  });

  it("Level B school clear when Identity valid", () => {
    storage.setItem(IDENTITY_REGISTRY_LS_KEY, identityJson(SCHOOL_A));
    storage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "L");
    storage.setItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }), "U");
    storage.setItem(
      buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A }),
      "S",
    );
    // Residue other school must not be scanned/cleared.
    storage.setItem(
      buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_B }),
      "OTHER",
    );

    const result = clearScenarioLabelLifecycle({ storage });
    expect(result).toMatchObject({ status: "success", shadow: "synced" });
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBeNull();
    expect(storage.getItem(buildScenarioLabelNamespacedKey({ kind: "unbound" }))).toBeNull();
    expect(
      storage.getItem(buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A })),
    ).toBeNull();
    expect(
      storage.getItem(buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_B })),
    ).toBe("OTHER");
  });

  it("N3-FENCE-WRITE O1: school synced write finalizes fence LAST (one set)", () => {
    const storage = new MemoryStorage();
    storage.setItem(IDENTITY_REGISTRY_LS_KEY, identityJson(SCHOOL_A));
    const fenceKey = serializeScenarioLabelN3FenceKey({
      kind: "school",
      schoolId: SCHOOL_A,
    });
    const result = writeScenarioLabelFromUiInput("LABEL", { storage });
    expect(result).toMatchObject({ status: "success", shadow: "synced", fence: "committed" });
    expect(storage.setCalls.filter((k) => k === fenceKey)).toHaveLength(1);
    expect(storage.setCalls.at(-1)).toBe(fenceKey);
    const parsed = parseScenarioLabelN3FenceRecordJson(storage.getItem(fenceKey));
    expect(parsed).toEqual({
      status: "valid",
      record: expect.objectContaining({
        committedRaw: { exists: true, value: "LABEL" },
        authority: "legacy",
      }),
    });
  });

  it("N3-FENCE-WRITE: unbound write skips fence", () => {
    const storage = new MemoryStorage();
    const result = writeScenarioLabelFromUiInput("U", { storage });
    expect(result).toMatchObject({ status: "success", shadow: "synced", fence: "skipped" });
    expect(storage.setCalls.some((k) => k.includes("protocol-commit"))).toBe(false);
  });

  it("N3-FENCE-WRITE: school clear finalizes absent fence", () => {
    const storage = new MemoryStorage();
    storage.setItem(IDENTITY_REGISTRY_LS_KEY, identityJson(SCHOOL_A));
    writeScenarioLabelFromUiInput("X", { storage });
    storage.setCalls = [];
    const result = clearScenarioLabelLifecycle({ storage });
    expect(result).toMatchObject({ status: "success", shadow: "synced", fence: "committed" });
    const fenceKey = serializeScenarioLabelN3FenceKey({
      kind: "school",
      schoolId: SCHOOL_A,
    });
    expect(storage.setCalls.filter((k) => k === fenceKey)).toHaveLength(1);
    const parsed = parseScenarioLabelN3FenceRecordJson(storage.getItem(fenceKey));
    expect(parsed).toEqual({
      status: "valid",
      record: expect.objectContaining({
        committedRaw: { exists: false },
      }),
    });
  });

  it("N3-FENCE-WRITE S1: fence failure does not overturn business success", () => {
    const storage = new MemoryStorage();
    storage.setItem(IDENTITY_REGISTRY_LS_KEY, identityJson(SCHOOL_A));
    const fenceKey = serializeScenarioLabelN3FenceKey({
      kind: "school",
      schoolId: SCHOOL_A,
    });
    storage.failSetKeys.add(fenceKey);
    const result = writeScenarioLabelFromUiInput("OK", { storage });
    expect(result.status).toBe("success");
    expect(result).toMatchObject({ shadow: "synced", fence: "incomplete" });
    expect(storage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBe("OK");
  });

  it("N3-FENCE-WRITE: business read remains legacy-only", () => {
    const storage = new MemoryStorage();
    storage.setItem(IDENTITY_REGISTRY_LS_KEY, identityJson(SCHOOL_A));
    writeScenarioLabelFromUiInput("LEGACY-VALUE", { storage });
    storage.setItem(
      buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_A }),
      "SHADOW-ONLY",
    );
    expect(readScenarioLabelUi({ storage })).toBe("LEGACY-VALUE");
    expect(readScenarioLabelRaw({ storage })).toEqual({
      exists: true,
      value: "LEGACY-VALUE",
    });
  });
});
