# Audit projektu Ředitelský průvodce

Datum: 2026-07-08  
Režim: readonly audit + dokumentace (bez změn runtime logiky, routingu, SEO, výpočtů, testů)  
Scope: celý repozitář `i:/AI_PROJECTs/CODE_AI_projects`

---

## 0) Metodika a hranice auditu

- Audit je založen na analýze zdrojových souborů, testů, CI konfigurace a jednom build měření (`npm run build`).
- V této fázi nebyly upravovány žádné produkční soubory aplikace, routing, canonical, robots, sitemap ani prerender konfigurace.
- U tvrzení, která vyžadují runtime produkční experiment nebo browser/device matrix, je explicitně uvedeno **Předpoklad**.

### Ověřené zdroje (klíčové)

- Routing a shell: `src/App.tsx`, `src/product-view-paths.ts`, `src/phmax-lite-paths.ts`
- SEO/head/prerender: `src/phmax-document-head.ts`, `src/phmax-route-seo-content.ts`, `src/render-route-seo-html.ts`, `scripts/prerender-route-html.ts`, `public/robots.txt`, `public/sitemap.xml`
- Moduly: `src/PhmaxPvPage.tsx`, `src/PhmaxSdPage.tsx`, `src/PhmaxZsPage.tsx`, `src/PhmaxSsPage.tsx`, `src/PhmaxNv75DeputyPage.tsx`, `src/PhmaxDashboardPage.tsx`, `src/VyrocniZpravaPage.tsx`, `src/VyrocniZpravaPreviewPage.tsx`, `src/ProfilSkolyPage.tsx`
- Výpočty a storage: `src/phmax-pv-logic.ts`, `src/phmax-sd-logic.ts`, `src/phmax-zs-logic.ts`, `src/ss/*`, `src/nv75-deputy-bank.ts`, `src/phmax-school-scenario-export.ts`, `src/phmax-local-storage-clear.ts`, `src/vyrocni-zprava/*storage*.ts`
- Import/export: `src/phmax-import-template-xlsx.ts`, `src/phmax-import-pv-zs.ts`, `src/export-xlsx.ts`, `src/vyrocni-zprava/import/VyrocniZpravaXlsxImportPanel.tsx`, `src/vyrocni-zprava/vyrocni-zprava-docx-export-logic.ts`
- Testy a CI: `.github/workflows/ci.yml`, `playwright.config.ts`, `e2e/*.spec.ts`, `src/**/*contract*.test.ts`, `src/**/*golden*.test.ts`, `package.json`

---

## 1) Produktová mapa

