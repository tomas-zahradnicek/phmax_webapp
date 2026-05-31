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
    "PV/ŠD – calculator shell a workflow dock; SŠ/NV75 hero parita s ostatními moduly.",
    "Dashboard Σ – orientační součet PHmax z autosave (PV + ŠD + ZŠ + SŠ).",
    "ZŠ průvodce – volby gymnázium a menšina; E2E wizard scroll SŠ a dashboard cross-PHmax.",
  ],
};
