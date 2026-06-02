# Produktová roadmapa PHmax webapp

Orientační plán většího scope mimo patch release. Neblokuje běžné UX vylepšení.

## 1. Propojení modulů (v progress)

| Stav | Popis |
|------|--------|
| **Hotovo (0.3.2+)** | Dashboard Σ zobrazuje orientační **součet PHmax** z autosave PV + ŠD + ZŠ + SŠ (`phmax-dashboard-cross-phmax.ts`). NV75 (banka) se nezapočítává. |
| **Hotovo (0.3.4)** | PV § 1d orientační redukce; IS handoff JSON; `Nv75ResultsSection`; `useZsPageDerivedState`. |
| **Hotovo (0.3.3+)** | Export JSON součtu a scénář **celá škola** (`phmax-school-scenario-export.ts`); varování při modulu ve Vyžaduje pozornost. |
| **Hotovo (0.3.5+)** | Cross-PHmax koherence, pojmenovaný scénář školy, IS POST klient (volitelný endpoint). |
| **Hotovo (0.3.7+)** | `PvWorkplaceRowsSection`; E2E scénář školy a koherence audit vs. Σ. |
| **Hotovo (0.3.8+)** | ZŠ přepočet v koherenci; kontrolní list před exportem; handout PDF. |
| **Hotovo (0.3.9+)** | ŠD PHmax na dashboardu + přepočet/koherence; `coherenceWarnings` ve scénáři; PV §1d v exportu; audit autosave PV/ŠD. |
| **Další** | Napojení IS u dodavatele; sjednocení přepočtu ZŠ s `useZsPageDerivedState`. |
| **Blokováno → 0.4.0** | CSV/import podle šablony zřizovatele nebo IS – čeká na schválený formát (viz §2). |

## 2. Oficiální výstupy

| Stav | Popis |
|------|--------|
| **Mimo scope** | Vykazování do systémů školy / zřizovatele – vyžaduje právní a integrační specifikaci mimo orientační CSV/XLSX. |
| **Blokováno (0.4.0)** | Mapování a CSV export podle šablony zřizovatele – **čeká na schválený formát** od zřizovatele nebo dodavatele IS. Viz `docs/export-field-mapping.md`. |
| **Připraveno** | Handoff JSON `phmax-is-handoff-v1`, scénář `phmax-school-scenario-v1`, volitelný POST z dashboardu. |

## 3. PV § 1d odst. 3 – krácení PHmax

| Stav | Popis |
|------|--------|
| **Hotovo (0.3.4+)** | Orientační výpočet v `phmax-pv-1d3-reduction.ts` (poměr dětí, strop KÚ, výjimka) + metodický box u řádku. |
| **Hotovo (0.3.5+)** | Rozšíření: reference rozhodnutí KÚ, stav `pending_ku` při nedostatku údajů pro závazný výsledek. |
| **Mimo scope** | Plně závazný výpočet bez rozhodnutí krajského úřadu – vždy ruční ověření. |

## Odkazy

- Acceptance checklist: `docs/acceptance-pv-zs-nv75.md`
- SŠ ruční ověření: `docs/ss-acceptance-checklist.md`
