# PHmax webapp

Jedna React aplikace (Vite) s několika kalkulačkami maximálního rozsahu přímé pedagogické činnosti a souvisejících výpočtů. Přepínání modulů: parametr URL `?view=` nebo přehled na úvodní obrazovce.

| `view` | Modul |
|--------|--------|
| `dash` | Přehled a rychlý start |
| `zs` | Základní školy (PHmax / PHAmax, § 16/9, …) |
| `pv` | Přípravná třída |
| `sd` | Školní družina |
| `ss` | Střední školy (orientační PHmax, PrŠ PHAmax) |
| `nv75` | NV 75 – zástupce (banka odpočtů) |

## Verze 0.3.16 (UX)

- **Přehled:** scénáře ZŠ, import follow-up, checklist nového uživatele, tisk profilu; a11y toast/drawer/kontrast.
- **Parity:** ZŠ/PV/ŠD/SŠ přepočet PHmax shodný s autosave audit; smoke checklist `docs/smoke-checklist-post-0.3.16.md`.

## Verze 0.3.15 (UX)

- **Po 0.3.14:** IT checklist exportu na dashboardu; kontrakt ZŠ přepočet vs audit.
- **Import / tisk / nápovědy pásem:** blob tisk, šablona ŠD „Počet účastníků“, orientační hinty PHmax/PHAmax/PHPmax/PV/NV75; po deployi `docs/post-deploy-checklist.md`.
- **Kvalita:** golden + kontrakty audit/E2E; `phmax-import-roundtrip.test.ts`.

## Verze 0.3.14 (UX)

- **Po 0.3.13:** popisky PHmax bez uppercase; dashboard hint záloh ZŠ, IT krok exportu; ZŠ quick tour; handout „Kde zadat co“.
- **Kvalita:** golden 176; E2E desktop `dashboard-ux-013`, `metric-label-casing`.

## Verze 0.3.13 (UX)

- **Vlna A–C:** akční řádek „co teď“, role na dashboardu, export mini-wizard, tisk kontroly, ZŠ mapa záložek, quick tour, import placeholder 0.4.0.
- **Kvalita:** golden + E2E green; contract `phmax-ux-wave-abc-contract`.

## Verze 0.3.7 (UX)

- **Refaktor PV:** `PvWorkplaceRowsSection`, sdílené typy v `pv-workplace-shared`.
- **E2E dashboard:** scénář školy JSON, varování koherence audit vs. Σ.
- **Docs:** SŠ checklist 0.3.x; roadmapa – 0.4.0 blokována na formát IS/zřizovatele.

## Verze 0.3.6 (UX)

- **E2E:** PV §1d `pending_ku`, dashboard POST handoff IS; oprava CI golden.
- **Refaktor PV:** `PvWorkplacesSummarySection` (souhrn pracovišť pod vstupy).

## Verze 0.3.5 (UX)

- **Cross-PHmax:** koherence audit vs. Σ; pojmenovaný scénář školy; volitelný POST na IS.
- **Refaktor:** `PvResultsOverviewSection`, `SsResultsSection`, `SdResultsSection`, `buildZsTocSections`.
- **PV §1d:** reference KÚ, stav `pending_ku`; E2E smoke §1d a IS handoff.

## Verze 0.3.4 (UX)

- **PV § 1d:** orientační poměrná redukce PHmax; metodický box u řádku.
- **IS školy:** JSON handoff z dashboardu; `docs/phmax-is-integration.md`.
- **Refaktor:** `Nv75ResultsSection`, `useZsPageDerivedState`; E2E CI stabilita.

## Verze 0.3.3 (UX)

- **Dashboard Σ:** JSON export cross-PHmax a scénář celá škola; varování u pozornosti.
- **ZŠ:** `buildZsExportBuildInput`; roadmapa a PV § 1d stub.

## Verze 0.3.2 (UX)

- **PV/ŠD:** calculator shell a workflow dock panely.
- **SŠ/NV75:** hero header, toolbar a quick onboarding.
- **Dashboard Σ:** orientační součet PHmax; roadmapa v `docs/product-roadmap.md`.

## Verze 0.3.1 (UX)

- **ZŠ:** `ZsCalculatorShell`, `ZsWorkflowDockPanel` – shell a dock mimo hlavní stránku.
- **PV/ŠD:** hero header, toolbar a quick onboarding – parita se ZŠ.
- **Metodika:** hero ukázky gymnázium a menšina; E2E wizard scroll ŠD/NV75.

## Verze 0.3.0 (UX)

- **ZŠ:** `ZsHeroHeader`, `ZsQuickOnboardingGuide` – další refaktor hlavní stránky.
- **Dashboard Σ:** PV/NV75 v průvodci, vysvětlení rozsahu a ukázek v horní liště.
- **E2E desktop** modulový smoke pro všechny kalkulačky; unit testy scroll handlerů PV/ŠD/NV75.

