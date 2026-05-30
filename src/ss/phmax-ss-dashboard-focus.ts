import type { PhmaxSsUnitRow } from "./phmax-ss-types";
import { deriveSsUnitsBrulesPreview, deriveSsUnitsPreview } from "./phmax-ss-units-derive";
import { resolveIsPar16Class } from "./phmax-ss-par16";

/** První řádek SŠ k fokusu z dashboardu – chyba PHmax, chyba brules, §16, nebo neúplný řádek. */
export function findFirstSsDashboardFocusRowId(rows: PhmaxSsUnitRow[]): number | undefined {
  const preview = deriveSsUnitsPreview(rows);
  const phmaxError = preview.find((p) => !p.skipped && "error" in p);
  if (phmaxError) return phmaxError.rowId;

  const brules = deriveSsUnitsBrulesPreview(rows);
  const brulesError = brules.find((b) => !b.skipped && "error" in b);
  if (brulesError) return brulesError.rowId;

  const brulesBlocked = brules.find((b) => !b.skipped && "result" in b && !b.result.allowed);
  if (brulesBlocked) return brulesBlocked.rowId;

  const par16Row = rows.find((row) => resolveIsPar16Class(row));
  if (par16Row) return par16Row.id;

  const skipped = preview.find((p) => p.skipped);
  if (skipped) return skipped.rowId;

  return rows[0]?.id;
}
