import type {
  RestoreRollbackSnapshot,
  RestoreRollbackSnapshotEntry,
  RestoreTransactionStorage,
} from "./restore-apply-types";

export type SnapshotRestoreTouchedKeysResult =
  | { ok: true; snapshot: RestoreRollbackSnapshot; keys: string[] }
  | { ok: false; detail: string; failedKey?: string };

/**
 * Snapshot all touched keys as raw localStorage strings.
 * Defensive dedupe + lexicographic sort for deterministic order.
 */
export function snapshotRestoreTouchedKeys(
  touchedKeys: readonly string[],
  storage: RestoreTransactionStorage,
): SnapshotRestoreTouchedKeysResult {
  const keys = [...new Set(touchedKeys)].sort();

  const snapshot: RestoreRollbackSnapshot = {};

  for (const key of keys) {
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      return { ok: false, detail: "storage_read_failed", failedKey: key };
    }

    const entry: RestoreRollbackSnapshotEntry =
      raw == null ? { existed: false } : { existed: true, value: raw };
    snapshot[key] = entry;
  }

  return { ok: true, snapshot, keys };
}
