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
    "Dashboard: scénáře ZŠ od 2 záloh, import s dalším krokem, checklist prázdného stavu a tisk školního profilu.",
    "Přepočet PHmax: jeden zdroj pravdy pro ZŠ, PV, ŠD a SŠ – méně falešných varování koherence na přehledu.",
    "Přístupnost: assertive toast po importu/exportu, návrat fokusu z draweru Akce, kontrast varování u polí.",
  ],
};
