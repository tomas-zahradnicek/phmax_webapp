import type {
  RestoreRollbackSnapshot,
  RestoreTransactionStorage,
} from "./restore-apply-types";

export type RollbackRestoreTouchedKeysResult =
  | { ok: true }
  | { ok: false; failedKeys: string[] };

/**
 * Restore all touched keys from raw snapshot (not operation inversion).
 * Continue-on-error; reports all failed keys.
 */
export function rollbackRestoreTouchedKeys(
  snapshot: RestoreRollbackSnapshot,
  storage: RestoreTransactionStorage,
): RollbackRestoreTouchedKeysResult {
  const keys = Object.keys(snapshot).sort();
  const failedKeys: string[] = [];

  for (const key of keys) {
    const entry = snapshot[key];
    if (!entry) continue;

    try {
      if (entry.existed) {
        storage.setItem(key, entry.value);
      } else {
        storage.removeItem(key);
      }
    } catch {
      failedKeys.push(key);
    }
  }

  if (failedKeys.length > 0) {
    return { ok: false, failedKeys };
  }

  return { ok: true };
}
