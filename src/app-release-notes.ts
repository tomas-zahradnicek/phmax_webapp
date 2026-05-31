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
    "Dashboard – deep-link ze sekce Vyžaduje pozornost na konkrétní řádek nebo sekci u PV, ZŠ, SŠ, ŠD i NV75; E2E smoke pro všech pět modulů.",
    "ŠD – dashboard varuje u neúplných vstupů; po otevření modulu scroll na problematické oddělení v detailním režimu.",
    "ZŠ – export CSV/XLSX, audit JSON a srovnání pojmenovaných záloh extrahováno do `zs-page-handlers.ts`.",
    "CI – ESLint běží s limitem 0 varování na celém `src/` a E2E.",
  ],
};
