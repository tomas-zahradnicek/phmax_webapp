import { PHMAX_IS_EXPORT_SCHEMA, type PhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import {
  PHMAX_MODULE_AUTOSAVE_LS_KEYS,
  PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
} from "./phmax-school-scenario-export";
import { PV_BASIC_WIZARD_LS_KEY } from "./pv-basic-wizard";
import { SD_BASIC_WIZARD_LS_KEY } from "./sd-basic-wizard";
import { SS_BASIC_WIZARD_LS_KEY } from "./ss-basic-wizard";
import { ZS_BASIC_WIZARD_LS_KEY } from "./zs-basic-wizard";

export type PhmaxModuleId = keyof typeof PHMAX_MODULE_AUTOSAVE_LS_KEYS;

const MODULE_IDS: readonly PhmaxModuleId[] = ["pv", "sd", "zs", "ss", "nv75"];

const MODULE_WIZARD_LS_KEYS: Partial<Record<PhmaxModuleId, string>> = {
  pv: PV_BASIC_WIZARD_LS_KEY,
  sd: SD_BASIC_WIZARD_LS_KEY,
  zs: ZS_BASIC_WIZARD_LS_KEY,
  ss: SS_BASIC_WIZARD_LS_KEY,
};

/** Krok „Vstupy“ – uživatel neprojde znovu úvodním wizardem po importu. */
const WIZARD_READY_STEP = "2";

export type HandoffApplyOptions = {
  /** Nechat wizard kroky v localStorage beze změny. */
  skipWizardReset?: boolean;
};

export type HandoffApplyResult = {
  appliedModules: PhmaxModuleId[];
  scenarioLabel: string | null;
  warnings: string[];
};

export function assertPhmaxIsHandoffPayload(payload: unknown): asserts payload is PhmaxIsHandoffPayload {
  if (payload == null || typeof payload !== "object") {
    throw new Error("Handoff musí být JSON objekt.");
  }
  const p = payload as PhmaxIsHandoffPayload;
  if (p.schema !== PHMAX_IS_EXPORT_SCHEMA) {
    throw new Error(`Očekáván schema ${PHMAX_IS_EXPORT_SCHEMA}, dostáno: ${String(p.schema)}`);
  }
  if (p.schoolScenario?.schema !== "phmax-school-scenario-v1") {
    throw new Error("schoolScenario.schema musí být phmax-school-scenario-v1.");
  }
}

/** Seznam zápisů do localStorage (klíč + serializovaná hodnota). */
export function buildHandoffLocalStorageWrites(
  payload: PhmaxIsHandoffPayload,
  options: HandoffApplyOptions = {},
): { key: string; value: string }[] {
  assertPhmaxIsHandoffPayload(payload);
  const writes: { key: string; value: string }[] = [];
  const label = payload.schoolScenario.scenarioLabel?.trim();
  if (label) {
    writes.push({ key: PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, value: label });
  }
  for (const id of MODULE_IDS) {
    const snap = payload.schoolScenario.moduleSnapshots[id];
    if (snap == null) continue;
    writes.push({ key: PHMAX_MODULE_AUTOSAVE_LS_KEYS[id], value: JSON.stringify(snap) });
    const wizardKey = MODULE_WIZARD_LS_KEYS[id];
    if (!options.skipWizardReset && wizardKey) {
      writes.push({ key: wizardKey, value: WIZARD_READY_STEP });
    }
  }
  return writes;
}

export function applyPhmaxIsHandoffToStorage(
  storage: Pick<Storage, "setItem">,
  payload: PhmaxIsHandoffPayload,
  options: HandoffApplyOptions = {},
): HandoffApplyResult {
  assertPhmaxIsHandoffPayload(payload);
  const appliedModules: PhmaxModuleId[] = [];
  for (const id of MODULE_IDS) {
    if (payload.schoolScenario.moduleSnapshots[id] != null) appliedModules.push(id);
  }
  for (const { key, value } of buildHandoffLocalStorageWrites(payload, options)) {
    storage.setItem(key, value);
  }
  const label = payload.schoolScenario.scenarioLabel?.trim() || null;
  const warnings = [...(payload.schoolScenario.coherenceWarnings ?? [])];
  return { appliedModules, scenarioLabel: label, warnings };
}

export function applyPhmaxIsHandoffToLocalStorage(
  payload: PhmaxIsHandoffPayload,
  options: HandoffApplyOptions = {},
): HandoffApplyResult {
  if (typeof localStorage === "undefined") {
    throw new Error("localStorage není k dispozici (spusťte v prohlížeči na originu aplikace).");
  }
  return applyPhmaxIsHandoffToStorage(localStorage, payload, options);
}

export type HandoffConsoleSnippetOptions = HandoffApplyOptions & {
  /** Po zápisu zavolat location.reload() (výchozí true). */
  reload?: boolean;
};

/** Jednorázový skript pro DevTools konzoli na stejném originu jako PHmax. */
export function buildHandoffApplyConsoleSnippet(
  payload: PhmaxIsHandoffPayload,
  options: HandoffConsoleSnippetOptions = {},
): string {
  const { reload = true, ...applyOpts } = options;
  const writes = buildHandoffLocalStorageWrites(payload, applyOpts);
  const body = writes
    .map((w) => `localStorage.setItem(${JSON.stringify(w.key)},${JSON.stringify(w.value)});`)
    .join("");
  const tail = reload ? "location.reload();" : "";
  return [
    "/* PHmax: apply phmax-is-handoff-v1 → localStorage. Spusťte na stejném originu jako aplikace. */",
    `(function(){try{${body}console.log("PHmax handoff applied.",${JSON.stringify(
      writes.map((w) => w.key),
    )});${tail}}catch(e){console.error("PHmax handoff apply failed",e);}})();`,
  ].join("\n");
}
