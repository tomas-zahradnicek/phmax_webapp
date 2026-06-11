import type { PhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import type { PhmaxModuleId } from "./phmax-is-handoff-apply";
import { PHMAX_MODULE_AUTOSAVE_LS_KEYS } from "./phmax-school-scenario-export";

const MODULE_ORDER: readonly PhmaxModuleId[] = ["pv", "sd", "zs", "ss", "nv75"];

export type ImportModuleStorageDiff = {
  overwrite: PhmaxModuleId[];
  unchanged: PhmaxModuleId[];
  loadNew: PhmaxModuleId[];
};

export function moduleHasStoredData(id: PhmaxModuleId): boolean {
  if (typeof localStorage === "undefined") return false;
  const raw = localStorage.getItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS[id]);
  return raw != null && raw.trim() !== "";
}

export function buildImportModuleStorageDiff(payload: PhmaxIsHandoffPayload): ImportModuleStorageDiff {
  const inPayload = MODULE_ORDER.filter((id) => payload.schoolScenario.moduleSnapshots[id] != null);
  const overwrite: PhmaxModuleId[] = [];
  const loadNew: PhmaxModuleId[] = [];
  const unchanged: PhmaxModuleId[] = [];

  for (const id of inPayload) {
    if (moduleHasStoredData(id)) overwrite.push(id);
    else loadNew.push(id);
  }
  for (const id of MODULE_ORDER) {
    if (!inPayload.includes(id) && moduleHasStoredData(id)) unchanged.push(id);
  }

  return { overwrite, unchanged, loadNew };
}

export function firstImportAffectedModule(diff: ImportModuleStorageDiff): PhmaxModuleId | null {
  return diff.overwrite[0] ?? diff.loadNew[0] ?? null;
}

export function formatImportModuleStorageDiff(
  diff: ImportModuleStorageDiff,
  labels: Record<PhmaxModuleId, string>,
): string {
  const parts: string[] = [];
  const overwriteAll = [...diff.overwrite, ...diff.loadNew];
  if (overwriteAll.length > 0) {
    parts.push(`Přepíše / načte: ${overwriteAll.map((id) => labels[id]).join(", ")}`);
  }
  if (diff.unchanged.length > 0) {
    parts.push(`Beze změny: ${diff.unchanged.map((id) => labels[id]).join(", ")}`);
  }
  if (parts.length === 0) return "Soubor nenačte žádná data modulů.";
  return parts.join(" · ");
}
