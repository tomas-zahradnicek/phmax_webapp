# Changelog

## 0.3.12 (2026-05-28)

### Dashboard a ZŠ
- Dashboard Σ: rozlišení „modul nevyplněn“ vs. „PHmax = 0“; proklik z varování koherence do modulu.
- Po stažení JSON z dashboardu volitelná připomínka vymazání lokálních dat.
- ZŠ: 3krokový průvodce PHAmax a PHPmax v základním režimu (`ProductBasicWizard`).

### Dokumentace a UX
- Nápovědy modulů: `CALCULATOR_GLOBAL_DISPLAY_HINT` (hustota/fokus napříč kalkulačkami).
- Expertní režim: upřesnění k volitelné ukázce v comboboxu.
- Handout a roadmap 0.3.12; IS docs beze změny API (0.4.0 stále blokováno).

## 0.3.11.1 (2026-05-28)

### Oprava CI
- Release notes – golden contract (`dashboard` v `app-release-notes.ts`).

## 0.3.11 (2026-05-28)

### Moduly a dashboard
- SŠ autosave: obal `{ rows, _phmaxAuditTotals }` (`ss-draft-storage`) – zpětně kompatibilní s legacy polem.
- Handout pro ředitele aktualizován na 0.3.11 (koherence, export checklist, IS handoff).

### Kvalita
- E2E: poslední inline seed → `applyCrossPhmaxSeed`; stažení cross-PHmax JSON assert `coherenceWarnings`.
- Unit testy: `ss-draft-storage`, `phmax-dashboard-export-checklist`.

## 0.3.10 (2026-05-28)

### Koherence a E2E
- SŠ: `computeSsPhmaxTotalFromSnapshot` v cross-PHmax varováních.
- E2E: POST handoff vyžaduje potvrzení exportu; scénář JSON assert `coherenceWarnings`; sdílený seed u všech cross-PHmax testů.

### Docs
- `phmax-is-integration.md` – pole `coherenceWarnings` pro integrátory.

## 0.3.9 (2026-05-28)

### Dashboard a moduly
- ŠD: PHmax na dashboardu Σ, přepočet ze snapshotu a koherence audit vs. vstupy.
- Scénář / cross-PHmax JSON: pole `coherenceWarnings`.
- PV/ŠD autosave: `_phmaxAuditTotals` při uložení; PV export CSV/XLSX – řádky § 1d odst. 3.

### Kvalita
- E2E: export bez potvrzení zakázán; sdílený seed u handoff; acceptance P2o/P7/Z6/S4.

## 0.3.8 (2026-05-28)

### Dashboard a koherence
- ZŠ: přepočet PHmax ze snapshotu (`computeZsPhmaxTotalFromSnapshot`) v `crossPhmaxAuditCoherenceWarnings`.
- Kontrolní list před exportem JSON (potvrzení orientačního charakteru).

### Kvalita
- E2E: sdílený seed `e2e/cross-phmax-seed.ts`, regrese PV „Přidat pracoviště“, varování ZŠ audit vs. přepočet.
- `npm run docs:handout-pdf` (Playwright print z HTML); contract test verze handoutu.

## 0.3.7 (2026-06-02)

### Refaktor PV
- `PvWorkplaceRowsSection` + `pv-workplace-shared` – vstupy a detaily pracovišť mimo `PhmaxPvPage`.

### Kvalita a docs
- E2E: stažení `phmax-school-scenario-v1`, varování koherence audit ZŠ vs. Σ.
- SŠ acceptance checklist 0.3.x; acceptance P5c/P2j/P2m; roadmapa 0.4.0 blokována na formát IS/zřizovatele.

## 0.3.6 (2026-06-01)

### Kvalita
- E2E: PV §1d `pending_ku`; dashboard POST handoff (mock endpoint).
- Golden contract: release notes odkazují na dashboard / E2E (CI build).

### Refaktor
- `PvWorkplacesSummarySection` – detailní souhrn pracovišť pod vstupy PV.

## 0.3.5 (2026-06-01)

