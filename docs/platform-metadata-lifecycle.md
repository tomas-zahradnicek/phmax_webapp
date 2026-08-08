# Platform metadata lifecycle — Identity Registry & AppContext

Tento dokument formalizuje lifecycle platformových persistence klíčů zavedených ve Fázi 0
(PR 0B–0E) a runtime wiring uzavřený ve **0F** (Profile) a **0G** (SchoolYear / VZ metadata).

**Stav:**

- **Profile runtime safety** (0F): **COMPLETE** pro současnou single-school architekturu.
- **SchoolYear / VZ metadata runtime** (0G): **COMPLETE** pro současnou single-school /
  single-flat-VZ architekturu.

Profil školy a Výroční zpráva jsou dva lokální runtime consumery School / SchoolYear metadata.
React App-level provider ani App.tsx global bootstrap nejsou součástí 0F ani 0G.

Související: [Záloha a obnova dat](./backup-and-restore.md).

---

## Klíče

| Klíč | Role |
|------|------|
| `reditelsky-pruvodce-identity-registry-v1` | Stabilní `schoolId` / `schoolYearId` (platformová identita) |
| `reditelsky-pruvodce-app-context-v1` | `activeSchoolId` / `activeSchoolYearId` (device / workspace stav) |

---

## Rozlišení verzí schémat

Tyto verze se **nesmí směšovat**:

| Verze | Kde | Význam |
|-------|-----|--------|
| Backup envelope `schemaVersion` | `format: reditelsky-pruvodce-backup` | Tvar centrální JSON zálohy |
| Module `schemaVersion` | položka v `modules.*` | Tvar payloadu jednoho backup modulu |
| `DOMAIN_DATA_SCHEMA_VERSION` | domain School / SchoolYear | Domain model, ne localStorage dokument |
| Identity Registry `schemaVersion` | identity registry dokument | Persistovaný tvar registry |
| AppContext `schemaVersion` | app-context dokument | Persistovaný tvar workspace pointerů |

Aktuální centrální envelope: `format = reditelsky-pruvodce-backup`, `schemaVersion = 1`.

---

## Identity Registry

`reditelsky-pruvodce-identity-registry-v1`

- Je **platformová identita**, nikoli UI preference.
- Je součástí **centrální uživatelské zálohy** od 0E-2 jako optional module `identity-registry` ve envelope v1.
- **Nesmí** být součástí module-specific clear.
- **Full application / factory reset** ji odstraní.
- Restore **nesmí** silent-merge různá `schoolId`.
- Stabilní `schoolId` / `schoolYearId` musí při přenosu zálohy mezi browsery / zařízeními **přežít**.

### Clear profile ≠ bezpečné „vždy zachovat Identity Registry“

**Nedokumentujeme** jako obecný bezpečný princip pravidlo „vymazání SchoolProfile vždy zachová Identity Registry“.

Problém: pokud je SchoolProfile odstraněn a do stejného browseru je později zadána **jiná škola**, zachovaná Identity Registry by mohla nové škole přiřadit **původní `schoolId`**. To by smíchalo logickou identitu školy A se školou B.

Rozlišujeme čtyři koncepty:

| Koncept | Význam | Identity lifecycle |
|---------|--------|--------------------|
| **1. Edit profile** | Stejná logická škola; uživatel mění údaje profilu | Identity se **zachovává** (0E-3B1) |
| **2. Reset Profile Fields** | Vyčištění formulářových atributů stejné školy | Identity + IČO/RED IZO/IZO **zachovány** (0E-3B1) |
| **3. Replace School (single-school)** | Odstranění školy A a zahájení práce se školou B | **Full Application Reset → hard reload → nový SchoolProfile → nová Identity Registry / nové `schoolId`** (policy uzavřena 0E-3B2) |
| **4. Full Application Reset** | Factory reset všech vlastněných dat aplikace | Identity **smazat** (implementováno 0E-3C1 + 0E-3C2) |

Samostatná runtime operace Remove / Replace School se v současné single-school architektuře
neimplementuje.

---

## AppContext

`reditelsky-pruvodce-app-context-v1`