| modul | účel | vstupy | výstupy | způsob ukládání | vazby na jiné moduly | stav dokončení |
|---|---|---|---|---|---|---|
| Dashboard (`/prehled`) | Souhrn modulů, navigace, import šablony, cross-PHmax | autosave snapshoty modulů, import data | souhrny, přechody do modulů, export/handoff | localStorage (`src/PhmaxDashboardPage.tsx`, `src/phmax-school-scenario-export.ts`) | čte PV/ŠD/ZŠ/SŠ/NV75 snapshoty; importuje helpery z NV75 page | **produkčně dokončeno**, ale silně provázané |
| PHmax PV | Výpočet PHmax/PHAmax MŠ | řádky pracovišť | součty + exporty + audit | `edu-cz-pv-calculator-state` (`src/PhmaxPvPage.tsx`) | dashboard, import/export | **produkčně dokončeno** |
| PHmax ŠD | Výpočet PHmax družiny | účastníci/oddělení | PHmax + staffing orientace | `edu-cz-sd-calculator-state` (`src/PhmaxSdPage.tsx`) | dashboard, import/export | **produkčně dokončeno** |
| PHmax ZŠ | PHmax/PHAmax/PHPmax, nejširší workflow | sekce + režimy + wizard | součty, exporty, snapshoty | `edu-cz-zs-calculator-state`, named snapshots (`src/zs/zs-form-snapshot.ts`, `src/zs-named-snapshots.ts`) | dashboard, lite handoff | **produkčně dokončeno**, vysoká komplexita |
| PHmax SŠ | Výpočet PHmax SŠ podle oborů | řádky tříd/oborů | součty + validace + export | `phmax-ss-units-draft` (`src/ss/use-phmax-ss-units.ts`) | dashboard, import/export | **částečně iterované** (legacy/phase stopy) |
| NV75 banka odpočtů | Výpočet banky odpočtů zástupců | řádky organizace, bonusy | banka odpočtů + export | `edu-cz-nv75-deputy-bank-state` (`src/PhmaxNv75DeputyPage.tsx`) | dashboard | **produkčně dokončeno** |
| Rychlé kalkulačky PV/ŠD/ZŠ | Zkrácené vstupy + handoff do plného modulu | minimální vstupy | předvyplnění plného modulu | write do full snapshot klíčů (`src/phmax-lite-handoff.ts`) | PV/ŠD/ZŠ full pages | **produkčně dokončeno** |
| Profil školy (`/profil-skoly`) | Sdílené identifikační údaje | profil školy | sdílený profil pro moduly | `reditelsky-pruvodce-school-profile-v1` (`src/school-profile/school-profile-storage.ts`) | výroční zpráva, další moduly | **produkčně dokončeno** |
| Návod (`/navod`) | Veřejná route s průvodcem + SEO | statický obsah/FAQ | prerender content + JSON-LD | bez business storage | vazba na SEO layer | **produkčně dokončeno** |
| Výroční zpráva (`/vyrocni-zprava`) | Workflow kapitol 01–14 + import/export | profil + section data + import XLSX/JSON | preview + DOCX export | více LS klíčů v1 (`src/vyrocni-zprava/*-storage.ts`) | profil školy, dashboard data bridge | **produkčně dokončeno**, datová konzistence částečně |
| SEO landing (`/kalkulacky-phmax`) | veřejný obsahový rozcestník | route SEO config | prerender page + indexovatelný obsah | bez business storage | routing + SEO | **produkčně dokončeno** |

### Skryté / experimentální / mrtvý kód / plánované

- **Skryté funkcionality:** explicitní feature-flag systém pro nové moduly není zaveden (`src/App.tsx` je route-switch bez feature gate).
- **Experimentální/legacy stopy:** SŠ část obsahuje legacy/phase termíny (`src/ss/phmax-ss-business-rules.ts`, `src/ss/phmax-ss-constants.ts`).
- **Mrtvý kód:** nebyl prokázán jednoznačný dead-code blok; repo má guard testy proti legacy root pages (`package.json` → `check:no-legacy-root-pages`).
- **Plánované nedokončené:** nový modul „Plán úvazků a personálních kapacit školy“ neexistuje jako route/page/datový model.

---

## 2) Architektura

### 2.1 Hlavní vrstvy

1. **App shell + route orchestrátor**  
   - `src/main.tsx` (mount + `ErrorBoundary`)  
   - `src/App.tsx` (route state, lazy pages, document head switch)
2. **Page komponenty modulů**  
   - `src/Phmax*Page.tsx`, `src/VyrocniZpravaPage.tsx`, `src/ProfilSkolyPage.tsx`
3. **Doménová logika výpočtů**  
   - PV: `src/phmax-pv-logic.ts`  
   - ŠD: `src/phmax-sd-logic.ts`  
   - ZŠ: `src/phmax-zs-logic.ts` + `src/config/calculator-config.ts`  
   - SŠ: `src/ss/*`  
   - NV75: `src/nv75-deputy-bank.ts`
4. **Persistence a snapshot vrstva**  
   - moduly: localStorage v page/hooks  
   - ZŠ snapshots: `src/zs/zs-form-snapshot.ts`, `src/zs-named-snapshots.ts`  
   - výroční zpráva: `src/vyrocni-zprava/*-storage.ts`
5. **Import/export vrstva**  
   - školní import: `src/phmax-import-template-xlsx.ts`, `src/phmax-import-pv-zs.ts`  
   - export XLSX: `src/export-xlsx.ts`  
   - výroční zpráva import/export: `src/vyrocni-zprava/import/*`, `src/vyrocni-zprava/vyrocni-zprava-docx-export-logic.ts`
6. **SEO vrstva**  
   - head/json-ld: `src/phmax-document-head.ts`  
   - route content: `src/phmax-route-seo-content.ts`  
   - prerender html: `src/render-route-seo-html.ts`, `scripts/prerender-route-html.ts`
