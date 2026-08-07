import { parseSchoolYearLabel } from "../../domain/school-year/school-year-label";

/** Canonical VZ main-state key used by readSchoolYearHintFromStorage(). */
export const LEGACY_ANNUAL_REPORT_STATE_LS_KEY = "vyrocni-zprava-state-v1";

export type LegacySchoolYearHintReadResult =
  | { ok: true; label: string | null; startYear: number | null }
  | { ok: false; code: "corrupted" | "storage_unavailable" };

/**
 * Discover legacy school-year label without writing.
 * Priority matches existing calculator hint: AnnualReport.schoolYear in VZ state.
 * Invalid / empty labels yield startYear null — never invent a default year.
 */
export function readLegacySchoolYearHint(): LegacySchoolYearHintReadResult {
  if (typeof localStorage === "undefined") {
    return { ok: false, code: "storage_unavailable" };
  }

  let raw: string | null;
  try {
    raw = localStorage.getItem(LEGACY_ANNUAL_REPORT_STATE_LS_KEY);
  } catch {
    return { ok: false, code: "storage_unavailable" };
  }

  if (raw == null || raw.trim() === "") {
    return { ok: true, label: null, startYear: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, code: "corrupted" };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, code: "corrupted" };
  }

  const report = (parsed as { report?: { schoolYear?: unknown } }).report;
  const labelRaw = report?.schoolYear;
  if (labelRaw == null) {
    return { ok: true, label: null, startYear: null };
  }
  if (typeof labelRaw !== "string") {
    return { ok: false, code: "corrupted" };
  }

  const label = labelRaw.trim();
  if (!label) {
    return { ok: true, label: null, startYear: null };
  }

  const startYear = parseSchoolYearLabel(label);
  return { ok: true, label, startYear };
}
