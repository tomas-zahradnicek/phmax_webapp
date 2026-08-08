import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("Restore preview UI contract (Restore-3A)", () => {
  const cardSource = readSource("src/dashboard/DashboardBackupExportCard.tsx");
  const dialogSource = readSource("src/dashboard/DashboardRestoreDialog.tsx");
  const fileReadSource = readSource("src/dashboard/dashboard-restore-dialog-file-read.ts");
  const profileSource = readSource("src/ProfilSkolyPage.tsx");
  const dashboardSource = readSource("src/PhmaxDashboardPage.tsx");
  const previewModelSource = readSource("src/backup/restore/restore-preview-model.ts");

  it("A/M: canonical restore entry only on dashboard backup card", () => {
    expect(cardSource).toContain('data-testid="restore-open"');
    expect(cardSource).toContain('data-testid="dash-backup-restore-entry"');
    expect(profileSource).not.toContain('data-testid="restore-open"');
    expect(dashboardSource).not.toContain('data-testid="restore-open"');
  });

  it("M: production restore UI does not reference applyAppBackupRestore", () => {
    expect(dialogSource).not.toContain("applyAppBackupRestore");
    expect(cardSource).not.toContain("applyAppBackupRestore");
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

  it("file input accepts JSON and resets value after selection", () => {
    expect(dialogSource).toContain('accept=".json,application/json"');
    expect(dialogSource).toContain('event.target.value = ""');
    expect(dialogSource).toContain("buildRestorePreviewFromBackupText");
    expect(dialogSource).not.toContain("applyAppBackupRestore");
  });

  it("3A does not include apply / OBNOVIT / backup-before-restore yet", () => {
    expect(dialogSource).not.toContain("OBNOVIT");
    expect(dialogSource).not.toContain("downloadBackupBeforeFullReset");
    expect(dialogSource).not.toContain("buildAppBackupEnvelope");
    expect(dialogSource).not.toContain("window.location.reload");
  });

  it("dialog user-facing copy avoids technical restore internals", () => {
    expect(dialogSource).not.toContain("localStorage");
    expect(dialogSource).not.toContain("identity-registry");
    expect(dialogSource).not.toContain("different_school");
    expect(dialogSource).not.toContain("failedRollbackKeys");
  });

  it("loading dialog cannot close via supported close paths", () => {
    expect(dialogSource).toContain("restoreDialogCanClose");
    expect(dialogSource).toContain("invalidateRestoreFileReadGeneration");
    expect(dialogSource).toContain("fileReadGenerationRef");
    expect(dialogSource).toContain("processRestoreFileRead");
    expect(dialogSource).toContain("disabled={!canClose}");
    expect(dialogSource).toContain("if (canClose) requestClose()");
    expect(dialogSource).toContain("if (!restoreDialogCanClose(phase)) return");
    expect(fileReadSource).toContain('return phase.status !== "loading"');
  });

  it("preview model exposes only user-facing module items", () => {
    expect(previewModelSource).toContain("export type RestorePreviewModuleItem = {");
    expect(previewModelSource).toContain("label: string;");
    expect(previewModelSource).not.toContain("failedRollbackKeys");
    expect(previewModelSource).not.toContain("serializedValue");
  });
});
