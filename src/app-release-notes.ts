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
    "PV § 1d – orientační poměrná redukce PHmax (volitelný strop KÚ, výjimka).",
    "Dashboard – export JSON handoff pro IS školy (`phmax-is-handoff-v1`).",
    "NV75 `Nv75ResultsSection`; ZŠ `useZsPageDerivedState`; stabilnější E2E na CI.",
  ],
};
