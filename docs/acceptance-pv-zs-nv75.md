# Acceptance checklist – PV, ZŠ, NV75 (bez SŠ)

Orientační kontrola před předáním nebo release. Automatizovaný smoke: `npm run test:e2e` (Playwright – mobilní viewport + desktop projekt `desktop-chrome`: dashboard deep-link, TOC a modulový smoke). Stav sloupce **OK**: `E2E` = pokryto mobilním nebo desktop smoke, `contract` = unit test na zdrojový kód, `ručně` = vyžaduje lidské ověření.

## Rozhodnutí: PV § 1d odst. 3 (krácení PHmax)

| Varianta | Stav |
|----------|------|
| **Orientační výpočet krácení** | **Zvoleno (0.3.4+)** – poměr dětí nebo PHmax z rozhodnutí KÚ; vždy s upozorněním. |
| **Plný závazný výpočet bez KÚ** | Mimo scope – finální výsledek vyžaduje rozhodnutí úřadu. |
| **Metodický box u pracoviště** | **Zvoleno** – u každého vyplněného řádku (mimo MŠ u ZZ) je viditelná informace s odkazem na § 1d odst. 3. |
| **Orientační výpočet** | **Zvoleno (0.3.4+)** – poměr dětí / strop KÚ; vždy s disclaimerem. |
| **Plný závazný výpočet** | **Mimo scope** – bez rozhodnutí KÚ jen orientačně; stav `pending_ku` upozorní na doplnění. |

Ověření ručně: otevřete PV → základní režim → pracoviště s počtem tříd > 0 → box „Krácení PHmax (§ 1d odst. 3)“ pod vstupy řádku.

**P5c (2026-06-02):** Bez rozhodnutí KÚ aplikace zobrazí jen orientační výpočet nebo stav `pending_ku` s disclaimerem – závazný výsledek nelze automaticky určit (záměr mimo scope).

---

## PV – předškolní vzdělávání

| # | Kontrola | OK |
|---|----------|-----|
| P1 | Mobilní souhrn: scroll dolů → panel → Skrýt → chip vlevo → Zobrazit | E2E |
| P2 | Banner + **Přejít k chybě** (prázdné pracoviště / neúplný řádek) | E2E |
| P2d | Desktop – combobox Příkladové výpočty + workflow dock | E2E desktop |
| P2n | Dashboard – ok PV/SŠ není ve Vyžaduje pozornost | E2E desktop |
| P2x | Dashboard – orientační součet PHmax PV+ŠD+ZŠ+SŠ | E2E desktop |
| P2j | Dashboard – export JSON součtu / scénář školy | E2E desktop + contract |
| P3 | Průvodce krok **2 Vstupy** → **Přejít k chybě** → sekce vstupů | E2E |
| P4 | Checklist „Kdy přidat další pracoviště“ u prázdné tabulky | contract |
| P5a | § 1d – metodický box u řádku + vstupy (děti, minimum, KÚ, výjimka) | contract + E2E |
| P5b | § 1d – orientační poměrné krácení / strop KÚ v souhrnu | contract + E2E |
| P5d | § 1d – stav `pending_ku` při chybějících údajích o dětech | E2E + contract |
| P5c | § 1d – plný závazný výsledek bez KÚ | ručně (mimo scope – UI jen orientačně / `pending_ku`) |
| P2i | Dashboard – export handoff IS školy (`phmax-is-handoff-v1`) | E2E + contract |
| P2j | Dashboard – scénář celá škola (`phmax-school-scenario-v1`) | E2E desktop |
| P2k | Dashboard – POST handoff na endpoint IS (mock / integrátor) | E2E |
| P2m | Dashboard – varování koherence audit vs. Σ (PV výpočet ≠ audit v autosave) | E2E desktop |
| P2o | Dashboard – kontrolní list + checkbox před exportem JSON | E2E desktop |
| P6 | 3 ukázky z comboboxu – PHmax/PHAmax sedí s očekáváním | contract |
| P7 | Export CSV/XLSX – řádky § 1d odst. 3 (stav, PHmax po krácení) | contract |

