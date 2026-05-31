import { revivePhmaxSsUnitRow, type PhmaxSsUnitRow } from "./phmax-ss-types";
import { deriveSsUnitsBrulesPreview, deriveSsUnitsPreview } from "./phmax-ss-units-derive";
import { resolveIsPar16Class } from "./phmax-ss-par16";
import type { ModuleInputsFocusHint } from "../phmax-focus-inputs-hint";
import type { DashboardFocusOptions } from "../phmax-dashboard-focus";

function findSsIssueRowId(rows: PhmaxSsUnitRow[]): number | undefined {
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

  return undefined;
}

function parseSsRowsFromRaw(raw: string | null): PhmaxSsUnitRow[] {
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  try {
    return parsed.map((item, i) => revivePhmaxSsUnitRow((item ?? {}) as Record<string, unknown>, i + 1));
  } catch {
    return [];
  }
}

/** Hint SŠ pro dashboard – problematický řádek nebo první řádek evidence. */
export function findSsDashboardFocusHint(
  raw: string | null,
  options: DashboardFocusOptions = {},
): ModuleInputsFocusHint | undefined {
  const preferIssue = options.preferIssue !== false;
  const rows = parseSsRowsFromRaw(raw);
  if (rows.length === 0) return preferIssue ? undefined : { sectionId: "ss-vstupy" };

  if (preferIssue) {
    const issueRowId = findSsIssueRowId(rows);
    return issueRowId != null ? { rowId: issueRowId } : undefined;
  }

  const firstId = rows[0]?.id;
  return firstId != null ? { rowId: firstId, sectionId: "ss-vstupy" } : { sectionId: "ss-vstupy" };
}

/** První řádek SŠ k fokusu z dashboardu – chyba PHmax, chyba brules, §16, nebo neúplný řádek. */
export function findFirstSsDashboardFocusRowId(rows: PhmaxSsUnitRow[]): number | undefined {
  return findSsIssueRowId(rows) ?? rows[0]?.id;
}
