# Changelog

## 0.2.9 (2026-05-31)

### UX a refaktor ZŠ
- `ZsHeroToolbar`, `ZsWizardShell`, `ZsPhaPhpTabPanels`, `ZsExpertOnboardingCard` – menší `PhmaxZsPage`.
- Hero ukázka **PHA B45** (`pha_zss_prep_b45`); golden testy B11–B13 a B45.

### Kvalita
- E2E **desktop-chrome** pro `dashboard-deep-link-smoke`.
- Unit testy: `createZsPageHandlers`, `createSsScrollToInputs`.

## 0.2.8 (2026-05-28)

### UX a dashboard
- E2E ok KPI deep-link pro **ZŠ**, **SŠ** a **NV75**; smoke scroll průvodce ZŠ (krok 2→3).

### Kvalita a refaktor
- ZŠ: `ZsPhmaxTabPanel`, `ZsSetupSection`, `ZsOverviewSection` a builder props – menší `PhmaxZsPage`.
- SŠ: `createSsScrollToInputs` – parita scrollu z dashboardu/banneru s ostatními moduly.

## 0.2.7 (2026-05-28)

### UX a dashboard
- Dashboard deep-link i pro moduly ve stavu **ok** (KPI dlaždice posunou na výchozí vstupy).
- Sjednocený hint API: `phmax-dashboard-focus.ts` → `getDashboardFocusHint`.

### Kvalita a refaktor
- ZŠ: `buildZsSummaryRows`, souhrn/rozpad PHmax a expert rozcestník v samostatných komponentách.
- PV, ŠD, NV75: extrakce scroll handlerů (`create*ScrollToInputs`), sdílený `useCalculatorSectionScroll`.
- E2E: ok modul z KPI, negativní deep-link, smoke pojmenovaných záloh ZŠ.

## 0.2.6 (2026-05-28)

### UX a dashboard
- Dashboard deep-link pro **ŠD** (sekce / detailní oddělení `data-sd-dept-id`) a **NV75** (`data-nv75-row-id`).
- Verdikt ŠD na dashboardu reflektuje neúplné vstupy (0 účastníků, prázdná oddělení).

### Kvalita a refaktor
- E2E `dashboard-deep-link-smoke` rozšířen na PV, ZŠ, SŠ, ŠD, NV75.
- ZŠ: `createZsPageHandlers` – export, audit a srovnání mimo `PhmaxZsPage`.
- ESLint limit varování snížen na **0**.

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
