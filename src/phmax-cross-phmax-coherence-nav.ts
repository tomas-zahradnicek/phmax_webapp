import type { CrossPhmaxModuleId } from "./phmax-dashboard-cross-phmax";

const COHERENCE_WARNING_MODULE_PREFIX: Record<string, CrossPhmaxModuleId> = {
  PV: "pv",
  "ZŠ": "zs",
  "ŠD": "sd",
  "SŠ": "ss",
};

/** Modul z textu varování koherence (prefix před dvojtečkou). */
export function coherenceWarningModuleId(warning: string): CrossPhmaxModuleId | null {
  const prefix = warning.split(":")[0]?.trim();
  if (!prefix) return null;
  return COHERENCE_WARNING_MODULE_PREFIX[prefix] ?? null;
}
