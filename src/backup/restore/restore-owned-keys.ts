import { SCHOOL_PROFILE_LS_KEY } from "../../school-profile/school-profile-constants";
import { IDENTITY_REGISTRY_LS_KEY } from "../../data/identity/identity-registry-types";
import { APP_CONTEXT_LS_KEY } from "../../data/app-context/app-context";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../phmax-school-scenario-export";
import {
  PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY,
  PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY,
  PHMAX_SS_UNITS_STORAGE_KEY,
} from "../../ss/phmax-ss-constants";
import { NAMED_SNAPSHOTS_LS_KEY } from "../../zs-named-snapshots";
import { VYROCNI_ZPRAVA_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-storage";
import { VYROCNI_ZPRAVA_PERSONNEL_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-personnel-storage";
import { VYROCNI_ZPRAVA_SECTION01_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section01-data-logic";
import { VYROCNI_ZPRAVA_SECTION02_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section02-data-logic";
import { VYROCNI_ZPRAVA_SECTION04_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section04-data-logic";
import { VYROCNI_ZPRAVA_SECTION05_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section05-data-logic";
import { VYROCNI_ZPRAVA_SECTION06_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section06-data-logic";
import { VYROCNI_ZPRAVA_SECTION07_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section07-data-logic";
import { VYROCNI_ZPRAVA_SECTION08_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section08-data-logic";
import { VYROCNI_ZPRAVA_SECTION09_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section09-data-logic";
import { VYROCNI_ZPRAVA_SECTION10_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section10-data-logic";
import { VYROCNI_ZPRAVA_SECTION11_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section11-data-logic";
import { VYROCNI_ZPRAVA_SECTION12_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section12-data-logic";
import { VYROCNI_ZPRAVA_SECTION13_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section13-data-logic";
import { VYROCNI_ZPRAVA_SECTION14_LS_KEY } from "../../vyrocni-zprava/vyrocni-zprava-section14-data-logic";
import type { RestoreKnownModuleId } from "./restore-types";

export const RESTORE_APP_CONTEXT_KEY = APP_CONTEXT_LS_KEY;
export const RESTORE_IDENTITY_KEY = IDENTITY_REGISTRY_LS_KEY;

export const ANNUAL_REPORT_SECTION_KEYS = {
  "01": VYROCNI_ZPRAVA_SECTION01_LS_KEY,
  "02": VYROCNI_ZPRAVA_SECTION02_LS_KEY,
  "04": VYROCNI_ZPRAVA_SECTION04_LS_KEY,
  "05": VYROCNI_ZPRAVA_SECTION05_LS_KEY,
  "06": VYROCNI_ZPRAVA_SECTION06_LS_KEY,
  "07": VYROCNI_ZPRAVA_SECTION07_LS_KEY,
  "08": VYROCNI_ZPRAVA_SECTION08_LS_KEY,
  "09": VYROCNI_ZPRAVA_SECTION09_LS_KEY,
  "10": VYROCNI_ZPRAVA_SECTION10_LS_KEY,
  "11": VYROCNI_ZPRAVA_SECTION11_LS_KEY,
  "12": VYROCNI_ZPRAVA_SECTION12_LS_KEY,
  "13": VYROCNI_ZPRAVA_SECTION13_LS_KEY,
  "14": VYROCNI_ZPRAVA_SECTION14_LS_KEY,
} as const;

const PV_AUTOSAVE_KEY = "edu-cz-pv-calculator-state";
const PV_NAMED_SNAPSHOTS_KEY = "edu-cz-pv-named-snapshots-v1";
const SD_AUTOSAVE_KEY = "edu-cz-sd-calculator-state";
const SD_NAMED_SNAPSHOTS_KEY = "edu-cz-sd-named-snapshots-v1";
const ZS_AUTOSAVE_KEY = "edu-cz-zs-calculator-state";
const NV75_AUTOSAVE_KEY = "edu-cz-nv75-deputy-bank-state";
const NV75_NAMED_SNAPSHOTS_KEY = "edu-cz-nv75-deputy-bank-named-snapshots";

export function ownedKeysForModule(moduleId: RestoreKnownModuleId): readonly string[] {
  switch (moduleId) {
    case "school-profile":
      return [SCHOOL_PROFILE_LS_KEY];
    case "identity-registry":
      return [IDENTITY_REGISTRY_LS_KEY];
    case "annual-report":
      return [VYROCNI_ZPRAVA_LS_KEY, VYROCNI_ZPRAVA_PERSONNEL_LS_KEY, ...Object.values(ANNUAL_REPORT_SECTION_KEYS)];
    case "phmax-pv":
      return [PV_AUTOSAVE_KEY, PV_NAMED_SNAPSHOTS_KEY];
    case "phmax-sd":
      return [SD_AUTOSAVE_KEY, SD_NAMED_SNAPSHOTS_KEY];
    case "phmax-zs":
      return [ZS_AUTOSAVE_KEY, NAMED_SNAPSHOTS_LS_KEY];
    case "phmax-ss":
      return [
        PHMAX_SS_UNITS_STORAGE_KEY,
        PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY,
        PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY,
      ];
    case "phmax-nv75":
      return [NV75_AUTOSAVE_KEY, NV75_NAMED_SNAPSHOTS_KEY];
    case "phmax-scenario-label":
      return [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY];
    default: {
      const _exhaustive: never = moduleId;
      return _exhaustive;
    }
  }
}

export {
  SCHOOL_PROFILE_LS_KEY,
  VYROCNI_ZPRAVA_LS_KEY,
  VYROCNI_ZPRAVA_PERSONNEL_LS_KEY,
  PV_AUTOSAVE_KEY,
  PV_NAMED_SNAPSHOTS_KEY,
  SD_AUTOSAVE_KEY,
  SD_NAMED_SNAPSHOTS_KEY,
  ZS_AUTOSAVE_KEY,
  NAMED_SNAPSHOTS_LS_KEY,
  NV75_AUTOSAVE_KEY,
  NV75_NAMED_SNAPSHOTS_KEY,
  PHMAX_SS_UNITS_STORAGE_KEY,
  PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY,
  PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY,
  PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
};