## Verze 0.2.9 (UX)

- **ZŠ:** hero lišta, průvodce a PHA/PHP panely v `ZsHeroToolbar`, `ZsWizardShell`, `ZsPhaPhpTabPanels`.
- **Metodika:** ukázka PHA B45; testy B11–B13 (zdravotnické zařízení).
- **E2E desktop** pro dashboard deep-link; unit testy handlerů a SŠ scrollu.

## Verze 0.2.8 (UX)

- **ZŠ:** PHmax záložka, setup a celkový přehled v `ZsPhmaxTabPanel`, `ZsSetupSection`, `ZsOverviewSection`.
- **SŠ:** `createSsScrollToInputs` – scroll z dashboardu na řádek nebo sekci evidence.
- **E2E:** ok KPI ZŠ/SŠ/NV75, wizard scroll krok 2→3.

## Verze 0.2.7 (UX)

- **Dashboard:** deep-link i z KPI dlaždic (modul ve stavu ok → scroll na výchozí vstupy); sjednocené hinty přes `phmax-dashboard-focus.ts`.
- **ZŠ:** `buildZsSummaryRows`, souhrn/rozpad PHmax a expert rozcestník v samostatných komponentách.
- **Parita modulů:** `create*ScrollToInputs` u PV/ŠD/NV75, sdílený `useCalculatorSectionScroll`.

## Verze 0.2.6 (UX)

- **Dashboard:** deep-link ŠD (oddělení) a NV75 (řádek); E2E pokrývá PV, ZŠ, SŠ, ŠD, NV75.
- **ZŠ:** export/audit handlery v `zs-page-handlers.ts`.
- **CI:** ESLint limit **0** varování.

## Verze 0.2.5 (UX)

- **Dashboard:** deep-link na konkrétní řádek PV a sekci ZŠ (kromě SŠ); E2E `dashboard-deep-link-smoke`.
- **ZŠ:** refaktor audit/srovnání do `zs-audit-actions.ts`, dynamické řádky přes `createZsRowHandlers`.
- **CI:** ESLint limit varování **5**; lazy `exceljs` v samostatném Vite chunku.

## Verze 0.2.4 (UX)

- **Mobil:** dynamická výška plovoucího souhrnu; tlačítko Skrýt/Zobrazit souhrn; záložka Obsah sedí podle skutečné výšky panelu.
- **Desktop:** panel Obsah lze skrýt tlačítkem Skrýt a znovu otevřít záložkou Obsah; stav se drží i po reloadu (`localStorage`, E2E `desktop-toc-smoke`).
- **ZŠ:** refaktor PHmax panelů (basic, PHA, PHP, §16, speciální, psych, zdrav., menšina, gym, smíšené, extras).
- **Dashboard:** klikatelné KPI dlaždice (řazení dle závažnosti); sekce Vyžaduje pozornost; deep-link na chyby vstupů u PV/ŠD/ZŠ/NV75.
- **CI:** ESLint v pipeline; acceptance contract pro SŠ (`phmax-ss-acceptance-contract.test.ts`), včetně §16 scénáře E.
- **E2E:** smoke suite nově zahrnuje i SŠ (`e2e/ss-mobile-smoke.spec.ts`).

## Verze 0.2.3 (UX)

- **Mobil:** plovoucí souhrn dole (hlavní číslo viditelné při scrollu); výběr ukázky u ZŠ a NV75.
- **Dashboard:** sjednocené verdikty u „Pokračovat“; porovnání variant A/B v základním režimu.
- **Export:** jednotná metadata a autor v CSV/XLSX (SŠ a společné helpery).

## Verze 0.2.2 (UX)

- **Mobil:** plovoucí souhrn – hlavní číslo zůstává nahoře při posunu; nápověda u polí (ikona „i“) funguje klepnutím.
- **Základní režim:** srozumitelnější porovnání variant, dashboard „Pokračovat“ s verdiktem, SŠ §16 u docku.
- **SŠ checklist:** scénář E doplněn; scénář F (reálná data) nechává tester.

## Verze 0.2.1 (UX)

- **Základní režim:** 3krokový průvodce u PV, ŠD, SŠ a NV75; zjednodušené porovnání s uloženou zálohou v docku.
- **Mobil:** plovoucí souhrn výsledku při scrollu (klepnutím přejdete k docku).
- **Přístupnost:** skip link „Přeskočit na výpočet“, klávesnice u modálů a mobilního obsahu stránky.
- **Co je nového:** odkaz v patičce (bez automatického popupu po updatu).

## Spuštění

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Testy a CI

```bash
npm run test:golden
```

