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
    "Rychlá kalkulačka ZŠ nově spočítá PHA1Rmax. PHmax a PHA1Rmax jsou dva samostatné údaje a nesčítají se.",
    "Přenos do plné kalkulačky se před nahrazením uložených údajů zeptá. Neplatné PHA1Rmax se nepřenese a otevření bez přenosu nic nezapíše.",
    "Formulář ZŠ odděluje zadání od výsledku. Na úzké obrazovce se Obsah a souhrn nepřekrývají.",
  ],
};
