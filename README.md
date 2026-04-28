# PHmax kalkulačka ZŠ

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

## Struktura
- `src/phmax-zs-logic.ts` – tabulky, typy, helpery, export CSV
- `src/phmax-zs-ui.tsx` – malé UI komponenty
- `src/App.tsx` – hlavní aplikace
- `src/styles.css` – jednoduché styly

## NV75 changelog (aktuální vydání)
- Nová auditní vrstva ve výsledcích NV75: u každého pracoviště se zobrazuje použité pásmo přílohy (`Příloha 2/3`) a pravidlo bonusu `§4d`.
- Audit je viditelný přímo v tabulce výsledků (nejen v exportu), včetně stručných metodických poznámek pro OV řádky.
- Připomenutí pro kontrolu výstupu: celková banka se skládá ze základu `§4b` + bonusů `§4c` a `§4d`, což je v tabulce explicitně označeno.

## NV75 acceptance checklist (pro předání)
- Ověřit 1-2 referenční příklady z metodiky NV75 a porovnat `Banka odpočtů celkem`.
- Zkontrolovat auditní sloupec u každého pracoviště (`§4b` pásmo + text `§4d`).
- Exportovat CSV/XLSX a uložit podklad s `Verze metodiky` + `Datum a čas exportu (archivní razítko)`.
- U OV scénáře ověřit textový výstup funkcí (vyhl. 13/2005) a mezihodnotu `OV – ekvivalent skupin`.
- Před releasem spustit `npm run test:golden` a `npm run build`.
