# Záloha a obnova dat — Ředitelský průvodce

Tento dokument popisuje centrální **export** a **obnovu** JSON zálohy dat aplikace z Dashboardu (`/prehled` → **Záloha a obnova dat**).

Lifecycle platformových klíčů Identity Registry a AppContext je popsán v **[platform-metadata-lifecycle.md](./platform-metadata-lifecycle.md)**. Calculator clear (level B, 0E-3A) **nemění** centrální zálohu; export po stažení automaticky maže data v prohlížeči nenabízí.

## Obnova ze zálohy (aktuální stav)

Obnova je dostupná pouze z Dashboardu. Uživatel:

1. vybere JSON soubor centrální zálohy,
2. zkontroluje **read-only náhled** (T1),
3. volitelně stáhne současnou zálohu,
4. potvrdí přesně token **OBNOVIT**,
5. spustí obnovu — engine provede fresh plán (T2), zápis, platform reconcile, verifikaci,
6. při úspěchu následuje **hard reload** stránky.

**Preview (T1) není autorita pro zápis.** Při Apply engine znovu načte current environment a vytvoří fresh T2 plán. Preview může být validní, ale Apply později vrátí `rejected_plan`, pokud se mezitím změnil stav aplikace.

### Semantika modulů při obnově

| Situace v záloze | Chování |
|------------------|---------|
| Modul **present** a validní | Nahradí odpovídající lokální snapshot modulu |
| Modul **celý chybí** v záloze | Lokální modul **zůstane beze změny** (preserve) |
| **Neznámý** modul v záloze | Varování; modul se při obnově **přeskočí** |
| **Known invalid** modul | Obnova **zablokována** |
| **Cross-school** (`schoolId` ≠ lokální) | Obnova **zablokována** |
| Legacy záloha bez identity | Policy dle [platform-metadata-lifecycle.md](./platform-metadata-lifecycle.md) |

`AppContext` (`activeSchoolId`, `activeSchoolYearId`) **není** součástí standardního importu zálohy. Po raw apply proběhne **platform reconcile** a AppContext se znovu vytvoří / sladí podle obnoveného SchoolProfile, Identity Registry a VZ year labelu.

### Výsledky obnovy (UI)

| Stav engine | Význam pro uživatele |
|-------------|----------------------|
| `success` | Obnova a verifikace OK → okamžitý reload stránky |
| `no_changes` | V záloze nebylo co měnit; reload se neprovádí |
| `rejected_plan` | Fresh T2 plán není bezpečně aplikovatelný; nabídka „Načíst náhled znovu“ |
| `snapshot_failed` | Snapshot se nepodařilo dokončit; **žádný restore write** |
| `rolled_back` | Obnova selhala; dotčené klíče vráceny; blocking recovery + explicitní reload |
| `fatal_partial` | Obnova selhala a rollback nebyl úplný; konzistence **není garantována**; blocking recovery + reload |
| Neočekávaná výjimka v UI | Konzervativní blocking recovery; reload; **bez** tvrzení o stavu dat |

### Omezení v1

1. **Dashboard-only apply** — minimalizace souběžných mounted autosave writerů na jiných stránkách.
2. **Žádný cross-tab lock** — jiný panel/okno může během obnovy měnit storage.
3. **Rollback snapshot je pouze in-memory** — crash nebo zavření tabu během obnovy může zanechat partial state.
4. UI proto varuje: zavřete ostatní panely a během obnovy stránku nezavírejte.
5. **Žádný persistent transaction journal** ani BroadcastChannel.
6. Centrální záloha **není** bitová kopie celého browser storage (viz níže).
7. **File-size limit** není v aplikaci vynucen — případné budoucí hardening.

### Budoucí hardening (mimo aktuální scope)

- per-modul výběr obnovy v UI (dnes obnova řídí presence/absence modulů v souboru),
- migrace starších `schemaVersion` envelope,
- lite moduly v centrální záloze,
- volitelný file-size policy po měření reálných backupů.

## Formát zálohy

```json
{
  "format": "reditelsky-pruvodce-backup",
  "schemaVersion": 1,
  "exportedAt": "2026-07-08T20:00:00.000Z",
  "appVersion": "0.3.16",
  "modules": {
    "school-profile": {
      "label": "Profil školy",
      "schemaVersion": 1,
      "exportedAt": "2026-07-08T20:00:00.000Z",
      "data": { }
    }
  }
}
```

