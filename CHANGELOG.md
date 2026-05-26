# Changelog

## 0.2.4 (2026-05-26)

### UX a dashboard
- Desktop Obsah: perzistence stavu po reloadu (`phmax-toc-open`), E2E `desktop-toc-smoke`.
- Dashboard: klikatelné KPI dlaždice, řazení podle závažnosti (danger → warning → prázdné → ok).
- Sekce **Vyžaduje pozornost** a deep-link na chyby vstupů (PV, ŠD, ZŠ, NV75).
- Verdikty sjednocené v banneru, docku a sticky liště; tlačítko **Přejít k chybě** v průvodci.

### Kvalita a refaktor
- ESLint v CI na celém `src/` (s limitem varování).
- E2E smoke: PV, ŠD, ZŠ, NV75, SŠ; acceptance contract §16 scénář E (SŠ).
- ZŠ: refaktor panelů, dynamické řádky, reset formuláře, načítání ukázek z `zs-hero-example-load.ts`.
- Oprava hooků v `CompareVariantsPanel` (rules-of-hooks).
