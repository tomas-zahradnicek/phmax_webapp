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

/** Includes Restore-2A storage phases + Restore-2B platform phases. */
export type RestoreFailurePhase =
  | RestoreStorageFailurePhase
  | "school_reconcile"
  | "vz_reconcile"
  | "verification";

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
  | "storage_unavailable"
  | "inconsistent_no_storage_changes";

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

/**
 * Final Restore-2B result.
 * `storage_applied` alone is never success — platform phase must complete.
 *
 * Known v1 limitations (documented, not mitigated here):
 * - Dashboard-only apply invariant enforced by Restore-3 UI, not this engine.
 * - Residual multi-tab race during async reconcile; rollback may overwrite other-tab writes.
 * - In-memory snapshot is not crash-atomic between storage_applied and final success.
 */
export type RestoreResult =
  | { status: "success" }
  | { status: "no_changes" }
  | { status: "rejected_plan"; reason: RestorePlanRejectReason; detail?: string }
  | { status: "snapshot_failed"; detail?: string }
  | {
      status: "rolled_back";
      failurePhase: RestoreFailurePhase;
      cause?: string;
    }
  | {
      status: "fatal_partial";
      failurePhase: RestoreFailurePhase;
      failedRollbackKeys: string[];
      cause?: string;
    };

/** Restricted storage surface for restore transaction (no clear()). */
export type RestoreTransactionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