- **Název souboru:** `reditelsky-pruvodce-zaloha-YYYY-MM-DD.json`
- **Verze formátu:** `schemaVersion: 1`
- **Identifikátor formátu:** `format: "reditelsky-pruvodce-backup"`

## Co se zálohuje

Centrální export zahrnuje pouze moduly explicitně registrované v `src/backup/backup-registry.ts`. Data se čtou přes adaptery modulů, nikoli slepým procházením celého `localStorage`.

| Modul ID | Popis | Storage klíče |
|----------|-------|---------------|
| `school-profile` | Profil školy | `reditelsky-pruvodce-school-profile-v1` |
| `identity-registry` | Stabilní identita školy a školních roků (platforma) | `reditelsky-pruvodce-identity-registry-v1` |
| `annual-report` | Výroční zpráva (hlavní stav, personál, kapitoly 01–14) | `vyrocni-zprava-state-v1`, `vyrocni-zprava-personnel-data-v1`, `vyrocni-zprava-section{01,02,04–14}-data-v1` |
| `phmax-pv` | Kalkulačka předškolního vzdělávání | `edu-cz-pv-calculator-state`, `edu-cz-pv-named-snapshots-v1` |
| `phmax-sd` | Kalkulačka školní družiny | `edu-cz-sd-calculator-state`, `edu-cz-sd-named-snapshots-v1` |
| `phmax-zs` | Kalkulačka základní školy | `edu-cz-zs-calculator-state`, `edu-cz-zs-named-snapshots-v1` |
| `phmax-ss` | Kalkulačka střední školy | `phmax-ss-units-draft`, `phmax-ss-named-snapshots-v1`, `phmax-ss-framework-phase1-notes` |
| `phmax-nv75` | Banka odpočtů zástupců ředitele | `edu-cz-nv75-deputy-bank-state`, `edu-cz-nv75-deputy-bank-named-snapshots` |
| `phmax-scenario-label` | Pojmenování scénáře školy (metadata) | `phmax-school-scenario-label` |

Modul bez uložených dat se do zálohy nezahrnuje (envelope zůstává validní s prázdným `modules`). Corrupted Identity Registry ani corrupted SchoolProfile se neexportují jako validní data — modul ohlásí chybu čtení, export ostatních modulů pokračuje (stejný kontrakt jako u ostatních adapterů). Runtime politika poškozeného profilu (write guard + recovery UI, bez force overwrite) je v **[platform-metadata-lifecycle.md](./platform-metadata-lifecycle.md)** (0F-3A / 0F-3B).

### Platform metadata a VZ `schoolYear` (0G)

Centrální záloha nese **business** year label v modulu `annual-report`:

- `vyrocni-zprava-state-v1` → `report.schoolYear` je write source of truth labelu.

Stabilní SchoolYear identity metadata jsou v optional modulu `identity-registry`:

- `schoolYears[]` (`schoolYearId`, `startYear`, …).

`AppContext` (`activeSchoolYearId`) se **nezálohuje**. Po obnově se workspace pointer znovu
bootstrapne / reconcile podle obnoveného SchoolProfile a persistovaného VZ year labelu — viz
[platform-metadata-lifecycle.md](./platform-metadata-lifecycle.md) (Restore, sekce 0G).

0G nezavádí žádná nová business data mimo současný backup envelope.

## Co se nezálohuje

