import type { RestorePreviewFromTextResult } from "../backup/restore/restore-preview-model";
import type { RestorePreviewModel } from "../backup/restore/restore-preview-model";

export const RESTORE_FILE_READ_ERROR = "Soubor zálohy se nepodařilo načíst.";

export type RestoreDialogPhase =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "file_error"; message: string }
  | { status: "parse_error"; message: string; schemaVersion?: unknown }
  | { status: "preview"; preview: RestorePreviewModel };

export type RestoreFileReadGenerationRef = {
  current: number;
};

export function restoreDialogCanClose(phase: RestoreDialogPhase): boolean {
  return phase.status !== "loading";
}

export function beginRestoreFileReadGeneration(
  generationRef: RestoreFileReadGenerationRef,
): number {
  return ++generationRef.current;
}

export function invalidateRestoreFileReadGeneration(
  generationRef: RestoreFileReadGenerationRef,
): void {
  generationRef.current += 1;
}

export function isCurrentRestoreFileReadGeneration(
  generationRef: RestoreFileReadGenerationRef,
  generation: number,
): boolean {
  return generation === generationRef.current;
}

export type ProcessRestoreFileReadResult =
  | { applied: false }
  | { applied: true; phase: Exclude<RestoreDialogPhase, { status: "idle" } | { status: "loading" }> };

export async function processRestoreFileRead(
  file: { text(): Promise<string> },
  generation: number,
  generationRef: RestoreFileReadGenerationRef,
  buildPreview: (text: string) => RestorePreviewFromTextResult,
): Promise<ProcessRestoreFileReadResult> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    if (!isCurrentRestoreFileReadGeneration(generationRef, generation)) {
      return { applied: false };
    }
    return { applied: true, phase: { status: "file_error", message: RESTORE_FILE_READ_ERROR } };
  }

  if (!isCurrentRestoreFileReadGeneration(generationRef, generation)) {
    return { applied: false };
  }

  const result = buildPreview(text);
  if (!isCurrentRestoreFileReadGeneration(generationRef, generation)) {
    return { applied: false };
  }

  if (result.status === "parse_error") {
    return {
      applied: true,
      phase: {
        status: "parse_error",
        message: result.message,
        ...(result.schemaVersion !== undefined ? { schemaVersion: result.schemaVersion } : {}),
      },
    };
  }

  return { applied: true, phase: { status: "preview", preview: result.preview } };
}
