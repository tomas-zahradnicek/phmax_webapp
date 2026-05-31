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
    "ZŠ – hero a nápověda v `ZsHeroHeader` a `ZsQuickOnboardingGuide`; menší hlavní stránka.",
    "Dashboard Σ – PV/NV75 v průvodci, text k ukázkám v horní liště a nápovědě.",
    "E2E desktop modulový smoke (PV–NV75); unit testy scroll handlerů PV, ŠD a NV75.",
  ],
};
