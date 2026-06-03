/** Po importu ze školy – moduly načtou autosave z localStorage (stejná záložka). */
export const PHMAX_IMPORT_APPLIED_EVENT = "phmax-import-applied";

export function dispatchPhmaxImportApplied(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PHMAX_IMPORT_APPLIED_EVENT));
}
