import {
  ensureSchoolPlatformBinding,
  type EnsureSchoolPlatformBindingResult,
} from "../../school-profile/ensure-school-platform-binding";
import {
  ensureVzSchoolYearPlatformBinding,
  type EnsureVzSchoolYearPlatformBindingResult,
} from "../../vyrocni-zprava/ensure-vz-school-year-platform-binding";
import { readIdentityRegistryFromStorage } from "../../data/identity/identity-registry-storage";
import {
  establishScenarioLabelSchoolShadowFromLegacy,
  type ScenarioLabelEstablishmentStorage,
} from "../../data/storage/scenario-label-migration/scenario-label-school-shadow-establishment-runtime";
import { finalizeScenarioLabelLegacyFenceCertificate } from "../../data/storage/scenario-label-migration/scenario-label-n3-fence-finalize";
import {
  applyRestoreStorageTransaction,
  type ApplyRestoreStorageTransactionDependencies,
} from "./apply-restore-storage-transaction";
import { rollbackRestoreTouchedKeys } from "./rollback-restore-touched-keys";
import {
  SCHOOL_PROFILE_LS_KEY,
} from "./restore-owned-keys";
import type {
  RestoreFailurePhase,
  RestoreResult,
  RestoreTransactionContext,
  RestoreTransactionStorage,
} from "./restore-apply-types";
import type { RestorePlan, ValidatedAppBackupEnvelope } from "./restore-types";
import {
  verifyPostRestorePlatformState,
  type VerifyPostRestorePlatformStateDependencies,
} from "./verify-post-restore-platform-state";

