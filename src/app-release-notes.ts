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
    "ZŠ – PHmax záložka, setup a celkový přehled extrahovány do `ZsPhmaxTabPanel`, `ZsSetupSection` a `ZsOverviewSection`.",
    "SŠ – scroll z dashboardu a banneru přes `createSsScrollToInputs` (parita s PV/ŠD/NV75).",
    "E2E – ok KPI deep-link pro ZŠ, SŠ a NV75; smoke scroll průvodce ZŠ (krok 2→3).",
  ],
};
