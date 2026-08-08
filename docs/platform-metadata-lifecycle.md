# Platform metadata lifecycle — Identity Registry & AppContext

Tento dokument formalizuje lifecycle dvou platformových persistence klíčů zavedených ve Fázi 0 (PR 0B–0D), **před** jejich runtime wiringem do Page komponent.

Stav k PR 0E-1: dokumentace a kontrakt. **Žádná změna runtime behavior** v tomto PR.

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
- Musí být součástí **centrální uživatelské zálohy** (budoucí optional module `identity-registry` ve envelope v1).
- **Nesmí** být součástí module-specific clear.
- **Full application / factory reset** ji odstraní.
- Restore **nesmí** silent-merge různá `schoolId`.
- Stabilní `schoolId` / `schoolYearId` musí při přenosu zálohy mezi browsery / zařízeními **přežít**.

### Clear profile ≠ bezpečné „vždy zachovat Identity Registry“

**Nedokumentujeme** jako obecný bezpečný princip pravidlo „vymazání SchoolProfile vždy zachová Identity Registry“.

Problém: pokud je SchoolProfile odstraněn a do stejného browseru je později zadána **jiná škola**, zachovaná Identity Registry by mohla nové škole přiřadit **původní `schoolId`**. To by smíchalo logickou identitu školy A se školou B.

Rozlišujeme tři koncepty:

| Koncept | Význam | Identity lifecycle |
|---------|--------|--------------------|
| **1. Edit profile** | Stejná logická škola; uživatel mění údaje profilu | Identity se **zachovává** (0E-3B1) |
| **2. Reset Profile Fields** | Vyčištění formulářových atributů stejné školy | Identity + IČO/RED IZO/IZO **zachovány** (0E-3B1) |
| **3. Remove / Replace School / Full reset** | Odstranění nebo výměna logické školy / factory reset | Identity **smazat** (TBD 0E-3B2 / 0E-3C); nesmí reuse schoolId A → B |

V tomto PR se **nevytváří** runtime funkce „nahradit školu“.

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

### C. School profile — **Edit / Reset Fields (0E-3B1)** vs Remove (TBD)

Rozlišujeme:

| Operace | Stav | Chování |
|---------|------|---------|
| **Edit Profile** | **Implementováno** | Úprava atributů stejné školy; `profile.id` a Identity Registry beze změny. Běžné atributy (adresa, web, ředitel, …) volně. |
| **Reset Profile Fields** | **Safe semantics implementována (0E-3B1)** | UI „Vymazat údaje profilu“. Zachová `profile.id`, `createdAt`, IČO / RED IZO / IZO. Vyčistí ostatní formulářová pole. **Nemaže** Identity Registry, AppContext, PHmax, VZ. |
| **Remove / Replace School** | **TBD 0E-3B2 / 0E-3C** | Explicitní destruktivní operace; nesmí tiše mapovat školu B na `schoolId` A. |

**Identity-sensitive guard (0E-3B1):** `readIdentityRegistryPresence()` rozlišuje `missing` | `valid` | `corrupted` | `storage_unavailable`. **missing** → legacy edit identifikátorů povolen. **valid** → změna již vyplněných IČO / RED IZO / IZO se blokuje. **corrupted** / **storage_unavailable** → fail-closed (jakákoli změna identifikátorů se blokuje; registry se neopravuje ani nepřepisuje). Běžné atributy zůstávají editovatelné. Oprava překlepu vs. nahrazení školy se nerozlišuje heuristikou.

**Legacy mismatch odstraněn:** dřívější `resetProfile` volalo `createDefaultSchoolProfile()` (nové `id`) + remove/rewrite — to 0E-3B1 nahrazuje.

### D. Full application reset — low-level storage kontrakt (0E-3C1)

`src/application-storage-registry.ts` obsahuje samostatný **delete registry** a raw API
`clearAllApplicationStorage()`. Whitelist maže vlastněné:

- business / modulová data (PHmax, NV75, VZ, named snapshots, scénář a lite drafty),
- SchoolProfile, Identity Registry a AppContext,
- UI / workspace stav, integrační konfiguraci IS a VZ diagnostické zálohy,
- dočasné session hints.

API nepoužívá `localStorage.clear()` ani `sessionStorage.clear()`, neparsuje payloady a zachovává
cizí klíče. Umí proto odstranit i corrupted owned data. Výsledek uvádí počet odstraněných položek
a jednotlivá selhání; po chybě pokračuje dalšími klíči.

**0E-3C1 neimplementuje UI ani reload.** Bezpečný uživatelský flow (confirm, backup CTA a hard reload)
zůstává pro 0E-3C2. Remove / Replace School zůstává pro 0E-3B2.

---

## Lifecycle tabulka (policy)

| Operace | Identity Registry | AppContext | SchoolProfile | Poznámka |
|---------|-------------------|------------|---------------|----------|
| **Centrální backup (cíl)** | **Ano** (optional module `identity-registry`) | **Ne** | Ano (již dnes jako `school-profile`) | Envelope v1 aditivně; AppContext jen re-bootstrap po restore |
| **Module clear** | Zachovat | Zachovat | Zachovat | Jen data daného modulu |
| **Calculator clear (0E-3A)** | Zachovat | Zachovat | Zachovat | Inventář bez SchoolProfile; post-export jen working autosave |
| **Edit Profile (0E-3B1)** | Zachovat | Zachovat | Aktualizace atributů | Stejná School; id zachováno |
| **Reset Profile Fields (0E-3B1)** | Zachovat | Zachovat | Vyčistit atributy; zachovat id + IČO/RED IZO/IZO | Ne remove school |
| **Remove / Replace School** | **TBD 0E-3B2 / 0E-3C** | Sanitize / smazat | Smazat / nahradit | Nesmí tiše mapovat školu B na ID školy A |
| **Full application reset (low-level 0E-3C1)** | **Smazat** | **Smazat** | **Smazat** | Whitelist delete registry; UI/reload až 0E-3C2 |

---

## Backup policy (budoucí implementace — ne 0E-1)

Envelope zůstává:

```text
format = reditelsky-pruvodce-backup
schemaVersion = 1
```

Doporučená budoucí změna (samostatný PR, např. 0E-3):

1. Přidat **optional** backup module `identity-registry`.
2. **Nepřidávat** AppContext do běžné zálohy.
3. Envelope `schemaVersion` **nezvyšovat** jen kvůli aditivnímu modulu.

Staré zálohy bez identity zůstávají validní `schemaVersion: 1`.

**V PR 0E-1 se backup kód nemění** — Identity Registry ani AppContext se dnes do exportu nezapisují.

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
- Runtime „replace school“ / Remove School identity wipe (0E-3B2)
- Full application reset (0E-3C)

Ty patří do pozdějších PR (0E-3B2/C, 0F, restore fáze).
