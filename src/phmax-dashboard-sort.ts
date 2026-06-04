import type { ProductView } from "./calculator-ui-constants";

/** Pořadí modulů na dashboardu: PHmax moduly, poté NV75. */
export const DASH_MODULE_DISPLAY_ORDER = ["pv", "sd", "zs", "ss", "nv75"] as const satisfies readonly Exclude<
  ProductView,
  "dash"
>[];

export function sortByDashModuleOrder<T extends { id: (typeof DASH_MODULE_DISPLAY_ORDER)[number] }>(
  rows: readonly T[],
): T[] {
  return [...rows].sort(
    (a, b) => DASH_MODULE_DISPLAY_ORDER.indexOf(a.id) - DASH_MODULE_DISPLAY_ORDER.indexOf(b.id),
  );
}

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
