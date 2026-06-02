import type { ProductView } from "./ProductViewPills";

export type CrossPhmaxModuleId = Exclude<ProductView, "dash" | "nv75">;

export type CrossPhmaxSlice = {
  id: CrossPhmaxModuleId;
  label: string;
  phmax: number | null;
  hasData: boolean;
  incomplete: boolean;
};

export type CrossPhmaxSummary = {
  slices: readonly CrossPhmaxSlice[];
  modulesWithPhmax: number;
  totalPhmax: number | null;
  hasIncomplete: boolean;
};

/** Parsuje hodnotu KPI PHmax z dashboardu (–, čárka, hvězdička neúplnosti). */
export function parseDashboardKpiPhmax(value: string): number | null {
  if (value === "–" || value.trim() === "") return null;
  const normalized = value.replace(/\s/g, "").replace(",", ".").replace(/\*$/, "");
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Text řádku v souhrnu Σ – rozlišuje nevyplněný modul, nulu a běžnou hodnotu. */
export function formatCrossPhmaxSliceLabel(slice: CrossPhmaxSlice): string {
  if (!slice.hasData) return `${slice.label}: modul nevyplněn`;
  if (slice.phmax == null) return `${slice.label}: PHmax nedopočteno`;
  if (slice.phmax === 0) return `${slice.label}: PHmax = 0 h/týden`;
  return `${slice.label}: ${slice.phmax} h/týden`;
}

/** Orientační součet PHmax z modulů s autosave (NV75 – banka – se nezapočítává). */
export function buildCrossPhmaxSummary(
  rows: ReadonlyArray<{
    id: ProductView;
    primaryKpi: { label: string; value: string };
    hasData: boolean;
    verdict: { tone: string } | null;
  }>,
  labels: Record<CrossPhmaxModuleId, string>,
): CrossPhmaxSummary {
  const ids: CrossPhmaxModuleId[] = ["pv", "sd", "zs", "ss"];
  const slices: CrossPhmaxSlice[] = ids.map((id) => {
    const row = rows.find((r) => r.id === id);
    const hasData = Boolean(row?.hasData);
    const phmax = row && row.primaryKpi.label === "PHmax" ? parseDashboardKpiPhmax(row.primaryKpi.value) : null;
    const incomplete = Boolean(hasData && row?.verdict && row.verdict.tone !== "ok" && phmax != null);
    return { id, label: labels[id], phmax, hasData, incomplete };
  });

  const withValues = slices.filter((s) => s.hasData && s.phmax != null);
  const totalPhmax =
    withValues.length > 0
      ? Math.round((withValues.reduce((sum, s) => sum + (s.phmax ?? 0), 0) + Number.EPSILON) * 100) / 100
      : null;

  return {
    slices,
    modulesWithPhmax: withValues.length,
    totalPhmax,
    hasIncomplete: slices.some((s) => s.incomplete),
  };
}
