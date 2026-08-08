import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { RestorePreviewModel } from "../backup/restore/restore-preview-model";
import type { RestoreResult } from "../backup/restore/restore-apply-types";
import type { ValidatedAppBackupEnvelope } from "../backup/restore/restore-types";
import {
  APP_BACKUP_FORMAT,
  APP_BACKUP_SCHEMA_VERSION,
} from "../backup/restore/restore-types";
import {
  canEnableRestoreApply,
  executeRestoreApply,
  acquireRestoreApplyLock,
  isExactRestoreConfirmationToken,
  mapRestoreResultToPhase,
  refreshRestorePreviewFromValidated,
  restoreDialogCanClose,
  RESTORE_CONFIRMATION_TOKEN,
  runRestoreCurrentBackupDownload,
  shouldShowFullResetSoftCta,
} from "./dashboard-restore-dialog-apply";
import { validateAppBackupEnvelope } from "../backup/restore/validate-app-backup";

function validBackupJson(scenario = "x"): string {
  return JSON.stringify({
    format: APP_BACKUP_FORMAT,
    schemaVersion: APP_BACKUP_SCHEMA_VERSION,
    exportedAt: "2026-08-08T12:00:00.000Z",
    modules: {
      "phmax-scenario-label": {
        label: "Scénář",
        schemaVersion: 1,
        exportedAt: "2026-08-08T12:00:00.000Z",
        data: scenario,
      },
    },
  });
}

function validatedFromScenario(scenario: string): ValidatedAppBackupEnvelope {
  const result = validateAppBackupEnvelope(validBackupJson(scenario));
  if (result.status !== "validated") {
    throw new Error("expected validated backup fixture");
  }
  return result;
}

function sampleValidated(): ValidatedAppBackupEnvelope {
  return validatedFromScenario("x");
}

function applyReadyPreview(overrides: Partial<RestorePreviewModel> = {}): RestorePreviewModel {
  return {
    exportedAtLabel: "8. 8. 2026",
    schemaVersionLabel: "1",
    schoolName: null,
    backupKind: "legacy",
    restoreModules: [{ label: "Scénář školy" }],
    preserveModules: [],
    unknownModuleWarning: false,
    invalidModules: [],
    conflictCategory: null,
    canApply: true,
    hasRestorableModules: true,
    warnings: [],
    blockedMessage: null,
    emptyBackupMessage: null,
    ...overrides,
  };
}

