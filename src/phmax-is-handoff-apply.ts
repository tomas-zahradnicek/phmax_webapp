import { PHMAX_IS_EXPORT_SCHEMA, type PhmaxIsHandoffPayload } from "./phmax-is-export-adapter";
import {
  PHMAX_MODULE_AUTOSAVE_LS_KEYS,
  PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
} from "./phmax-school-scenario-export";
import { PV_BASIC_WIZARD_LS_KEY } from "./pv-basic-wizard";
import { SD_BASIC_WIZARD_LS_KEY } from "./sd-basic-wizard";
import { SS_BASIC_WIZARD_LS_KEY } from "./ss-basic-wizard";
import { ZS_BASIC_WIZARD_LS_KEY } from "./zs-basic-wizard";
import {
  writeScenarioLabelFromUiInput,
  type ScenarioLabelStorage,
} from "./data/storage/scenario-label-migration/scenario-label-repository";
import { readIdentityRegistryFromStorage } from "./data/identity/identity-registry-storage";
import { IDENTITY_REGISTRY_LS_KEY } from "./data/identity/identity-registry-types";
import {
  SCENARIO_LABEL_MIGRATION_MODULE_ID,
  SCENARIO_LABEL_MIGRATION_RESOURCE_ID,
} from "./data/storage/scenario-label-migration/scenario-label-migration-types";
import { SCENARIO_LABEL_MIGRATION_MARKER_SEGMENT } from "./data/storage/scenario-label-migration/scenario-label-migration-marker-key";
import { NAMESPACED_STORAGE_V2_ROOT_PREFIX } from "./data/storage/namespaced-storage-schema";
import {
  SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION,
  SCENARIO_LABEL_N3_FENCE_RESOURCE,
  SCENARIO_LABEL_N3_FENCE_SCHEMA_VERSION,
  SCENARIO_LABEL_N3_FENCE_SEGMENT,
} from "./data/storage/scenario-label-migration/scenario-label-n3-fence-types";

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

/**
 * Seznam zápisů do localStorage (klíč + serializovaná hodnota).
 *
 * Scenario label is intentionally excluded: missing/empty incoming label must be a
 * no-op (not clear), and non-empty labels use the N2 dual-write repository.
 */
