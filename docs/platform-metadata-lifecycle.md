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
| **1. Edit profile** | Stejná logická škola; uživatel mění údaje profilu | Identity se **zachovává** |
| **2. Reset / remove school profile** | Současný legacy `clearSchoolProfileStorage()` / UI „vymazat profil“ | Nemá dost kontextu k bezpečnému rozhodnutí (stejná škola vs. výměna školy). **Bod k řešení v PR 0E-3 / 0F** — zatím žádná runtime „replace school“ funkce |
| **3. Full application / factory reset** | Úplný reset aplikace v browseru | Odstraní SchoolProfile, Identity Registry, AppContext i business/modulová data dle full-reset inventáře |

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

### B. Calculator clear

- Maže PHmax / NV75 relevantní data.
- **Nemá** se tvářit jako full reset.
- **Legacy mismatch (současný kód):** dashboard akce přes `clearAllPhmaxLocalStorage()` maže i `reditelsky-pruvodce-school-profile-v1`, zatímco UI text mluví o „datech kalkulaček“. Označeno k opravě v pozdějším clear-policy PR — v 0E-1 se behavior **nemění**.

### C. School profile reset

- Vyžaduje **explicitní identity policy** před runtime wiringem EntityId do modulů.
- Nesmí tiše převést identitu školy A na školu B (viz výše).
- Do řešení v 0E-3 / 0F: legacy clear profilu zůstává; identity lifecycle při resetu profilu není v runtime bezpečně uzavřen.

### D. Full application reset

Odstraní (dle explicitního inventáře v implementačním PR):

- business / modulová data (PHmax, NV75, VZ, …),
- SchoolProfile,
- Identity Registry,
- AppContext,
- relevantní diagnostická data (např. VZ diagnostic backup klíče), pokud jsou v inventáři full resetu.

V aplikaci zatím **neexistuje** kompletní factory-reset API — toto je cílový kontrakt.

---

## Lifecycle tabulka (policy)

| Operace | Identity Registry | AppContext | SchoolProfile | Poznámka |
|---------|-------------------|------------|---------------|----------|
| **Centrální backup (cíl)** | **Ano** (optional module `identity-registry`) | **Ne** | Ano (již dnes jako `school-profile`) | Envelope v1 aditivně; AppContext jen re-bootstrap po restore |
| **Module clear** | Zachovat | Zachovat | Zachovat | Jen data daného modulu |
| **Calculator clear (cíl)** | Zachovat | Zachovat | Zachovat | Dnešní clear i SchoolProfile = legacy mismatch |
| **Profile reset (edit)** | Zachovat | Zachovat / sanitize | Aktualizace dat | Stejná logická škola |
| **Profile reset (remove)** | **TBD 0E-3 / 0F** | Sanitize / TBD | Smazat | Nesmí tiše mapovat školu B na ID školy A |
| **Full application reset** | **Smazat** | **Smazat** | **Smazat** | Včetně business dat dle inventáře |

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
- Změnu `backup-registry.ts` / exportu
- Implementaci restore
- Implementaci full factory reset
- Runtime „replace school“
- Opravu legacy calculator clear (SchoolProfile)

Ty patří do pozdějších PR (0E-2+, 0F, restore fáze).
