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
    "Dashboard – E2E POST handoff IS a oprava CI golden testů.",
    "PV §1d – E2E stav pending_ku; souhrnná tabulka v `PvWorkplacesSummarySection`.",
    "Refaktor PV bez změny metodiky – menší `PhmaxPvPage`.",
  ],
};
