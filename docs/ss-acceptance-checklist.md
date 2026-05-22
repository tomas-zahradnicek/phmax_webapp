# SŠ – acceptance checklist (ověření na reálných datech)

Orientační podklad pro předání modulu `?view=ss` (verze 0.2). Aplikace **nenahrazuje** oficiální výstup školy – slouží k orientaci a kontrole vstupů.

Metodika: [MŠMT – PHmax pro SŠ 2026](https://msmt.gov.cz/vzdelavani/skolstvi-v-cr/ekonomika-skolstvi/metodika-vypoctu-phmax-pro-ss-2026).

## Co aplikace v 0.2 počítá / nepočítá


| Oblast                                                   | V aplikaci                                          | Mimo aplikaci (ručně / MŠMT)   |
| -------------------------------------------------------- | --------------------------------------------------- | ------------------------------ |
| PHmax po řádcích (dataset NV, režimy, koeficienty formy) | Ano (orientační)                                    | Složité agregace školy dle § 4 |
| PHAmax                                                   | Jen PrŠ `78-62-C/01`, `78-62-C/02`, **denní forma** | Ostatní obory, jiné formy      |
| § 16 odst. 9                                             | Přepínač, kontrola pravidel, varování               | Plný výpočet pásem § 16        |
| Víceoborové třídy                                        | Kontrola pravidel (sloupce Další obory / žáci)      | —                              |


## Příprava

1. Spusťte `npm run build` a `npm run test:golden` (nebo ověřte poslední CI na `master`).
2. Otevřete `npm run preview` → `?view=ss`, režim **Základní**.
3. Připravte si 1–2 reálné podklady ze školy (evidence tříd / oborů) a 1 řádek z metodiky nebo interní tabulky pro porovnání.

## Scénáře k ručnímu ověření

Zapište do tabulky: **očekávané (metodika / škola)** vs **aplikace** vs **poznámka**.

### A – Běžný jednoobor (PHmax)


| Pole        | Hodnota k ověření       |
| ----------- | ----------------------- |
| Kód oboru   | např. `39-41-L/01`      |
| Průměr žáků | např. 17                |
| Počet tříd  | 2                       |
| Forma       | denní                   |
| Režim PHmax | Automaticky / jednoobor |


**Automatický smoke (golden):** PHmax celkem **100** (50 × 2, pásmo 17–20).

### B – Forma studia (koeficient)

Stejný obor, **večerní forma** – očekávaný součet PHmax **30** (koeficient 0,3 u golden příkladu).

### C – Praktická škola + PHAmax


| Pole        | Hodnota                        |
| ----------- | ------------------------------ |
| Kód         | `78-62-C/01` nebo `78-62-C/02` |
| Průměr žáků | např. 4                        |
| Forma       | **denní**                      |


- V horním docku / souhrnu: **PHAmax PrŠ** > 0 (ne „–“).
- PHmax řádku: golden smoke **30** (1 třída, pásmo 4–6).

### D – Víceoborová třída (kontrola pravidel)

- Vyplňte **Další obory** a volitelně **Žáci / obor**.
- Ověřte blok **Kontrola pravidel** – varování/chyby odpovídají situaci (ne mechanicky „OK“ u konfliktu).

### E – § 16 odst. 9 (omezení 0.2)

- Na řádku zapněte **Třída dle § 16 odst. 9**.
- Očekávejte:
  - varování `PAR16_CALC_PREVIEW_ONLY` / text o neúplném výpočtu,
  - stav řádku **§ 16 – orientačně** (ne čisté „OK“),
  - verdikt stránky s upozorněním, pokud je § 16 řádků více.

**Neověřujte** shodu PHmax s plnou metodikou § 16 – to záměrně není implementováno.

### F – Reálná škola (povinné)

Vyberte **min. jeden** reálný řádek z vaší evidence:

1. Načtěte ukázkový příklad jen jako vzor UI, pak **vymažte / upravte** na vlastní data.
2. Porovnejte **PHmax na třídu** a **celkem** s vaším excelovým nebo metodickým výpočtem (tolerance: zaokrouhlení).
3. Pokud máte PrŠ v denní formě, porovnejte **PHAmax** v horním přehledu.
4. Exportujte **CSV** – zkontrolujte sloupce kódu, průměru, tříd, formy, PHmax.

## Export a archivace

- CSV export obsahuje `Verze metodiky` / orientační poznámku (kde je v exportu použita).
- Uložený soubor má datum v názvu (aplikace doplňuje při exportu).
- Na sdíleném PC: po testu **Vymazat uložená data** nebo anonymní režim.

## Regrese před předáním

```bash
npm run test:golden
npm run build
npm run check:readme-sync
```

## Záznam výsledku (šablona)


| Datum | Tester | Škola / scénář  | Výsledek            | Poznámka                                                              |
| ----- | ------ | --------------- | ------------------- | --------------------------------------------------------------------- |
|       |        | A – jednoobor   | OK / NOK            |                                                                       |
|       |        | C – PrŠ PHAmax  | OK / NOK            |                                                                       |
|       |        | E – § 16        | OK (varování) / NOK |                                                                       |
|       |        | F – reálná data | OK / NOK            | F – reálná škola | Neověřeno | Nemám k dispozici reálná vstupní data. |


**NOK** = rozdíl oproti metodice nebo škole; přiložte screenshot řádku + rozbalení „Proč?“.