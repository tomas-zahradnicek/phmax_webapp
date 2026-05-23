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
    "Mobilní souhrn – hlavní výsledek zůstává čitelný při posunu stránky; klepnutím přejdete k horní liště (krátké připnutí).",
    "Nápověda u polí – ikona „i“ a legislativní odkazy fungují klepnutím na mobilu i najetím na PC.",
    "Základní režim – přehlednější porovnání variant, dashboard s verdiktem u „Pokračovat“, upřesnění SŠ §16 u souhrnu.",
  ],
};
