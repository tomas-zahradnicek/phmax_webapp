import type { ProductView } from "./ProductViewPills";
import type { ModuleInputsFocusHint } from "./phmax-focus-inputs-hint";
import { findPvDashboardFocusHint } from "./phmax-pv-dashboard-focus";
import { findSdDashboardFocusHint } from "./phmax-sd-dashboard-focus";
import { findNv75DashboardFocusHint } from "./phmax-nv75-dashboard-focus";
import { findSsDashboardFocusHint } from "./ss/phmax-ss-dashboard-focus";
import { findZsDashboardFocusHint } from "./zs/phmax-zs-dashboard-focus";
import { PHMAX_SS_UNITS_STORAGE_KEY } from "./ss/phmax-ss-constants";
import { ZS_AUTOSAVE_STORAGE_KEY } from "./zs/zs-form-snapshot";

export type DashboardFocusOptions = {
  /** true = problematický řádek/sekce; false = výchozí vstupní oblast modulu */
  preferIssue?: boolean;
};

const MODULE_LS_KEYS: Record<Exclude<ProductView, "dash">, string> = {
  pv: "edu-cz-pv-calculator-state",
  sd: "edu-cz-sd-calculator-state",
  zs: ZS_AUTOSAVE_STORAGE_KEY,
  ss: PHMAX_SS_UNITS_STORAGE_KEY,
  nv75: "edu-cz-nv75-deputy-bank-state",
};

function readModuleLs(moduleId: Exclude<ProductView, "dash">): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(MODULE_LS_KEYS[moduleId]);
}

/** Sjednocený hint pro dashboard deep-link – issue nebo výchozí landing. */
export function getDashboardFocusHint(
  moduleId: Exclude<ProductView, "dash">,
  options: DashboardFocusOptions = {},
): ModuleInputsFocusHint | undefined {
  const raw = readModuleLs(moduleId);
  switch (moduleId) {
    case "pv":
      return findPvDashboardFocusHint(raw, options);
    case "sd":
      return findSdDashboardFocusHint(raw, options);
    case "zs":
      return findZsDashboardFocusHint(raw, options);
    case "ss":
      return findSsDashboardFocusHint(raw, options);
    case "nv75":
      return findNv75DashboardFocusHint(raw, options);
    default:
      return undefined;
  }
}
