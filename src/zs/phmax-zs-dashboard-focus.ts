import { buildZsValidationIssues } from "./zs-form-validation";
import type { ZsTabKey } from "./zs-form-snapshot";

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function arrLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

function tabFromSnapshot(s: Record<string, unknown>): ZsTabKey {
  return s.tab === "pha" || s.tab === "php" ? s.tab : "phmax";
}

/** První sekce ZŠ k fokusu z dashboardu – z uloženého autosave stavu. */
export function findFirstZsDashboardFocusSection(raw: string | null): string | undefined {
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== "object") return undefined;
  const s = parsed as Record<string, unknown>;

  const issues = buildZsValidationIssues({
    tab: tabFromSnapshot(s),
    basic1Classes: num(s.basic1Classes),
    basic1Pupils: num(s.basic1Pupils),
    basic2Classes: num(s.basic2Classes),
    basic2Pupils: num(s.basic2Pupils),
    incl1Classes: num(s.incl1Classes),
    incl2Classes: num(s.incl2Classes),
    psychRowCount: arrLen(s.psychRows),
    healthRowCount: arrLen(s.healthRows),
    minority1Classes: num(s.minority1Classes),
    gymRowCount: arrLen(s.gymRows),
    mixedRowCount: arrLen(s.mixedRows),
    special1Classes: num(s.special1Classes),
    special2Classes: num(s.special2Classes),
    specialIIClasses: num(s.specialIIClasses),
    prepClasses: num(s.prepClasses),
    prepSpecialClasses: num(s.prepSpecialClasses),
    phaRowCount: arrLen(s.phaRows),
    phpYear1: num(s.phpYear1),
    phpYear2: num(s.phpYear2),
    phpYear3: num(s.phpYear3),
    phpMethodMode: typeof s.phpMethodMode === "string" ? s.phpMethodMode : "three_year_avg",
  });

  if (issues[0]?.section) return issues[0].section;
  return "guide";
}
