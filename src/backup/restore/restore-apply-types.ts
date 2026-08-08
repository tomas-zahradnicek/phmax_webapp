import type { RestorePlan } from "./restore-types";

/** Raw localStorage snapshot entry — never parsed JSON. */
export type RestoreRollbackSnapshotEntry =
  | { existed: false }
  | { existed: true; value: string };

export type RestoreRollbackSnapshot = Record<string, RestoreRollbackSnapshotEntry>;

/**
 * Transaction context preserved for Restore-2B reconcile + verification.
 * In-memory only — not crash-atomic (known v1 limitation).
 */
export type RestoreTransactionContext = {
  plan: RestorePlan;
  snapshot: RestoreRollbackSnapshot;
};

export type RestoreStorageFailurePhase = "set" | "remove" | "app_context_reset";

export type RestorePlanRejectReason =
  | "can_apply_false"
  | "conflict_present"
  | "invalid_operation_shape"
  | "unknown_storage_action"
  | "invalid_serialized_value"
  | "duplicate_operation_key"
  | "unowned_operation_key"
  | "touched_keys_incomplete"
  | "platform_side_effect_key_missing"
  | "unsupported_storage_target"
  | "fresh_plan_blocked"
  | "storage_unavailable";

export type RestoreStoragePhaseResult =
  | { status: "storage_applied"; transaction: RestoreTransactionContext }
  | { status: "no_storage_changes"; transaction: RestoreTransactionContext }
  | { status: "rejected_plan"; reason: RestorePlanRejectReason; detail?: string }
  | { status: "snapshot_failed"; detail?: string }
  | {
      status: "rolled_back";
      failurePhase: RestoreStorageFailurePhase;
      cause?: string;
      transaction: RestoreTransactionContext;
    }
  | {
      status: "fatal_partial";
      failurePhase: RestoreStorageFailurePhase;
      failedRollbackKeys: string[];
      cause?: string;
      transaction: RestoreTransactionContext;
    };

/** Restricted storage surface for restore transaction (no clear()). */
export type RestoreTransactionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