---

## ZŠ

| # | Kontrola | OK |
|---|----------|-----|
| Z1 | Mobilní souhrn + chip (jako PV) | E2E |
| Z2 | Banner bez duplicity „Kontrola vstupů“; stejný verdikt v docku | E2E |
| Z2d | Desktop – combobox + workflow dock | E2E desktop |
| Z3 | Průvodce PHmax – krok 2 Třídy → **Přejít k chybě** (prázdný formulář) | E2E |
| Z3w | Průvodce – volba gym/menšina načte hero ukázku | contract |
| Z4 | PHAmax/PHPmax v basic – věta „pro tento typ školy se nepočítá“ u neplatného režimu | contract |
| Z5 | Export CSV/XLSX – metadata a orientační disclaimer | contract |
| Z6 | Dashboard – varování koherence ZŠ audit vs. přepočet vstupů | E2E desktop + contract |

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
| S2d | Desktop – combobox + workflow dock | E2E desktop |
| S3 | Porovnání variant A/B s pojmenovanou zálohou | contract |
| S4 | Dashboard Σ – PHmax ŠD z přepočtu autosave; koherence audit | contract + E2E |
| P2p | Dashboard – stažení cross-PHmax JSON obsahuje coherenceWarnings | E2E desktop |
| SS2 | SŠ autosave `_phmaxAuditTotals` (obal rows + audit) | contract |

---

## Produktová roadmapa (větší scope – neblokuje release)

Viz **`docs/product-roadmap.md`**. Stručně:

1. **Propojení modulů** – první krok: orientační součet PHmax na dashboardu (PV+ŠD+ZŠ+SŠ).
2. **Oficiální výstupy** – mimo orientační CSV/XLSX.
3. **PV § 1d odst. 3** – orientační výpočet hotov; závazný výsledek po rozhodnutí KÚ ručně.

---

## Po 0.3.14 (ruční / E2E)

| Oblast | Stav | Poznámka |
|--------|------|----------|
| Popisky PHmax v docku | E2E desktop | `metric-label-casing.spec.ts` – PHmax, ne PHMAX |
| Dashboard role + export wizard | E2E desktop | `dashboard-ux-013.spec.ts` |
| ZŠ quick tour | contract + ručně | `ZS_QUICK_TOUR_*` v modulu ZŠ |

Detailní checklist: [smoke-checklist-post-0.3.16.md](./smoke-checklist-post-0.3.16.md).

## Příkazy

```bash
npm run build
npm test
npm run test:e2e
```

| Datum | Tester | PV | ZŠ | NV75 | Poznámka |
|-------|--------|----|----|------|----------|
| 2026-05-21 | CI + contract | E2E+contract | E2E+contract+Zs panely | E2E+contract | checklist kompletní (contract/E2E) |
| 2026-05-31 | CI + contract | E2E+contract (0.3.2) | E2E+contract+wizard gym/menšina | E2E+contract | cross-PHmax, shell parita SŠ/NV75 |
| 2026-05-31 | CI + contract | E2E+contract (0.3.3) | E2E+contract | E2E+contract | JSON scénář školy, export cross-PHmax |
| 2026-06-01 | CI + contract | E2E+contract (0.3.4) | E2E+contract | E2E+contract | PV §1d, IS handoff, CI E2E green |
| 2026-06-01 | CI + contract | E2E P5a/b, P2i (0.3.5) | refaktor hook | refaktor sekce | cross-PHmax koherence |
| 2026-06-01 | CI + contract | E2E P5d, P2k; `PvWorkplacesSummarySection` (0.3.6) | – | – | golden CI fix, IS POST E2E |
| 2026-06-02 | CI + contract + ručně | E2E P2j/m; P5c UI ověřeno (0.3.7) | SŠ checklist 0.3.x | – | `PvWorkplaceRowsSection`, release uzavřen |
