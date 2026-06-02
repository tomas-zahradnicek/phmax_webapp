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
    "SŠ autosave ukládá audit PHmax (zpětně kompatibilní s legacy polem řádků).",
    "Handout pro ředitele aktualizován – koherence, export checklist, IS handoff.",
    "0.4.0 import IS – stále čeká na schválený formát od zřizovatele.",
  ],
};
