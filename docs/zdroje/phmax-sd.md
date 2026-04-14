# PHmax – školní družina (praktický postup)

## 1. Co je PHmax
PHmax (maximální počet hodin) vyjadřuje týdenní rozsah přímé pedagogické činnosti ve školní družině, který je financovaný ze státního rozpočtu.

- Vztahuje se na **celou školní družinu (jednu právnickou osobu)**
- Závisí především na:
  - počtu oddělení
  - počtu účastníků
  - případných výjimkách

---

## 2. Vstupní údaje

Pro výpočet potřebujete:

- Počet oddělení školní družiny (výkaz Z 2-01, ř. 0101)
- Celkový počet účastníků (žáci 1. stupně)
- Informaci:
  - zda jde o běžná oddělení
  - zda existují „speciální“ oddělení (§ 16 odst. 9)
  - zda byla udělena výjimka z minimálního počtu

⚠️ Rozhodující jsou údaje z oficiálních výkazů (Z 2-01, P 1c-01)

---

## 3. Základní postup výpočtu

### Krok 1 – zjisti počet oddělení
Sečti všechna oddělení školní družiny (za všechna pracoviště).

👉 PHmax se vždy počítá za celou organizaci, ne za jednotlivá pracoviště.

---

### Krok 2 – najdi základní PHmax
Podle počtu oddělení najdi odpovídající hodnotu PHmax v tabulce (vyhláška č. 74/2005 Sb.).

👉 Toto je základní (nekrácená) hodnota.

---

### Krok 3 – spočítej průměrný počet účastníků

---

## 4. Krácení při nízkém počtu účastníků

Pokud není splněn minimální počet (typicky 20 žáků na oddělení):

### Výpočet:

👉 Výsledek se poměrně snižuje.

---

## 5. Speciální oddělení (§ 16 odst. 9)

Pokud družina obsahuje speciální oddělení:

PHmax se snižuje podle průměrného počtu účastníků v těchto odděleních:

| Počet účastníků | Krácení |
|----------------|--------|
| 5–6            | −5 %   |
| 4–5            | −10 %  |
| méně než 4     | −60 %  |

👉 Krácení se vztahuje pouze na část PHmax odpovídající těmto oddělením.

---

## 6. Výjimka z minimálního počtu

Pokud je udělena výjimka:

👉 Používá se zejména u malých škol (1–2 oddělení).

---

## 7. Specifické situace

### Jedno oddělení
- PHmax se bere přímo z tabulky podle počtu účastníků

### Více oddělení
- používá se agregovaný výpočet (součty, průměry)

---

## 8. Shrnutí postupu

1. Zjisti počet oddělení
2. Najdi základní PHmax v tabulce
3. Spočítej průměrný počet účastníků
4. Pokud je nízký → aplikuj krácení
5. Pokud jsou speciální oddělení → aplikuj další krácení
6. Výsledek zaokrouhli

---

## 9. Důležité poznámky

- PHmax a PHAmax se počítají samostatně
- Nelze mezi nimi převádět hodiny
- Výsledek ovlivňuje financování školy

---

## 10. Zjednodušený algoritmus (pro aplikaci)

if (pocet_oddeleni == 1):
PHmax = tabulka_dle_ucastniku
else:
PHmax = tabulka_dle_oddeleni

if (ucastnici < minimum):
PHmax = PHmax * (ucastnici / minimum)

if (existuje_specialni_oddeleni):
PHmax = snizeni_dle_koeficientu

return PHmax

---

## 11. Konkrétní vstupy pro oba režimy (TypeScript)

Níže jsou ukázky pro modul `phmax-sd.ts`:

- `mode: "summary"` = souhrnný vstup (agregované běžné oddělení + speciální oddělení po položkách)
- `mode: "detail"` = oddělení po jednom řádku (interní model výpočtu)

### 11.1 Souhrnný režim (`SchoolShdSummaryInput`)

```ts
import {
  calculateSchoolDruzinaPhmax,
  summaryToDetailModel,
  type SchoolShdSummaryInput,
} from "./phmax-sd";

const summaryInput: SchoolShdSummaryInput = {
  mode: "summary",
  regularDepartments: 3,
  regularParticipantsTotal: 48,
  regularExceptionGranted: true,
  schoolFirstStageClassCount: null,
  specialExceptionGranted: true,
  specialDepartments: [
    { participants: 5.4, exceptionGranted: true }, // koeficient 0.95
    { participants: 4.3, exceptionGranted: true }, // koeficient 0.90
    { participants: 3.8, exceptionGranted: true }, // koeficient 0.40
  ],
};

const summaryResult = calculateSchoolDruzinaPhmax(summaryInput);
const internalDetail = summaryToDetailModel(summaryInput); // převod na detailní interní model
```

Co ukazuje příklad:
- běžná i speciální oddělení v jedné družině,
- více speciálních oddělení s různým počtem účastníků,
- poměrné krácení běžné části (výjimka u běžných oddělení),
- samostatné krácení každého speciálního oddělení.

Očekávaný orientační kontrolní výsledek:
- `summaryResult.basePhmax = 155.0`
- `summaryResult.finalPhmax = 119.9`
- rozpad: běžná část `64.0` + speciální část `55.9`
- kontrola po odděleních (po krácení): `26.0`, `20.0`, `18.0`, `16.6`, `29.3`, `10.0`

### 11.2 Detailní režim (`SchoolShdDetailInput`)

```ts
import { calculateSchoolDruzinaPhmax, type SchoolShdDetailInput } from "./phmax-sd";

const detailInput: SchoolShdDetailInput = {
  mode: "detail",
  regularExceptionGranted: true,
  specialExceptionGranted: false, // globální default pro speciální oddělení
  schoolFirstStageClassCount: 3,
  departments: [
    { kind: "regular", participants: 17 },
    { kind: "regular", participants: 16 },
    { kind: "special", participants: 5.1, specialExceptionGranted: true },
    { kind: "special", participants: 3.9, specialExceptionGranted: true },
    { kind: "special", participants: 6.2 }, // bez lokální výjimky -> použije globální specialExceptionGranted
  ],
};

const detailResult = calculateSchoolDruzinaPhmax(detailInput);
```

Co vrací výsledek:
- souhrn (`basePhmax`, `regularSharePhmax`, `specialSharePhmax`, `finalPhmax`),
- koeficienty (`regularReductionFactor`, `specialReductionFactor`),
- detailní rozpad po odděleních v `departments[]` (základ, koeficient, finální PHmax).

Očekávaný orientační kontrolní výsledek:
- `detailResult.basePhmax = 130.0`
- `detailResult.finalPhmax = 108.3`
- rozpad: běžná část `47.4` + speciální část `60.9`
- kontrola po odděleních (po krácení): `26.8`, `20.6`, `21.4`, `7.0`, `32.5`

### 11.3 Minimalistický příklad bez výjimek

```ts
import { calculateSchoolDruzinaPhmax } from "./phmax-sd";

const simple = calculateSchoolDruzinaPhmax({
  mode: "detail",
  departments: [
    { kind: "regular", participants: 24 },
    { kind: "regular", participants: 23 },
  ],
});
```

Tady se neuplatní krácení (koeficienty vyjdou 1), ale výpočet stále běží interně po jednotlivých odděleních.

Očekávaný orientační kontrolní výsledek:
- `simple.basePhmax = 57.5`
- `simple.finalPhmax = 57.5`