7. **Test & delivery**  
   - Unit/Vitest + contracts/golden: `src/**/*.test.ts`  
   - E2E/Playwright: `e2e/*.spec.ts`, `playwright.config.ts`  
   - CI: `.github/workflows/ci.yml`

### 2.2 Routing

- Route mapping je explicitní přes `PRODUCT_VIEW_PATH` (`src/product-view-paths.ts`), nikoliv přes React Router.
- `src/App.tsx` přepíná view podle pathname + interního state.
- Legacy redirect řeší middleware (`middleware.ts` + `legacy-view-redirect.mjs`).

### 2.3 Sdílené komponenty a patterny

- Sdílený shell a akční panel: `src/CalculatorProductShell.tsx`, `src/CalculatorWorkflowDock.tsx`, `src/HeroActionsDrawer.tsx`
- A11y utility pro dialogy: `src/modal-dialog-a11y.ts`
- Toast messaging: `src/ui-toast.tsx`

### 2.4 Textový dependency diagram

```text
main.tsx
  -> App.tsx
      -> lazy pages (Dashboard, PV, SD, ZS, SS, NV75, Profil, Návod, Výroční zpráva)
      -> phmax-document-head.ts

DashboardPage
  -> phmax-dashboard-cross-phmax.ts
  -> phmax-import-template-xlsx.ts
  -> phmax-school-scenario-export.ts
  -> (coupling) helpers from PhmaxNv75DeputyPage.tsx

VyrocniZpravaPage
  -> use-vyrocni-zprava-report.ts
  -> section storage hooks (01..14 + personnel)
  -> import panel / preview page / docx logic
  -> school-profile storage

Build pipeline
  -> vite build
  -> scripts/prerender-route-html.ts
      -> phmax-route-seo-content.ts
      -> render-route-seo-html.ts
      -> phmax-document-head.ts
```

### 2.5 Nálezy architektury

- **Silné provázání dashboardu s NV75 page**  
  `src/PhmaxDashboardPage.tsx` importuje `normalizeNv75UiRow` a `eligibleAdditionalWorkplacesForRow` ze `src/PhmaxNv75DeputyPage.tsx`.
- **God components (mnoho odpovědností):**  
  - `src/PhmaxZsPage.tsx` (~2184 řádků)  
  - `src/PhmaxDashboardPage.tsx` (~1755 řádků)  
  - `src/VyrocniZpravaPage.tsx` (~580 řádků)
- **Duplicitní utility:**  
  `safeJsonParse` lokálně v `src/PhmaxDashboardPage.tsx`, `src/phmax-dashboard-band-hints.ts`, `src/vyrocni-zprava/vyrocni-zprava-calculator-data-bridge.ts`.
- **Cyklické závislosti:**  
  - **Ověřeno částečně:** statická kontrola importů neodhalila zjevný tvrdý cyklus.  
  - **Předpoklad:** bez automatického graph scanneru nelze 100% potvrdit absenci všech cyklů.

---

## 3) Bezpečnost dat a localStorage audit

### 3.1 Seznam hlavních klíčů

Centrální inventář je v `src/phmax-local-storage-clear.ts` (`PHMAX_APP_LOCAL_STORAGE_KEYS`) a dále v modulech.

Klíče výroční zprávy (vše `v1`):
- `vyrocni-zprava-state-v1` (`src/vyrocni-zprava/vyrocni-zprava-storage.ts`)
- `vyrocni-zprava-personnel-data-v1` (`src/vyrocni-zprava/vyrocni-zprava-personnel-logic.ts`)
- `vyrocni-zprava-section01-data-v1` ... `vyrocni-zprava-section14-data-v1` (`src/vyrocni-zprava/vyrocni-zprava-section*-data-logic.ts`)

Klíče hlavních modulů:
- PV: `edu-cz-pv-calculator-state`
- ŠD: `edu-cz-sd-calculator-state`
- ZŠ: `edu-cz-zs-calculator-state`
- SŠ: `phmax-ss-units-draft`
- NV75: `edu-cz-nv75-deputy-bank-state`
- Profil školy: `reditelsky-pruvodce-school-profile-v1`

