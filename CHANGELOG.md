# Changelog

## 0.2.5 (2026-05-28)

### UX a dashboard
- Dashboard deep-link na konkrétní **řádek PV** (`data-pv-row-id`) a **sekci ZŠ** (hint `sectionId`).
- SŠ deep-link z dashboardu rozšířen o E2E `dashboard-deep-link-smoke`.

### Kvalita a refaktor
- ZŠ: extrakce `createZsRowHandlers`, `zs-audit-actions` (audit JSON, srovnání, preview).
- ESLint limit varování snížen na **5**; `exceljs` zůstává lazy import v samostatném chunku.
- Unit testy: `phmax-pv-dashboard-focus`, `phmax-zs-dashboard-focus`.

## 0.2.4 (2026-05-26)

### UX a dashboard
- Desktop Obsah: perzistence stavu po reloadu (`phmax-toc-open`), E2E `desktop-toc-smoke`.
- Dashboard: klikatelné KPI dlaždice, řazení podle závažnosti (danger → warning → prázdné → ok).
- Sekce **Vyžaduje pozornost** a deep-link na chyby vstupů (PV, ŠD, ZŠ, NV75).
- Verdikty sjednocené v banneru, docku a sticky liště; tlačítko **Přejít k chybě** v průvodci.

### Kvalita a refaktor
- ESLint v CI na celém `src/` (s limitem varování, postupně snižován na 20).
- E2E smoke: PV, ŠD, ZŠ, NV75, SŠ; acceptance contract §16 scénář E (SŠ).
- ZŠ: refaktor panelů, dynamické řádky, reset formuláře, načítání ukázek z `zs-hero-example-load.ts`.
- ZŠ: extrakce `buildZsShareText` a `buildZsWarnings` mimo `PhmaxZsPage`.
- SŠ: ESLint cleanup hooků.
- Vite: samostatný chunk pro `exceljs`.
- Oprava hooků v `CompareVariantsPanel` (rules-of-hooks).
