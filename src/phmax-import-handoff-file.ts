import type { PhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import { assertPhmaxIsHandoffPayload } from "./phmax-is-handoff-apply";
import { parseImportFile, parseImportFileList } from "./phmax-import-xlsx";

export async function parseImportHandoffFile(file: File): Promise<PhmaxIsHandoffPayload> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".json") || file.type === "application/json") {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      throw new Error("Soubor JSON není platný.");
    }
    assertPhmaxIsHandoffPayload(parsed);
    return parsed;
  }
  return parseImportFile(file);
}

export async function parseImportHandoffFileList(files: readonly File[]): Promise<PhmaxIsHandoffPayload> {
  if (files.length === 1) return parseImportHandoffFile(files[0]!);
  return parseImportFileList(files);
}