- Je **device / workspace state** (ukazatele aktivní školy a roku).
- **Není** autoritativní business data.
- Běžná centrální uživatelská záloha jej **nebude exportovat**.
- Po budoucím restore se vždy znovu **validuje / bootstrapuje** (stale / orphan pointery dle invariantů 0D).
- Module-specific clear jej standardně **zachová**.
- Full application / factory reset jej **odstraní**.

---

## Clear levels (budoucí kontrakt)

### A. Module clear

- Maže jen data daného modulu (např. jedna kalkulačka, jedna kapitola VZ).
- Zachovává SchoolProfile.
- Zachovává Identity Registry.
- Zachovává AppContext.

### B. Calculator clear — **implementováno (0E-3A)**

- Maže PHmax / NV75 relevantní data (`PHMAX_APP_LOCAL_STORAGE_KEYS` + prefix `phmax-dash-last-visit-`).
- **Nemá** se tvářit jako full reset (UI: „Vymazat data kalkulaček“).
- **Zachovává** SchoolProfile, Identity Registry, AppContext a výroční zprávu.
- **Post-export clear** po úzkém JSON (školní scénář / IS handoff) maže jen `PHMAX_SCHOOL_SCENARIO_EXPORT_WORKING_LS_KEYS` (autosave modulů + scenario label). Cross-PHmax JSON clear nenabízí. Centrální záloha clear po exportu nenabízí.

### C. School profile — **Edit / Reset Fields (0E-3B1)** a Replace policy (0E-3B2)

Rozlišujeme:

| Operace | Stav | Chování |
|---------|------|---------|
| **Edit Profile** | **Implementováno** | Úprava atributů stejné školy; `profile.id` a Identity Registry beze změny. Běžné atributy (adresa, web, ředitel, …) volně. |
| **Reset Profile Fields** | **Safe semantics implementována (0E-3B1)** | UI „Vymazat údaje profilu“. Zachová `profile.id`, `createdAt`, IČO / RED IZO / IZO. Vyčistí ostatní formulářová pole. **Nemaže** Identity Registry, AppContext, PHmax, VZ. |
| **Replace School** | **Decision complete (0E-3B2); bez samostatné runtime implementace** | V single-school architektuře použít Full Application Reset, hard reload a poté vytvořit nový profil školy. |

**Identity-sensitive guard (0E-3B1):** `readIdentityRegistryPresence()` rozlišuje `missing` | `valid` | `corrupted` | `storage_unavailable`. **missing** → legacy edit identifikátorů povolen. **valid** → změna již vyplněných IČO / RED IZO / IZO se blokuje. **corrupted** / **storage_unavailable** → fail-closed (jakákoli změna identifikátorů se blokuje; registry se neopravuje ani nepřepisuje). Běžné atributy zůstávají editovatelné. Oprava překlepu vs. nahrazení školy se nerozlišuje heuristikou.

**Legacy mismatch odstraněn:** dřívější `resetProfile` volalo `createDefaultSchoolProfile()` (nové `id`) + remove/rewrite — to 0E-3B1 nahrazuje.

### D. Full application reset — storage kontrakt a Dashboard UI (0E-3C1 / 0E-3C2)

`src/application-storage-registry.ts` obsahuje samostatný **delete registry** a raw API
`clearAllApplicationStorage()`. Whitelist maže vlastněné:

- business / modulová data (PHmax, NV75, VZ, named snapshots, scénář a lite drafty),
- SchoolProfile, Identity Registry a AppContext,
- UI / workspace stav, integrační konfiguraci IS a VZ diagnostické zálohy,
- dočasné session hints.

API nepoužívá `localStorage.clear()` ani `sessionStorage.clear()`, neparsuje payloady a zachovává
cizí klíče. Umí proto odstranit i corrupted owned data. Výsledek uvádí počet odstraněných položek
a jednotlivá selhání; po chybě pokračuje dalšími klíči.

0E-3C2 přidává jediné canonical UI na Dashboardu: doporučený centrální backup, potvrzení tokenem
`SMAZAT`, vyhodnocení výhradně podle `result.ok` a bezprostřední hard reload při úspěchu. Při
partial failure zůstává blokující recovery dialog s volbou retry nebo explicitního reloadu.

