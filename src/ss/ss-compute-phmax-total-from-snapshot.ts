import { parseSsDraftRowsFromSnapshot } from "./ss-draft-storage";
import { deriveSsUnitsPreview } from "./phmax-ss-units-derive";
/** Přepočet PHmax ze SŠ autosave (draft řádky) – stejná logika jako dashboard Σ. */
export function computeSsPhmaxTotalFromSnapshot(snapshot: unknown): number | null {
  const rows = parseSsDraftRowsFromSnapshot(snapshot);
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
