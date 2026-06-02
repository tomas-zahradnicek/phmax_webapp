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
    "Dashboard Σ: modul nevyplněn vs. PHmax = 0; proklik z varování koherence do modulu; připomínka vymazání dat po exportu JSON.",
    "ZŠ: 3krokový průvodce PHAmax a PHPmax v základním režimu (ZsHeroHeader); nápovědy modulů + globální hustota/fokus.",
    "0.4.0 import IS – stále čeká na schválený formát od zřizovatele (viz docs/export-field-mapping.md).",
  ],
};
