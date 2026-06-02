import { revivePhmaxSsUnitRow, type PhmaxSsUnitRow } from "./phmax-ss-types";
import { deriveSsUnitsPreview } from "./phmax-ss-units-derive";

function parseSsDraftRows(snapshot: unknown): PhmaxSsUnitRow[] {
  if (!Array.isArray(snapshot) || snapshot.length === 0) return [];
  try {
    return snapshot.map((item, i) => revivePhmaxSsUnitRow((item ?? {}) as Record<string, unknown>, i + 1));
  } catch {
    return [];
  }
}

/** Přepočet PHmax ze SŠ autosave (draft řádky) – stejná logika jako dashboard Σ. */
export function computeSsPhmaxTotalFromSnapshot(snapshot: unknown): number | null {
  const rows = parseSsDraftRows(snapshot);
  if (rows.length === 0) return null;
  const preview = deriveSsUnitsPreview(rows);
  let sum = 0;
  let any = false;
  for (const p of preview) {
    if (!p.skipped && "resolved" in p) {
      sum += p.resolved?.totalPhmax ?? 0;
      any = true;
    }
  }
  return any ? Math.round((sum + Number.EPSILON) * 100) / 100 : null;
}