| Storage klíč / skupina | Modul | Typ | Důvod vyloučení |
|------------------------|-------|-----|-----------------|
| `vyrocni-zprava-diagnostic-backup-v1:*` | Výroční zpráva | Diagnostický | Záloha poškozených dat při načtení — není uživatelský obsah |
| `phmax-pv-lite-v3`, `phmax-zs-lite-v2`, `phmax-sd-lite-v2` | Lite kalkulačky | Produkt / draft | Samostatný workflow, handoff do plných modulů |
| `phmax-pv-view-mode`, `phmax-sd-view-mode`, … | Kalkulačky | UI stav | Režim základní/expert |
| `phmax-*-basic-wizard-step`, `phmax-zs-pha/php-basic-wizard-step` | Kalkulačky | UI stav | Krok průvodce |
| `phmax-*-onboarding`, `phmax-*-quick-tour-v1` | Kalkulačky / dashboard | UI stav | Onboarding a prohlídky |
| `phmax-calculator-hint-first-visit-v1`, `phmax-calculator-expert-first-switch-v1` | Globální | UI stav | Jednorázové hinty |
| `phmax-display-density`, `phmax-calculator-focus`, `phmax-toc-open` | Globální | UI preference | Prezentace, ne obsah |
| `phmax-app-whats-new-seen-version` | Globální | UI stav | Verze zobrazeného what's-new |
| `phmax-dash-role-v1`, `phmax-dash-quick-tour-v1` | Dashboard | UI stav | Role a prohlídka dashboardu |
| `phmax-dash-last-active-product`, `phmax-dash-last-visit-*` | Dashboard | Cache / metadata | Časové značky návštěv |
| `phmax-dash-last-export-v1` | Dashboard | Cache / metadata | Poslední export — neobsah |
| `phmax-is-handoff-endpoint` | Integrace IS | Konfigurace | URL endpointu — citlivá integrační konfigurace mimo běžnou zálohu |
| `reditelsky-pruvodce-identity-registry-v1` | Platforma | Platformová identita | Exportováno jako optional module `identity-registry` (0E-2); chybějící registry export nepřeruší |
| `reditelsky-pruvodce-app-context-v1` | Platforma | Device / workspace | Záměrně mimo běžnou zálohu; po restore bootstrap |
| Neznámé klíče v `localStorage` | — | — | Bez explicitní registrace se neexportují |

### Centrální záloha není obrazem browser storage

Low-level Full Reset kontrakt (0E-3C1) maže podle samostatného delete registry také data, která
centrální záloha neobsahuje: lite drafty, AppContext, UI a dashboard preference, VZ diagnostické
zálohy, konfiguraci IS endpointu a dočasné session hints. Centrální backup proto není byte-for-byte
kopie `localStorage` / `sessionStorage` a nelze z něj obnovit úplně vše, co Full Reset odstraní.

Delete registry v `src/application-storage-registry.ts` a backup registry v
`src/backup/backup-registry.ts` mají rozdílné lifecycle účely a nejsou záměrně sloučené.

## Registry storage klíčů (audit)

