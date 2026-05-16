# PHmax webapp

Jedna React aplikace (Vite) s několika kalkulačkami maximálního rozsahu přímé pedagogické činnosti a souvisejících výpočtů. Přepínání modulů: parametr URL `?view=` nebo přehled na úvodní obrazovce.

| `view` | Modul |
|--------|--------|
| `dash` | Přehled a rychlý start |
| `zs` | Základní školy (PHmax / PHAmax, § 16/9, …) |
| `pv` | Přípravná třída |
| `sd` | Školní družina |
| `ss` | Střední školy (orientační PHmax, PrŠ PHAmax) |
| `nv75` | NV 75 – zástupce (banka odpočtů) |

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

## Struktura (zkráceně)

- `src/App.tsx` – routování podle `view`
- `src/phmax-zs-*` – logika a UI základních škol
- `src/PhmaxPvPage.tsx`, `PhmaxSdPage.tsx`, `PhmaxNv75DeputyPage.tsx` – další produkty
- `src/ss/` – střední školy (`phmax-ss-logic.ts`, dataset, formulář jednotek)
- `src/styles.css` – společné styly

## Rozsah modulu SŠ (verze 0.2)

- **PHmax:** orientační výpočet po řádcích (dataset NV, režimy jednoobor / víceobor / přechodné), kontrola pravidel vyhl. č. 13/2005 Sb.
- **PHAmax:** součet jen pro Praktickou školu (`78-62-C/01`, `78-62-C/02`, denní forma) podle tabulky metodiky v3/2026.
- **§ 16 odst. 9:** přepínač na řádku, kontrola business rules a upozornění; **plný výpočet PHmax dle metodiky zatím není** (hodnota v náhledu je orientační z běžného datasetu).
- **Mimo rozsah:** další dílčí výpočty PHAmax dle metodiky, školní agregace průměrů podle § 4 – plný postup MŠMT.

Metodika: [MŠMT – PHmax pro SŠ 2026](https://msmt.gov.cz/vzdelavani/skolstvi-v-cr/ekonomika-skolstvi/metodika-vypoctu-phmax-pro-ss-2026).

## NV75 changelog (aktuální vydání)

- Nová auditní vrstva ve výsledcích NV75: u každého pracoviště se zobrazuje použité pásmo přílohy (`Příloha 2/3`) a pravidlo bonusu `§4d`.
- Audit je viditelný přímo v tabulce výsledků (nejen v exportu), včetně stručných metodických poznámek pro OV řádky.
- Připomenutí pro kontrolu výstupu: celková banka se skládá ze základu `§4b` + bonusů `§4c` a `§4d`, což je v tabulce explicitně označeno.

## NV75 acceptance checklist (pro předání)

- Ověřit 1–2 referenční příklady z metodiky NV75 a porovnat `Banka odpočtů celkem`.
- Zkontrolovat auditní sloupec u každého pracoviště (`§4b` pásmo + text `§4d`).
- Exportovat CSV/XLSX a uložit podklad s `Verze metodiky` + `Datum a čas exportu (archivní razítko)`.
- U OV scénáře ověřit textový výstup funkcí (vyhl. 13/2005) a mezihodnotu `OV – ekvivalent skupin`.
- Před releasem spustit `npm run test:golden` a `npm run build`.
