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

## Co zatím neimplementovat

- Přímý upload do ISŠ, EduPage, Excel šablony zřizovatele.
- Podpis / archivace s právní platností.

## Další krok

Po schválení šablony zřizovatele doplnit konkrétní mapování sloupců v `build*ExportRows` funkcích.
