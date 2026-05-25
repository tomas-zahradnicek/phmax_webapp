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
    "Acceptance checklist kompletní (E2E + contract pro PV, ZŠ, NV75, ŠD); refaktor ZŠ panelů (basic, PHA, PHP, §16, speciální, psych, zdrav.).",
    "Dashboard – klik na KPI dlaždici otevře modul (bez dat → Začít u ukázky); mobilní chip souhrnu vlevo, Obsah vpravo.",
    "Verdikty – stejný text v banneru, docku a sticky liště; na posledním kroku průvodce tlačítko Přejít k chybě.",
    "E2E smoke – Playwright pro PV, ŠD, ZŠ a NV75 v CI; ESLint rozšířen na dashboard a hlavní kalkulačky.",
  ],
};