### 3.2 Formát, verze, migrace, JSON chyby

- **Verze schématu:** většinou `version: 1` obálky (`src/vyrocni-zprava/vyrocni-zprava-storage.ts`, `src/vyrocni-zprava/vyrocni-zprava-personnel-storage.ts`).
- **Migrace:** je dílčí migrace legacy profilu (`migrateLegacySchoolProfileIfNeeded` v `src/school-profile/school-profile-storage.ts`).
- **Poškozený JSON:** obvykle `try/catch` + fallback na default data.
- **Změna struktury:** normalizační funkce v modulech výroční zprávy (např. `normalizePersonnelData`).

### 3.3 Rizika

- **P0:** tiché selhání při `localStorage.setItem` (quota/privacy) je často pouze ignorováno bez user-notice (`/* ignore quota / privacy mode */`).
- **P1:** výroční zpráva používá více oddělených klíčů bez centrálního migrátoru napříč všemi klíči.
- **P1:** chybí namespacing per `reportId/schoolYear` u sekčních klíčů výroční zprávy.
- **P1:** smazání „rozpracované výroční zprávy“ maže hlavní key, ale neřeší explicitně kompletní sekční cleanup flow (`use-vyrocni-zprava-report.ts` -> `clearReport`).

### 3.4 Export/import/mazání

- **Kompletní JSON záloha výroční zprávy:** `handleExportBackup` v `src/vyrocni-zprava/import/VyrocniZpravaXlsxImportPanel.tsx`.
- **Import zálohy:** `handleBackupFileChange` + `handleConfirmBackupRestore` ve stejném souboru.
- **Mazání dat:** modulární clear funkce (`clearVyrocniZpravaStorage`, `clearPersonnelDataStorage`, `clearSchoolProfileStorage`, `clearAllPhmaxLocalStorage`).

### 3.5 Citlivé údaje

- Aplikace ukládá identifikační údaje školy a texty výroční zprávy v browser storage (nešifrované localStorage).
- To je u SPA běžné, ale vyžaduje přísné UX upozornění a monitoring hygienu.

### 3.6 Návrh jednotného bezpečného verzování a migrace (bez implementace)

1. Zaveďte jeden manifest key: `app-storage-manifest-v1` (mapa klíčů + verze).
2. Namespacing pro výroční zprávu: `vyrocni-zprava:{reportId}:{schoolYear}:{section}`.
3. Centrální migrátor: `migrations[fromVersion] => toVersion`.
4. Při save používat write-through se záložním snapshotem (last-known-good).
5. Každý load: strict validator + explicitní user warning při fallbacku.
6. Přidat jednotné API wrappery (get/set/remove) namísto přímých volání v page komponentách.

---

## 4) Audit workflow Výroční zprávy

### 4.1 User proces 1–10

1. **Založení zprávy**  
   - Ověřeno: default report + schoolYear (`createFreshVyrocniZpravaStorage`).
2. **Načtení profilu školy**  
   - Ověřeno: `useSchoolProfile` + shared storage.
3. **Vyplňování kapitol**  
   - Ověřeno: section hooks 01–14 + personnel (`src/VyrocniZpravaPage.tsx`).
4. **Import**  
   - Ověřeno: XLSX import + preview + warnings (`src/vyrocni-zprava/import/*`), JSON backup restore.
5. **Autosave**  
   - Ověřeno: persist v `use-vyrocni-zprava-report.ts` + section-level save.
6. **Kontrola úplnosti**  
   - Ověřeno: readiness/check flow (`checkSectionData`, section readiness).
7. **Náhled**  
   - Ověřeno: `src/VyrocniZpravaPreviewPage.tsx`.
8. **Export**  
   - Ověřeno: DOCX logika v `src/vyrocni-zprava/vyrocni-zprava-docx-export-logic.ts`.
9. **Obnovení rozpracované zprávy**  
   - Ověřeno: restore z storage + JSON backup import.
10. **Další školní rok**  
   - Ověřeno částečně: `setSchoolYear`; explicitní guided rollover workflow zatím chybí.

### 4.2 Kde může uživatel přijít o data

- Tiché selhání localStorage write (quota/private mode).
- Rozdíl mezi `generatedText` a strukturovanými section daty (stale export, pokud není regenerace).
- Nejednotný multi-key storage bez centrální transakce.

