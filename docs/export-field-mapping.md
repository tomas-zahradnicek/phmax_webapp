# Mapování exportů – návrh vůči oficiálním výstupům

Orientační dokument (bez API integrace). Slouží jako podklad pro budoucí napojení na systémy školy / zřizovatele.

## Současný stav aplikace

| Modul | Formát | Obsah |
|-------|--------|--------|
| PV, ŠD, ZŠ, SŠ, NV75 | CSV / XLSX | Řádky výpočtu, metadata (verze, datum, označení exportu) |
| Všechny moduly | JSON audit | Snapshot vstupů a souhrnných čísel pro kontrolu |
| Dashboard Σ | JSON | `phmax-school-scenario-v1` – cross-PHmax + autosave modulů |

## Navrhované mapování (MŠMT / interní evidence)

| Pole exportu (aplikace) | Cíl v evidenci školy | Poznámka |
|-------------------------|----------------------|----------|
| `PHmax celkem` (PV/ŠD/ZŠ/SŠ) | Kapacita PPČ pracoviště / družiny / školy | Orientační; ověřit vůči metodice |
| `PHAmax` | Samostatný strop asistentů § 16 | PV/ZŠ – ne sčítat do PHmax |
| `PHPmax` | Samostatný strop PHP | Pouze ZŠ |
| Banka NV75 | Hodiny odpočtů zástupce | Jiná jednotka než PHmax |
| `_phmaxAuditTotals` (ZŠ autosave) | Interní kontrola před exportem | Už v localStorage |

## Dashboard Σ (0.3.13)

| Stav v UI | Význam pro integrátora |
|-----------|------------------------|
| modul nevyplněn | V `moduleSnapshots` chybí nebo je prázdný autosave – nepočítat do součtu |
| PHmax = 0 | Modul vyplněn, výsledek nula – započítat do cross-součtu jako 0 |
| `coherenceWarnings` | Nesoulad KPI vs. přepočet – ruční oprava před importem |

## Co zatím neimplementovat (0.4.0)

- Přímý upload do ISŠ, EduPage, Excel šablony zřizovatele – **až po dodání schválené šablony sloupců**.
- Podpis / archivace s právní platností.

## Další krok (po rozhodnutí zřizovatele / IS)

1. Schválit šablonu importu u dodavatele IS (handoff `phmax-is-handoff-v1` je připraven – viz `docs/phmax-is-integration.md`).
2. Doplnit konkrétní mapování sloupců v `build*ExportRows` a případně volitelný CSV export podle šablony.
3. Cross-PHmax a audit `_phmaxAuditTotals` používat jen jako kontrolu před odesláním – ne jako závazný výkaz.