export type ApplyAppBackupRestoreDependencies = {
  storage?: RestoreTransactionStorage;
  applyStorageTransaction?: typeof applyRestoreStorageTransaction;
  ensureSchool?: () => Promise<EnsureSchoolPlatformBindingResult>;
  ensureVzYear?: () => Promise<EnsureVzSchoolYearPlatformBindingResult>;
  verify?: typeof verifyPostRestorePlatformState;
  verifyDependencies?: VerifyPostRestorePlatformStateDependencies;
  /** Injectable for tests — post-verify scenario school-shadow establishment. */
  establishScenarioSchoolShadow?: (
    schoolId: unknown,
    deps: { storage: ScenarioLabelEstablishmentStorage },
  ) => ReturnType<typeof establishScenarioLabelSchoolShadowFromLegacy>;
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

function planSetsSchoolProfile(plan: RestorePlan): boolean {
  return plan.operations.some(
    (op) => op.action === "set" && op.key === SCHOOL_PROFILE_LS_KEY,
  );
}

function hasRequiredPlatformWork(plan: RestorePlan): boolean {
  return (
    plan.platform.requiresIdentityBootstrap ||
    plan.platform.requiresPlatformReconcile ||
    plan.platform.requiresVzSchoolYearReconcile ||
    plan.platform.requiresAppContextReset
  );
}

function schoolEmptyIsFailure(plan: RestorePlan): boolean {
  return plan.platform.requiresIdentityBootstrap || planSetsSchoolProfile(plan);
}

function mapStoragePhaseToFinal(
  result: Awaited<ReturnType<typeof applyRestoreStorageTransaction>>,
): RestoreResult | null {
  if (result.status === "rejected_plan") {
    return {
      status: "rejected_plan",
      reason: result.reason,
      ...(result.detail !== undefined ? { detail: result.detail } : {}),
    };
  }
  if (result.status === "snapshot_failed") {
    return {
      status: "snapshot_failed",
      ...(result.detail !== undefined ? { detail: result.detail } : {}),
    };
  }
  if (result.status === "rolled_back") {
    return {
      status: "rolled_back",
      failurePhase: result.failurePhase,
      ...(result.cause !== undefined ? { cause: result.cause } : {}),
    };
  }
  if (result.status === "fatal_partial") {
    return {
      status: "fatal_partial",
      failurePhase: result.failurePhase,
      failedRollbackKeys: result.failedRollbackKeys,
      ...(result.cause !== undefined ? { cause: result.cause } : {}),
    };
  }
  return null;
}

function runRollback(
  transaction: RestoreTransactionContext,
  storage: RestoreTransactionStorage,
  failurePhase: RestoreFailurePhase,
  cause?: string,
): RestoreResult {
  const rollback = rollbackRestoreTouchedKeys(transaction.snapshot, storage);
  if (rollback.ok) {
    return {
      status: "rolled_back",
      failurePhase,
      ...(cause !== undefined ? { cause } : {}),
    };
  }
  return {
    status: "fatal_partial",
    failurePhase,
    failedRollbackKeys: rollback.failedKeys,
    ...(cause !== undefined ? { cause } : {}),
  };
}

type ReconcileOutcome =
  | { ok: true; schoolReady: boolean }
  | { ok: false; phase: "school_reconcile" | "vz_reconcile"; cause: string };

async function runPlatformReconcile(
  plan: RestorePlan,
  ensureSchool: () => Promise<EnsureSchoolPlatformBindingResult>,
  ensureVzYear: () => Promise<EnsureVzSchoolYearPlatformBindingResult>,
): Promise<ReconcileOutcome> {
  const needVz = plan.platform.requiresVzSchoolYearReconcile;
  const needSchoolStandalone =
    !needVz &&
    (plan.platform.requiresPlatformReconcile || plan.platform.requiresIdentityBootstrap);

  if (!needVz && !needSchoolStandalone) {
    return { ok: true, schoolReady: false };
  }

  if (needVz) {
    const vz = await ensureVzYear();
    if (vz.status === "error") {
      return {
        ok: false,
        phase: "vz_reconcile",
        cause: vz.detail ?? vz.reason,
      };
    }
    if (vz.status === "empty") {
      if (schoolEmptyIsFailure(plan)) {
        return {
          ok: false,
          phase: "vz_reconcile",
          cause: "unexpected_empty_school_for_vz_reconcile",
        };
      }
      return { ok: true, schoolReady: false };
    }
    if (vz.status === "noop") {
      // School was ready; year not bindable — legitimate.
      return { ok: true, schoolReady: true };
    }
    // ready
    return { ok: true, schoolReady: true };
  }

  const school = await ensureSchool();
  if (school.status === "error") {
    return {
      ok: false,
      phase: "school_reconcile",
      cause: school.detail ?? school.reason,
    };
  }
  if (school.status === "empty") {
    if (schoolEmptyIsFailure(plan)) {
      return {
        ok: false,
        phase: "school_reconcile",
        cause: "unexpected_empty_school",
      };
    }
    return { ok: true, schoolReady: false };
  }
  return { ok: true, schoolReady: true };
}

/**
 * Restore-2B: full restore apply = Restore-2A raw transaction + platform reconcile + verification.
 *
 * v1 apply is intended Dashboard-only (no mounted calculator autosave). Engine does not enforce
 * that UI invariant. Multi-tab race and crash between storage_applied and success remain known
 * limitations (in-memory snapshot; no persistent journal).
 *
 * Never performs browser hard-reload — that remains Restore-3 UI responsibility.
 */
export async function applyAppBackupRestore(
  validatedBackup: ValidatedAppBackupEnvelope,
  dependencies: ApplyAppBackupRestoreDependencies = {},
): Promise<RestoreResult> {
  const storage = dependencies.storage ?? resolveDefaultStorage();
  if (storage == null) {
    return { status: "snapshot_failed", detail: "storage_unavailable" };
  }

  const applyStorage =
    dependencies.applyStorageTransaction ?? applyRestoreStorageTransaction;
  const ensureSchool = dependencies.ensureSchool ?? (() => ensureSchoolPlatformBinding());
  const ensureVzYear =
    dependencies.ensureVzYear ?? (() => ensureVzSchoolYearPlatformBinding());
  const verify = dependencies.verify ?? verifyPostRestorePlatformState;

  const storageDeps: ApplyRestoreStorageTransactionDependencies = {
    storage,
  };

  const storagePhase = applyStorage(validatedBackup, storageDeps);
  const early = mapStoragePhaseToFinal(storagePhase);
  if (early) return early;

  if (storagePhase.status === "no_storage_changes") {
    if (hasRequiredPlatformWork(storagePhase.transaction.plan)) {
      return {
        status: "rejected_plan",
        reason: "inconsistent_no_storage_changes",
        detail: "platform_work_without_snapshot",
      };
    }
    return { status: "no_changes" };
  }

  if (storagePhase.status !== "storage_applied") {
    return { status: "snapshot_failed", detail: "unexpected_storage_phase" };
  }

  const { transaction } = storagePhase;
  // Snapshot must remain the original T2 pre-apply RAW bytes — never re-read / mutate.
  const snapshot = transaction.snapshot;
  const plan = transaction.plan;

  const reconcile = await runPlatformReconcile(plan, ensureSchool, ensureVzYear);
  if (!reconcile.ok) {
    return runRollback(
      { plan, snapshot },
      storage,
      reconcile.phase,
      reconcile.cause,
    );
  }

  const verification = verify(
    plan,
    { schoolReady: reconcile.schoolReady },
    dependencies.verifyDependencies,
  );
  if (!verification.ok) {
    return runRollback(
      { plan, snapshot },
      storage,
      "verification",
      verification.detail,
    );
  }

  // N2-ADOPT-WRITE: post-verification best-effort school-shadow establishment.
  // Past rollback boundary — soft failure / throw MUST NOT downgrade Restore success.
  // N3-FENCE-WRITE: fence LAST also only here (never inside raw txn / pre-verify).
  try {
    const identity = readIdentityRegistryFromStorage(storage);
    if (identity.ok && identity.registry != null) {
      const establish =
        dependencies.establishScenarioSchoolShadow ??
        establishScenarioLabelSchoolShadowFromLegacy;
      const establishResult = establish(identity.registry.schoolId, { storage });

      // Fence follows Restore scenario school mutation OR establishment mutation.
      // already_ready + module-absent + no school Restore mutation → PREP (0 fence).
      const restoreTouchedSchool =
        plan.expectedScenarioLabelTarget?.kind === "school";
      const establishmentMutated = establishResult.status === "established";
      if (restoreTouchedSchool || establishmentMutated) {
        try {
          finalizeScenarioLabelLegacyFenceCertificate({
            storage,
            schoolId: identity.registry.schoolId,
          });
        } catch {
          // Soft fence metadata only.
        }
      }
    }
  } catch {
    // Soft metadata only — verified business Restore remains successful.
  }

  return { status: "success" };
}