Full Reset je záměrně dostupný jen na Dashboardu, kde nejsou mountované PHmax / VZ / lite autosave
stránky. Pokud by se někdy zpřístupnil na stránce s aktivním autosave, musí se autosave komponenty
před clear odmountovat nebo respektovat explicitní reset-in-progress guard.

Full Reset je současně jedinou podporovanou cestou pro bezpečnou náhradu školy v single-school
architektuře.

### E. Remove / Replace School — policy closure (0E-3B2)

**Stav 0E-3B2: DECISION COMPLETE — NO RUNTIME IMPLEMENTATION REQUIRED FOR CURRENT SINGLE-SCHOOL
ARCHITECTURE.**

Současný kontrakt je:

```text
Replace School
=
Full Application Reset
→ hard reload
→ vytvoření nového SchoolProfile
→ nová Identity Registry / nové schoolId
```

Samostatná runtime operace Remove School, samostatný storage registry ani další destruktivní UI se
nyní neimplementují. Full Reset již poskytuje bezpečnou cestu škola A → škola B: odstraní profil,
Identity Registry, AppContext i business data školy A, takže nevzniknou orphan data a `schoolId`
školy A se nemůže tiše použít pro školu B. Současně nevzniká druhý paralelní destruktivní registry
a flow. Není doložený produktový požadavek na časté přepínání škol.

#### Vědomě přijatý UX trade-off

Full Reset je širší než hypotetický school-scoped Remove. Maže:

- 66 exact `localStorage` keys,
- 2 `localStorage` prefixes,
- 6 `sessionStorage` keys.

Hypotetický Remove School by mohl zachovat přibližně 33 device / UI preference keys, například view
modes, onboarding state, tours, wizard steps, display density a dashboard preferences. Současný
single-school kontrakt vědomě upřednostňuje bezpečnost a jednoznačnost identity před zachováním
device / UI preferencí při změně školy.

`phmax-is-handoff-endpoint` se automaticky nepovažuje za device-global preference. Může jít o
school-specific integrační konfiguraci; její lifecycle by proto před případným school-scoped Remove
vyžadoval samostatné produktové rozhodnutí.

#### Kdy rozhodnutí znovu otevřít

Samostatný Remove / Replace School se znovu posoudí, pokud vznikne konkrétní požadavek „změnit školu
a zachovat nastavení zařízení“ nebo multi-school architektura, například User → School A + School B.
V multi-school modelu Remove School nesmí být alias Full Resetu: musí jít o `schoolId`-scoped operaci,
která zachová ostatní školy, uživatelský účet a odpovídající device stav.

---

## Lifecycle tabulka (policy)

| Operace | Identity Registry | AppContext | SchoolProfile | Poznámka |
|---------|-------------------|------------|---------------|----------|
| **Centrální backup (0E-2)** | **Ano** (optional module `identity-registry`) | **Ne** | Ano (`school-profile`) | Envelope v1 aditivně; AppContext jen re-bootstrap po restore |
| **Module clear** | Zachovat | Zachovat | Zachovat | Jen data daného modulu |
| **Calculator clear (0E-3A)** | Zachovat | Zachovat | Zachovat | Inventář bez SchoolProfile; post-export jen working autosave |
| **Edit Profile (0E-3B1)** | Zachovat | Zachovat | Aktualizace atributů | Stejná School; id zachováno |
| **Reset Profile Fields (0E-3B1)** | Zachovat | Zachovat | Vyčistit atributy; zachovat id + IČO/RED IZO/IZO | Ne remove school |
| **Replace School (0E-3B2 policy)** | **Smazat přes Full Reset** | **Smazat přes Full Reset** | **Smazat; po reloadu vytvořit nový** | Bez samostatné runtime operace v single-school architektuře |
| **Full application reset (0E-3C1 / 0E-3C2)** | **Smazat** | **Smazat** | **Smazat** | Whitelist delete registry + Dashboard confirm/backup/reload flow |

---

## Backup policy (implementováno od 0E-2)

Envelope zůstává:

```text
format = reditelsky-pruvodce-backup
schemaVersion = 1
```

Současný kontrakt:

