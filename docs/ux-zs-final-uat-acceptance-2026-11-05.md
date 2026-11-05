# Akceptační protokol – UX redesign kalkulačky ZŠ

**Projekt:** Ředitelský průvodce – PHMAX webapp  
**Datum rozhodnutí vlastníka:** 5. 11. 2026  
**Akceptační větev:** `master`  
**Akceptační commit:** [`16d8333dbff30890bd911b0154f4c8ceac96a9d2`](https://github.com/tomas-zahradnicek/phmax_webapp/commit/16d8333dbff30890bd911b0154f4c8ceac96a9d2)  
**Podklady:** UX-ZS-FINAL-UAT-1; UX-ZS-FINAL-UAT-2 CLOSURE REPORT; [GitHub CI #345](https://github.com/tomas-zahradnicek/phmax_webapp/actions/runs/42056735275)  
**Konečný stav:** **ACCEPTED WITH KNOWN LIMITATIONS – UŽIVATELSKY PŘIJATO A UZAVŘENO**

> Tento dokument archivuje **rozhodnutí vlastníka projektu** a stav akceptační evidence, nikoli potvrzení, že jsou otestovány všechny myslitelné scénáře. Technické hodnocení UAT-2 bylo původně **CONDITIONAL PASS**. Vlastník následně **výslovně přijal omezení UAT2-01 až UAT2-05**, čímž splnil zbývající podmínku přijetí. Původní výsledek testování se zpětně nepřepisuje.

## 1. Schválený rozsah

Akceptace pokrývá dokončené úpravy uživatelského rozhraní ZŠ:

- UX-HEADER-1A/1B – prezentace a stavy výpočtových výsledků.
- UX-FLOW-1A – úvodní krok a orientace v průvodci.
- UX-MODES-1A – režimy **Průvodce** a **Všechna pole**.
- UX-FLOW-1B-1 – zadávání tříd a výjimek.
- UX-FLOW-1B-2 – zjednodušení pracovního souhrnu (sloučeno v [PR #62](https://github.com/tomas-zahradnicek/phmax_webapp/pull/62)).

Tento akceptační protokol **nezakládá novou produktovou změnu** a nemění pravidla výpočtů, validace, ukládání ani chování ostatních kalkulaček.

## 2. Ověřené výsledky a testovací podklady

Závěrečná uživatelská akceptace proběhla v čistém prohlížeči Chromium s prázdným úložištěm proti lokální aplikaci `http://127.0.0.1:4175/phmax-zakladni-skola` na ověřeném commitu `16d8333`.

| Oblast | Zjištění |
| --- | --- |
| Pětikrokový průvodce | Dokončen: Typ školy → Třídy → Výjimky → Souhrn PHmax → Celkový přehled; ověřeno i Zpět |
| Režimy zobrazení | **Průvodce** i **Všechna pole**; při přepnutí zachovány hodnoty v rámci relace |
| Obnova aktuálního kroku | **PASS** – po obnovení stránky se obnovil krok Celkový přehled |
| PHmax | Ověřen oficiální příklad **934 h**; jiné metriky se k němu nepřičítají |
| PHA1Rmax | Ověřeno **20 h** a platný vypočtený výsledek **0 h** |
| PHPmax | Ověřeno **12 h** na příkladu `phpmax_tri_roky`; jiné nezadané metriky zůstaly **Nezadáno** |
| Výsledkové stavy | Ověřeny **Nezadáno**, **Nelze spočítat**, kladný výsledek a platná nula |
| Responzivita | Prověřeny viewporty 390×844, 768×900, 1024×800, 1366×768 a 1920×1080 |
| GitHub CI #345 | **205/205 Playwright**, bez opakování; build, golden testy, Vitest a ESLint úspěšné |
| Závažné vady | V rámci UAT **nejsou evidovány otevřené P0 ani P1** |

**Rozlišení stupňů důkazů:** Ověření zobrazení a průchodu workflow neznamená automaticky ověření obsahu exportního souboru či perzistence všech číselných hodnot po reloadu; tyto položky jsou uvedeny níže jako **NOT VERIFIED**.

## 3. Výslovně přijaté známé limity a GitHub backlog

Vlastník projektu dne **5. 11. 2026** výslovně přijal všech pět následujících nálezů jako známá omezení. **Žádná z těchto oprav není podmínkou uzavření redesignu.** Issues zůstávají otevřená pouze jako samostatný backlog.

| ID | Závažnost | Přijaté omezení | Důkaz / dopad | GitHub Issue |
| --- | --- | --- | --- | --- |
| UAT2-01 | P2 | Na šířkách 390 a 768 px může plovoucí souhrn dočasně překrýt **Další krok**; běžné posunutí stránky navigaci zpřístupní | Možný dojem zablokovaného postupu; `mobile-float-390.png` a hit-target kontrola | [#64](https://github.com/tomas-zahradnicek/phmax_webapp/issues/64) |
| UAT2-02 | P2 | Dokončený výpočet nadále může zobrazovat akci **Přejít k chybě** | Hotový výpočet působí nedokončeně; `example-934.png`, `step5-prehled.png` | [#66](https://github.com/tomas-zahradnicek/phmax_webapp/issues/66) |
| UAT2-03 | P2 | Informace o kompletních vstupech se opakuje v banneru, pruhu a sticky liště | Zbytečná vizuální zátěž; nejde o duplicitní verdikt v docku | [#68](https://github.com/tomas-zahradnicek/phmax_webapp/issues/68) |
| UAT2-04 | P2 | Step pills i seznam obsahu souběžně umožňují přechod mezi sekcemi | Dvě volby pro prvního uživatele; obě navigace fungovaly | [#70](https://github.com/tomas-zahradnicek/phmax_webapp/issues/70) |
| UAT2-05 | P3 | Hlavičkový čip při 390 px zkracuje **Nezadáno** na **Nezadá** | Kosmetická čitelnost; dock a mobilní souhrn uvádějí plný text; `first-390.png` | [#71](https://github.com/tomas-zahradnicek/phmax_webapp/issues/71) |

**Procesní pravidlo:** Uzavření UX redesignu a případné budoucí uzavření jednotlivých Issues jsou odlišné kroky. Opravy se smějí realizovat až v samostatně vymezené etapě, s vlastní regresní kontrolou a PR. Závažnost P2/P3 neznamená automatickou prioritu implementace.

### Orientační pořadí budoucího zpracování

1. **UAT2-02 (#66)** – zavádějící odkaz na chybu při validním výsledku.
2. **UAT2-05 (#71)** – drobná oprava čitelnosti na mobilu.
3. **UAT2-01 (#64)** – interakce tlačítka Další krok s plovoucím souhrnem.
4. **UAT2-03 (#68)** – opakování sdělení o kompletních vstupech.
5. **UAT2-04 (#70)** – navigační hierarchie.

Pořadí je doporučení pro backlog, **nikoliv schválený termín ani závazek implementace**.

## 4. Neúplně ověřené oblasti – NOT VERIFIED

Následující položky nebyly v závěrečné UAT plně doloženy a **nejsou automaticky považovány ani za funkční, ani za vadné**:

- **Číselné hodnoty po reloadu:** obnovený krok průvodce byl ověřen; samostatný důkaz zachování všech zadaných číselných hodnot po reloadu chybí.
- **Obsah exportu:** ověřena viditelnost/dostupnost akcí, nikoliv obsah skutečně vytvořeného souboru ani uložený payload.
- **Kompletní průchod klávesnicí:** první Tab byl zachycen, avšak úplný průchod všemi poli nebyl proveden.
- **Stav Nevztahuje se:** v UAT nebyl samostatně reprodukován, nebyla odvozována nová pravidla.
- **Další PHPmax příklady:** kromě ověřeného `phpmax_tri_roky` nebyl načten druhý příklad.
- **Cíl akce Přejít k chybě u kompletního výsledku:** samotný proklik nebyl ověřen; viz UAT2-02.

Tyto mezery v evidenci **nebyly vlastníkem určeny jako překážka uzavření**. V případě potřeby je lze později ověřit samostatně bez opětovného otevření celé UX akceptace.

## 5. Záležitost testovacího skriptu – mimo produktový backlog

**UAT2-06:** První automatizační skript selhal, protože nabídka **Zobrazení** již byla otevřena a další kliknutí ji zavřelo. Následný skript správně ošetřil stav nabídky, přepnutí režimů dokončil a hodnoty v relaci zachoval. Nález je klasifikován jako **problém testovacího skriptu**, nikoliv produktová P0–P3 vada.

Při uzavření UAT byly na lokálním `master` hlášeny tři **necommitované úpravy E2E testů**, mimo akceptační commit:

- `e2e/smoke-helpers.ts`
- `e2e/zs-classes-exceptions-flow.spec.ts`
- `e2e/zs-display-modes.spec.ts`

Tyto změny **nejsou obsahem akceptace ani tohoto dokumentačního PR**. Před případným samostatným testovacím PR je potřeba jejich revize. Nesmějí být bez prověření zahazovány.

## 6. Rozhodnutí vlastníka a podmínky závěru

Vlastník projektu výslovně potvrdil:

> Schvaluji variantu A. Výslovně přijímám známá omezení UAT2-01 až UAT2-05, uzavři redesign ZŠ a připrav postup evidence následných úprav.

Důsledky rozhodnutí:

1. **Uživatelská akceptace redesignu ZŠ je ukončena** na `master` v commitu `16d8333` se známými omezeními.
2. Z UAT nevzniká žádná **povinná implementační oprava** před přijetím.
3. Zbývající P2/P3 jsou evidovány jako odkazy na samostatná Issues, nikoliv jako důvod k opakování celé UAT.
4. P0/P1 nebyly v provedené UAT evidovány; toto tvrzení není zárukou neexistence jiných dosud nezjištěných vad.
5. Další vývoj musí chránit nezměněné výpočty, validaci, persistenci i ostatní kalkulačky.

## 7. Archivní stopa a omezení evidence

- Akceptovaný produktový commit: [`16d8333`](https://github.com/tomas-zahradnicek/phmax_webapp/commit/16d8333dbff30890bd911b0154f4c8ceac96a9d2).
- Sloučený poslední redesignový PR: [#62](https://github.com/tomas-zahradnicek/phmax_webapp/pull/62).
- Finální automatizovaná CI verifikace: [#345](https://github.com/tomas-zahradnicek/phmax_webapp/actions/runs/42056735275).
- Následný backlog: [#64](https://github.com/tomas-zahradnicek/phmax_webapp/issues/64), [#66](https://github.com/tomas-zahradnicek/phmax_webapp/issues/66), [#68](https://github.com/tomas-zahradnicek/phmax_webapp/issues/68), [#70](https://github.com/tomas-zahradnicek/phmax_webapp/issues/70), [#71](https://github.com/tomas-zahradnicek/phmax_webapp/issues/71).
- UAT-1 evidoval lokální screenshoty v `C:\Users\info\AppData\Local\Temp\ux-zs-uat-1\`. **Screenshoty nejsou součástí tohoto dokumentačního commitu; jejich trvalou dostupnost v GitHubu tento protokol netvrdí.**
- Výchozí UAT-2 closure report je podklad rozhodnutí; v tomto PR je archivováno jeho strukturované shrnutí a odkazy na operativní úkoly.

**Stav dokumentu:** archiv rozhodnutí vlastníka a závěrečného UX rozsahu; budoucí produktové změny vyžadují vlastní zadání a schválení.
