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
    "Všechny moduly: řádek „co teď“ s CTA (export / přejít k chybě); quick tour při prvním spuštění (PV, ŠD, SŠ, NV75).",
    "Dashboard: vstup podle role (ředitel / metodik / IT), export mini-wizard, tisk kontroly před jednáním, badge stavu modulů.",
    "ZŠ: mapa PHmax → PHAmax → PHPmax v docku; expertní režim – jednorázová nápověda k ukázkám. Import IS stále 0.4.0.",
  ],
};