1. Identity Registry je exportována jako **optional** backup module `identity-registry`.
2. AppContext zůstává záměrně mimo běžnou zálohu.
3. Aditivní modul nezvýšil envelope `schemaVersion`.

Staré zálohy bez identity zůstávají validní `schemaVersion: 1`.

Identity Registry je v centrálním backupu od 0E-2. AppContext se do exportu nezapisuje.

---

## Restore policy (kontrakt pro budoucí implementaci)

Restore centrální zálohy zatím **není implementován** (fáze 2 v [backup-and-restore.md](./backup-and-restore.md)). Následující pravidla jsou kontrakt, ne kód:

| Scénář | Požadované chování |
|--------|-------------------|
| Prázdný browser + backup s identity | Identity lze obnovit (replace do prázdného úložiště), poté moduly |
| Stejné `schoolId` v browseru i backupu | Explicitní **replace** policy (uživatelské potvrzení); žádný tichý částečný merge |
| Jiné `schoolId` | **Žádný silent merge**; reject / hard stop (schema v1 = jedna škola) |
| Legacy backup bez identity | Obnovit moduly → bootstrap identity z obnoveného SchoolProfile (bez fake profilu, bez date fallback roku) |
| Corrupted identity v backupu | Neoverwrite lokální validní registry; reportovat chybu |
| AppContext po restore | Vždy validate / bootstrap; neaplikovat slepě pointery ze zálohy (záloha AppContext ani neobsahuje) |

Žádný silent conflict resolution bez explicitní policy a UI.

---

## Source of truth (po 0F / 0G)

| Vrstva | Role |
|--------|------|
| **SchoolProfile** (`reditelsky-pruvodce-school-profile-v1`) | **Write source of truth** profilových polí (edit přes Profile / VZ prefill writers) |
| **VZ main state** (`vyrocni-zprava-state-v1` → `report.schoolYear`) | **Write source of truth** year labelu výroční zprávy |
| **Identity Registry** | Stabilní School / SchoolYear **identity metadata** (`schoolId`, `schoolYearId`) |
| **AppContext** | Device / workspace **pointer** (`activeSchoolId`, `activeSchoolYearId`) — ne business data |
| **Domain School / SchoolYear** | Read-only **projekce** z legacy dat + Identity |
| **DataRepository** | Read boundary; **žádné domain School write API** |

Profilová pole se neukládají paralelním zápisem do Identity Registry. SchoolYear **label**
se neukládá druhým write source of truth — metadata helper čte persistovaný VZ label a
propojuje ho se stabilní `schoolYearId`.

Identity se při Profile bindingu vytváří / reuseuje z persistovaného SchoolProfile
(a volitelně SchoolYear z validního VZ year hintu při prvním bootstrapu AppContext).
Po 0G-2 SchoolYear metadata sync navíc reaguje na každý **úspěšný VZ persist** validního roku.

---

## 0F — Profile platform runtime (COMPLETE)

0F zapojilo Identity / AppContext do **Profil školy**. PHmax / NV75 a Dashboard platform binding
**nevolají**. VZ (0G) je druhý runtime consumer SchoolYear metadata — viz sekce 0G níže.

### Implementované řezy

| Řez | Kontrakt |
|-----|----------|
| **0F-1** | `ensureSchoolPlatformBinding()` — empty / ready / typed error; no ghost identity bez profilu |
| **0F-2A** | Truthful SchoolProfile persistence (`persistence.ok`); cache+emit až po úspěšném `setItem` |
| **0F-2B** | Explicitní úspěšný Save → platform binding (soft metadata warning při chybě; profil zůstává uložen) |
| **0F-2C** | Mount / legacy persistovaný profil → lazy binding (empty = bez warningu; error = mount-specific copy) |
| **0F-3A** | Shared corrupted-profile **write guard** — Save / update / reset / migrace nepřepisují corrupted bytes |
| **0F-3B** | Corrupted / storage-unavailable **recovery UI** na ProfilSkolyPage; žádný force overwrite |

### Production binding triggers

Jediné produkční volání `ensureSchoolPlatformBinding` (přes serialized runner na ProfilSkolyPage):

1. **Mount** — již persistovaný SchoolProfile (legacy / reload)
2. **Explicitní úspěšný Save** — po `persistence.ok === true`