- `npm run test:golden` spouští golden/boundary/UI-flow/contract sadu pro kontrolu stability výpočtů a exportů.
- V GitHub Actions je po běhu dostupný krátký `Test summary` blok v job summary (unit + golden výsledky), bez nutnosti stahovat artifact.
- Guard skripty pro CI kontrakty:
  - `npm run check:readme-sync`
  - `npm run check:ci-summary-manifest`
  - `npm run check:golden-manifest`
  - `npm run check:ci-guards-manifest`
- Ruční smoke na mobilu (cca 5 min): [docs/mobile-smoke-checklist.md](docs/mobile-smoke-checklist.md)
- Automatický mobilní smoke (PV, ŠD, ZŠ, NV75, SŠ): `npm run test:e2e` (jednorázově `npm run test:e2e:install`); desktop TOC: projekt `desktop-chrome` v Playwright config.

## Struktura (zkráceně)

- `src/App.tsx` – routování podle `view`
- `src/phmax-zs-*` – logika a UI základních škol
- `src/PhmaxPvPage.tsx`, `PhmaxSdPage.tsx`, `PhmaxNv75DeputyPage.tsx` – další produkty
- `src/ss/` – střední školy (`phmax-ss-logic.ts`, dataset, formulář jednotek)
- `src/styles.css` – společné styly

## Rozsah modulu SŠ (verze 0.2)

- **PHmax:** orientační výpočet po řádcích (dataset NV, režimy jednoobor / víceobor / přechodné), kontrola pravidel vyhl. č. 13/2005 Sb.
- **PHAmax:** součet jen pro Praktickou školu (`78-62-C/01`, `78-62-C/02`, denní forma) podle tabulky metodiky v3/2026.
- **§ 16 odst. 9:** přepínač na řádku, kontrola business rules a výpočet PHmax dle pásem metodiky (mapování průměru na pásma NV); golden testy v `phmax-ss-par16-golden.test.ts`.
- **Mimo rozsah:** další dílčí výpočty PHAmax dle metodiky, školní agregace průměrů podle § 4 – plný postup MŠMT.

Metodika: [MŠMT – PHmax pro SŠ 2026](https://msmt.gov.cz/vzdelavani/skolstvi-v-cr/ekonomika-skolstvi/metodika-vypoctu-phmax-pro-ss-2026).

Podrobný pracovní list (scénáře A–F, tabulka zápisu): [docs/ss-acceptance-checklist.md](docs/ss-acceptance-checklist.md).

## SŠ acceptance checklist (pro předání)

Krátká kontrola před předáním modulu SŠ; detailní kroky a golden smoke hodnoty jsou v [docs/ss-acceptance-checklist.md](docs/ss-acceptance-checklist.md).

- Ověřit **1–2 reálné řádky** z evidence školy (kód RVP, průměr, třídy, forma) a porovnat PHmax s vlastním podkladem.
- Automatický smoke v aplikaci: ukázka **jednoobor** (`39-41-L/01`, 17 žáků, 2 třídy, denní) → součet PHmax **100**; **PrŠ** (`78-62-C/01`, 4 žáci, 1 třída, denní) → PHmax **30** a **PHAmax > 0** v horním přehledu.
- **Víceoborová třída:** vyplnit Další obory / žáci – zkontrolovat blok Kontrola pravidel (varování u konfliktu).
- **§ 16 odst. 9:** zapnout přepínač – PHmax dle pásem metodiky (golden: avg 8→50, 5→35, 12→53); kontrola `PAR16_CALC_APPLIED`; reálná škola ve scénáři F checklistu.
- Export **CSV**, kontrola sloupců a archivní poznámky; na sdíleném PC po testu smazat uložená data.
- Před releasem: `npm run test:golden`, `npm run build`, `npm run check:readme-sync`.

## NV75 changelog (aktuální vydání)

- Nová auditní vrstva ve výsledcích NV75: u každého pracoviště se zobrazuje použité pásmo přílohy (`Příloha 2/3`) a pravidlo bonusu `§4d`.
- Audit je viditelný přímo v tabulce výsledků (nejen v exportu), včetně stručných metodických poznámek pro OV řádky.
- Připomenutí pro kontrolu výstupu: celková banka se skládá ze základu `§4b` + bonusů `§4c` a `§4d`, což je v tabulce explicitně označeno.

## NV75 acceptance checklist (pro předání)

- Ověřit 1–2 referenční příklady z metodiky NV75 a porovnat `Banka odpočtů celkem`.
- Zkontrolovat auditní sloupec u každého pracoviště (`§4b` pásmo + text `§4d`).
- Exportovat CSV/XLSX a uložit podklad s `Verze metodiky` + `Datum a čas exportu (archivní razítko)`.
- U OV scénáře ověřit textový výstup funkcí (vyhl. 13/2005) a mezihodnotu `OV – ekvivalent skupin`.
- Před releasem spustit `npm run test:golden` a `npm run build`.
