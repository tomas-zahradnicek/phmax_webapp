import { buildAppBackupRestorePlan } from "./build-app-backup-restore-plan";
import { readCurrentRestoreEnvironment } from "./read-restore-environment";
import { applyRestoreStorageOperations } from "./apply-restore-storage-operations";
import { rollbackRestoreTouchedKeys } from "./rollback-restore-touched-keys";
import { snapshotRestoreTouchedKeys } from "./snapshot-restore-touched-keys";
import type {
  RestoreStoragePhaseResult,
  RestoreTransactionContext,
  RestoreTransactionStorage,
} from "./restore-apply-types";
import type { RestorePlan, ValidatedAppBackupEnvelope } from "./restore-types";
import { validateRestorePlanForApply } from "./validate-restore-plan-for-apply";

export type ApplyRestoreStorageTransactionDependencies = {
  storage?: RestoreTransactionStorage;
  readEnvironment?: typeof readCurrentRestoreEnvironment;
  buildPlan?: typeof buildAppBackupRestorePlan;
};

function resolveDefaultStorage(): RestoreTransactionStorage | null {
  try {
    const storage = globalThis.localStorage;
    if (storage == null) return null;
    return storage;
  } catch {
    return null;
  }
}

/**
 * Fresh plan at apply time — preview plan from T1 must not be applied blindly.
 * Passes storage so scenario authority is freshly assessed (T2 wins).
 */
export function prepareFreshRestorePlan(
  validated: ValidatedAppBackupEnvelope,
  readEnvironment: typeof readCurrentRestoreEnvironment = readCurrentRestoreEnvironment,
  buildPlan: typeof buildAppBackupRestorePlan = buildAppBackupRestorePlan,
  storage?: RestoreTransactionStorage | null,
): RestorePlan {
  const env = readEnvironment();
  return buildPlan(validated, env, { storage: storage ?? null });
}

function emptySnapshotTransaction(plan: RestorePlan): RestoreTransactionContext {
  return { plan, snapshot: {} };
}

function runRollbackAfterFailure(
  transaction: RestoreTransactionContext,
  storage: RestoreTransactionStorage,
  failurePhase: "set" | "remove" | "app_context_reset",
  cause?: string,
): RestoreStoragePhaseResult {
  const rollback = rollbackRestoreTouchedKeys(transaction.snapshot, storage);
  if (rollback.ok) {
    return {
      status: "rolled_back",
      failurePhase,
      ...(cause !== undefined ? { cause } : {}),
      transaction,
    };
  }
  return {
    status: "fatal_partial",
    failurePhase,
    failedRollbackKeys: rollback.failedKeys,
    ...(cause !== undefined ? { cause } : {}),
    transaction,
  };
}

/**
 * Restore-2A raw storage transaction kernel.
 *
 * Flow: fresh rebuild → validate → snapshot → SET/REMOVE (+ AppContext remove) → phase result.
 * Does NOT run platform reconcile (Restore-2B).
 *
 * Known v1 limitations:
 * - In-memory snapshot is not crash-atomic if tab closes mid-transaction.
 * - Residual multi-tab race during short sync writes (mitigated by fresh rebuild, not eliminated).
 */
export function applyRestoreStorageTransaction(
  validatedBackup: ValidatedAppBackupEnvelope,
  dependencies: ApplyRestoreStorageTransactionDependencies = {},
): RestoreStoragePhaseResult {
  const storage = dependencies.storage ?? resolveDefaultStorage();
  if (storage == null) {
    return { status: "snapshot_failed", detail: "storage_unavailable" };
  }

  const readEnvironment = dependencies.readEnvironment ?? readCurrentRestoreEnvironment;
  const buildPlan = dependencies.buildPlan ?? buildAppBackupRestorePlan;

  const plan = prepareFreshRestorePlan(validatedBackup, readEnvironment, buildPlan, storage);

  if (!plan.canApply) {
    return {
      status: "rejected_plan",
      reason: "fresh_plan_blocked",
      detail: plan.conflict?.kind ?? "can_apply_false",
    };
  }

  if (plan.conflict != null) {
    return {
      status: "rejected_plan",
      reason: "conflict_present",
      detail: plan.conflict.kind,
    };
  }

  const validation = validateRestorePlanForApply(plan);
  if (!validation.ok) {
    return {
      status: "rejected_plan",
      reason: validation.reason,
      ...(validation.detail !== undefined ? { detail: validation.detail } : {}),
    };
  }

  const needsStorageWrites =
    plan.operations.length > 0 || plan.platform.requiresAppContextReset;

  if (!needsStorageWrites) {
    return {
      status: "no_storage_changes",
      transaction: emptySnapshotTransaction(plan),
    };
  }

  const snap = snapshotRestoreTouchedKeys(plan.touchedKeys, storage);
  if (!snap.ok) {
    return {
      status: "snapshot_failed",
      detail: snap.failedKey ?? snap.detail,
    };
  }

  const transaction: RestoreTransactionContext = {
    plan,
    snapshot: snap.snapshot,
  };

  const applyResult = applyRestoreStorageOperations(plan, storage);
  if (!applyResult.ok) {
    return runRollbackAfterFailure(
      transaction,
      storage,
      applyResult.phase,
      applyResult.cause ?? applyResult.key,
    );
  }

  return {
    status: "storage_applied",
    transaction,
  };
}
