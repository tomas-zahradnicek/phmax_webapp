import type { CrossPhmaxSummary } from "./phmax-dashboard-cross-phmax";

export type DashboardExportChecklistInput = {
  crossPhmax: CrossPhmaxSummary;
  attentionModuleLabels: readonly string[];
  auditCoherenceWarnings: readonly string[];
  exportDisclaimerConfirmed: boolean;
  appVersion?: string;
  scenarioLabel?: string;
};

/** Orientační kontrola před stažením JSON z dashboardu. */
export function buildDashboardExportChecklist(input: DashboardExportChecklistInput): readonly string[] {
  const items: string[] = [
    "Export je orientační – neoficiální výkaz pro zřizovatele ani IS.",
    "Součet PHmax nezahrnuje NV75 (banka odpočtů) ani krácení PV § 1d odst. 3.",
  ];
  if (input.crossPhmax.hasIncomplete) {
    items.push("Některé moduly mají neúplný výpočet – součet může být podhodnocený.");
  }
  if (input.attentionModuleLabels.length > 0) {
    items.push(`Modul(y) ve Vyžaduje pozornost: ${input.attentionModuleLabels.join(", ")}.`);
  }
  for (const w of input.auditCoherenceWarnings) {
    items.push(w);
  }
  if (input.auditCoherenceWarnings.length === 0) {
    items.push("Pole coherenceWarnings ve scénáři je prázdné – audit autosave sedí s přepočtem modulů.");
  }
  if (input.appVersion?.trim()) {
    items.push(`Do JSON uveďte appVersion: ${input.appVersion.trim()} (stejná verze jako v patičce aplikace).`);
  }
  if (input.scenarioLabel?.trim()) {
    items.push(`Název scénáře školy: „${input.scenarioLabel.trim()}“ (pole scenarioLabel ve scénáři / handoff).`);
  }
  items.push("IT: dokumentace integrace v docs/phmax-is-integration.md a mapování polí v docs/export-field-mapping.md.");
  if (!input.exportDisclaimerConfirmed) {
    items.push("Potvrďte orientační charakter exportu (zaškrtávací pole níže).");
  }
  return items;
}
