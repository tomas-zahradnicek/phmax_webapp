# Závěrečný akceptační protokol – redesign kalkulačky ZŠ

**Projekt:** Ředitelský průvodce – PHMAX webapp  
**Datum rozhodnutí vlastníka:** 5. listopadu 2026  
**Rozsah:** UX-HEADER-1A/1B, UX-FLOW-1A, UX-MODES-1A, UX-FLOW-1B-1, UX-FLOW-1B-2  
**Akceptační větev / commit:** `master` / [`16d8333dbff30890bd911b0154f4c8ceac96a9d2`](https://github.com/tomas-zahradnicek/phmax_webapp/commit/16d8333dbff30890bd911b0154f4c8ceac96a9d2)  
**Podklady:** UX-ZS-FINAL-UAT-1; UX-ZS-FINAL-UAT-2 CLOSURE REPORT; [GitHub Actions #345](https://github.com/tomas-zahradnicek/phmax_webapp/actions/runs/42056735275)  
**Konečný projektový stav:** **ACCEPTED WITH KNOWN LIMITATIONS** (uživatelská akceptace uzavřena)

> **Rozlišení dvou rozhodnutí:** Technické a uživatelské vyhodnocení UAT-2 skončilo jako **CONDITIONAL PASS**. Dne 5. 11. 2026 vlastník projektu výslovně přijal nálezy UAT2-01 až UAT2-05. Tím splnil zbývající rozhodovací podmínku a **uzavřel uživatelskou akceptaci se známými omezeními**. Výsledek původní UAT se zpětně nepřepisuje.

## 1. Rozhodnutí vlastníka projektu

Vlastník schválil **variantu A**: přijmout všech pět zdokumentovaných produktových omezení jako známý UX dluh a případné opravy vést jako samostatná následná zadání. Žádný další implementační PR není podmínkou uzavření redesignu ZŠ.

Rozsah tohoto rozhodnutí **nezahrnuje** neověřené operace (viz oddíl 4) a **neznamená**, že dokumentované P2/P3 nálezy byly opraveny.

## 2. Doložené výsledky ověřování

| Oblast | Výsledek a rozsah důkazu |
| --- | --- |
| Git baseline | UAT na čistém `master` @ `16d8333` |
| Pětikrokový průvodce | Dokončeno: Typ školy → Třídy → Výjimky → Souhrn PHmax → Celkový přehled; ověřen návrat |
| Režimy | Průvodce i Všechna pole funkční; přepnutí režimu zachovalo zadané hodnoty v relaci |
| Vstupy a navigace | V UAT dostupná požadovaná pole a běžné klikání bez `force`; 390/768 px vyžadovalo posun stránky pro tlačítko Další krok |
| PHmax | Kanonický příklad **934 h**; neobsahuje samostatný PHA1Rmax |
| PHA1Rmax | Ověřeno **20 h** a platná vypočtená **0 h** |
| PHPmax | Ověřeno **12 h** u příkladu `phpmax_tri_roky`; další PHPmax scénář nebyl načten |
| Sémantické stavy | Nezadáno; Nelze spočítat; platná nula 0 h; samostatnost metrik |
| Obnovení stránky | Obnoven aktuální krok Celkový přehled; obnovení **číselných hodnot nebylo samostatně ověřeno** |
| Responsivní kontrola | 390×844, 768×900, 1024×800, 1366×768, 1920×1080; nebylo zaznamenáno vodorovné přetékání |
| Automatizované CI | [Běh #345](https://github.com/tomas-zahradnicek/phmax_webapp/actions/runs/42056735275): **205/205 Playwright PASS** bez retry; build, golden tests, Vitest, lint PASS |
| Závažnost | Podle dostupné UAT evidence nebyly identifikovány otevřené **P0 ani P1** |

Úspěšné automatizované CI nenahrazuje jednotlivá níže popsaná uživatelská ověření.

## 3. Přijatá známá omezení a backlog

Všechna omezení níže jsou **výslovně přijata**, nikoliv odstraněna. GitHub Issues jsou evidenční backlog bez závazku termínu implementace.

| UAT ID | Závažnost | Potvrzený nález | Evidence / další postup |
| --- | --- | --- | --- |
| [UAT2-01](https://github.com/tomas-zahradnicek/phmax_webapp/issues/63) | P2 | Plovoucí mobilní souhrn může na 390/768 px zakrýt **Další krok**. Běžný posun stránky akci odkryje. | Přijato; případně doplnit ZŠ-specifický bezpečný prostor |
| [UAT2-02](https://github.com/tomas-zahradnicek/phmax_webapp/issues/65) | P2 | Platně dokončený výpočet stále nabízí **Přejít k chybě**. | Přijato; v budoucnu zobrazovat skok jen při skutečné chybě |
| [UAT2-03](https://github.com/tomas-zahradnicek/phmax_webapp/issues/67) | P2 | Oznámení o kompletních vstupech se na desktopu opakuje v banneru, proužku a sticky liště. | Přijato; případně odstranit redundantní sdělení |
| [UAT2-04](https://github.com/tomas-zahradnicek/phmax_webapp/issues/69) | P2 | Průvodce i seznam obsahu poskytují souběžnou navigaci mezi sekcemi. | Přijato; případně vizuálně podřadit sekundární navigaci |
| [UAT2-05](https://github.com/tomas-zahradnicek/phmax_webapp/issues/72) | P3 | Hlavičkový čip při 390 px ukazuje zkrácené **Nezadá** místo **Nezadáno**. | Přijato; případně upravit zalomení/šířku čipu |

**Povinné opravy před přijetím:** žádné. Případnou implementaci řešit v oddělené větvi a PR, s vlastním cíleným testováním a CI. Neotevírat původní rozsah redesignu bez důkazu nové regresní vady.

## 4. Výslovně neověřené oblasti

Tyto položky mají stav **NOT VERIFIED**, ne „PASS“ a ne „potvrzená vada“:

- Uchování **číselných hodnot** kalkulačky po obnovení stránky. Ověřeno bylo jen obnovení kroku a zachování hodnot v téže relaci.
- Skutečný **obsah uloženého/exportovaného souboru**. Ovládací prvky Uložit a Export byly dostupné, ale exportovaný soubor nebyl ověřen.
- **Úplný klávesnicový průchod** všemi poli a ovládacími prvky; doložen jen počáteční Tab.
- Výsledkový stav **Nevztahuje se** nebyl samostatně reprodukován.
- Druhý nezávislý příklad PHPmax nebyl v UAT načten.
- Cílové chování **Přejít k chybě** po kliknutí v již bezchybném stavu nebylo ověřeno.
- Oranžový okraj pole u druhého stupně s 0/0 byl pouze pozorován, **nikoliv potvrzen jako vada**.

Pokud se z některé neověřené oblasti stane konkrétní další požadavek, založit cílený testovací úkol oddělený od již přijatých P2/P3 omezení.

## 5. Testovací incident mimo produktový backlog

**UAT2-06** – první automatický průchod selhal, protože nabídka **Zobrazení** byla již otevřená a druhý klik ji zavřel. Skript poté nenašel radio **Průvodce**. Pozdější browser průchod správně ošetřil stav nabídky a úspěšně přešel mezi režimy; nešlo o potvrzenou chybu aplikace.

Podle UAT-2 se na místním `master` nacházely **tři necommitované úpravy E2E testů**, které nejsou součástí akceptačního commitu:

- `e2e/smoke-helpers.ts`
- `e2e/zs-classes-exceptions-flow.spec.ts`
- `e2e/zs-display-modes.spec.ts`

Tyto úpravy nejsou UAT důkazem, nebyly zahrnuty do tohoto dokumentačního PR a jejich případné převzetí/odstranění musí být řešeno samostatně. **Neprovádět automatický reset či čištění pracovního stromu.**

## 6. Auditní stopa důkazů

- **UAT-1**: skutečný Chromium na `http://127.0.0.1:4175/phmax-zakladni-skola`, prázdné úložiště, průchod kroků a viewporty výše.
- **UAT-2**: konsolidační report bez opakování celého UAT, původní verdikt CONDITIONAL PASS.
- **Lokální screenshoty z UAT-1** (v době testování): `C:\Users\info\AppData\Local\Temp\ux-zs-uat-1\` – zejména `first-390.png`, `mobile-float-390.png`, `empty-1366.png`, `example-934.png`, `step5-prehled.png` a snímky kroků 2–5.
- **Omezení důkazu:** soubory v lokální dočasné složce nejsou připojené k tomuto GitHub protokolu. Odkaz na lokální cestu nedokládá trvalou archivaci screenshotů.
- **Automatické CI**: [GitHub Actions #345](https://github.com/tomas-zahradnicek/phmax_webapp/actions/runs/42056735275).
- **Implementační základ**: sloučený [PR #62](https://github.com/tomas-zahradnicek/phmax_webapp/pull/62), commit `16d8333`.

## 7. Konečné rozhodnutí a pravidla pokračování

**Uživatelská akceptace redesignu ZŠ je k 5. 11. 2026 UZAVŘENA jako ACCEPTED WITH KNOWN LIMITATIONS.** Vlastník přijal UAT2-01 až UAT2-05 a nepožaduje další implementační změnu jako podmínku uzavření.

Pro navazující práci platí:

1. Uchovat výchozí výpočty, validaci, sémantické stavy, ukládání, export a nezávislé kalkulačky PV, ŠD, SŠ, NV75.
2. Nálezy P2/P3 řešit jen jako samostatné backlog úkoly, nikoliv jako neuzavřenou původní etapu.
3. Nezaměňovat **NOT VERIFIED** za testem potvrzenou správnost či nesprávnost.
4. U každého budoucího opravného PR zaznamenat reprodukci, rozsah a regresní testy; sloučit až po GitHub CI.
