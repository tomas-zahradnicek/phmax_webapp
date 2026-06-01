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
    "PV – řádky pracovišť v `PvWorkplaceRowsSection`; menší hlavní stránka.",
    "Dashboard E2E – scénář celá škola JSON a varování koherence audit vs. Σ.",
    "Docs – SŠ checklist 0.3.x; 0.4.0 čeká na formát IS/zřizovatele.",
  ],
};
