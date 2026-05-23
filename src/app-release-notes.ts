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
    "Mobilní souhrn – dynamická výška podle obsahu, tlačítko Skrýt/Zobrazit souhrn a záložka Obsah nad panelem.",
    "Neúplné vstupy – jednotný banner nahoře s odkazem Přejít k chybě (PV, ŠD, ZŠ, SŠ, NV75); u ZŠ bez duplicitní sekce Kontrola vstupů.",
    "Dashboard – stavy Ještě nevyplněno / Vstupy v pořádku; průvodce doplněn o mobilní tip (souhrn dole + Obsah).",
  ],
};