### 4.3 Validace a UX mezery

- JSON restore kontroluje verzi a základní shape, ale ne plnou hlubokou validaci všech nested polí.
- Import panel správně upozorňuje, že import neupraví automaticky `generatedText`.
- Chybí tvrdá guard podmínka „regenerovat kapitoly před exportem“, existuje jen doporučení.

### 4.4 Mobilní rizika (workflow)

- **Předpoklad:** dlouhé import preview/sekční formuláře mohou být hůře ovladatelné na úzkém viewportu; existují mobile E2E, ale ne plné pokrytí všech kroků výroční zprávy.

### 4.5 Prioritizovaný plán rozvoje výroční zprávy

- **P0:** jednotný storage manifest + namespacing + fallback warning při write fail.
- **P1:** explicitní „data changed since generated text“ indikátor a pre-export check.
- **P1:** hlubší runtime validace JSON restore.
- **P2:** guided rollover mezi školními roky.
- **P2:** rozšířit E2E pro complete end-to-end flow (import -> edit -> preview -> export -> restore).

---

## 5) Audit kalkulaček (hlavní vs rychlé)

### 5.1 Srovnání

- **Layout:** hlavní moduly mají rozsáhlý shell + tool panely; rychlé varianty jsou zjednodušené (`src/*LitePage.tsx`).
- **Vstupy/validace:** hlavní moduly detailní vstupy; rychlé varianty minimální potřebné vstupy.
- **Error messaging:** standardizované texty v `src/calculator-ui-constants.ts`, ale implementace je distribuovaná.
- **Výsledkové karty a vysvětlení:** existují napříč moduly, v různé hloubce.
- **Ukládání scénářů:** ZŠ robustní named snapshots; jiné moduly méně robustní patterny.
- **Export/tisk/reset:** dostupné napříč moduly; implementačně ne plně sjednocené.
- **Mobil a a11y:** pokryto smoke testy, ale s různou hloubkou.

### 5.2 Co lze bezpečně sjednotit (bez sjednocování výpočtových jader)

- Společný storage adapter (safe load/save/remove + warning policy).
- Společný error/toast wrapper pro import/export/storage.
- Společná knihovna pro named snapshots (UI + storage contract).
- Společný kontrakt pro module toolbar actions (reset/export/restore semantics).
- Společná validační vrstva pro JSON import payloady.

---

## 6) Testovací mezery

### 6.1 Co je pokryté dobře

- Unit + contract + golden testy: vysoké pokrytí (`src/**/*contract*.test.ts`, `src/**/*golden*.test.ts`).
- E2E smoke pro desktop/mobile: `e2e/*.spec.ts`.
- No-JS SEO test: `e2e/seo-prerender-content.spec.ts` (`javaScriptEnabled: false`).
- CI pipeline je přísná (`.github/workflows/ci.yml`).

### 6.2 Mezery

- Chybí systematické testy poškozeného localStorage pro všechny hlavní moduly.
- Chybí centrální test migrace dat mezi verzemi (protože centrální migrace není zavedena).
- Chybí a11y automatizační scanner (axe/pa11y/lighthouse) v CI.
- Chybí performance budget testy (chunk limits, load budget, runtime budget).
- Chybí širší browser matrix (Playwright je převážně Chromium).

---

## 7) Přístupnost (WCAG 2.2 AA)

### Kritické

- **Privacy-compliance a přístupnost governance:** analytics/replay je globálně v `index.html`; bez prokázaného maskování citlivých polí je to vysoké compliance riziko pro formulářové moduly.

### Vysoké

- Chybí automatický a11y scanning v CI.
- Chybí cílené testy pořadí nadpisů a screen-reader čitelnosti napříč všemi stránkami.

### Střední

- Klávesnice/focus/dialogy jsou implementovány dobře (`src/modal-dialog-a11y.ts`, `src/SkipToMainLink.tsx`, `src/styles.css`).
- `aria-live` a toast pattern existuje (`src/ui-toast.tsx`).

### Nízké

- `prefers-reduced-motion` a `focus-visible` mají CSS podporu (`src/styles.css`).

---

## 8) Výkon

