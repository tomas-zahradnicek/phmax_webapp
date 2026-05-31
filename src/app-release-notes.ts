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
    "ZŠ – hero lišta, průvodce a PHA/PHP panely extrahovány do `ZsHeroToolbar`, `ZsWizardShell` a `ZsPhaPhpTabPanels`.",
    "Metodika – hero ukázka PHA B45 (`pha_zss_prep_b45`); golden testy B11–B13 a B45.",
    "E2E desktop pro dashboard deep-link; unit testy `createZsPageHandlers` a `createSsScrollToInputs`.",
  ],
};
