import { revivePhmaxSsUnitRow, type PhmaxSsUnitRow } from "./phmax-ss-types";

export type SsDraftStoragePayload = {
  rows: PhmaxSsUnitRow[];
  _phmaxAuditTotals?: { totalPhmax: number; tab: "phmax" };
};

function parseRowsArray(raw: unknown[]): PhmaxSsUnitRow[] {
  if (raw.length === 0) return [];
  try {
    return raw.map((item, i) => revivePhmaxSsUnitRow((item ?? {}) as Record<string, unknown>, i + 1));
  } catch {
    return [];
  }
}

/** Načte řádky SŠ z autosave – podporuje legacy pole i obal s `_phmaxAuditTotals`. */
export function parseSsDraftRowsFromSnapshot(snapshot: unknown): PhmaxSsUnitRow[] {
  if (Array.isArray(snapshot)) return parseRowsArray(snapshot);
  if (!snapshot || typeof snapshot !== "object") return [];
  const rows = (snapshot as { rows?: unknown }).rows;
  return Array.isArray(rows) ? parseRowsArray(rows) : [];
}

export function parseSsDraftRowsFromLs(raw: string | null): PhmaxSsUnitRow[] {
  if (raw == null || raw === "") return [];
  try {
    return parseSsDraftRowsFromSnapshot(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function buildSsDraftStoragePayload(
  rows: PhmaxSsUnitRow[],
  totalPhmax: number | null,
): SsDraftStoragePayload | PhmaxSsUnitRow[] {
  if (totalPhmax == null) return rows;
  return {
    rows,
    _phmaxAuditTotals: { totalPhmax, tab: "phmax" },
  };
}
