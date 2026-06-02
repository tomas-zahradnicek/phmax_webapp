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
    "Dashboard – kontrolní list před exportem JSON; koherence ZŠ audit vs. přepočet vstupů.",
    "E2E – sdílený cross-PHmax seed, PV přidání pracoviště; handout PDF skript.",
    "SŠ scénář F – stále bez reálných dat školy (0.4.0 čeká na formát IS/zřizovatele).",
  ],
};
