export const PHMAX_DASH_LAST_EXPORT_LS_KEY = "phmax-dash-last-export-v1";

export type DashboardLastExportRecord = {
  at: string;
  kind: string;
};

export function readDashboardLastExport(): DashboardLastExportRecord | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(PHMAX_DASH_LAST_EXPORT_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DashboardLastExportRecord;
    if (!parsed || typeof parsed.at !== "string" || typeof parsed.kind !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function recordDashboardLastExport(kind: string, at = new Date()): void {
  if (typeof localStorage === "undefined") return;
  const payload: DashboardLastExportRecord = { at: at.toISOString(), kind };
  localStorage.setItem(PHMAX_DASH_LAST_EXPORT_LS_KEY, JSON.stringify(payload));
}

export function formatDashboardLastExportLabel(record: DashboardLastExportRecord | null): string {
  if (!record) return "Zatím neexportováno";
  const when = new Date(record.at);
  if (Number.isNaN(when.getTime())) return record.kind;
  return `${when.toLocaleString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })} · ${record.kind}`;
}
