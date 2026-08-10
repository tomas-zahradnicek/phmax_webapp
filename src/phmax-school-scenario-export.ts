import { APP_VERSION } from "./app-version";
import {
  logicalScenarioLabelDisplayOrNull,
  readScenarioLabelAwareLogicalForBusiness,
} from "./data/storage/scenario-label-migration/scenario-label-aware-runtime";
import type { CrossPhmaxExportPayload } from "./phmax-dashboard-cross-phmax-export";
import { buildCrossPhmaxExportPayload } from "./phmax-dashboard-cross-phmax-export";
import type { CrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";

export const PHMAX_MODULE_AUTOSAVE_LS_KEYS = {
  pv: "edu-cz-pv-calculator-state",
  sd: "edu-cz-sd-calculator-state",
  zs: "edu-cz-zs-calculator-state",
  ss: "phmax-ss-units-draft",
  nv75: "edu-cz-nv75-deputy-bank-state",
} as const;

const LS_KEYS = PHMAX_MODULE_AUTOSAVE_LS_KEYS;

export const PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY = "phmax-school-scenario-label";

export type SchoolScenarioExportPayload = Omit<CrossPhmaxExportPayload, "schema"> & {
  schema: "phmax-school-scenario-v1";
  moduleSnapshots: Partial<Record<keyof typeof PHMAX_MODULE_AUTOSAVE_LS_KEYS, unknown>>;
  /** Pojmenování scénáře pro archiv / IS (volitelné). */
  scenarioLabel: string;
  /** Varování koherence audit / přepočet v době exportu. */
  coherenceWarnings: readonly string[];
  /** Meta z importní šablony (volitelné, jen po importu ze školy). */
  importBatchMeta?: {
    school_id: string;
    school_name: string;
    school_year: string;
  };
};

export function readSchoolScenarioLabel(): string {
  return readSchoolScenarioLabelLogicalOrNull() ?? "";
}

/**
 * Logical scenario label only when current storage authority is readable.
 * Callers that export business data must handle null rather than guessing.
 */
export function readSchoolScenarioLabelLogicalOrNull(): string | null {
  return logicalScenarioLabelDisplayOrNull(readScenarioLabelAwareLogicalForBusiness());
}

function readLsJson(key: string): unknown {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === "") return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Scénář „celá škola“ – cross-PHmax + surové autosave modulů (jen v prohlížeči). */
export function buildSchoolScenarioExportPayload(
  summary: CrossPhmaxSummary,
  attentionModuleLabels: readonly string[],
  scenarioLabel?: string,
  coherenceWarnings: readonly string[] = [],
): SchoolScenarioExportPayload {
  const cross = buildCrossPhmaxExportPayload(summary, attentionModuleLabels);
  const moduleSnapshots: SchoolScenarioExportPayload["moduleSnapshots"] = {};
  for (const [id, key] of Object.entries(LS_KEYS) as [keyof typeof LS_KEYS, string][]) {
    const data = readLsJson(key);
    if (data != null) moduleSnapshots[id] = data;
  }
  const storedLabel = scenarioLabel === undefined ? readSchoolScenarioLabelLogicalOrNull() : scenarioLabel;
  if (storedLabel == null) {
    throw new Error("Název scénáře nelze bezpečně ověřit; export scénáře nebyl vytvořen.");
  }
  const label = storedLabel.trim() || "Celá škola (autosave)";
  return {
    ...cross,
    schema: "phmax-school-scenario-v1",
    appVersion: APP_VERSION,
    moduleSnapshots,
    scenarioLabel: label,
    coherenceWarnings,
  };
}