**Není** binding v: Dashboard, Výroční zpráva, PHmax / NV75, App.tsx global bootstrap.

### Empty / new School

```text
missing SchoolProfile
→ mount ensure = empty
→ žádná Identity Registry
→ žádný school-bound AppContext

první successful Save
→ Identity Registry + activeSchoolId
```

### Legacy persistovaný profil

```text
mount → lazy binding
valid UUID profile.id → reuse jako schoolId
non-UUID profile.id → nový canonical UUID schoolId; profile.id se nepřepisuje
```

### Corrupted SchoolProfile

```text
corrupted persisted SchoolProfile
→ běžné Save / updateProfile / resetProfile blokovány (profile_corrupted)
→ raw bytes se nepřepisují
→ shared cache / emit se necommitují
→ platform binding nevzniká
→ Profile page: recovery state (ne falešný prázdný formulář)
→ žádný force overwrite / „Přepsat poškozený profil“
→ bezpečná Replace School cesta = Full Application Reset
```

`storage_unavailable` **≠** `profile_corrupted`. Storage unavailable má samostatnou UI copy a
**nepředstírá**, že Full Reset tento stav jistě opraví.

Centrální backup: corrupted SchoolProfile se do envelope jako validní data **nezahrnuje**
(module-level read error; ostatní moduly pokračují) — viz [backup-and-restore.md](./backup-and-restore.md).

### PROFILE RUNTIME SAFETY status

```text
PROFILE RUNTIME SAFETY = COMPLETE
(pro současnou single-school architekturu)
```

**Limity (záměrné, platí i po 0G):**

- School binding zůstává Profile-scoped (0F),
- žádný React Platform / ActiveSchool provider,
- žádný App.tsx global bootstrap,
- SchoolYear metadata z validního VZ hintu / persistu (bez inventování aktuálního roku).

---

## 0G — SchoolYear / VZ metadata runtime (COMPLETE)

0G uzavírá SchoolYear platform metadata pro současnou single-school / single-flat-VZ architekturu.

### Implementované řezy

| Řez | Kontrakt |
|-----|----------|
| **0G-0** | Fresh VZ default `schoolYear = ""` — žádný fake authoritative year, žádný current-date fallback |
| **0G-1** | `ensureVzSchoolYearPlatformBinding()` — school-first helper; žádné produkční call sites samostatně |
| **0G-2** | Successful VZ persist → serialized SchoolYear metadata sync v `useVyrocniZpravaReport.persist()` |

### 0G-0 — Fresh vs legacy year label

**Fresh VZ** (chybí LS nebo nový default shell):

```text
schoolYear = ""
```

Důvod: žádný fake authoritative year, žádný current-date fallback, žádná SchoolYear identity jen
kvůli defaultu.

**Legacy / existující persistovaný validní label** (např. `2024/2025`):

```text
zůstává authoritative
→ žádná migrace na empty
→ žádná heuristika podle konkrétního roku
```

### Jediný SchoolYear metadata runtime trigger (0G-2)

```text
saveVyrocniZpravaStorage(...) FAIL
→ ensureVzSchoolYearPlatformBinding() = 0×

saveVyrocniZpravaStorage(...) OK
→ serialized metadata sync smí běžet
```

**Není** samostatný mount binding pro SchoolYear. First-mount reconcile vzniká přes existující
first autosave VZ (`useEffect` na `report` / `selectedSectionId`).

Production path:

```text
useVyrocniZpravaReport.persist()
→ createSerializedVzSchoolYearBindingRunner().afterPersist({ ok: true })
→ ensureVzSchoolYearPlatformBinding()
```

### Helper result semantics

| Result | Význam | UI |
|--------|--------|-----|
| `ready` | Metadata synchronized (`schoolYearId`, `startYear`) | žádný warning |
| `noop` / `no_valid_year` | School ready, persisted year empty/invalid | žádný warning; **active pointer se nemaže** |
| `empty` | Missing SchoolProfile | žádný blocking warning; VZ může dál fungovat |
| `error` | Metadata sync failure | soft `schoolYearMetadataNotice`; **VZ business save zůstává success** |

