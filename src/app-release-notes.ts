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
    "Dashboard – deep-link i z KPI dlaždic u modulů ve stavu ok (scroll na výchozí vstupy); sjednocené hinty přes `getDashboardFocusHint`.",
    "ZŠ – exportní souhrnné řádky, karty PHmax a expert rozcestník extrahovány do samostatných modulů pod `src/zs/`.",
    "PV, ŠD, NV75 – scroll na vstupy z dashboardu přes `create*ScrollToInputs`; ZŠ scroll sdílí `useCalculatorSectionScroll`.",
    "E2E – ok modul z KPI, negativní scénář bez Vyžaduje pozornost a smoke pojmenovaných záloh ZŠ.",
  ],
};
