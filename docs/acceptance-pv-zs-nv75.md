# Acceptance checklist – PV, ZŠ, NV75 (bez SŠ)

Orientační kontrola před předáním nebo release. Automatizovaný smoke: `npm run test:e2e` (Playwright – mobilní viewport + desktop projekt `desktop-chrome`: dashboard deep-link, TOC a modulový smoke). Stav sloupce **OK**: `E2E` = pokryto mobilním nebo desktop smoke, `contract` = unit test na zdrojový kód, `ručně` = vyžaduje lidské ověření.

## Rozhodnutí: PV § 1d odst. 3 (krácení PHmax)

| Varianta | Stav |
|----------|------|
| **Plný výpočet krácení** | Záměrně **mimo scope** – vyžaduje právní parametry (nejnižší počet dětí, rozhodnutí KÚ) a není v metodické tabulce PV jednoznačně algoritmizovatelný. |
| **Metodický box u pracoviště** | **Zvoleno** – u každého vyplněného řádku (mimo MŠ u ZZ) je viditelná informace s odkazem na § 1d odst. 3; aplikace krácení nepočítá. |

Ověření ručně: otevřete PV → základní režim → pracoviště s počtem tříd > 0 → box „Krácení PHmax (§ 1d odst. 3)“ pod vstupy řádku.

---

## PV – předškolní vzdělávání

| # | Kontrola | OK |
|---|----------|-----|
| P1 | Mobilní souhrn: scroll dolů → panel → Skrýt → chip vlevo → Zobrazit | E2E |
| P2 | Banner + **Přejít k chybě** (prázdné pracoviště / neúplný řádek) | E2E |
| P2d | Desktop – combobox Příkladové výpočty + workflow dock | E2E desktop |
| P2n | Dashboard – ok PV není ve Vyžaduje pozornost | E2E desktop |
| P3 | Průvodce krok **2 Vstupy** → **Přejít k chybě** → sekce vstupů | E2E |
| P4 | Checklist „Kdy přidat další pracoviště“ u prázdné tabulky | contract |
| P5 | § 1d odst. 3 – box u řádku + text u souhrnu (bez výpočtu krácení) | contract |
| P6 | 3 ukázky z comboboxu – PHmax/PHAmax sedí s očekáváním | contract |

---

## ZŠ

| # | Kontrola | OK |
|---|----------|-----|
| Z1 | Mobilní souhrn + chip (jako PV) | E2E |
| Z2 | Banner bez duplicity „Kontrola vstupů“; stejný verdikt v docku | E2E |
| Z2d | Desktop – combobox + workflow dock | E2E desktop |
| Z3 | Průvodce PHmax – krok 2 Třídy → **Přejít k chybě** (prázdný formulář) | E2E |
| Z4 | PHAmax/PHPmax v basic – věta „pro tento typ školy se nepočítá“ u neplatného režimu | contract |
| Z5 | Export CSV/XLSX – metadata a orientační disclaimer | contract |

---

## NV75 – banka odpočtů

| # | Kontrola | OK |
|---|----------|-----|
| N1 | Mobilní souhrn + chip | E2E |
| N2 | Banner při chybějícím §4b / varování u řádků | E2E |
| N2d | Desktop – combobox + workflow dock; legenda ikon v nápovědě | E2E desktop |
| N3 | Průvodce **2 Vstupy** → **Přejít k chybě** | E2E |
| N4 | Ukázka A z comboboxu – banka a §4b v audit sloupci | contract |
| N5 | Export CSV/XLSX – archivní razítko, release notes verze | contract |
| N6 | Tlačítko **Vložit druh školy/zařízení** pod tabulkou | contract |

---

## ŠD (stručně, E2E + vzorek ručně)

| # | Kontrola | OK |
|---|----------|-----|
| S1 | E2E smoke (`sd-mobile-smoke.spec.ts`) projde | E2E |
| S2 | Souhrnný režim – věta o počtu oddělení | E2E + contract |
| S3 | Porovnání variant A/B s pojmenovanou zálohou | contract |

---

## Produktová roadmapa (větší scope – neblokuje release)

1. **Propojení modulů** – dashboard dnes čte uložený stav; nepočítá napříč PV/ŠD/ZŠ/NV75.
2. **Oficiální výstupy** – vykazování do systémů školy / zřizovatele (mimo orientační CSV/XLSX).
3. **PV § 1d odst. 3** – volitelný budoucí výpočet po doplnění právních vstupů.

---

## Příkazy

```bash
npm run build
npm test
npm run test:e2e
```

| Datum | Tester | PV | ZŠ | NV75 | Poznámka |
|-------|--------|----|----|------|----------|
| 2026-05-21 | CI + contract | E2E+contract | E2E+contract+Zs panely | E2E+contract | checklist kompletní (contract/E2E) |