### 8.1 Ověřená měření (build)

Výstup `npm run build`:
- Největší chunk: `dist/assets/exceljs-*.js` ~938.74 kB (gzip ~271.09 kB)
- Velké chunky také: `VyrocniZpravaPreviewPage` ~393.73 kB, `ss-compute-phmax-total-from-snapshot` ~377.40 kB
- CSS bundle: `index-*.css` ~229.93 kB

### 8.2 Pozitivní body

- Lazy loading page modulů (`src/App.tsx` + `React.lazy`).
- Ruční chunking `exceljs` (`vite.config.ts` -> `manualChunks`).
- `exceljs` se importuje dynamicky při exportu (`src/export-xlsx.ts`).

### 8.3 Rizika

- Některé chunky zůstávají velmi velké; build hlásí warning >500kB.
- Časté autosave zápisy mohou být nákladné na slabších mobilech.
- Chybí explicitní performance budgets v CI.

---

## 9) Chybové stavy a monitoring

### Ověřeno

- Globální React `ErrorBoundary` existuje (`src/ErrorBoundary.tsx`, použití v `src/main.tsx`).
- Import/export cesty vrací uživatelské statusy a varování (např. výroční zpráva import panel).

### Mezery

- Chybí centrální async error capture (`window.onerror`, `unhandledrejection`) s bezpečnou telemetrií.
- Chybí explicitní server-side error monitoring stack.
- Riziko logování dat přes analytics/replay, pokud není mimo repozitář vynuceno maskování.

### Návrh bezpečného monitoringu (bez obsahu zpráv/profilů)

- Posílat jen anonymizovaná metadata (`route`, `module`, `error_code`, `stack_hash`, `version`, `timestamp`).
- Hard denylist pro všechny textové a identifikační údaje školy.
- Pro `/vyrocni-zprava` a `/profil-skoly` aktivovat strict mode: bez replay obsahu formulářů.

---

## 10) Připravenost na nový modul: „Plán úvazků a personálních kapacit školy“

### 10.1 Hodnocení připravenosti

- Architektura je připravená na přidání nové stránky a route.
- Není připraven centrální storage/migration framework; to je hlavní blokátor bezpečného škálování.

### 10.2 Návrh modulu (bez implementace)

- **Datový model (v1 návrh):**
  - `planId`, `schoolYear`, `schoolProfileRef`
  - `scenarios[]`
  - `roles[]` (učitel/AP/vychovatel/odborné role)
  - `capacityInputs` + `phmaxReferences` + `totals`
  - `updatedAt`, `schemaVersion`
- **Napojení na PHmax:** read-only agregace přes dashboard bridge pattern (`src/phmax-dashboard-cross-phmax.ts`).
- **Napojení na profil školy:** reuse `useSchoolProfile` API.
- **Obrazovky:** Overview, Scenario editor, Role matrix, Validation panel, Export panel.
- **Validace:** povinné role, konzistence FTE, hranice dle vstupních kapacit.
- **Ukládání:** namespaced klíče + migrační manifest.
- **Export:** JSON + XLSX přes stávající export utility pattern.
- **Oddělení od jader:** žádné zásahy do existujících výpočtových jader; pouze čtení agregátů.
- **Feature flag:** route gate v `App.tsx` + storage/query flag.
- **Test strategie:** unit (výpočty), contract (schema), integration (bridge), E2E (workflow).

---

## 11) Výsledná roadmapa

