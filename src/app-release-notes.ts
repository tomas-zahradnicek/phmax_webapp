import { APP_VERSION } from "./app-version";

export type AppReleaseNote = {
  version: string;
  title: string;
  bullets: readonly string[];
};

/** Aktuální release notes zobrazené ve footeru a po updatu. */
export const PHMAX_CURRENT_RELEASE_NOTES: AppReleaseNote = {
  version: APP_VERSION,
  title: `Co je nového (${APP_VERSION})`,
  bullets: [
    "Dashboard: kontrolní list před exportem pro IT – appVersion, scénář, coherenceWarnings a odkazy na dokumentaci.",
    "ZŠ: autosave ukládá _phmaxAuditTotals v souladu s přepočtem PHmax (méně falešných varování na přehledu).",
    "Dokumentace: smoke checklist po 0.3.14; E2E desktop pokrývá role na dashboardu a popisky PHmax.",
  ],
};
