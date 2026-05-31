# Produktová roadmapa PHmax webapp

Orientační plán většího scope mimo patch release. Neblokuje běžné UX vylepšení.

## 1. Propojení modulů (v progress)

| Stav | Popis |
|------|--------|
| **Hotovo (0.3.2+)** | Dashboard Σ zobrazuje orientační **součet PHmax** z autosave PV + ŠD + ZŠ + SŠ (`phmax-dashboard-cross-phmax.ts`). NV75 (banka) se nezapočítává. |
| **Další** | Jednotné scénáře „celá škola“ (PV+ŠD+ZŠ+SŠ) s exportem souhrnného JSON; varování při nesouladu dat mezi moduly. |

## 2. Oficiální výstupy

| Stav | Popis |
|------|--------|
| **Mimo scope** | Vykazování do systémů školy / zřizovatele – vyžaduje právní a integrační specifikaci mimo orientační CSV/XLSX. |
| **Další** | Mapování polí exportu na požadavky MŠMT / interní evidence (návrh bez implementace API). |

## 3. PV § 1d odst. 3 – krácení PHmax

| Stav | Popis |
|------|--------|
| **Zvoleno** | Metodický box u pracoviště + text u souhrnu (bez výpočtu krácení) – viz `docs/acceptance-pv-zs-nv75.md`. |
| **Další** | Volitelný výpočet po doplnění právních vstupů (nejnižší počet dětí, rozhodnutí KÚ) – vyžaduje právní parametry mimo tabulku PV. |

## Odkazy

- Acceptance checklist: `docs/acceptance-pv-zs-nv75.md`
- SŠ ruční ověření: `docs/ss-acceptance-checklist.md`
