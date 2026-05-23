import {
  PHMAX_PV_ONBOARDING_LS_KEY,
  PHMAX_SD_ONBOARDING_LS_KEY,
  PHMAX_SS_ONBOARDING_LS_KEY,
  PHMAX_ZS_ONBOARDING_LS_KEY,
  PHMAX_NV75_ONBOARDING_LS_KEY,
} from "./calculator-ui-constants";
import { PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY, PHMAX_SS_UNITS_STORAGE_KEY } from "./ss/phmax-ss-constants";
import { NAMED_SNAPSHOTS_LS_KEY } from "./zs-named-snapshots";
import { SD_BASIC_WIZARD_LS_KEY } from "./sd-basic-wizard";
import { ZS_BASIC_WIZARD_LS_KEY } from "./zs-basic-wizard";

/** Všechna klíče kalkulačky v localStorage (včetně preferencí a návštěv). */
export const PHMAX_APP_LOCAL_STORAGE_KEYS: readonly string[] = [
  "edu-cz-pv-calculator-state",
  "edu-cz-pv-named-snapshots-v1",
  "phmax-pv-view-mode",
  PHMAX_PV_ONBOARDING_LS_KEY,
  "edu-cz-sd-calculator-state",
  "edu-cz-sd-named-snapshots-v1",
  "phmax-sd-view-mode",
  PHMAX_SD_ONBOARDING_LS_KEY,
  SD_BASIC_WIZARD_LS_KEY,
  "edu-cz-zs-calculator-state",
  NAMED_SNAPSHOTS_LS_KEY,
  "phmax-zs-view-mode",
  ZS_BASIC_WIZARD_LS_KEY,
  PHMAX_ZS_ONBOARDING_LS_KEY,
  PHMAX_SS_UNITS_STORAGE_KEY,
  PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY,
  "phmax-ss-view-mode",
  "phmax-ss-framework-phase1-notes",
  PHMAX_SS_ONBOARDING_LS_KEY,
  "edu-cz-nv75-deputy-bank-state",
  "edu-cz-nv75-deputy-bank-named-snapshots",
  PHMAX_NV75_ONBOARDING_LS_KEY,
  "phmax-display-density",
  "phmax-calculator-focus",
  "phmax-dash-last-active-product",
];

const DASH_VISIT_PREFIX = "phmax-dash-last-visit-";

/** Smaže uložená data kalkulaček v tomto prohlížeči. Vrací počet odstraněných klíčů. */
export function clearAllPhmaxLocalStorage(): number {
  if (typeof localStorage === "undefined") return 0;
  let removed = 0;
  try {
    for (const key of PHMAX_APP_LOCAL_STORAGE_KEYS) {
      if (localStorage.getItem(key) != null) {
        localStorage.removeItem(key);
        removed += 1;
      }
    }
    const toDrop: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(DASH_VISIT_PREFIX)) toDrop.push(key);
    }
    for (const key of toDrop) {
      localStorage.removeItem(key);
      removed += 1;
    }
  } catch {
    /* ignore */
  }
  return removed;
}
