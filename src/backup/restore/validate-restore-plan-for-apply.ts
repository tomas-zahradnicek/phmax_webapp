import { RESTORE_APP_CONTEXT_KEY, RESTORE_IDENTITY_KEY } from "./restore-owned-keys";
import { allRestoreOperationKeys } from "./restore-owned-key-allowlist";
import type { RestorePlan, RestoreStorageOperation } from "./restore-types";
import type { RestorePlanRejectReason } from "./restore-apply-types";

export type ValidateRestorePlanForApplyResult =
  | { ok: true }
  | { ok: false; reason: RestorePlanRejectReason; detail?: string };

function isValidOperation(op: unknown): op is RestoreStorageOperation {
  if (typeof op !== "object" || op === null) return false;
  const record = op as Record<string, unknown>;
  if (record.storage !== "localStorage") return false;
  if (typeof record.key !== "string" || record.key.trim() === "") return false;
  if (record.action === "set") {
    return typeof record.serializedValue === "string";
  }
  if (record.action === "remove") {
    return true;
  }
  return false;
}

function requiredPlatformSideEffectKeys(plan: RestorePlan): string[] {
  const keys = new Set<string>();
  if (plan.platform.requiresAppContextReset) {
    keys.add(RESTORE_APP_CONTEXT_KEY);
  }
  if (
    plan.platform.requiresIdentityBootstrap ||
    plan.platform.requiresPlatformReconcile ||
    plan.platform.requiresVzSchoolYearReconcile
  ) {
    keys.add(RESTORE_IDENTITY_KEY);
    keys.add(RESTORE_APP_CONTEXT_KEY);
  }
  return [...keys];
}

/**
 * Fail-closed apply boundary validation.
 * Does not read storage — structural/plan contract only.
 */
export function validateRestorePlanForApply(plan: RestorePlan): ValidateRestorePlanForApplyResult {
  if (!plan.canApply) {
    return { ok: false, reason: "can_apply_false" };
  }

  if (plan.conflict != null) {
    return { ok: false, reason: "conflict_present", detail: plan.conflict.kind };
  }

  const allowedOpKeys = allRestoreOperationKeys();
  const seenOpKeys = new Set<string>();

  for (const op of plan.operations) {
    if (!isValidOperation(op)) {
      return { ok: false, reason: "invalid_operation_shape" };
    }

    if (op.storage !== "localStorage") {
      return { ok: false, reason: "unsupported_storage_target" };
    }

    if (op.action !== "set" && op.action !== "remove") {
      return { ok: false, reason: "unknown_storage_action" };
    }

    if (op.action === "set" && typeof op.serializedValue !== "string") {
      return { ok: false, reason: "invalid_serialized_value" };
    }

    if (seenOpKeys.has(op.key)) {
      return { ok: false, reason: "duplicate_operation_key", detail: op.key };
    }
    seenOpKeys.add(op.key);

    if (!allowedOpKeys.has(op.key)) {
      return { ok: false, reason: "unowned_operation_key", detail: op.key };
    }

    // AppContext is side-effect only (remove after ops) — never a module operation target.
    if (op.key === RESTORE_APP_CONTEXT_KEY) {
      return { ok: false, reason: "unowned_operation_key", detail: op.key };
    }
  }

  const touchedSet = new Set(plan.touchedKeys);

  for (const opKey of seenOpKeys) {
    if (!touchedSet.has(opKey)) {
      return { ok: false, reason: "touched_keys_incomplete", detail: opKey };
    }
  }

  for (const platformKey of requiredPlatformSideEffectKeys(plan)) {
    if (!touchedSet.has(platformKey)) {
      return { ok: false, reason: "platform_side_effect_key_missing", detail: platformKey };
    }
  }

  return { ok: true };
}
