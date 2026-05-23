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
    "Mobilní souhrn – hlavní číslo dole na obrazovce, kompaktní pruh při posunu (PV, ZŠ a další moduly).",
    "Výběr ukázky – kompaktní panel na mobilu u ZŠ a NV75; stejný režim jako u PV, ŠD a SŠ.",
    "Dashboard a export – sjednocené verdikty „Pokračovat“, legenda porovnání variant A/B a metadata exportu.",
  ],
};