### Business vs metadata failure (oddělené domény)

```text
VZ persistence OK + metadata ERROR
→ savedAt = success
→ saveIssue = cleared
→ schoolYearMetadataNotice = soft warning
→ VZ report / schoolYear string beze změny
```

Metadata failure **nesmí** rollbackovat VZ, vytvářet `saveIssue`, rušit úspěšný `savedAt` ani měnit
`report.schoolYear`.

### Year A → B

```text
persisted VZ year A (valid) + successful persist
→ SchoolYear identity A
→ activeSchoolYearId = A

změna na validní B + successful persist
→ create/reuse SchoolYear B
→ activeSchoolYearId = B
→ A zůstává v Identity Registry (nemaže se)
```

VZ sections / personnel / flat storage keys se nemění.

### Invalid intermediate label

Při psaní roku může autosave persistovat mezistavy (`2026/`, `2026/2`, …):

```text
successful persist invalid label
→ helper noop
→ activeSchoolYearId zůstává na posledním validním year A
→ žádný current-date fallback

successful persist valid "2026/2027"
→ helper ready
→ active B
```

### KRITICKÝ LIMIT — activeSchoolYearId ≠ dataset switch

VZ business storage je stále **flat** (není `schoolYearId`-scoped):

- `vyrocni-zprava-state-v1` (main)
- `vyrocni-zprava-personnel-data-v1`
- `vyrocni-zprava-section*-data-v1`

Proto v této fázi:

```text
activeSchoolYearId
= platform identity odpovídající aktuálnímu persistovanému VZ year labelu

≠ přepínání mezi samostatnými výročními zprávami za více školních roků
```

### Dva runtime consumery (bez provideru)

| Consumer | Scope | Binding |
|----------|-------|---------|
| **Profil školy** | School identity | `ensureSchoolPlatformBinding()` — mount + Save |
| **Výroční zpráva** | SchoolYear metadata | `ensureVzSchoolYearPlatformBinding()` — po successful VZ persist |

Žádný App-level provider. Lokální lazy orchestration (serialized runner + generation guard) je
dostačující.

VZ reuseuje `ensureSchoolPlatformBinding()` uvnitř SchoolYear helperu (school-first); nemá vlastní
School bootstrap.

### Full Reset po 0G

Full Reset maže SchoolProfile, Identity Registry, AppContext, VZ i ostatní owned business data.

Po resetu:

```text
fresh VZ schoolYear = ""
→ successful first autosave
→ helper noop
→ žádná SchoolYear metadata
```

### Known limitations / debt (0G closure)

| ID | Finding | Status |
|----|---------|--------|
| A | Každý successful VZ autosave může vyvolat redundantní metadata sync / AppContext rewrite | Correctness OK; performance optimization deferred |
| B | Po failed VZ save může zůstat starý `savedAt` vedle nového `saveIssue` | Existing UX debt; mimo 0G |
| C | Po pozdějším VZ save failure může zůstat starý `schoolYearMetadataNotice` z předchozího metadata pokusu | Known UX debt; ne correctness issue |
| D | Flat VZ storage — žádné multi-year dataset switching | Záměrný architektonický limit |

### SCHOOLYEAR / VZ METADATA RUNTIME status

```text
SCHOOLYEAR / VZ METADATA RUNTIME = COMPLETE
(pro současnou single-school / single-flat-VZ architekturu)
```

---

## Co tento dokument záměrně neřeší

- Implementaci restore (fáze 2) — **doporučená nejbližší fáze** po 0G (viz níže)
- Budoucí multi-school / `schoolId`-scoped Remove School
- Dashboard Active School consumer, PHmax namespaced storage
- App-level provider / global bootstrap (zatím není potřeba)
- Multi-year VZ dataset switching / namespaced section storage
- SchoolYear selector redesign

### Doporučené pořadí po 0G

**Restore (fáze 2)** má prioritu před migrací business storage na `schoolId`-`schoolYearId`-scoped
klíče. Od 0G už platform metadata aktivně řídíme ve dvou runtime oblastech (Profile + VZ); restore
musí respektovat Identity Registry, VZ `schoolYear` label a post-restore AppContext bootstrap.
