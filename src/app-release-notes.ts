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
    "Popisky metrik zobrazují PHmax správně (ne PHMAX) ve všech modulech – dock, hero i mobilní souhrn.",
    "Dashboard: porovnání pojmenovaných záloh ZŠ, krok exportu pro IT; ZŠ quick tour v základním režimu.",
    "Handout ředitele: sekce „Kde zadat co“ (MŠ v PV vs přípravná třída v ZŠ). Import IS stále 0.4.0.",
  ],
};
