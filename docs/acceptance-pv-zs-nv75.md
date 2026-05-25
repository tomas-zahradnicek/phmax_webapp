# Acceptance checklist – PV, ZŠ, NV75 (bez SŠ)

Orientační kontrola před předáním nebo release. Automatizovaný smoke: `npm run test:e2e` (Playwright, mobilní viewport).

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
| P1 | Mobilní souhrn: scroll dolů → panel → Skrýt → chip vlevo → Zobrazit | |
| P2 | Banner + **Přejít k chybě** (prázdné pracoviště / neúplný řádek) | |
| P3 | Průvodce krok **2 Vstupy** → **Přejít k chybě** → sekce vstupů | |
| P4 | Checklist „Kdy přidat další pracoviště“ u prázdné tabulky | |
| P5 | § 1d odst. 3 – box u řádku + text u souhrnu (bez výpočtu krácení) | |
| P6 | 3 ukázky z comboboxu – PHmax/PHAmax sedí s očekáváním | |

---

## ZŠ

| # | Kontrola | OK |
|---|----------|-----|
| Z1 | Mobilní souhrn + chip (jako PV) | |
| Z2 | Banner bez duplicity „Kontrola vstupů“; stejný verdikt v docku | |
| Z3 | Průvodce PHmax – krok 2 Třídy → **Přejít k chybě** (prázdný formulář) | |
| Z4 | PHAmax/PHPmax v basic – věta „pro tento typ školy se nepočítá“ u neplatného režimu | |
| Z5 | Export CSV/XLSX – metadata a orientační disclaimer | |

---

## NV75 – banka odpočtů

| # | Kontrola | OK |
|---|----------|-----|
| N1 | Mobilní souhrn + chip | |
| N2 | Banner při chybějícím §4b / varování u řádků | |
| N3 | Průvodce **2 Vstupy** → **Přejít k chybě** | |
| N4 | Ukázka A z comboboxu – banka a §4b v audit sloupci | |
| N5 | Export CSV/XLSX – archivní razítko, release notes verze | |
| N6 | Tlačítko **Vložit druh školy/zařízení** pod tabulkou | |

---

## ŠD (stručně, E2E + vzorek ručně)

| # | Kontrola | OK |
|---|----------|-----|
| S1 | E2E smoke (`sd-mobile-smoke.spec.ts`) projde | |
| S2 | Souhrnný režim – věta o počtu oddělení | |
| S3 | Porovnání variant A/B s pojmenovanou zálohou | |

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
|       |        |    |    |      |          |
