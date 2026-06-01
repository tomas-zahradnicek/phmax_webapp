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
    "Dashboard Σ – export JSON součtu PHmax a scénář celá škola; varování u modulů ve Vyžaduje pozornost.",
    "ZŠ – sestavení exportu přes `buildZsExportBuildInput`.",
    "Roadmapa a stub PV § 1d odst. 3; dokumentace release procesu a mapování exportů.",
  ],
};
