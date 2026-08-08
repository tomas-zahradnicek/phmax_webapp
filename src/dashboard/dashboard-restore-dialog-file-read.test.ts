import { describe, expect, it } from "vitest";
import { buildRestorePreviewFromBackupText } from "../backup/restore/restore-preview-model";
import {
  APP_BACKUP_FORMAT,
  APP_BACKUP_SCHEMA_VERSION,
} from "../backup/restore/restore-types";
import {
  beginRestoreFileReadGeneration,
  invalidateRestoreFileReadGeneration,
  isCurrentRestoreFileReadGeneration,
  processRestoreFileRead,
  restoreDialogCanClose,
} from "./dashboard-restore-dialog-file-read";

function deferredText(): {
  file: { text(): Promise<string> };
  resolve(value: string): void;
  reject(error: Error): void;
} {
  let resolveText!: (value: string) => void;
  let rejectText!: (error: Error) => void;
  const textPromise = new Promise<string>((res, rej) => {
    resolveText = res;
    rejectText = rej;
  });
  return {
    file: { text: () => textPromise },
    resolve: (value: string) => resolveText(value),
    reject: (error: Error) => rejectText(error),
  };
}

function validBackupJson(label: string): string {
  return JSON.stringify({
    format: APP_BACKUP_FORMAT,
    schemaVersion: APP_BACKUP_SCHEMA_VERSION,
    exportedAt: "2026-08-08T12:00:00.000Z",
    modules: {
      "phmax-scenario-label": {
        label,
        schemaVersion: 1,
        exportedAt: "2026-08-08T12:00:00.000Z",
        data: label,
      },
    },
  });
}

describe("dashboard restore dialog file read orchestration", () => {
  it("C: loading and applying phases are not closable", () => {
    expect(restoreDialogCanClose({ status: "loading" })).toBe(false);
    expect(restoreDialogCanClose({ status: "idle" })).toBe(true);
    expect(restoreDialogCanClose({ status: "file_error", message: "x" })).toBe(true);
  });

  it("preview phase retains validated envelope atomically with preview", async () => {
    const generationRef = { current: 0 };
    const gen = beginRestoreFileReadGeneration(generationRef);
    const result = await processRestoreFileRead(
      { text: async () => validBackupJson("Scénář") },
      gen,
      generationRef,
      buildRestorePreviewFromBackupText,
    );
    expect(result.applied).toBe(true);
    if (!result.applied || result.phase.status !== "preview") return;
    expect(result.phase.validated.status).toBe("validated");
    expect(result.phase.preview.restoreModules[0]?.label).toBe("Scénář školy");
  });

  it("A: stale file A cannot overwrite current file B when B starts after A", async () => {
    const generationRef = { current: 0 };
    const genA = beginRestoreFileReadGeneration(generationRef);
    const deferredA = deferredText();
    const promiseA = processRestoreFileRead(
      deferredA.file,
      genA,
      generationRef,
      buildRestorePreviewFromBackupText,
    );

    const genB = beginRestoreFileReadGeneration(generationRef);
    const deferredB = deferredText();
    const promiseB = processRestoreFileRead(
      deferredB.file,
      genB,
      generationRef,
      buildRestorePreviewFromBackupText,
    );

    deferredB.resolve(validBackupJson("Scénář B"));
    const resultB = await promiseB;
    expect(resultB.applied).toBe(true);
    if (!resultB.applied || resultB.phase.status !== "preview") return;
    expect(resultB.phase.preview.restoreModules[0]?.label).toBe("Scénář školy");

    deferredA.resolve(validBackupJson("Scénář A"));
    const resultA = await promiseA;
    expect(resultA.applied).toBe(false);
  });

  it("B: pending read invalidated by lifecycle reset cannot apply later state", async () => {
    const generationRef = { current: 0 };
    const genA = beginRestoreFileReadGeneration(generationRef);
    const deferredA = deferredText();
    const promiseA = processRestoreFileRead(
      deferredA.file,
      genA,
      generationRef,
      buildRestorePreviewFromBackupText,
    );

    invalidateRestoreFileReadGeneration(generationRef);

    const genB = beginRestoreFileReadGeneration(generationRef);
    const deferredB = deferredText();
    const promiseB = processRestoreFileRead(
      deferredB.file,
      genB,
      generationRef,
      buildRestorePreviewFromBackupText,
    );

    deferredB.resolve(validBackupJson("Scénář B"));
    expect(await promiseB).toMatchObject({ applied: true });

    deferredA.resolve(validBackupJson("Scénář A"));
    expect(await promiseA).toEqual({ applied: false });
  });

  it("stale file error from A cannot overwrite B preview", async () => {
    const generationRef = { current: 0 };
    const genA = beginRestoreFileReadGeneration(generationRef);
    const deferredA = deferredText();
    const promiseA = processRestoreFileRead(
      deferredA.file,
      genA,
      generationRef,
      buildRestorePreviewFromBackupText,
    );

    const genB = beginRestoreFileReadGeneration(generationRef);
    const deferredB = deferredText();
    const promiseB = processRestoreFileRead(
      deferredB.file,
      genB,
      generationRef,
      buildRestorePreviewFromBackupText,
    );

    deferredB.resolve(validBackupJson("Scénář B"));
    expect(await promiseB).toMatchObject({ applied: true });

    deferredA.reject(new Error("read failed"));
    expect(await promiseA).toEqual({ applied: false });
  });

  it("D: valid → invalid → same valid reselect remains current", async () => {
    const generationRef = { current: 0 };

    const validGen = beginRestoreFileReadGeneration(generationRef);
    const valid = await processRestoreFileRead(
      { text: async () => validBackupJson("Scénář valid") },
      validGen,
      generationRef,
      buildRestorePreviewFromBackupText,
    );
    expect(valid.applied).toBe(true);

    const invalidGen = beginRestoreFileReadGeneration(generationRef);
    const invalid = await processRestoreFileRead(
      { text: async () => "{not-json" },
      invalidGen,
      generationRef,
      buildRestorePreviewFromBackupText,
    );
    expect(invalid.applied).toBe(true);
    if (!invalid.applied) return;
    expect(invalid.phase.status).toBe("parse_error");

    const reselectGen = beginRestoreFileReadGeneration(generationRef);
    const reselect = await processRestoreFileRead(
      { text: async () => validBackupJson("Scénář valid") },
      reselectGen,
      generationRef,
      buildRestorePreviewFromBackupText,
    );
    expect(reselect.applied).toBe(true);
    if (!reselect.applied || reselect.phase.status !== "preview") return;
    expect(reselect.phase.preview.restoreModules[0]?.label).toBe("Scénář školy");
    expect(isCurrentRestoreFileReadGeneration(generationRef, reselectGen)).toBe(true);
  });

  it("generation increments monotonically", () => {
    const generationRef = { current: 0 };
    expect(beginRestoreFileReadGeneration(generationRef)).toBe(1);
    expect(beginRestoreFileReadGeneration(generationRef)).toBe(2);
    invalidateRestoreFileReadGeneration(generationRef);
    expect(generationRef.current).toBe(3);
    expect(beginRestoreFileReadGeneration(generationRef)).toBe(4);
  });
});
