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
    "ZŠ – shell a workflow dock v `ZsCalculatorShell` / `ZsWorkflowDockPanel`; menší hlavní stránka.",
    "PV a ŠD – hero header, toolbar a quick onboarding jako u ZŠ.",
    "Metodika – hero ukázky gymnázium a menšina; E2E wizard scroll ŠD/NV75 a dashboard PV ok smoke.",
  ],
};
