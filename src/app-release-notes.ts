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
    "Verdikty – stejný text v banneru, docku a sticky liště; na posledním kroku průvodce tlačítko Přejít k chybě.",
    "Dashboard – detail verdiktu v horním KPI stripu; mobilní chip souhrnu vlevo, Obsah vpravo.",
    "PV – u pracoviště metodický box k § 1d odst. 3 (bez automatického krácení); checklist přijetí v docs/acceptance-pv-zs-nv75.md.",
    "E2E smoke – Playwright pro PV, ŠD, ZŠ a NV75 v CI; ESLint (react-hooks) pro src a e2e.",
  ],
};
