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
    "ŠD – PHmax v dashboardu a koherence; scénář JSON obsahuje coherenceWarnings.",
    "PV – § 1d v exportu; autosave audit PHmax. NV75 zůstává mimo cross-součet.",
    "SŠ / 0.4.0 – bez reálných dat školy; import IS čeká na schválený formát.",
  ],
};