describe("restore dialog apply orchestration", () => {
  it("C: applying and recovery phases are not closable", () => {
    expect(restoreDialogCanClose({ status: "loading" })).toBe(false);
    expect(restoreDialogCanClose({ status: "applying", validated: sampleValidated(), preview: applyReadyPreview() })).toBe(false);
    expect(restoreDialogCanClose({ status: "rolled_back" })).toBe(false);
    expect(restoreDialogCanClose({ status: "fatal_partial" })).toBe(false);
    expect(restoreDialogCanClose({ status: "unexpected_failure" })).toBe(false);
    expect(restoreDialogCanClose({ status: "preview", validated: sampleValidated(), preview: applyReadyPreview() })).toBe(true);
  });

  describe("confirmation token", () => {
    it("B/C: exact OBNOVIT enables apply preconditions", () => {
      const phase = {
        status: "preview" as const,
        validated: sampleValidated(),
        preview: applyReadyPreview(),
      };
      expect(isExactRestoreConfirmationToken(RESTORE_CONFIRMATION_TOKEN)).toBe(true);
      expect(canEnableRestoreApply(phase, RESTORE_CONFIRMATION_TOKEN, false)).toBe(true);
    });

    it("B: wrong token disables apply", () => {
      const phase = {
        status: "preview" as const,
        validated: sampleValidated(),
        preview: applyReadyPreview(),
      };
      expect(canEnableRestoreApply(phase, "WRONG", false)).toBe(false);
    });

    it('D: trimmed " obnovit " is disabled', () => {
      const phase = {
        status: "preview" as const,
        validated: sampleValidated(),
        preview: applyReadyPreview(),
      };
      expect(canEnableRestoreApply(phase, " obnovit ", false)).toBe(false);
    });

    it('E: lowercase "obnovit" is disabled', () => {
      const phase = {
        status: "preview" as const,
        validated: sampleValidated(),
        preview: applyReadyPreview(),
      };
      expect(canEnableRestoreApply(phase, "obnovit", false)).toBe(false);
    });

    it("F/G: whitespace variants of OBNOVIT are disabled", () => {
      const phase = {
        status: "preview" as const,
        validated: sampleValidated(),
        preview: applyReadyPreview(),
      };
      expect(isExactRestoreConfirmationToken("OBNOVIT ")).toBe(false);
      expect(isExactRestoreConfirmationToken(" OBNOVIT")).toBe(false);
      expect(isExactRestoreConfirmationToken(" OBNOVIT ")).toBe(false);
      expect(canEnableRestoreApply(phase, "OBNOVIT ", false)).toBe(false);
      expect(canEnableRestoreApply(phase, " OBNOVIT", false)).toBe(false);
      expect(canEnableRestoreApply(phase, " OBNOVIT ", false)).toBe(false);
    });

    it("blocked conflict never enables apply", () => {
      const phase = {
        status: "preview" as const,
        validated: sampleValidated(),
        preview: applyReadyPreview({
          conflictCategory: "different_school",
          canApply: false,
          blockedMessage: "x",
        }),
      };
      expect(canEnableRestoreApply(phase, RESTORE_CONFIRMATION_TOKEN, false)).toBe(false);
    });
  });

  describe("executeRestoreApply", () => {
    it("H: apply lock allows only one concurrent acquire", () => {
      const lockRef = { current: false };
      expect(acquireRestoreApplyLock(lockRef)).toBe(true);
      expect(acquireRestoreApplyLock(lockRef)).toBe(false);
    });

    it("H: concurrent apply attempts invoke engine once while first is pending", async () => {
      const lockRef = { current: false };
      const validated = sampleValidated();
      const preview = applyReadyPreview();
      let resolveApply!: (value: RestoreResult) => void;
      const applyRestore = vi.fn(
        () =>
          new Promise<RestoreResult>((resolve) => {
            resolveApply = resolve;
          }),
      );

      const attemptApply = async () => {
        if (!acquireRestoreApplyLock(lockRef)) return "blocked";
        return executeRestoreApply(validated, preview, { applyRestore, reload: vi.fn() });
      };

      const first = attemptApply();
      expect(await attemptApply()).toBe("blocked");
      resolveApply({ status: "no_changes" });
      await first;

      expect(applyRestore).toHaveBeenCalledTimes(1);
      expect(applyRestore).toHaveBeenCalledWith(validated);
    });

    it("H: double invocation still calls apply once when second sees lock externally", async () => {
      const applyRestore = vi.fn(async (): Promise<RestoreResult> => ({ status: "no_changes" }));
      const reload = vi.fn();
      const validated = sampleValidated();
      const preview = applyReadyPreview();

      await executeRestoreApply(validated, preview, { applyRestore, reload });
      expect(applyRestore).toHaveBeenCalledTimes(1);
      expect(applyRestore).toHaveBeenCalledWith(validated);
      expect(reload).not.toHaveBeenCalled();
    });

    it("J: success reloads exactly once", async () => {
      const reload = vi.fn();
      await executeRestoreApply(sampleValidated(), applyReadyPreview(), {
        applyRestore: async () => ({ status: "success" }),
        reload,
      });
      expect(reload).toHaveBeenCalledTimes(1);
    });

    it("K: no_changes does not reload and releases lock", async () => {
      const reload = vi.fn();
      const outcome = await executeRestoreApply(sampleValidated(), applyReadyPreview(), {
        applyRestore: async () => ({ status: "no_changes" }),
        reload,
      });
      expect(reload).not.toHaveBeenCalled();
      expect(outcome).toMatchObject({
        kind: "phase",
        phase: { status: "no_changes" },
        releaseApplyLock: true,
        resetConfirmationToken: true,
      });
    });

    it("L: rejected_plan maps to rejected with same validated for refresh", async () => {
      const validated = sampleValidated();
      const preview = applyReadyPreview();
      const outcome = await executeRestoreApply(validated, preview, {
        applyRestore: async () => ({ status: "rejected_plan", reason: "fresh_plan_blocked" }),
      });
      expect(outcome).toMatchObject({
        kind: "phase",
        phase: { status: "rejected", validated, preview },
        releaseApplyLock: true,
      });
    });

    it("M: snapshot_failed releases lock", async () => {
      const outcome = await executeRestoreApply(sampleValidated(), applyReadyPreview(), {
        applyRestore: async () => ({ status: "snapshot_failed" }),
      });
      expect(outcome).toMatchObject({
        kind: "phase",
        phase: { status: "snapshot_failed" },
        releaseApplyLock: true,
      });
    });

    it("N/O/P: recovery outcomes keep lock", async () => {
      for (const status of ["rolled_back", "fatal_partial"] as const) {
        const outcome = await executeRestoreApply(sampleValidated(), applyReadyPreview(), {
          applyRestore: async () =>
            status === "rolled_back"
              ? { status: "rolled_back", failurePhase: "set" }
              : { status: "fatal_partial", failurePhase: "set", failedRollbackKeys: ["k"] },
        });
        expect(outcome).toMatchObject({ releaseApplyLock: false, resetConfirmationToken: false });
      }

      const thrown = await executeRestoreApply(sampleValidated(), applyReadyPreview(), {
        applyRestore: async () => {
          throw new Error("boom");
        },
      });
      expect(thrown).toMatchObject({
        kind: "phase",
        phase: { status: "unexpected_failure" },
        releaseApplyLock: false,
      });
    });
  });

  it("A: refresh preview uses same validated envelope without reparse", () => {
    const validated = sampleValidated();
    const refreshed = refreshRestorePreviewFromValidated(validated);
    expect(refreshed.status).toBe("preview");
    if (refreshed.status !== "preview") return;
    expect(refreshed.validated).toBe(validated);
    expect(refreshed.preview.restoreModules.length).toBeGreaterThan(0);
  });

  it("Q/R: current backup uses single build+download contract", () => {
    const downloadBackup = vi.fn(() => ({
      status: "complete" as const,
      filename: "backup.json",
    }));
    expect(runRestoreCurrentBackupDownload({ downloadBackup })).toEqual({
      status: "download_started",
    });
    expect(downloadBackup).toHaveBeenCalledTimes(1);
  });

  it("S/T: partial and error current backup statuses", () => {
    expect(
      runRestoreCurrentBackupDownload({
        downloadBackup: () => ({ status: "partial", filename: "x.json", failedModules: 2 }),
      }),
    ).toEqual({ status: "partial", failedModules: 2 });
    expect(
      runRestoreCurrentBackupDownload({
        downloadBackup: () => ({ status: "error", reason: "download_failed" }),
      }),
    ).toEqual({ status: "error" });
  });

  describe("Full Reset soft CTA", () => {
    it("W/X/Y: blocked categories show soft CTA", () => {
      expect(shouldShowFullResetSoftCta("different_school")).toBe(true);
      expect(shouldShowFullResetSoftCta("legacy_unverifiable")).toBe(true);
      expect(shouldShowFullResetSoftCta("local_data_corrupted")).toBe(true);
    });

    it("Z: storage unavailable hides soft CTA", () => {
      expect(shouldShowFullResetSoftCta("storage_unavailable")).toBe(false);
    });
  });

  it("A→B: apply receives validated B after preview switch", async () => {
    const validatedA = validatedFromScenario("scenario-A");
    const validatedB = validatedFromScenario("scenario-B");
    const applyRestore = vi.fn(async (): Promise<RestoreResult> => ({ status: "no_changes" }));

    await executeRestoreApply(validatedB, applyReadyPreview(), {
      applyRestore,
      reload: vi.fn(),
    });

    expect(applyRestore).toHaveBeenCalledTimes(1);
    expect(applyRestore).toHaveBeenCalledWith(validatedB);
    expect(applyRestore).not.toHaveBeenCalledWith(validatedA);

    const scenarioModule = validatedB.modules.find(
      (module) => module.moduleId === "phmax-scenario-label" && module.status === "present_valid",
    );
    expect(scenarioModule?.status === "present_valid" ? scenarioModule.data : null).toBe("scenario-B");
  });

  it("redaction: recovery UI source excludes internal failure details", () => {
    const dialogSource = fs.readFileSync(
      path.join(path.resolve(__dirname), "DashboardRestoreDialog.tsx"),
      "utf8",
    );
    expect(dialogSource).not.toContain("failedRollbackKeys");
    expect(dialogSource).not.toContain("failurePhase");
    expect(dialogSource).not.toContain("reditelsky-pruvodce-secret-key");
  });

  it("result mapping ignores internal failure details for phase selection", () => {
    const validated = sampleValidated();
    const preview = applyReadyPreview();
    expect(
      mapRestoreResultToPhase(
        {
          status: "fatal_partial",
          failurePhase: "set",
          failedRollbackKeys: ["secret-key"],
        },
        validated,
        preview,
      ).status,
    ).toBe("fatal_partial");
  });
});
