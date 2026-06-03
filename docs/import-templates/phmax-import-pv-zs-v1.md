# CSV šablony importu PHmax – PV + ZŠ (návrh v1)

**Stav:** pilot **PV + ZŠ** v aplikaci (dashboard – šablona Excel + import). Fáze C: ŠD, SŠ, detail ZŠ.  
**Cíl:** jednoduchý import z evidence školy bez JSON skillů.

## Soubory

| Soubor | Modul | Účel |
|--------|-------|------|
| `phmax-import-meta-v1.example.csv` | – | Škola, rok, název scénáře |
| `phmax-import-pv-v1.example.csv` | PV | Řádky pracovišť MŠ |
| `phmax-import-zs-summary-v1.example.csv` | ZŠ | Souhrn PHmax (základní stupně, inkluze, přípravka ZŠ) |

Po importu IT / skript sestaví JSON `moduleSnapshots.pv` a `moduleSnapshots.zs` ve tvaru autosave aplikace.

## Společná pravidla

- Kódování: **UTF-8**, oddělovač **středník `;`** (Excel CZ) nebo čárka – jedna volba v dokumentaci zřizovatele.
- První řádek = hlavička (názvy sloupců).
- Čísla: desetinná čárka `,` nebo tečka `.` – transformační skript musí normalizovat.
- Prázdné buňky = 0 nebo výchozí (viz sloupec).
- `school_id` + `scenario_label` musí být shodné ve všech souborech jedné dávky.

---

## 1. Meta – `phmax-import-meta-v1`

| Sloupec | Povinné | Příklad | Mapování |
|---------|---------|---------|----------|
| `school_id` | ano | `zs-praha-123` | Interní ID školy v IS |
| `school_name` | ne | `ZŠ a MŠ Ukázka` | Pouze pro archiv |
| `school_year` | ne | `2025/2026` | Text |
| `scenario_label` | ano | `Import z IS 2026-05` | `scenarioLabel` v JSON scénáře |
| `schema_version` | ano | `phmax-import-pv-zs-v1` | Verze šablony |

---

## 2. PV – `phmax-import-pv-v1`

Jeden řádek = jedno pracoviště (mateřská škola).

| Sloupec | Povinné | Příklad | Mapování do autosave |
|---------|---------|---------|----------------------|
| `school_id` | ano | `zs-praha-123` | – |
| `scenario_label` | ano | `Import z IS 2026-05` | – |
| `row_key` | ano | `pv-1` | `id` (řetězec, unikátní v dávce) |
| `label` | ne | `Budova A` | `label` |
| `provoz` | ano | `celodenni` | `provoz` – viz hodnoty níže |
| `class_count` | ano | `4` | `classCount` |
| `avg_hours` | ano | `8` | `avgHours` |
| `sec16_count` | ne | `0` | `sec16Count` |
| `language_groups` | ne | `0` | `languageGroups` |

**Hodnoty `provoz`:** `polodenni` | `celodenni` | `internat` | `zdravotnicke`

**Fáze 2 (volitelné sloupce PV):** `pv1d_actual_children`, `pv1d_minimum_children`, `pv1d_ku_phmax_cap`, `pv1d_exemption` (0/1) – § 1d; bez nich aplikace doplní výchozí nulu / false.

**Výstupní JSON (fragment):**

```json
{
  "rows": [
    {
      "id": "pv-1",
      "label": "Budova A",
      "provoz": "celodenni",
      "classCount": 4,
      "avgHours": 8,
      "sec16Count": 0,
      "languageGroups": 0
    }
  ]
}
```

---

## 3. ZŠ souhrn – `phmax-import-zs-summary-v1`

Jeden řádek = jedna škola (ne více řádků tříd). Vhodné pro první napojení z agregátů IS (počty tříd/žáků).

| Sloupec | Povinné | Příklad | Mapování |
|---------|---------|---------|----------|
| `school_id` | ano | `zs-praha-123` | – |
| `scenario_label` | ano | `Import z IS 2026-05` | – |
| `basic_type` | ano | `full_more_than_2` | `basicType` – viz hodnoty |
| `basic1_classes` | ne | `10` | `basic1Classes` |
| `basic1_pupils` | ne | `250` | `basic1Pupils` |
| `basic2_classes` | ne | `8` | `basic2Classes` |
| `basic2_pupils` | ne | `225` | `basic2Pupils` |
| `incl1_classes` | ne | `0` | `incl1Classes` |
| `incl1_pupils` | ne | `0` | `incl1Pupils` |
| `incl2_classes` | ne | `0` | `incl2Classes` |
| `incl2_pupils` | ne | `0` | `incl2Pupils` |
| `prep_classes` | ne | `2` | `prepClasses` (přípravná třída **u ZŠ**) |
| `prep_children` | ne | `40` | `prepChildren` |
| `export_label` | ne | `Import IS` | `exportLabel` |

**Hodnoty `basic_type`:**  
`full_more_than_2` | `full_max_2` | `first_only_1` | `first_only_2` | `first_only_3` | `first_only_4`

**Po importu** skript nastaví `tab: "phmax"`, prázdné pole řádků (`psychRows`, `healthRows`, …) jako `[]`, `mode: "basic"`. Uživatel v aplikaci doplní specializované sekce nebo použije ukázku.

**Fáze 2 ZŠ (samostatné soubory, volitelně):**

- `phmax-import-zs-psych-v1.csv` – řádky školního psychologa  
- `phmax-import-zs-health-v1.csv` – zdravotní třídy  
- `phmax-import-zs-pha-v1.csv` / `php` – jiné záložky  

---

## Transformační skript (ukázka)

Z repozitáře (vyžaduje síť pro jednorázové stažení `tsx`):

```bash
npm run import:csv-handoff
```

Výchozí vstupy: `phmax-import-*-v1.example.csv` v této složce.  
Výstup: `phmax-is-handoff.generated.json` (`phmax-is-handoff-v1`).

Vlastní cesty:

```bash
npx --yes tsx scripts/csv-to-phmax-handoff.ts --meta ./meta.csv --pv ./pv.csv --zs ./zs.csv --out ./handoff.json
```

**Použití ve škole (aplikace):**

1. Dashboard Σ → **Stáhnout šablonu Excel** (listy Návod, Meta, PV, ZŠ).
2. Vyplnit a uložit `.xlsx` (nebo tři CSV se středníkem).
3. **Import ze školy** → vybrat soubor → náhled → **Načíst do kalkulaček PV a ZŠ**.
4. Ověřit moduly PV a ZŠ a součet na dashboardu.

**IT (bez UI):** `npm run import:csv-handoff`, případně `npm run import:handoff-apply-snippet` pro konzoli (`applyPhmaxIsHandoffToLocalStorage`).

## Kontrola po transformaci

1. Spustit `npm run import:csv-handoff` – ověřit součty v konzoli.  
2. Otevřít PV a ZŠ v aplikaci – přepočet PHmax po načtení snapshotů.  
3. Dashboard Σ – `coherenceWarnings` musí být prázdné po uložení modulů.

## Odmítnutí / mimo šablonu v1

- MŠ v polích ZŠ (`prep_*` je přípravná u **ZŠ**, ne oddělení MŠ – MŠ jen v PV).  
- ŠD, SŠ, NV75 – další soubory `phmax-import-sd-v1`, `phmax-import-ss-v1`, …

Související: [../import-from-school-0.4.0.md](../import-from-school-0.4.0.md)
