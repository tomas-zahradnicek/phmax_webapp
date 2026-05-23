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
    "Nápověda – stručné pokyny v horní liště a 3krokový průvodce v základním režimu u PV, ŠD, SŠ a NV75.",
    "Mobilní souhrn – při posunu stránky zobrazí plovoucí panel s výsledkem; klepnutím přejdete k docku (krátké připnutí).",
    "Tisk – vylepšené tiskové výstupy a patička dokumentu s autorským kreditem.",
  ],
};
