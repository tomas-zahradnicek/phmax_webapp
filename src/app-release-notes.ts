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
    "SŠ – přepočet PHmax v koherenci dashboardu (bez reálného scénáře školy).",
    "E2E – POST handoff s potvrzením exportu; scénář obsahuje coherenceWarnings.",
    "0.4.0 import IS – stále čeká na schválený formát od zřizovatele.",
  ],
};
