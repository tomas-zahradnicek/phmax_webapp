import { APP_VERSION } from "./app-version";
import type { SchoolScenarioExportPayload } from "./phmax-school-scenario-export";

/** Verze schématu pro napojení na IS školy (Bakaláři, EduPage, …) – bez vendor-specifického API. */
export const PHMAX_IS_EXPORT_SCHEMA = "phmax-is-handoff-v1" as const;

export type PhmaxIsHandoffPayload = {
  schema: typeof PHMAX_IS_EXPORT_SCHEMA;
  appVersion: string;
  exportedAt: string;
  disclaimer: string;
  schoolScenario: SchoolScenarioExportPayload;
  /** Doporučené mapování polí – viz docs/phmax-is-integration.md */
  fieldMapVersion: "2026-05";
};

export function buildPhmaxIsHandoffPayload(schoolScenario: SchoolScenarioExportPayload): PhmaxIsHandoffPayload {
  return {
    schema: PHMAX_IS_EXPORT_SCHEMA,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    disclaimer:
      "Handoff JSON pro import do IS školy – vyžaduje transformační skript podle dokumentace zřizovatele. Neoficiální výstup.",
    schoolScenario,
    fieldMapVersion: "2026-05",
  };
}
