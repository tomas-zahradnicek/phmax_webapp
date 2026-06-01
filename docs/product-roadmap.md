# Produktová roadmapa PHmax webapp

Orientační plán většího scope mimo patch release. Neblokuje běžné UX vylepšení.

## 1. Propojení modulů (v progress)

| Stav | Popis |
|------|--------|
| **Hotovo (0.3.2+)** | Dashboard Σ zobrazuje orientační **součet PHmax** z autosave PV + ŠD + ZŠ + SŠ (`phmax-dashboard-cross-phmax.ts`). NV75 (banka) se nezapočítává. |
| **Hotovo (0.3.3+)** | Export JSON součtu a scénář **celá škola** (`phmax-school-scenario-export.ts`); varování při modulu ve Vyžaduje pozornost. |
| **Další** | Validace nesouladu mezi moduly (např. duplicitní žáci); jednotný pojmenovaný scénář napříč moduly. |

## 2. Oficiální výstupy

| Stav | Popis |
|------|--------|
| **Mimo scope** | Vykazování do systémů školy / zřizovatele – vyžaduje právní a integrační specifikaci mimo orientační CSV/XLSX. |
| **Další** | Mapování polí exportu – viz `docs/export-field-mapping.md`. |

## 3. PV § 1d odst. 3 – krácení PHmax

| Stav | Popis |
|------|--------|
| **Zvoleno** | Metodický box u pracoviště + text u souhrnu (bez výpočtu krácení) – viz `docs/acceptance-pv-zs-nv75.md`. |
| **Další** | Volitelný výpočet po doplnění právních vstupů – stub `phmax-pv-1d3-reduction.ts`. |

## Odkazy

- Acceptance checklist: `docs/acceptance-pv-zs-nv75.md`
- SŠ ruční ověření: `docs/ss-acceptance-checklist.md`
