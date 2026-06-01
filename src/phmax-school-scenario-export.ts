import { APP_VERSION } from "./app-version";
import type { CrossPhmaxExportPayload } from "./phmax-dashboard-cross-phmax-export";
import { buildCrossPhmaxExportPayload } from "./phmax-dashboard-cross-phmax-export";
import type { CrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";

const LS_KEYS = {
  pv: "edu-cz-pv-calculator-state",
  sd: "edu-cz-sd-calculator-state",
  zs: "edu-cz-zs-calculator-state",
  ss: "phmax-ss-units-draft",
} as const;

export const PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY = "phmax-school-scenario-label";

export type SchoolScenarioExportPayload = Omit<CrossPhmaxExportPayload, "schema"> & {
  schema: "phmax-school-scenario-v1";
  moduleSnapshots: Partial<Record<"pv" | "sd" | "zs" | "ss", unknown>>;
  /** Pojmenování scénáře pro archiv / IS (volitelné). */
  scenarioLabel: string;
};

export function readSchoolScenarioLabel(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)?.trim() ?? "";
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
): SchoolScenarioExportPayload {
  const cross = buildCrossPhmaxExportPayload(summary, attentionModuleLabels);
  const moduleSnapshots: SchoolScenarioExportPayload["moduleSnapshots"] = {};
  for (const [id, key] of Object.entries(LS_KEYS) as [keyof typeof LS_KEYS, string][]) {
    const data = readLsJson(key);
    if (data != null) moduleSnapshots[id] = data;
  }
  const label = (scenarioLabel ?? readSchoolScenarioLabel()).trim() || "Celá škola (autosave)";
  return {
    ...cross,
    schema: "phmax-school-scenario-v1",
    appVersion: APP_VERSION,
    moduleSnapshots,
    scenarioLabel: label,
  };
}