### Cross-PHmax a IS
- Koherence auditních součtů autosave vs. dashboard Σ (`crossPhmaxAuditCoherenceWarnings`).
- Pojmenovaný scénář školy (`scenarioLabel`); volitelný POST handoff na IS (`phmax-is-handoff-client`).

### PV § 1d a refaktor
- Rozšíření §1d: reference KÚ, stav `pending_ku`.
- Výsledkové sekce: `PvResultsOverviewSection`, `SsResultsSection`, `SdResultsSection`; ZŠ TOC v `buildZsTocSections`.

### Kvalita
- E2E: PV §1d smoke, stažení IS handoff JSON z dashboardu.

## 0.3.4 (2026-05-31)

### PV § 1d a IS školy
- Orientační poměrná redukce PHmax (`computePv1d3Reduction`) s volitelným stropem KÚ a potvrzením výjimky.
- Export handoff JSON pro IS školy (`phmax-is-handoff-v1`); dokumentace `docs/phmax-is-integration.md`.

### Refaktor
- NV75: panel výsledků v `Nv75ResultsSection`.
- ZŠ: odvozený stav stránky v `useZsPageDerivedState`.

### Kvalita
- E2E mobilní smoke: stabilnější chip (bez `toBeFocused`), scroll před `toBeInViewport`; CI retries 2.

## 0.3.3 (2026-05-31)

### Dashboard a roadmapa
- Export JSON orientačního součtu PHmax a scénář **celá škola** (autosave modulů).
- Varování při modulu ve Vyžaduje pozornost současně v cross-PHmax.
- `docs/product-roadmap.md`, `docs/export-field-mapping.md`, `docs/release-process.md`.

### Refaktor ZŠ
- `buildZsExportBuildInput` v `zs-export-build.ts`.

### Větší scope (první krok)
- Stub `phmax-pv-1d3-reduction.ts` pro budoucí PV § 1d odst. 3.

### Kvalita
- E2E: cross-PHmax se ZŠ a tlačítka JSON exportu.
- Acceptance a SŠ checklist doplněny.

## 0.3.2 (2026-05-31)

### UX a refaktor
- PV/ŠD: `PvCalculatorShell`, `SdCalculatorShell` a workflow dock panely – menší hlavní stránky.
- SŠ a NV75: hero header, toolbar a quick onboarding – parita s ostatními moduly.

### Dashboard a roadmapa
- Orientační **součet PHmax** (PV + ŠD + ZŠ + SŠ) z autosave; `docs/product-roadmap.md`.

### Metodika
- ZŠ průvodce: volby **gymnázium** a **menšina** načtou hero ukázky.

### Kvalita
- E2E desktop: wizard scroll SŠ; dashboard smoke pro ok PV/SŠ a cross-PHmax.

## 0.3.1 (2026-05-31)

### UX a refaktor
- ZŠ: `ZsCalculatorShell`, `ZsWorkflowDockPanel` – shell a workflow dock mimo `PhmaxZsPage`.
- PV a ŠD: `PvHeroHeader` / `SdHeroHeader`, toolbar a `*QuickOnboardingGuide` – parita s ZŠ.

### Metodika
- Hero ukázky **gymnázium** a **menšina**; golden testy B17 (menšina) a B23 (gym8).

### Kvalita
- E2E desktop: wizard scroll ŠD/NV75; dashboard smoke – PV s validními daty není ve Vyžaduje pozornost.
- Contract testy sladěny s extrahovanými hero/shell komponentami.

## 0.3.0 (2026-05-31)

### UX a dashboard
- ZŠ: `ZsHeroHeader`, `ZsQuickOnboardingGuide` – další zmenšení `PhmaxZsPage`.
- Dashboard Σ: vysvětlení rozsahu, PV/NV75 v průvodci nového uživatele, sjednocený text k ukázkám a nápovědě.
- NV75: onboarding doplněn o legendu ikon a ukázku A.

### Kvalita
- E2E **desktop-chrome**: `desktop-module-smoke` pro PV/ŠD/ZŠ/SŠ/NV75; opravy KPI deep-link a ZŠ záloh na desktopu.
- Unit testy scroll handlerů PV, ŠD a NV75 (`create*ScrollToInputs`).

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
