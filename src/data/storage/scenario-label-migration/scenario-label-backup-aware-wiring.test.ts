/**
 * Backup adapter — authority-aware logical read, zero writes.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { getBackupModuleAdapter } from "../../../backup/backup-registry";
import {
  MemoryStorage,
  SCHOOL_A,
  seedConflictingAuthority,
  seedLegacyReady,
  seedNamespacedDegraded,
  seedNamespacedReady,
} from "./scenario-label-n3-aware-test-helpers";
import { IDENTITY_REGISTRY_LS_KEY } from "../../identity/identity-registry-types";

function installStorage(storage: MemoryStorage) {
  const identity = {
    schemaVersion: 1,
    schoolId: SCHOOL_A,
    schoolYears: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  storage.setItem(IDENTITY_REGISTRY_LS_KEY, JSON.stringify(identity));
  vi.stubGlobal("localStorage", storage);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Backup scenario adapter AWARE wiring", () => {
  it("legacy ready exports legacy logical value + 0 writes", () => {
    const storage = new MemoryStorage();
    seedLegacyReady(storage, "LEGACY-L");
    installStorage(storage);
    const before = storage.writeCount;
    const adapter = getBackupModuleAdapter("phmax-scenario-label");
    expect(adapter).toBeTruthy();
    const result = adapter!.read();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toBe("LEGACY-L");
    expect(storage.writeCount).toBe(before);
  });

  it("namespaced ready exports v2 value, no metadata", () => {
    const storage = new MemoryStorage();
    seedNamespacedReady(storage, "V2-VALUE");
    installStorage(storage);
    const before = storage.writeCount;
    const result = getBackupModuleAdapter("phmax-scenario-label")!.read();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toBe("V2-VALUE");
    expect(JSON.stringify(result.data)).not.toContain("protocolGeneration");
    expect(JSON.stringify(result.data)).not.toContain("authority");
    expect(storage.writeCount).toBe(before);
  });

  it("namespaced degraded exports v2 authoritative value", () => {
    const storage = new MemoryStorage();
    seedNamespacedDegraded(storage);
    installStorage(storage);
    const result = getBackupModuleAdapter("phmax-scenario-label")!.read();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toBe("A");
  });

  it("blocked → module error / omit, 0 writes", () => {
    const storage = new MemoryStorage();
    seedConflictingAuthority(storage);
    installStorage(storage);
    const before = storage.writeCount;
    const result = getBackupModuleAdapter("phmax-scenario-label")!.read();
    expect(result.ok).toBe(false);
    expect(storage.writeCount).toBe(before);
  });
});
