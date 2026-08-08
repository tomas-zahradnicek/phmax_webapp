# Platform metadata lifecycle — Identity Registry & AppContext

Tento dokument formalizuje lifecycle dvou platformových persistence klíčů zavedených ve Fázi 0
(PR 0B–0D) a navazující bezpečnostní kontrakty uzavřené před jejich runtime wiringem do Page
komponent.

Stav po 0E-3B2: lifecycle rozhodnutí Fáze 0 jsou uzavřena; dalším krokem je 0F — runtime wiring
nové platformové vrstvy.

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

## Co tento dokument záměrně neřeší

- Runtime wiring Identity / AppContext do Pages
- Implementaci restore
- Budoucí multi-school / `schoolId`-scoped Remove School

## Přechod na 0F

Před 0F jsou uzavřeny:

- stable identity,
- AppContext,
- repository read layer,
- backup lifecycle,
- calculator clear,
- profile reset semantics,
- Full Application Reset,
- Replace School policy.

Dalším krokem je **0F — runtime wiring nové platformové vrstvy**. Preferovaným prvním wiringem je
School Profile.
