import { SCHOOL_PROFILE_LS_KEY } from "../school-profile/school-profile-constants";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../phmax-school-scenario-export";
import { PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY, PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY, PHMAX_SS_UNITS_STORAGE_KEY } from "../ss/phmax-ss-constants";
import { NAMED_SNAPSHOTS_LS_KEY } from "../zs-named-snapshots";
import { VYROCNI_ZPRAVA_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-storage";
import { VYROCNI_ZPRAVA_PERSONNEL_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-personnel-storage";
import { VYROCNI_ZPRAVA_SECTION01_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section01-data-logic";
import { VYROCNI_ZPRAVA_SECTION02_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section02-data-logic";
import { VYROCNI_ZPRAVA_SECTION04_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section04-data-logic";
import { VYROCNI_ZPRAVA_SECTION05_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section05-data-logic";
import { VYROCNI_ZPRAVA_SECTION06_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section06-data-logic";
import { VYROCNI_ZPRAVA_SECTION07_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section07-data-logic";
import { VYROCNI_ZPRAVA_SECTION08_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section08-data-logic";
import { VYROCNI_ZPRAVA_SECTION09_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section09-data-logic";
import { VYROCNI_ZPRAVA_SECTION10_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section10-data-logic";
import { VYROCNI_ZPRAVA_SECTION11_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section11-data-logic";
import { VYROCNI_ZPRAVA_SECTION12_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section12-data-logic";
import { VYROCNI_ZPRAVA_SECTION13_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section13-data-logic";
import { VYROCNI_ZPRAVA_SECTION14_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-section14-data-logic";
import {
  IDENTITY_REGISTRY_LS_KEY,
  IDENTITY_REGISTRY_SCHEMA_VERSION,
} from "../data/identity/identity-registry-types";
import { parseIdentityRegistry, readIdentityRegistry } from "../data/identity/identity-registry-storage";
import {
  logicalScenarioLabelDisplayOrNull,
  readScenarioLabelAwareLogicalForBusiness,
} from "../data/storage/scenario-label-migration/scenario-label-aware-runtime";
import type { BackupModuleAdapter, BackupModuleReadResult } from "./backup-types";
import {
  collectRecordValues,
  hasMeaningfulValue,
  readLocalStorageJson,
  readLocalStorageText,
  validateAnnualReportMainExport,
  validateNamedSnapshotsExport,
  validateScenarioLabelExport,
  validateSchoolProfileExport,
} from "./backup-validation";

const PV_AUTOSAVE_KEY = "edu-cz-pv-calculator-state";
const PV_NAMED_SNAPSHOTS_KEY = "edu-cz-pv-named-snapshots-v1";
const SD_AUTOSAVE_KEY = "edu-cz-sd-calculator-state";
const SD_NAMED_SNAPSHOTS_KEY = "edu-cz-sd-named-snapshots-v1";
const ZS_AUTOSAVE_KEY = "edu-cz-zs-calculator-state";
const NV75_AUTOSAVE_KEY = "edu-cz-nv75-deputy-bank-state";
const NV75_NAMED_SNAPSHOTS_KEY = "edu-cz-nv75-deputy-bank-named-snapshots";

const ANNUAL_REPORT_SECTION_KEYS = {
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

export const VYROCNI_ZPRAVA_DIAGNOSTIC_BACKUP_KEY_PREFIX = "vyrocni-zprava-diagnostic-backup-v1:";

function readJsonKey(key: string): BackupModuleReadResult {
  const result = readLocalStorageJson(key);
  if (!result.ok) {
    return { ok: false, hasData: false, error: result.error };
  }
  return { ok: true, hasData: hasMeaningfulValue(result.value), data: result.value };
}

function readTextKey(key: string): BackupModuleReadResult {
  const result = readLocalStorageText(key);
  if (!result.ok) {
    return { ok: false, hasData: false, error: result.error };
  }
  return { ok: true, hasData: hasMeaningfulValue(result.value), data: result.value };
}

function readCalculatorModule(params: {
  autosaveKey: string;
  namedSnapshotsKey: string;
  extra?: { key: string; read: () => BackupModuleReadResult };
}): BackupModuleReadResult {
  const autosave = readLocalStorageJson(params.autosaveKey);
  if (!autosave.ok) {
    return { ok: false, hasData: false, error: autosave.error };
  }
  const named = readLocalStorageJson(params.namedSnapshotsKey);
  if (!named.ok) {
    return { ok: false, hasData: false, error: named.error };
  }
  const data: Record<string, unknown> = {};
  if (hasMeaningfulValue(autosave.value)) data.autosave = autosave.value;
  if (hasMeaningfulValue(named.value)) data.namedSnapshots = named.value;
  if (params.extra) {
    const extra = params.extra.read();
    if (!extra.ok) return extra;
    if (extra.hasData) data.notes = extra.data;
  }
  const hasData = collectRecordValues(data).some((value) => hasMeaningfulValue(value));
  return { ok: true, hasData, data: hasData ? data : null };
}

function readAnnualReportModule(): BackupModuleReadResult {
  const main = readLocalStorageJson(VYROCNI_ZPRAVA_LS_KEY);
  if (!main.ok) return { ok: false, hasData: false, error: main.error };
  const personnel = readLocalStorageJson(VYROCNI_ZPRAVA_PERSONNEL_LS_KEY);
  if (!personnel.ok) return { ok: false, hasData: false, error: personnel.error };

  const sections: Record<string, unknown> = {};
  for (const [sectionId, key] of Object.entries(ANNUAL_REPORT_SECTION_KEYS)) {
    const section = readLocalStorageJson(key);
    if (!section.ok) return { ok: false, hasData: false, error: section.error };
    if (hasMeaningfulValue(section.value)) {
      sections[sectionId] = section.value;
    }
  }

  const data: Record<string, unknown> = {};
  if (hasMeaningfulValue(main.value)) data.main = main.value;
  if (hasMeaningfulValue(personnel.value)) data.personnel = personnel.value;
  if (Object.keys(sections).length > 0) data.sections = sections;

  const hasData = collectRecordValues(data).some((value) => hasMeaningfulValue(value));
  return { ok: true, hasData, data: hasData ? data : null };
}

function createSchoolProfileAdapter(): BackupModuleAdapter {
  return {
    id: "school-profile",
    label: "Profil školy",
    schemaVersion: 1,
    storageKeys: [SCHOOL_PROFILE_LS_KEY],
    read: () => readJsonKey(SCHOOL_PROFILE_LS_KEY),
    validateForExport: validateSchoolProfileExport,
  };
}

/**
 * Read-only Identity Registry adapter for central backup.
 * Missing → no module payload. Corrupted → module-level error (export continues).
 * Never bootstraps or writes identity storage.
 */
function readIdentityRegistryModule(): BackupModuleReadResult {
  const result = readIdentityRegistry();
  if (!result.ok) {
    if (result.code === "corrupted") {
      const code = result.detail === "invalid_json" ? "invalid_json" : "invalid_shape";
      return { ok: false, hasData: false, error: { ok: false, code } };
    }
    return { ok: false, hasData: false, error: { ok: false, code: "storage_unavailable" } };
  }
  if (!result.registry) {
    return { ok: true, hasData: false, data: null };
  }
  return { ok: true, hasData: true, data: result.registry };
}

function createIdentityRegistryAdapter(): BackupModuleAdapter {
  return {
    id: "identity-registry",
    label: "Identita školy a školních roků",
    schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
    storageKeys: [IDENTITY_REGISTRY_LS_KEY],
    read: readIdentityRegistryModule,
    validateForExport: (data) => {
      if (data == null) return { ok: true };
      return parseIdentityRegistry(data) ? { ok: true } : { ok: false, code: "invalid_shape" };
    },
  };
}

function createAnnualReportAdapter(): BackupModuleAdapter {
  const sectionKeys = Object.values(ANNUAL_REPORT_SECTION_KEYS);
  return {
    id: "annual-report",
    label: "Výroční zpráva",
    schemaVersion: 1,
    storageKeys: [VYROCNI_ZPRAVA_LS_KEY, VYROCNI_ZPRAVA_PERSONNEL_LS_KEY, ...sectionKeys],
    read: readAnnualReportModule,
    validateForExport: (data) => {
      if (data == null) return { ok: true };
      if (typeof data !== "object" || data === null) return { ok: false, code: "invalid_shape" };
      const record = data as Record<string, unknown>;
      if (record.main != null) {
        const mainValidation = validateAnnualReportMainExport(record.main);
        if (!mainValidation.ok) return mainValidation;
      }
      return { ok: true };
    },
  };
}

function createPhmaxPvAdapter(): BackupModuleAdapter {
  return {
    id: "phmax-pv",
    label: "Kalkulačka PHmax – předškolní vzdělávání",
    schemaVersion: 1,
    storageKeys: [PV_AUTOSAVE_KEY, PV_NAMED_SNAPSHOTS_KEY],
    read: () =>
      readCalculatorModule({
        autosaveKey: PV_AUTOSAVE_KEY,
        namedSnapshotsKey: PV_NAMED_SNAPSHOTS_KEY,
      }),
    validateForExport: (data) => {
      if (data == null) return { ok: true };
      if (typeof data !== "object" || data === null) return { ok: false, code: "invalid_shape" };
      const record = data as Record<string, unknown>;
      if (record.namedSnapshots != null) {
        return validateNamedSnapshotsExport(record.namedSnapshots);
      }
      return { ok: true };
    },
  };
}

function createPhmaxSdAdapter(): BackupModuleAdapter {
  return {
    id: "phmax-sd",
    label: "Kalkulačka PHmax – školní družina",
    schemaVersion: 1,
    storageKeys: [SD_AUTOSAVE_KEY, SD_NAMED_SNAPSHOTS_KEY],
    read: () =>
      readCalculatorModule({
        autosaveKey: SD_AUTOSAVE_KEY,
        namedSnapshotsKey: SD_NAMED_SNAPSHOTS_KEY,
      }),
    validateForExport: (data) => {
      if (data == null) return { ok: true };
      if (typeof data !== "object" || data === null) return { ok: false, code: "invalid_shape" };
      const record = data as Record<string, unknown>;
      if (record.namedSnapshots != null) {
        return validateNamedSnapshotsExport(record.namedSnapshots);
      }
      return { ok: true };
    },
  };
}

function createPhmaxZsAdapter(): BackupModuleAdapter {
  return {
    id: "phmax-zs",
    label: "Kalkulačka PHmax – základní škola",
    schemaVersion: 1,
    storageKeys: [ZS_AUTOSAVE_KEY, NAMED_SNAPSHOTS_LS_KEY],
    read: () =>
      readCalculatorModule({
        autosaveKey: ZS_AUTOSAVE_KEY,
        namedSnapshotsKey: NAMED_SNAPSHOTS_LS_KEY,
      }),
    validateForExport: (data) => {
      if (data == null) return { ok: true };
      if (typeof data !== "object" || data === null) return { ok: false, code: "invalid_shape" };
      const record = data as Record<string, unknown>;
      if (record.namedSnapshots != null) {
        return validateNamedSnapshotsExport(record.namedSnapshots);
      }
      return { ok: true };
    },
  };
}

function createPhmaxSsAdapter(): BackupModuleAdapter {
  return {
    id: "phmax-ss",
    label: "Kalkulačka PHmax – střední škola",
    schemaVersion: 1,
    storageKeys: [PHMAX_SS_UNITS_STORAGE_KEY, PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY, PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY],
    read: () =>
      readCalculatorModule({
        autosaveKey: PHMAX_SS_UNITS_STORAGE_KEY,
        namedSnapshotsKey: PHMAX_SS_NAMED_SNAPSHOTS_LS_KEY,
        extra: {
          key: PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY,
          read: () => readTextKey(PHMAX_SS_FRAMEWORK_PHASE1_NOTES_LS_KEY),
        },
      }),
    validateForExport: (data) => {
      if (data == null) return { ok: true };
      if (typeof data !== "object" || data === null) return { ok: false, code: "invalid_shape" };
      const record = data as Record<string, unknown>;
      if (record.namedSnapshots != null) {
        return validateNamedSnapshotsExport(record.namedSnapshots);
      }
      return { ok: true };
    },
  };
}

function createPhmaxNv75Adapter(): BackupModuleAdapter {
  return {
    id: "phmax-nv75",
    label: "Banka odpočtů zástupců ředitele (NV75)",
    schemaVersion: 1,
    storageKeys: [NV75_AUTOSAVE_KEY, NV75_NAMED_SNAPSHOTS_KEY],
    read: () =>
      readCalculatorModule({
        autosaveKey: NV75_AUTOSAVE_KEY,
        namedSnapshotsKey: NV75_NAMED_SNAPSHOTS_KEY,
      }),
    validateForExport: (data) => {
      if (data == null) return { ok: true };
      if (typeof data !== "object" || data === null) return { ok: false, code: "invalid_shape" };
      const record = data as Record<string, unknown>;
      if (record.namedSnapshots != null) {
        return validateNamedSnapshotsExport(record.namedSnapshots);
      }
      return { ok: true };
    },
  };
}

function createScenarioLabelAdapter(): BackupModuleAdapter {
  return {
    id: "phmax-scenario-label",
    label: "Název scénáře školy",
    schemaVersion: 1,
    storageKeys: [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY],
    read: () => {
      const authority = readScenarioLabelAwareLogicalForBusiness();
      const label = logicalScenarioLabelDisplayOrNull(authority);
      if (label != null) {
        return { ok: true, hasData: hasMeaningfulValue(label), data: label || null };
      }
      return {
        ok: false,
        hasData: false,
        error: {
          ok: false,
          code: authority.status === "unavailable" ? "storage_unavailable" : "authority_blocked",
        },
      };
    },
    validateForExport: validateScenarioLabelExport,
  };
}

export const BACKUP_MODULE_ADAPTERS: readonly BackupModuleAdapter[] = [
  createSchoolProfileAdapter(),
  createIdentityRegistryAdapter(),
  createAnnualReportAdapter(),
  createPhmaxPvAdapter(),
  createPhmaxSdAdapter(),
  createPhmaxZsAdapter(),
  createPhmaxSsAdapter(),
  createPhmaxNv75Adapter(),
  createScenarioLabelAdapter(),
];

export function getBackupModuleAdapter(id: string): BackupModuleAdapter | undefined {
  return BACKUP_MODULE_ADAPTERS.find((adapter) => adapter.id === id);
}

export function listRegisteredBackupStorageKeys(): readonly string[] {
  const keys = new Set<string>();
  for (const adapter of BACKUP_MODULE_ADAPTERS) {
    for (const key of adapter.storageKeys) {
      keys.add(key);
    }
  }
  return [...keys];
}

export function isDiagnosticBackupStorageKey(key: string): boolean {
  return key.startsWith(VYROCNI_ZPRAVA_DIAGNOSTIC_BACKUP_KEY_PREFIX);
}
