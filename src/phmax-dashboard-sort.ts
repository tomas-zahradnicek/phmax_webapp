/** Priorita zobrazení na dashboardu: danger → warning → prázdné → ostatní → ok */
export function dashboardAttentionSortKey(
  hasData: boolean,
  tone: "ok" | "warning" | "danger" | "neutral" | undefined,
): number {
  if (tone === "danger") return 0;
  if (tone === "warning") return 1;
  if (!hasData) return 2;
  if (tone === "ok") return 4;
  return 3;
}

export function sortByDashboardAttention<T extends { hasData: boolean; verdict: { tone: "ok" | "warning" | "danger" | "neutral" } | null }>(
  rows: readonly T[],
): T[] {
  return [...rows].sort(
    (a, b) =>
      dashboardAttentionSortKey(a.hasData, a.verdict?.tone) -
      dashboardAttentionSortKey(b.hasData, b.verdict?.tone),
  );
}
