import type { CrossPhmaxModuleId } from "./phmax-dashboard-cross-phmax";
import type { ModuleInputsFocusHint } from "./phmax-focus-inputs-hint";

const COHERENCE_WARNING_MODULE_PREFIX: Record<string, CrossPhmaxModuleId> = {
  PV: "pv",
  "ZŠ": "zs",
  "ŠD": "sd",
  "SŠ": "ss",
};

/** Výchozí sekce formuláře pro opravu nesouladu audit vs. přepočet. */
const COHERENCE_FOCUS_SECTION: Record<CrossPhmaxModuleId, string> = {
  pv: "pv-vstupy",
  zs: "basic",
  sd: "sd-vstupy",
  ss: "ss-vstupy",
};

/** Modul z textu varování koherence (prefix před dvojtečkou). */
export function coherenceWarningModuleId(warning: string): CrossPhmaxModuleId | null {
  const prefix = warning.split(":")[0]?.trim();
  if (!prefix) return null;
  return COHERENCE_WARNING_MODULE_PREFIX[prefix] ?? null;
}

/** Modul a sekce formuláře pro proklik z varování koherence na Přehledu. */
export function coherenceWarningFocusHint(
  warning: string,
): (ModuleInputsFocusHint & { moduleId: CrossPhmaxModuleId }) | null {
  const moduleId = coherenceWarningModuleId(warning);
  if (!moduleId) return null;
  return { moduleId, sectionId: COHERENCE_FOCUS_SECTION[moduleId] };
}