| ID | oblast | problém/příležitost | závažnost | přínos | riziko změny | odhad pracnosti | doporučené pořadí |
|---|---|---|---|---|---|---|---|
| P0-01 | Data safety | Tiché selhání storage write bez user warning | P0 | prevence ztráty dat | nízké-střední | M | 1 |
| P0-02 | Storage architektura | Chybí centrální verze/migrace a namespacing | P0 | stabilita při rozvoji | střední | L | 2 |
| P0-03 | Monitoring/privacy | Globální analytics/replay bez prokázané ochrany citlivých formulářů | P0 | compliance a důvěra | střední | M | 3 |
| P1-01 | Výroční zpráva | Stale generatedText vs section data před exportem | P1 | vyšší správnost exportu | nízké | M | 4 |
| P1-02 | Coupling | Dashboard importuje logiku z NV75 page | P1 | lepší modularita | nízké-střední | M | 5 |
| P1-03 | Error handling | Chybí global async capture a kategorizace | P1 | rychlejší diagnostika | nízké | M | 6 |
| P1-04 | A11y QA | Chybí automatický a11y scan v CI | P1 | nižší regresní riziko | nízké | S | 7 |
| P2-01 | Performance | Chybí performance budgety v CI | P2 | předvídatelný výkon | nízké | S | 8 |
| P2-02 | Refactoring | Duplicitní safeJsonParse / storage helpery | P2 | údržba a konzistence | nízké | S | 9 |
| P2-03 | Výroční zpráva UX | Guided rollover mezi školními roky | P2 | méně chyb při novém roce | střední | M | 10 |
| P2-04 | Test mezery | Corrupted localStorage test matrix napříč moduly | P2 | robustnost obnovy | nízké | M | 11 |
| P3-01 | Nový modul | Plán úvazků a kapacit | P3 | nový produktový přínos | střední-vysoké | XL | 12 |

### P0 – kritické

- P0-01, P0-02, P0-03

### P1 – vysoká priorita

- P1-01, P1-02, P1-03, P1-04

### P2 – střední priorita

- P2-01, P2-02, P2-03, P2-04

### P3 – budoucí rozvoj

- P3-01

---

## 12) Návrh využití zbývající kapacity Cursoru

### Varianta A — konzervativní (stabilita a opravy)

- **Úkoly:**
  1. Storage warning policy + jednotný storage adapter
  2. Async error capture + bezpečný telemetry envelope
  3. A11y scan pipeline v CI
  4. Corrupted storage test matrix pro PV/ŠD/ZŠ/SŠ/NV75/VZ
- **Přínos:** minimum produkčního rizika, vyšší důvěra v data.
- **Rizika:** pomalejší produktový posun.
- **Pořadí commitů:** storage safety -> monitoring -> a11y CI -> tests.
- **Nedělat teď:** nový modul, velké UI redesigny.

### Varianta B — vyvážená (stabilita + výroční zpráva + příprava nového modulu)

- **Úkoly:**
  1. P0 storage+monitoring
  2. Výroční zpráva: pre-export stale guard + deep JSON restore validation
  3. Připravit feature-flag scaffold + datový kontrakt pro nový modul
- **Přínos:** stabilita + viditelné UX zlepšení + připravený základ pro růst.
- **Rizika:** střední rozsah změn.
- **Pořadí commitů:** P0 safety -> VZ export/restore -> feature-flag scaffold -> testy.
- **Nedělat teď:** zásahy do výpočtových jader.

### Varianta C — růstová (rychlé zahájení nového modulu)

- **Úkoly:**
  1. Minimum P0 (privacy + storage warning)
  2. Skeleton nového modulu (route + data model + read-only bridge)
  3. První E2E smoke a export kontrakt
- **Přínos:** rychlé ověření nového produktu.
- **Rizika:** vyšší pravděpodobnost technického dluhu.
- **Pořadí commitů:** P0 minimum -> module scaffold -> bridge -> tests.
- **Nedělat teď:** rozsáhlý refactor dashboardu/ZŠ page.

---

## Ověřené vs předpoklady

### Ověřené

- Route mapa, SEO head/prerender konfigurace, robots/sitemap stav.
- Existence a rozsah test pipeline (unit/contract/golden/E2E/no-JS).
- Build metriky chunk velikostí (aktuální měření).
- LocalStorage key landscape a chování fallbacků v hlavních modulech.
- Struktura workflow výroční zprávy a import/export mechaniky.

### Předpoklady / co vyžaduje navazující ověření

- 100% jistota absence cyklických závislostí (vyžaduje formální graph scan).
- Reálné chování na Safari/Firefox mobile a při konkrétních privacy restrikcích OS/browser.
- Konfigurace analytics masking mimo repozitář (např. admin nastavení nástrojů).

---

## Doporučený další krok po schválení auditu

1. Schválit variantu kapacitního plánu (A/B/C).
2. Otevřít implementační větev s P0 úkoly v malých commitech.
3. Nezasahovat do routingu/SEO/výpočtových jader bez samostatného RFC.

