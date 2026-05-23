import type { ProductView } from "./ProductViewPills";

const LS_PREFIX = "phmax-dash-last-visit-";
const LS_LAST_ACTIVE = "phmax-dash-last-active-product";

export type DashboardVisitProduct = Exclude<ProductView, "dash">;

function storage(): Storage | null {
  if (typeof globalThis === "undefined") return null;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function recordDashboardProductVisit(product: DashboardVisitProduct): void {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(`${LS_PREFIX}${product}`, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

export function readDashboardProductVisit(product: DashboardVisitProduct): Date | null {
  const ls = storage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(`${LS_PREFIX}${product}`);
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isFinite(d.getTime()) ? d : null;
  } catch {
    return null;
  }
}

export function recordLastActiveProduct(product: DashboardVisitProduct): void {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(LS_LAST_ACTIVE, product);
  } catch {
    /* ignore */
  }
}

export function readLastActiveProduct(): DashboardVisitProduct | null {
  const ls = storage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(LS_LAST_ACTIVE);
    if (raw === "pv" || raw === "sd" || raw === "zs" || raw === "ss" || raw === "nv75") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function formatDashboardProductVisit(product: DashboardVisitProduct): string {
  const d = readDashboardProductVisit(product);
  if (!d) return "zatím neotevřeno v tomto prohlížeči";
  return d.toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
