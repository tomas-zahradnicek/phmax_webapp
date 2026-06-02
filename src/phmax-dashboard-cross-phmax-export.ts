import { APP_VERSION } from "./app-version";
import type { CrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";

export type CrossPhmaxExportPayload = {
  schema: "phmax-cross-phmax-v1";
  appVersion: string;
  exportedAt: string;
  disclaimer: string;
  summary: CrossPhmaxSummary;
  attentionModuleLabels: readonly string[];
  coherenceWarnings?: readonly string[];
};

export function buildCrossPhmaxExportPayload(
  summary: CrossPhmaxSummary,
  attentionModuleLabels: readonly string[],
): CrossPhmaxExportPayload {
  return {
    schema: "phmax-cross-phmax-v1",
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    disclaimer:
      "Orientační souhrn z autosave v tomto prohlížeči. NV75 (banka odpočtů) a PV § 1d odst. 3 nejsou zahrnuty. Neoficiální výstup.",
    summary,
    attentionModuleLabels,
  };
}

/** Moduly ve Vyžaduje pozornost, které mají v cross-PHmax nenulovou hodnotu – upozornění na nesoulad. */
export function crossPhmaxAttentionMismatches(
  summary: CrossPhmaxSummary,
  attentionIds: ReadonlySet<string>,
): readonly string[] {
  return summary.slices
    .filter((s) => attentionIds.has(s.id) && s.phmax != null)
    .map((s) => s.label);
}
