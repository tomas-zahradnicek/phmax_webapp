import { describe, expect, it, vi } from "vitest";
import type { AppBackupEnvelope, BackupExportResult } from "./backup/backup-types";
import {
  downloadBackupBeforeFullReset,
  executeFullApplicationReset,
} from "./application-full-reset-flow";

function backupResult(
  moduleStatuses: BackupExportResult["moduleStatuses"] = [],
): BackupExportResult {
  return {
    envelope: {
      format: "reditelsky-pruvodce-backup",
      schemaVersion: 1,
      exportedAt: "2026-08-08T12:00:00.000Z",
      modules: {},
    },
    moduleStatuses,
    filename: "backup.json",
  };
}

describe("Full Application Reset flow", () => {
  it("buildne backup jednou a stáhne přesně tentýž envelope", () => {
    const built = backupResult();
    const buildBackup = vi.fn(() => built);
    const downloadBackup = vi.fn(
      (_envelope: AppBackupEnvelope, filename: string) => ({
        ok: true as const,
        filename,
      }),
    );

    const result = downloadBackupBeforeFullReset({ buildBackup, downloadBackup });

    expect(result).toEqual({ status: "complete", filename: "backup.json" });
    expect(buildBackup).toHaveBeenCalledTimes(1);
    expect(downloadBackup).toHaveBeenCalledTimes(1);
    expect(downloadBackup).toHaveBeenCalledWith(built.envelope, built.filename);
    expect(downloadBackup.mock.calls[0]?.[0]).toBe(built.envelope);
  });

  it("rozliší partial backup podle statusů stejného buildu", () => {
    const built = backupResult([
      { id: "school-profile", label: "Profil školy", hasData: false, error: "invalid_json" },
      { id: "annual-report", label: "Výroční zpráva", hasData: true },
    ]);

    const result = downloadBackupBeforeFullReset({
      buildBackup: () => built,
      downloadBackup: () => ({ ok: true, filename: built.filename }),
    });

    expect(result).toEqual({
      status: "partial",
      filename: "backup.json",
      failedModules: 1,
    });
  });

  it("vrátí download error a nespouští žádný reset", () => {
    const result = downloadBackupBeforeFullReset({
      buildBackup: () => backupResult(),
      downloadBackup: () => ({ ok: false, reason: "download_failed" }),
    });

    expect(result).toEqual({ status: "error", reason: "download_failed" });
  });

  it("zachytí neočekávanou build chybu", () => {
    const result = downloadBackupBeforeFullReset({
      buildBackup: () => {
        throw new Error("simulated build failure");
      },
      downloadBackup: vi.fn(),
    });

    expect(result).toEqual({ status: "error", reason: "build_failed" });
  });

  it("při ok:true provede hard reload i když removed je nula", () => {
    const hardReload = vi.fn();

    const result = executeFullApplicationReset({
      clearStorage: () => ({ ok: true, removed: 0, failed: [] }),
      hardReload,
    });

    expect(result.ok).toBe(true);
    expect(hardReload).toHaveBeenCalledTimes(1);
  });

  it("při ok:false reload neprovede bez ohledu na removed", () => {
    const hardReload = vi.fn();
    const failed = [
      {
        storage: "localStorage" as const,
        key: "owned-key",
        operation: "read" as const,
      },
    ];

    const result = executeFullApplicationReset({
      clearStorage: () => ({ ok: false, removed: 999, failed }),
      hardReload,
    });

    expect(result).toEqual({ ok: false, removed: 999, failed });
    expect(hardReload).not.toHaveBeenCalled();
  });
});
