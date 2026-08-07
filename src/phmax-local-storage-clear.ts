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
import { PV_BASIC_WIZARD_LS_KEY } from "./pv-basic-wizard";
import { SS_BASIC_WIZARD_LS_KEY } from "./ss-basic-wizard";
import { NV75_BASIC_WIZARD_LS_KEY } from "./nv75-basic-wizard";
import { ZS_BASIC_WIZARD_LS_KEY } from "./zs-basic-wizard";
import { PHMAX_WHATS_NEW_SEEN_LS_KEY } from "./app-whats-new";
import {
  CALCULATOR_EXPERT_FIRST_SWITCH_LS_KEY,
  CALCULATOR_HINT_FIRST_VISIT_LS_KEY,
} from "./calculator-ui-constants";
import {
  NV75_QUICK_TOUR_LS_KEY,
  PV_QUICK_TOUR_LS_KEY,
  SD_QUICK_TOUR_LS_KEY,
  SS_QUICK_TOUR_LS_KEY,
  ZS_QUICK_TOUR_LS_KEY,
} from "./phmax-module-quick-tour";
import {
  PHMAX_MODULE_AUTOSAVE_LS_KEYS,
  PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
} from "./phmax-school-scenario-export";

/**
 * Level B — Calculator Clear inventář.
 * Neobsahuje SchoolProfile, Identity Registry, AppContext ani klíče výroční zprávy.
 */
export const PHMAX_APP_LOCAL_STORAGE_KEYS: readonly string[] = [
  "edu-cz-pv-calculator-state",
  "edu-cz-pv-named-snapshots-v1",
  "phmax-pv-view-mode",
  PHMAX_PV_ONBOARDING_LS_KEY,
  PV_BASIC_WIZARD_LS_KEY,
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
  SS_BASIC_WIZARD_LS_KEY,
  "edu-cz-nv75-deputy-bank-state",
  "edu-cz-nv75-deputy-bank-named-snapshots",
  PHMAX_NV75_ONBOARDING_LS_KEY,
  NV75_BASIC_WIZARD_LS_KEY,
  "phmax-display-density",
  "phmax-calculator-focus",
  "phmax-dash-last-active-product",
  PHMAX_WHATS_NEW_SEEN_LS_KEY,
  CALCULATOR_HINT_FIRST_VISIT_LS_KEY,
  CALCULATOR_EXPERT_FIRST_SWITCH_LS_KEY,
  PV_QUICK_TOUR_LS_KEY,
  SD_QUICK_TOUR_LS_KEY,
  SS_QUICK_TOUR_LS_KEY,
  NV75_QUICK_TOUR_LS_KEY,
  ZS_QUICK_TOUR_LS_KEY,
  PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
];

const DASH_VISIT_PREFIX = "phmax-dash-last-visit-";

/**
 * Klíče, které školní scénář / IS handoff JSON skutečně nese v `moduleSnapshots` + label.
 * Post-export clear smí mazat jen tuto množinu (CLEAR_SCOPE ⊆ export).
 */
export const PHMAX_SCHOOL_SCENARIO_EXPORT_WORKING_LS_KEYS: readonly string[] = [
  PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv,
  PHMAX_MODULE_AUTOSAVE_LS_KEYS.sd,
  PHMAX_MODULE_AUTOSAVE_LS_KEYS.zs,
  PHMAX_MODULE_AUTOSAVE_LS_KEYS.ss,
  PHMAX_MODULE_AUTOSAVE_LS_KEYS.nv75,
  PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
];

function removeListedKeys(keys: readonly string[]): number {
  if (typeof localStorage === "undefined") return 0;
  let removed = 0;
  try {
    for (const key of keys) {
      if (localStorage.getItem(key) != null) {
        localStorage.removeItem(key);
        removed += 1;
      }
    }
  } catch {
    /* ignore */
  }
  return removed;
}

/** Level B: smaže data kalkulaček. SchoolProfile / Identity / AppContext / VZ nezapisuje ani nemaže. */
export function clearAllPhmaxLocalStorage(): number {
  if (typeof localStorage === "undefined") return 0;
  let removed = removeListedKeys(PHMAX_APP_LOCAL_STORAGE_KEYS);
  try {
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

/**
 * Úzký post-export clear po exportu, který obsahuje autosave modulů + scenario label
 * (školní scénář JSON / IS handoff). Named snapshots ani SchoolProfile nemaže.
 */
export function clearSchoolScenarioExportWorkingLocalStorage(): number {
  return removeListedKeys(PHMAX_SCHOOL_SCENARIO_EXPORT_WORKING_LS_KEYS);
}
