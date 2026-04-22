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

## Struktura
- `src/phmax-zs-logic.ts` – tabulky, typy, helpery, export CSV
- `src/phmax-zs-ui.tsx` – malé UI komponenty
- `src/App.tsx` – hlavní aplikace
- `src/styles.css` – jednoduché styly
