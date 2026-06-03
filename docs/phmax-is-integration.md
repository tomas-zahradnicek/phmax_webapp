# Napojení na IS školy (handoff JSON)

Aplikace **neposílá data přímo** do Bakalářů, EduPage ani jiného IS – chybí jednotné veřejné API MŠMT.

## Co je k dispozici (v0.3.14+)

Stejné schéma jako v 0.3.4+ – bez breaking change. Dashboard: export mini-wizard (krok 2 pro IT – `appVersion`, `coherenceWarnings`, docs), kontrolní list před exportem, tisk kontroly; po stažení JSON volitelné vymazání lokálních dat (sdílený počítač). Import ze školy až ve 0.4.0.

**Předání IT (checklist v UI):** stáhnout JSON scénář nebo handoff → ověřit `appVersion` a `scenarioLabel` → předat pole `coherenceWarnings` (prázdné = OK, jinak vyřešit v modulech) → mapování polí: `docs/export-field-mapping.md`.

## Historie (v0.3.4+)

1. **Dashboard Σ** → tlačítko **Scénář celá škola (JSON)** – autosave PV/ŠD/ZŠ/SŠ.
2. **Handoff pro IS** → tlačítko **Export pro IS školy (JSON)** – obal `phmax-is-handoff-v1` kolem scénáře (včetně `coherenceWarnings` z dashboardu).

Schéma: `src/phmax-is-export-adapter.ts`  
Mapování polí (návrh): `docs/export-field-mapping.md`

Pole **`coherenceWarnings`** (0.3.9+) obsahuje textová varování z `crossPhmaxAuditCoherenceWarnings` – integrátor může zablokovat import nebo vyžadovat ruční potvrzení.

## Doporučený postup integrátora

1. Stáhnout handoff JSON z prohlížeče uživatele.
2. Transformovat `schoolScenario.moduleSnapshots` do vstupních polí vašeho IS (skript ETL).
3. PHmax modulů zapisovat jako orientační kapacity – ne jako závazný výkaz.

## Volitelné POST (0.3.5+)

Na dashboardu lze uložit **URL endpoint IS** do `localStorage` (`phmax-is-handoff-endpoint`) a odeslat handoff přes `postPhmaxIsHandoff` (`src/phmax-is-handoff-client.ts`). Vyžaduje CORS a schválený endpoint u dodavatele IS.

## Import ze školy (pilot PV + ZŠ v aplikaci)

- Dashboard → **Import ze školy** → šablona Excel (`phmax-import-pv-zs-v1.xlsx`, listy Meta / PV / ZŠ) → náhled → načtení do autosave.
- Kód: `src/phmax-import-pv-zs.ts`, `src/phmax-import-xlsx.ts`, `src/phmax-import-template-xlsx.ts`, `src/DashboardSchoolImportDialog.tsx`.

## Import z handoff (IT / konzole)

- `npm run import:csv-handoff` → `docs/import-templates/phmax-is-handoff.generated.json`
- `npm run import:handoff-apply-snippet` → JS pro DevTools na originu aplikace
- Logika: `src/phmax-is-handoff-apply.ts` (`applyPhmaxIsHandoffToLocalStorage`, mapování `moduleSnapshots` → autosave klíče)

## Další krok (mimo webapp)

- Dohodnout s dodavatelem IS konkrétní endpoint / šablonu importu.
- Po schválení doplnit volitelný export CSV podle šablony zřizovatele.
