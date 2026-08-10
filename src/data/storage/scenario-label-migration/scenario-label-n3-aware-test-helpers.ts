/**
 * Shared MemoryStorage + seed helpers for N3-AWARE-CORE unit tests.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import type { RawStoredText } from "./scenario-label-migration-types";
import {
  buildScenarioLabelN3LegacyMarker,
  buildScenarioLabelN3NamespacedMarker,
  serializeScenarioLabelN3AuthorityMarker,
} from "./scenario-label-n3-authority-marker";
import type { ScenarioLabelAwareStorage } from "./scenario-label-n3-aware-types";
import { serializeScenarioLabelN3FenceKey } from "./scenario-label-n3-fence-key";
import {
  buildScenarioLabelN3FenceRecord,
  serializeScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-record";

export const SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" as EntityId;

export class MemoryStorage implements ScenarioLabelAwareStorage {
  store = new Map<string, string>();
  writeCount = 0;
  failSetKeys = new Set<string>();
  failRemoveKeys = new Set<string>();
  failGetKeys = new Set<string>();

  getItem(key: string): string | null {
    if (this.failGetKeys.has(key)) throw new Error("get_failed");
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    if (this.failSetKeys.has(key)) throw new Error("set_failed");
    this.writeCount += 1;
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    if (this.failRemoveKeys.has(key)) throw new Error("remove_failed");
    this.writeCount += 1;
    this.store.delete(key);
  }
}

export function schoolKeys(schoolId: EntityId = SCHOOL_A) {
  const target = { kind: "school" as const, schoolId };
  return {
    target,
    v2: buildScenarioLabelNamespacedKey(target),
    marker: serializeScenarioLabelMigrationMarkerKey(target),
    fence: serializeScenarioLabelN3FenceKey(target),
    legacy: PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
  };
}

export function rawPresent(value: string): RawStoredText {
  return { exists: true, value };
}

export function rawAbsent(): RawStoredText {
  return { exists: false };
}

export function seedLegacyReady(
  storage: MemoryStorage,
  label: string,
  schoolId: EntityId = SCHOOL_A,
) {
  const keys = schoolKeys(schoolId);
  const raw = rawPresent(label);
  storage.setItem(keys.legacy, label);
  storage.setItem(keys.v2, label);
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
        committedRaw: raw,
      }),
    ),
  );
  storage.writeCount = 0;
  return keys;
}

export function seedLegacyUnprepared(
  storage: MemoryStorage,
  label: string,
  schoolId: EntityId = SCHOOL_A,
) {
  const keys = schoolKeys(schoolId);
  storage.setItem(keys.legacy, label);
  storage.setItem(keys.v2, label);
  storage.setItem(
    keys.marker,
    serializeScenarioLabelN3AuthorityMarker(
      buildScenarioLabelN3LegacyMarker({
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    ),
  );
  // fence missing → LEGACY_COMPAT_UNPREPARED
  storage.writeCount = 0;
  return keys;
}

export function seedLegacyViolatedRecoverable(
  storage: MemoryStorage,
  schoolId: EntityId = SCHOOL_A,
) {
  const keys = schoolKeys(schoolId);
  // Current tuple B/B with legacy marker; fence still certifies A.
  storage.setItem(keys.legacy, "B");
  storage.setItem(keys.v2, "B");
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
        committedRaw: rawPresent("A"),
      }),
    ),
  );
  storage.writeCount = 0;
  return keys;
}

export function seedNamespacedReady(
  storage: MemoryStorage,
  label: string,
  schoolId: EntityId = SCHOOL_A,
) {
  const keys = schoolKeys(schoolId);
  const raw = rawPresent(label);
  storage.setItem(keys.legacy, label);
  storage.setItem(keys.v2, label);
  storage.setItem(
    keys.marker,
    serializeScenarioLabelN3AuthorityMarker(
      buildScenarioLabelN3NamespacedMarker({
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
        schoolId,
        committedRaw: raw,
      }),
    ),
  );
  storage.writeCount = 0;
  return keys;
}

export function seedNamespacedDegraded(
  storage: MemoryStorage,
  schoolId: EntityId = SCHOOL_A,
) {
  const keys = schoolKeys(schoolId);
  // Namespaced marker + namespaced fence for A, but legacy diverged to B.
  storage.setItem(keys.legacy, "B");
  storage.setItem(keys.v2, "A");
  storage.setItem(
    keys.marker,
    serializeScenarioLabelN3AuthorityMarker(
      buildScenarioLabelN3NamespacedMarker({
        mirrorHealth: "dirty",
        authoritativePresence: "present",
      }),
    ),
  );
  storage.setItem(
    keys.fence,
    serializeScenarioLabelN3FenceRecord(
      buildScenarioLabelN3FenceRecord({
        authority: "namespaced",
        schoolId,
        committedRaw: rawPresent("A"),
      }),
    ),
  );
  storage.writeCount = 0;
  return keys;
}

export function seedNamespacedMissingFence(
  storage: MemoryStorage,
  label: string,
  schoolId: EntityId = SCHOOL_A,
) {
  const keys = schoolKeys(schoolId);
  storage.setItem(keys.legacy, label);
  storage.setItem(keys.v2, label);
  storage.setItem(
    keys.marker,
    serializeScenarioLabelN3AuthorityMarker(
      buildScenarioLabelN3NamespacedMarker({
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    ),
  );
  storage.writeCount = 0;
  return keys;
}

export function seedConflictingAuthority(
  storage: MemoryStorage,
  schoolId: EntityId = SCHOOL_A,
) {
  const keys = schoolKeys(schoolId);
  storage.setItem(keys.legacy, "A");
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
  storage.setItem(
    keys.fence,
    serializeScenarioLabelN3FenceRecord(
      buildScenarioLabelN3FenceRecord({
        authority: "legacy",
        schoolId,
        committedRaw: rawPresent("A"),
      }),
    ),
  );
  storage.writeCount = 0;
  return keys;
}
