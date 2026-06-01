# Napojení na IS školy (handoff JSON)

Aplikace **neposílá data přímo** do Bakalářů, EduPage ani jiného IS – chybí jednotné veřejné API MŠMT.

## Co je k dispozici (v0.3.4+)

1. **Dashboard Σ** → tlačítko **Scénář celá škola (JSON)** – autosave PV/ŠD/ZŠ/SŠ.
2. **Handoff pro IS** → tlačítko **Export pro IS školy (JSON)** – obal `phmax-is-handoff-v1` kolem scénáře.

Schéma: `src/phmax-is-export-adapter.ts`  
Mapování polí (návrh): `docs/export-field-mapping.md`

## Doporučený postup integrátora

1. Stáhnout handoff JSON z prohlížeče uživatele.
2. Transformovat `schoolScenario.moduleSnapshots` do vstupních polí vašeho IS (skript ETL).
3. PHmax modulů zapisovat jako orientační kapacity – ne jako závazný výkaz.

## Volitelné POST (0.3.5+)

Na dashboardu lze uložit **URL endpoint IS** do `localStorage` (`phmax-is-handoff-endpoint`) a odeslat handoff přes `postPhmaxIsHandoff` (`src/phmax-is-handoff-client.ts`). Vyžaduje CORS a schválený endpoint u dodavatele IS.

## Další krok (mimo webapp)

- Dohodnout s dodavatelem IS konkrétní endpoint / šablonu importu.
- Po schválení doplnit volitelný export CSV podle šablony zřizovatele.
