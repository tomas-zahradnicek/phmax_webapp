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
import { clearScenarioLabelAwareRuntime } from "./data/storage/scenario-label-migration/scenario-label-aware-runtime";

/**
 * Level B — Calculator Clear inventář.
 * Neobsahuje SchoolProfile, Identity Registry, AppContext ani klíče výroční zprávy.
 *
 * Includes the legacy scenario label key for inventory/documentation completeness.
 * Runtime Level B MUST filter it out and clear via {@link clearScenarioLabelAwareRuntime}
 * (shadow-aware). Do not call generic removeListedKeys on this full list for scenario.
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
 * Klíče, které školní scénář / IS handoff JSON skutečně nese v `moduleSnapshots`
 * (autosave modulů). Scenario label NENÍ v tomto seznamu — clear musí jít přes
 * {@link clearScenarioLabelAwareRuntime} (legacy + shadow + markers), ne generic remove-list.
 *
 * Post-export clear = these autosave keys + shadow-aware scenario lifecycle.
 */
export const PHMAX_SCHOOL_SCENARIO_EXPORT_WORKING_LS_KEYS: readonly string[] = [
  PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv,
  PHMAX_MODULE_AUTOSAVE_LS_KEYS.sd,
  PHMAX_MODULE_AUTOSAVE_LS_KEYS.zs,
  PHMAX_MODULE_AUTOSAVE_LS_KEYS.ss,
  PHMAX_MODULE_AUTOSAVE_LS_KEYS.nv75,
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

function clearScenarioLabelShadowAwareCounted(): number {
  if (typeof localStorage === "undefined") return 0;
  const before = localStorage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY) != null ? 1 : 0;
  const result = clearScenarioLabelAwareRuntime();
  if (
    result.status === "fatal_partial" ||
    result.status === "blocked_authority" ||
    result.status === "fence_incomplete" ||
    result.status === "storage_unavailable"
  ) {
    throw new Error("Název scénáře nebylo možné bezpečně vymazat; ostatní data kalkulaček byla zpracována.");
  }
  const after = localStorage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY) != null ? 1 : 0;
  return before > after ? 1 : 0;
}

/** Level B: smaže data kalkulaček. SchoolProfile / Identity / AppContext / VZ nezapisuje ani nemaže. */
export function clearAllPhmaxLocalStorage(): number {
  if (typeof localStorage === "undefined") return 0;
  // Scenario label is handled by shadow-aware lifecycle (legacy + unbound [+ school]).
  const keysWithoutScenario = PHMAX_APP_LOCAL_STORAGE_KEYS.filter(
    (key) => key !== PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
  );
  let removed = removeListedKeys(keysWithoutScenario);
  removed += clearScenarioLabelShadowAwareCounted();
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
  let removed = removeListedKeys(PHMAX_SCHOOL_SCENARIO_EXPORT_WORKING_LS_KEYS);
  removed += clearScenarioLabelShadowAwareCounted();
  return removed;
}
