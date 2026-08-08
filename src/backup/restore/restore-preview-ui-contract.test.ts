import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("Restore preview UI contract (Restore-3B)", () => {
  const cardSource = readSource("src/dashboard/DashboardBackupExportCard.tsx");
  const dialogSource = readSource("src/dashboard/DashboardRestoreDialog.tsx");
  const fileReadSource = readSource("src/dashboard/dashboard-restore-dialog-file-read.ts");
  const applySource = readSource("src/dashboard/dashboard-restore-dialog-apply.ts");
  const profileSource = readSource("src/ProfilSkolyPage.tsx");
  const dashboardSource = readSource("src/PhmaxDashboardPage.tsx");
  const previewModelSource = readSource("src/backup/restore/restore-preview-model.ts");

  it("A: canonical restore entry only on dashboard backup card", () => {
    expect(cardSource).toContain('data-testid="restore-open"');
    expect(cardSource).toContain('data-testid="dash-backup-restore-entry"');
    expect(profileSource).not.toContain('data-testid="restore-open"');
    expect(dashboardSource).not.toContain('data-testid="restore-open"');
  });

  it("M: restore UI calls only high-level applyAppBackupRestore via orchestration", () => {
    expect(dialogSource).not.toContain("applyAppBackupRestore");
    expect(cardSource).not.toContain("applyAppBackupRestore");
    expect(applySource).toContain("applyAppBackupRestore");
    expect(dialogSource).toContain("executeRestoreApply");
    expect(dialogSource).not.toContain("applyRestoreStorageTransaction");
    expect(dialogSource).not.toContain("ensureSchoolPlatformBinding");
    expect(dialogSource).not.toContain("ensureVzSchoolYearPlatformBinding");
    expect(dialogSource).not.toContain("executeFullApplicationReset");
  });

  it("uses modal dialog a11y pattern", () => {
    expect(dialogSource).toContain('role="dialog"');
    expect(dialogSource).toContain('aria-modal="true"');
    expect(dialogSource).toContain("useModalDialogA11y");
    expect(dialogSource).not.toContain("window.confirm");
  });

  it("retains validated envelope in preview phase and file read pipeline", () => {
    expect(fileReadSource).toContain("validated: result.validated");
    expect(previewModelSource).toContain("validated: ValidatedAppBackupEnvelope");
    expect(previewModelSource).toContain("buildRestorePreviewFromValidated");
    expect(dialogSource).toContain('status: "preview"');
  });

  it("includes OBNOVIT exact-match confirmation and current backup CTA", () => {
    expect(applySource).toContain('RESTORE_CONFIRMATION_TOKEN = "OBNOVIT"');
    expect(dialogSource).toContain("RESTORE_CONFIRMATION_TOKEN");
    expect(applySource).toContain('return token === RESTORE_CONFIRMATION_TOKEN');
    expect(dialogSource).toContain("runRestoreCurrentBackupDownload");
    expect(dialogSource).toContain("Stažení zálohy bylo zahájeno.");
    expect(dialogSource).not.toContain("Záloha byla uložena na disk");
  });

  it("dialog user-facing copy avoids technical restore internals", () => {
    expect(dialogSource).not.toContain("localStorage");
    expect(dialogSource).not.toContain("identity-registry");
    expect(dialogSource).not.toContain("different_school");
    expect(dialogSource).not.toContain("failedRollbackKeys");
    expect(dialogSource).not.toContain("failurePhase");
  });

  it("loading/applying/recovery dialog cannot close via supported close paths", () => {
    expect(dialogSource).toContain("restoreDialogCanClose");
    expect(dialogSource).toContain("invalidateRestoreFileReadGeneration");
    expect(dialogSource).toContain("fileReadGenerationRef");
    expect(dialogSource).toContain("applyLockRef");
    expect(dialogSource).toContain("processRestoreFileRead");
    expect(dialogSource).toContain("disabled={!canClose}");
    expect(dialogSource).toContain("if (canClose) requestClose()");
    expect(applySource).toContain('"applying"');
    expect(applySource).toContain('"rolled_back"');
    expect(applySource).toContain('"fatal_partial"');
    expect(applySource).toContain('"unexpected_failure"');
  });

  it("preview model exposes only user-facing module items", () => {
    expect(previewModelSource).toContain("export type RestorePreviewModuleItem = {");
    expect(previewModelSource).toContain("label: string;");
    expect(previewModelSource).not.toContain("failedRollbackKeys");
    expect(previewModelSource).not.toContain("serializedValue");
  });

  it("includes refresh preview flow without File.text reparse in dialog", () => {
    expect(dialogSource).toContain("refreshRestorePreviewFromValidated");
    expect(dialogSource).toContain("Načíst náhled znovu");
    expect(dialogSource).not.toContain("File.text");
  });

  it("Full Reset soft CTA only for blocked identity categories", () => {
    expect(applySource).toContain("shouldShowFullResetSoftCta");
    expect(dialogSource).toContain("restore-full-reset-soft-cta");
    expect(applySource).toContain('"different_school"');
    expect(applySource).toContain('"legacy_unverifiable"');
    expect(applySource).toContain('"local_data_corrupted"');
  });
});
