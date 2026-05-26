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
    "Desktop Obsah: stav Skrýt/Zobrazit se po reloadu zachová (localStorage), E2E krytí je v desktop smoke testu.",
    "Dashboard – klik na KPI dlaždici otevře modul (bez dat → Začít u ukázky); mobilní chip souhrnu vlevo, Obsah vpravo.",
    "Verdikty – stejný text v banneru, docku a sticky liště; na posledním kroku průvodce tlačítko Přejít k chybě.",
    "E2E smoke – Playwright pro PV, ŠD, ZŠ, NV75 i SŠ v CI; doplněn §16 acceptance contract scénář E.",
    "ESLint – dočištěné hook deps warningy v hlavních kalkulačkách (PV/ŠD/NV75) a dashboardu.",
  ],
};
