# Import dat ze školy (návrh 0.4.0)

Orientační specifikace. **Pilot PV + ZŠ v aplikaci:** dashboard → Import ze školy, šablona Excel `.xlsx`. ŠD, SŠ a detailní listy ZŠ – fáze C. Vychází ze struktury autosave a exportu `phmax-school-scenario-v1` / `phmax-is-handoff-v1`.

## Princip

1. Škola / IS dodá soubor (CSV, XLSX nebo JSON) podle **schválené šablony** zřizovatele nebo dodavatele IS.
2. Aplikace (nebo ETL u IT) mapuje sloupce na `moduleSnapshots` jednotlivých modulů.
3. Uživatel v prohlížeči **zkontroluje** výpočet, `coherenceWarnings` a teprve pak exportuje / archivuje.

Import **není** závazný výkaz ani náhrada ručního doplnění metodických detailů (§ 16, víceoborové třídy, výjimky).

**Doporučení (pilot):** ze školy / IS přenášet **agregované počty a řádky** podle šablony Excel v2 (české názvy sloupců i hodnot výčtů). **PHAmax, PHPmax, gymnázia, menšinové třídy, smíšené třídy, § 1d PV, výjimky a pojmenované scénáře** nechte uživateli doplnit v kalkulačce po importu – rozšíření šablony je možné ve fázi C, ale zvyšuje riziko chybné metodiky bez kontroly v UI.

## Co lze importovat po modulech

### PV (mateřská škola)

| Z evidence školy (typicky) | Pole v autosave / výpočtu |
|----------------------------|---------------------------|
| Pracoviště / oddělení školky | `label` |
| Druh provozu (polodenní, celodenní, internát, zdravotnické) | `provoz` |
| Počet tříd / skupin | `classCount` |
| Průměrná denní doba (hodiny) | `avgHours` |
| Třídy podle § 16 | `sec16Count` |
| Jazykové skupiny | `languageGroups` |

**Nelze spolehlivě z IS bez šablony:** přesné zařazení do tabulek metodiky PHmax, § 1d krácení (orientační výpočet zůstává v aplikaci).

### ZŠ

| Z evidence | Pole (výběr) |
|----------|----------------|
| Počty tříd 1. / 2. stupně, žáci na třídu | `basic1Classes`, `basic1Pupils`, `basic2Classes`, `basic2Pupils` |
| Inkluzivní třídy | `incl1*`, `incl2*` |
| Přípravná třída u ZŠ (ne MŠ) | `prepClasses`, `prepChildren`, režim v `basicType` / metodice |
| Školní psycholog, speciální pedagog, zdravotní třídy | řádky `psychRows`, `healthRows` |
| Menšinové / národnostní třídy | `minority*` |
| Gymnázium, smíšené třídy | `gymRows`, `mixedRows`, mixed-method tabulka |
| PHAmax / PHPmax (pokud IS eviduje) | `phaRows`, `phpYear1–3`, odpočty PHP |

**Důležité:** MŠ (přípravné oddělení v MŠ) patří do modulu **PV**, ne ZŠ. Viz handout „Kde zadat co“.

### ŠD

| Z evidence | Pole |
|----------|------|
| Počet účastníků (1. stupeň ZŠ v družině) | `pupils` |
| Počet oddělení | `departments` |
| Souhrnný vs. detailní režim | `inputMode`, `detailDepartments[]` |

### SŠ

| Z evidence | Pole řádku jednotky |
|----------|---------------------|
| Označení třídy / skupiny | `label` |
| Kód oboru (RVP) | `educationField` |
| Denní / distanční forma | `studyForm` |
| Počet tříd, průměr žáků | `classCount`, `averageStudents` |
| Více oborů ve třídě, § 16, talentní obory | `oborCountInClass`, `additionalOborCodes`, příznaky |

### NV75 (zástupce)

| Z evidence | Pole |
|----------|------|
| Druh školy/zařízení (příloha NV 75) | řádek banky odpočtů |
| Hodiny odpočtů | banka (jednotka **hodiny**, ne PHmax) |

NV75 se **nezapočítává** do cross-součtu PHmax na dashboardu.

### Dashboard / scénář celé školy

| Meta | Pole exportu |
|------|----------------|
| Název scénáře, školní rok | `scenarioLabel` |
| Souhrn modulů | `moduleSnapshots.pv|sd|zs|ss|nv75` |
| Kontrola před importem do IS | `coherenceWarnings`, `appVersion` |

## Co typicky z IS **nepřijde** hotové

- Interpretace metodiky (volba pásma, režim B29/B30 u ZŠ, § 1d PV u KÚ).
- Pojmenované zálohy a scénáře – zůstanou v prohlížeči, pokud je IT nezařadí do vlastního DMS.
- Právně závazný podpis / verze výkazu pro zřizovatele.

## CSV šablona (pilot PV + ZŠ)

Konkrétní sloupce, příklady a mapování na autosave: **[import-templates/phmax-import-pv-zs-v1.md](./import-templates/phmax-import-pv-zs-v1.md)**  
Soubory: `phmax-import-meta-v1.example.csv`, `phmax-import-pv-v1.example.csv`, `phmax-import-zs-summary-v1.example.csv`.  
**V aplikaci:** Stáhnout šablonu Excel v2 (`phmax-import-skola-v2.xlsx`) → vyplnit → Import ze školy na dashboardu (náhled → načtení do PV, ZŠ a volitelně ŠD, SŠ, NV75).  
**IT:** Skript CSV → handoff JSON: `npm run import:csv-handoff`. Zápis konzolí: `npm run import:handoff-apply-snippet` (`src/phmax-is-handoff-apply.ts`). Round-trip test: `src/phmax-import-roundtrip.test.ts`.

**Po nasazení:** viz [post-deploy-checklist.md](./post-deploy-checklist.md) (Ctrl+F5, šablona v2, popup pro tisk).

## Doporučený postup pro zřizovatele / IT

1. Schválit **jednu šablonu** (minimálně: identifikátor školy, rok, modul, JSON nebo CSV sloupce) – pilot v1: PV + ZŠ souhrn.
2. Pilot: import JSON ve tvaru `phmax-is-handoff-v1` → transformace na `moduleSnapshots`.
3. V aplikaci ověřit dashboard Σ a prázdné `coherenceWarnings`.
4. Teprve potom napojit automatický upload (0.4.0+).

Související: [export-field-mapping.md](./export-field-mapping.md), [phmax-is-integration.md](./phmax-is-integration.md).
