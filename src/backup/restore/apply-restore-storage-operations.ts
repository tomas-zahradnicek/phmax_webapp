import { RESTORE_APP_CONTEXT_KEY } from "./restore-owned-keys";
import type { RestorePlan, RestoreStorageOperation } from "./restore-types";
import type { RestoreStorageFailurePhase, RestoreTransactionStorage } from "./restore-apply-types";

export type ApplyRestoreStorageOperationsResult =
  | { ok: true }
  | { ok: false; phase: RestoreStorageFailurePhase; key: string; cause?: string };

function applyOneOperation(
  op: RestoreStorageOperation,
  storage: RestoreTransactionStorage,
): ApplyRestoreStorageOperationsResult {
  try {
    if (op.action === "set") {
      storage.setItem(op.key, op.serializedValue);
      return { ok: true };
    }
    storage.removeItem(op.key);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      phase: op.action === "set" ? "set" : "remove",
      key: op.key,
      cause: error instanceof Error ? error.message : "storage_write_failed",
    };
  }
}

/**
 * Apply plan.operations in order, then optional AppContext raw remove.
 * No business parsers — trusted validated raw writes only.
 */
export function applyRestoreStorageOperations(
  plan: RestorePlan,
  storage: RestoreTransactionStorage,
): ApplyRestoreStorageOperationsResult {
  for (const op of plan.operations) {
    const result = applyOneOperation(op, storage);
    if (!result.ok) return result;
  }

  if (plan.platform.requiresAppContextReset) {
    try {
      storage.removeItem(RESTORE_APP_CONTEXT_KEY);
    } catch (error) {
      return {
        ok: false,
        phase: "app_context_reset",
        key: RESTORE_APP_CONTEXT_KEY,
        cause: error instanceof Error ? error.message : "storage_write_failed",
      };
    }
  }

  return { ok: true };
}