export function buildHandoffLocalStorageWrites(
  payload: PhmaxIsHandoffPayload,
  options: HandoffApplyOptions = {},
): { key: string; value: string }[] {
  assertPhmaxIsHandoffPayload(payload);
  const writes: { key: string; value: string }[] = [];
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

function incomingScenarioLabel(payload: PhmaxIsHandoffPayload): string | null {
  const label = payload.schoolScenario.scenarioLabel?.trim();
  return label || null;
}

/**
 * Build DevTools JS that applies a scenario label using LIVE destination Identity.
 *
 * Does NOT embed generation-time schoolId. Target is resolved when the snippet runs.
 * Missing Identity → unbound; corrupted/unavailable → legacy only (shadow skipped).
 * School target: legacy → v2 → verify → v1 marker → FENCE LAST (protocolGeneration 3).
 * Unbound: no fence certificate.
 */
export function buildScenarioLabelLiveApplySnippetFragment(label: string): string {
  // Keep key grammar aligned with N1/N2/N3 serializers; resolve schoolId only at apply time.
  const legacyKey = JSON.stringify(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
  const identityKey = JSON.stringify(IDENTITY_REGISTRY_LS_KEY);
  const labelLit = JSON.stringify(label);
  const v2Root = JSON.stringify(NAMESPACED_STORAGE_V2_ROOT_PREFIX);
  const moduleId = JSON.stringify(SCENARIO_LABEL_MIGRATION_MODULE_ID);
  const resourceId = JSON.stringify(SCENARIO_LABEL_MIGRATION_RESOURCE_ID);
  const markerSeg = JSON.stringify(SCENARIO_LABEL_MIGRATION_MARKER_SEGMENT);
  const fenceSeg = JSON.stringify(SCENARIO_LABEL_N3_FENCE_SEGMENT);
  const fenceResource = JSON.stringify(SCENARIO_LABEL_N3_FENCE_RESOURCE);
  const fenceSchema = String(SCENARIO_LABEL_N3_FENCE_SCHEMA_VERSION);
  const fenceGen = String(SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION);
  return [
    `(function(label){`,
    `localStorage.setItem(${legacyKey},label);`,
    `try{`,
    `var idRaw=localStorage.getItem(${identityKey});`,
    `var v2Root=${v2Root};`,
    `var mod=${moduleId};`,
    `var res=${resourceId};`,
    `var mseg=${markerSeg};`,
    `var fseg=${fenceSeg};`,
    `var fres=${fenceResource};`,
    `var v2Key=null;`,
    `var markerKey=null;`,
    `var fenceKey=null;`,
    `var schoolSid=null;`,
    `if(idRaw==null||!String(idRaw).trim()){`,
    `v2Key=v2Root+"unbound:module:"+mod+":resource:"+res;`,
    `markerKey=v2Root+mseg+":"+mod+":"+res+":unbound";`,
    `}else{`,
    `var reg=JSON.parse(idRaw);`,
    `var sid=reg&&reg.schoolId;`,
    `var uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;`,
    `if(typeof sid==="string"&&uuid.test(sid)&&sid===sid.toLowerCase()&&reg.schemaVersion===1){`,
    `schoolSid=sid;`,
    `v2Key=v2Root+"school:"+sid+":module:"+mod+":resource:"+res;`,
    `markerKey=v2Root+mseg+":"+mod+":"+res+":school:"+sid;`,
    `fenceKey=v2Root+fseg+":"+mod+":"+res+":school:"+sid;`,
    `}`,
    `}`,
    `if(v2Key&&markerKey){`,
    `localStorage.setItem(v2Key,label);`,
    `if(localStorage.getItem(v2Key)===label){`,
    `localStorage.setItem(markerKey,JSON.stringify({schemaVersion:1,authority:"legacy",mirrorHealth:"synced",authoritativePresence:"present"}));`,
    `if(fenceKey&&schoolSid){`,
    `try{`,
    `var fencePayload={schemaVersion:${fenceSchema},protocolGeneration:${fenceGen},authority:"legacy",markerSchemaVersion:1,schoolId:schoolSid,resource:fres,committedRaw:{exists:true,value:label}};`,
    `localStorage.setItem(fenceKey,JSON.stringify(fencePayload));`,
    `var rb=localStorage.getItem(fenceKey);`,
    `if(!rb||JSON.parse(rb).protocolGeneration!==${fenceGen}){/* soft fence verify fail — legacy already written */}`,
    `}catch(_fe){/* soft fence failure */}`,
    `}`,
    `}`,
    `}`,
    `}catch(_e){}`,
    `})(${labelLit});`,
  ].join("");
}

export function applyPhmaxIsHandoffToStorage(
  storage: ScenarioLabelStorage,
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

  const label = incomingScenarioLabel(payload);
  if (label) {
    // Canonical single pipeline — Identity from the same destination storage.
    // Missing → unbound; corrupted/unavailable → skipped (never catch→unbound).
    const result = writeScenarioLabelFromUiInput(label, {
      storage,
      readIdentity: () => readIdentityRegistryFromStorage(storage),
    });
    if (result.status === "authoritative_failed") {
      throw new Error(
        result.code === "storage_unavailable"
          ? "localStorage není k dispozici (spusťte v prohlížeči na originu aplikace)."
          : "Uložení názvu scénáře se nezdařilo.",
      );
    }
  }

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
  const writes = [...buildHandoffLocalStorageWrites(payload, applyOpts)];
  const moduleBody = writes
    .map((w) => `localStorage.setItem(${JSON.stringify(w.key)},${JSON.stringify(w.value)});`)
    .join("");
  const label = incomingScenarioLabel(payload);
  const scenarioBody = label ? buildScenarioLabelLiveApplySnippetFragment(label) : "";
  const appliedKeys = [
    ...writes.map((w) => w.key),
    ...(label ? [PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "(v2+marker resolved at apply)"] : []),
  ];
  const tail = reload ? "location.reload();" : "";
  return [
    "/* PHmax: apply phmax-is-handoff-v1 → localStorage. Spusťte na stejném originu jako aplikace.",
    "   Scenario v2/marker target is resolved LIVE from destination Identity (not generation-time). */",
    `(function(){try{${moduleBody}${scenarioBody}console.log("PHmax handoff applied.",${JSON.stringify(
      appliedKeys,
    )});${tail}}catch(e){console.error("PHmax handoff apply failed",e);}})();`,
  ].join("\n");
}
