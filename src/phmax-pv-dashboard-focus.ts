import { computePvPhmaxTotal, type PvProvozKind } from "./phmax-pv-logic";
import type { ModuleInputsFocusHint } from "./phmax-focus-inputs-hint";
import type { DashboardFocusOptions } from "./phmax-dashboard-focus";

const PV_PROVOZ: readonly PvProvozKind[] = ["polodenni", "celodenni", "internat", "zdravotnicke"];

function normalizePvRowLoose(item: unknown): {
  id?: string;
  provoz: PvProvozKind;
  classCount: number;
  avgHours: number;
  sec16Count: number;
  languageGroups: number;
} | null {
  if (!item || typeof item !== "object") return null;
  const r = item as Record<string, unknown>;
  const provoz = r.provoz;
  if (typeof provoz !== "string" || !PV_PROVOZ.includes(provoz as PvProvozKind)) return null;
  const classCount = typeof r.classCount === "number" && Number.isFinite(r.classCount) ? Math.max(0, r.classCount) : 0;
  const avgHours = typeof r.avgHours === "number" && Number.isFinite(r.avgHours) ? Math.max(0, r.avgHours) : 0;
  const sec16Count = typeof r.sec16Count === "number" && Number.isFinite(r.sec16Count) ? Math.max(0, r.sec16Count) : 0;
  const languageGroups =
    typeof r.languageGroups === "number" && Number.isFinite(r.languageGroups) ? Math.max(0, r.languageGroups) : 0;
  const id = typeof r.id === "string" ? r.id : undefined;
  return { id, provoz: provoz as PvProvozKind, classCount, avgHours, sec16Count, languageGroups };
}

function parsePvRows(raw: string | null) {
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== "object") return [];
  const rowsRaw = (parsed as { rows?: unknown }).rows;
  if (!Array.isArray(rowsRaw)) return [];
  return rowsRaw.map(normalizePvRowLoose).filter((row): row is NonNullable<typeof row> => row != null);
}

/** Hint PV pro dashboard – neúplné pracoviště nebo výchozí vstupy. */
export function findPvDashboardFocusHint(
  raw: string | null,
  options: DashboardFocusOptions = {},
): ModuleInputsFocusHint | undefined {
  const preferIssue = options.preferIssue !== false;
  const rows = parsePvRows(raw);
  if (rows.length === 0) return preferIssue ? undefined : { sectionId: "pv-vstupy" };

  if (preferIssue) {
    for (const nr of rows) {
      const computed = computePvPhmaxTotal({
        provoz: nr.provoz,
        classCount: nr.classCount,
        avgHoursPerDay: nr.avgHours,
        sec16ClassCount: nr.sec16Count,
        languageGroupCount: nr.languageGroups,
      });
      if (computed.totalPhmax == null && nr.id) return { rowKey: nr.id, sectionId: "pv-vstupy" };
    }
    return undefined;
  }

  const first = rows.find((row) => row.id);
  return first?.id ? { rowKey: first.id, sectionId: "pv-vstupy" } : { sectionId: "pv-vstupy" };
}

/** První pracoviště PV k fokusu z dashboardu – neúplný výpočet PHmax. */
export function findFirstPvDashboardFocusRowKey(raw: string | null): string | undefined {
  return findPvDashboardFocusHint(raw, { preferIssue: true })?.rowKey;
}
