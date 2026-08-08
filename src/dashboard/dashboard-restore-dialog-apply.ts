import { applyAppBackupRestore } from "../backup/restore/apply-app-backup-restore";
import {
  buildRestorePreviewFromValidated,
  type RestorePreviewConflictCategory,
  type RestorePreviewModel,
} from "../backup/restore/restore-preview-model";
import type { RestoreResult } from "../backup/restore/restore-apply-types";
import type { ValidatedAppBackupEnvelope } from "../backup/restore/restore-types";
import {
  downloadBackupBeforeFullReset,
  type FullResetBackupAttemptResult,
} from "../application-full-reset-flow";

export const RESTORE_CONFIRMATION_TOKEN = "OBNOVIT";

export type RestoreDialogPreviewPhase = {
  status: "preview";
  validated: ValidatedAppBackupEnvelope;
  preview: RestorePreviewModel;
};

export type RestoreDialogPhase =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "file_error"; message: string }
  | { status: "parse_error"; message: string; schemaVersion?: unknown }
  | RestoreDialogPreviewPhase
  | {
      status: "applying";
      validated: ValidatedAppBackupEnvelope;
      preview: RestorePreviewModel;
    }
  | { status: "no_changes" }
  | {
      status: "rejected";
      validated: ValidatedAppBackupEnvelope;
      preview: RestorePreviewModel;
    }
  | { status: "snapshot_failed" }
  | { status: "rolled_back" }
  | { status: "fatal_partial" }
  | { status: "unexpected_failure" };

export type RestoreCurrentBackupStatus =
  | { status: "idle" }
  | { status: "running" }
  | { status: "download_started" }
  | { status: "partial"; failedModules: number }
  | { status: "error" };

const NON_CLOSABLE_PHASES = new Set<RestoreDialogPhase["status"]>([
  "loading",
  "applying",
  "rolled_back",
  "fatal_partial",
  "unexpected_failure",
]);

export function restoreDialogCanClose(phase: RestoreDialogPhase): boolean {
  return !NON_CLOSABLE_PHASES.has(phase.status);
}

export function isExactRestoreConfirmationToken(token: string): boolean {
  return token === RESTORE_CONFIRMATION_TOKEN;
}

export function canEnableRestoreApply(
  phase: RestoreDialogPhase,
  confirmationToken: string,
  applyLocked: boolean,
): boolean {
  if (applyLocked) return false;
  if (phase.status !== "preview") return false;
  const { preview } = phase;
  return (
    preview.canApply &&
    preview.hasRestorableModules &&
    preview.conflictCategory == null &&
    isExactRestoreConfirmationToken(confirmationToken)
  );
}

export function shouldShowFullResetSoftCta(
  category: RestorePreviewConflictCategory | null,
): boolean {
  return (
    category === "different_school" ||
    category === "legacy_unverifiable" ||
    category === "local_data_corrupted"
  );
}

export function mapRestoreResultToPhase(
  result: Exclude<RestoreResult, { status: "success" }>,
  validated: ValidatedAppBackupEnvelope,
  preview: RestorePreviewModel,
): Exclude<
  RestoreDialogPhase,
  | { status: "idle" }
  | { status: "loading" }
  | { status: "file_error" }
  | { status: "parse_error" }
  | RestoreDialogPreviewPhase
  | { status: "applying" }
> {
  switch (result.status) {
    case "no_changes":
      return { status: "no_changes" };
    case "rejected_plan":
      return { status: "rejected", validated, preview };
    case "snapshot_failed":
      return { status: "snapshot_failed" };
    case "rolled_back":
      return { status: "rolled_back" };
    case "fatal_partial":
      return { status: "fatal_partial" };
    default:
      return { status: "unexpected_failure" };
  }
}

export type RestoreApplyDependencies = {
  applyRestore?: (
    validated: ValidatedAppBackupEnvelope,
  ) => Promise<RestoreResult>;
  reload?: () => void;
};

export type RestoreApplyOutcome =
  | { kind: "reloaded" }
  | {
      kind: "phase";
      phase: Exclude<RestoreDialogPhase, RestoreDialogPreviewPhase | { status: "applying" }>;
      releaseApplyLock: boolean;
      resetConfirmationToken: boolean;
    };

export async function executeRestoreApply(
  validated: ValidatedAppBackupEnvelope,
  preview: RestorePreviewModel,
  dependencies: RestoreApplyDependencies = {},
): Promise<RestoreApplyOutcome> {
  const applyRestore = dependencies.applyRestore ?? applyAppBackupRestore;
  const reload = dependencies.reload ?? (() => window.location.reload());

  try {
    const result = await applyRestore(validated);
    if (result.status === "success") {
      reload();
      return { kind: "reloaded" };
    }

    const phase = mapRestoreResultToPhase(result, validated, preview);
    const releaseApplyLock =
      phase.status === "no_changes" ||
      phase.status === "rejected" ||
      phase.status === "snapshot_failed";
    const resetConfirmationToken = releaseApplyLock;

    return {
      kind: "phase",
      phase,
      releaseApplyLock,
      resetConfirmationToken,
    };
  } catch {
    return {
      kind: "phase",
      phase: { status: "unexpected_failure" },
      releaseApplyLock: false,
      resetConfirmationToken: false,
    };
  }
}

export type RestorePreviewRefreshResult =
  | { status: "preview"; validated: ValidatedAppBackupEnvelope; preview: RestorePreviewModel }
  | { status: "error"; message: string };

export function refreshRestorePreviewFromValidated(
  validated: ValidatedAppBackupEnvelope,
): RestorePreviewRefreshResult {
  try {
    const ready = buildRestorePreviewFromValidated(validated);
    return {
      status: "preview",
      validated: ready.validated,
      preview: ready.preview,
    };
  } catch {
    return {
      status: "error",
      message: "Náhled obnovy se nepodařilo znovu načíst.",
    };
  }
}

export type RestoreCurrentBackupDependencies = {
  downloadBackup: () => FullResetBackupAttemptResult;
};

export function runRestoreCurrentBackupDownload(
  dependencies: RestoreCurrentBackupDependencies = {
    downloadBackup: downloadBackupBeforeFullReset,
  },
): RestoreCurrentBackupStatus {
  const result = dependencies.downloadBackup();
  if (result.status === "complete") {
    return { status: "download_started" };
  }
  if (result.status === "partial") {
    return { status: "partial", failedModules: result.failedModules };
  }
  return { status: "error" };
}

export function shouldReleaseApplyLockAfterPhase(phase: RestoreDialogPhase): boolean {
  return (
    phase.status === "no_changes" ||
    phase.status === "rejected" ||
    phase.status === "snapshot_failed"
  );
}

export function isRestoreBlockingRecoveryPhase(phase: RestoreDialogPhase): boolean {
  return (
    phase.status === "rolled_back" ||
    phase.status === "fatal_partial" ||
    phase.status === "unexpected_failure"
  );
}

export function acquireRestoreApplyLock(lockRef: { current: boolean }): boolean {
  if (lockRef.current) return false;
  lockRef.current = true;
  return true;
}

export function releaseRestoreApplyLock(lockRef: { current: boolean }): void {
  lockRef.current = false;
}
