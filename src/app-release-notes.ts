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
    "Cross-PHmax – koherence audit vs. Σ, pojmenovaný scénář školy, volitelný POST handoff IS.",
    "Refaktor výsledkových sekcí PV, SŠ, ŠD; ZŠ TOC v `buildZsTocSections`.",
    "PV §1d – reference KÚ a stav pending_ku; E2E smoke §1d a IS export.",
  ],
};