| Storage klíč | Modul | Typ dat | Kategorie | Citlivost | Export v běžné záloze | Validátor / parser | Poznámka |
|--------------|-------|---------|-----------|-----------|----------------------|------------------|----------|
| `reditelsky-pruvodce-school-profile-v1` | Profil školy | JSON `SchoolProfile` | Produkční | Vysoká (IČO, kontakty) | Ano (`school-profile`) | `normalizeSchoolProfile` | Sdílený napříč moduly |
| `vyrocni-zprava-state-v1` | Výroční zpráva | JSON `{ version, report, selectedSectionId }` | Produkční | Vysoká | Ano (`annual-report`) | `parseStorage` ve `vyrocni-zprava-storage.ts` | Hlavní stav zprávy |
| `vyrocni-zprava-personnel-data-v1` | Výroční zpráva k. 03 | JSON envelope personál | Produkční | Střední | Ano (`annual-report`) | `normalizePersonnelData` | Kapitola 03 |
| `vyrocni-zprava-section01-data-v1` … `section14-data-v1` (bez 03) | Výroční zpráva | JSON envelope per section | Produkční | Střední–vysoká | Ano (`annual-report`) | `*-data-storage.ts` | 13 klíčů kapitol |
| `vyrocni-zprava-diagnostic-backup-v1:{ISO}` | Výroční zpráva | Raw string | Diagnostický | — | **Ne** | — | Dynamický prefix |
| `edu-cz-pv-calculator-state` | PHmax PV | JSON autosave | Produkční | Střední | Ano (`phmax-pv`) | JSON parse | |
| `edu-cz-pv-named-snapshots-v1` | PHmax PV | JSON `{ items }` | Produkční (zálohy) | Střední | Ano (`phmax-pv`) | JSON parse | Max ~10 položek |
| `edu-cz-sd-calculator-state` | PHmax ŠD | JSON autosave | Produkční | Střední | Ano (`phmax-sd`) | JSON parse | |
| `edu-cz-sd-named-snapshots-v1` | PHmax ŠD | JSON `{ items }` | Produkční (zálohy) | Střední | Ano (`phmax-sd`) | JSON parse | |
| `edu-cz-zs-calculator-state` | PHmax ZŠ | JSON form snapshot | Produkční | Střední | Ano (`phmax-zs`) | `zs-form-snapshot` | |
| `edu-cz-zs-named-snapshots-v1` | PHmax ZŠ | JSON `{ items }` | Produkční (zálohy) | Střední | Ano (`phmax-zs`) | JSON parse | |
| `phmax-ss-units-draft` | PHmax SŠ | JSON rows / legacy array | Produkční | Střední | Ano (`phmax-ss`) | `parseSsDraftRowsFromSnapshot` | |
| `phmax-ss-named-snapshots-v1` | PHmax SŠ | JSON `{ items }` | Produkční (zálohy) | Střední | Ano (`phmax-ss`) | JSON parse | |
| `phmax-ss-framework-phase1-notes` | PHmax SŠ | Plain text | Produkční (poznámky) | Nízká | Ano (`phmax-ss`) | string trim | Neovlivňuje výpočet |
| `edu-cz-nv75-deputy-bank-state` | NV75 | JSON `{ rows }` | Produkční | Střední | Ano (`phmax-nv75`) | JSON parse | |
| `edu-cz-nv75-deputy-bank-named-snapshots` | NV75 | JSON `{ items }` | Produkční (zálohy) | Střední | Ano (`phmax-nv75`) | JSON parse | |
| `phmax-school-scenario-label` | Scénář školy | Plain string | Produkční (metadata) | Nízká | Ano (`phmax-scenario-label`) | string trim | Label pro export scénáře |
| `phmax-pv-lite-v3` | PV lite | JSON draft | Produkt / draft | Střední | **Ne** | — | Zatím nepodporováno v centrální záloze |
| `phmax-zs-lite-v2` | ZŠ lite | JSON draft | Produkt / draft | Střední | **Ne** | — | Zatím nepodporováno |
| `phmax-sd-lite-v2` | ŠD lite | JSON draft | Produkt / draft | Střední | **Ne** | — | Zatím nepodporováno |
| `phmax-*-view-mode` | Kalkulačky | `"basic"` \| `"expert"` | UI | — | **Ne** | — | |
| `phmax-*-basic-wizard-step` | Kalkulačky | string step | UI | — | **Ne** | — | |
| `phmax-dash-*` (role, tour, visits, last-export) | Dashboard | různé | UI / cache | — | **Ne** | — | |
| `phmax-is-handoff-endpoint` | Integrace IS | URL string | Konfigurace | Střední | **Ne** | — | Mimo běžnou zálohu |
| `phmax-display-density`, `phmax-calculator-focus`, `phmax-toc-open` | Globální | preference | UI | — | **Ne** | — | |
| `reditelsky-pruvodce-identity-registry-v1` | Platforma | JSON Identity Registry | Platformová identita | Střední | Ano (`identity-registry`) | `parseIdentityRegistry` / `readIdentityRegistry` | Optional; missing = bez payloadu; corrupted = module error bez overwrite |
| `reditelsky-pruvodce-app-context-v1` | Platforma | JSON AppContext | Device / workspace | Nízká | **Ne** (záměrně; po restore bootstrap) | `parseAppContext` | Viz [platform-metadata-lifecycle.md](./platform-metadata-lifecycle.md) |

## Bezpečnostní upozornění

- Záloha může obsahovat **údaje o škole** (název, IČO, RED IZO, kontakty, texty výroční zprávy, vstupy kalkulaček).
- Soubor ukládejte na **zabezpečené místo** (šifrovaný disk, školní úložiště s přístupovými právy).
- Aplikace **neodesílá** zálohu na server — stahování probíhá pouze v prohlížeči uživatele.
- Obsah zálohy se **nevypisuje** do konzole ani do logů.
- Diagnostické zálohy poškozených dat se do běžného exportu **nezahrnují**.

## Implementace

| Soubor | Účel |
|--------|------|
| `src/backup/backup-types.ts` | Typy envelope a výsledků exportu |
| `src/backup/backup-registry.ts` | Explicitní registry modulů a adapterů |
| `src/backup/backup-validation.ts` | Validace JSON a tvaru dat modulů |
| `src/backup/backup-export.ts` | Sestavení envelope a stažení souboru |
| `src/backup/restore/*` | Parse, validate, plan, apply, rollback, reconcile |
| `src/dashboard/DashboardBackupExportCard.tsx` | UI exportu a vstup obnovy na `/prehled` |
| `src/dashboard/DashboardRestoreDialog.tsx` | UI náhledu, potvrzení a obnovy |
| `e2e/backup-restore.spec.ts` | Browser-level closure testy obnovy |
