# Pilot s řediteli (5 minut) – Ředitelský průvodce PHmax

**Cíl:** Ověřit, zda nový uživatel do ~5 sekund pochopí stav školy, souhrn a kam pokračovat.  
**Nepřidávejte další UI ladění** během pilotu – sbírejte pozorování a citace.

## Koho oslovit (3–5 osob)

| Profil | Počet |
|--------|-------|
| Ředitel/ředitelka ZŠ | 2–3 |
| Ředitel/ředitelka MŠ (PV) | 1 |
| Zástupce (ideálně metodika / personální) | 1 |

## Odkaz na test

- Produkce: https://phmax-webapp.vercel.app/?view=dash (přehled)
- Případně vlastní deploy po nasazení `master`

Doporučení: **anonymní okno** nebo jiný prohlížeč než ten, kde už máte vyplněná data – uvidíte „prázdný“ i „vyplněný“ stav podle toho, zda účastník někdy kalkulačku používal.

## Úkol pro účastníka (přečtěte nahlas)

> Otevři stránku a **bez dalších instrukcí** mi řekni:
> 1. Co si myslíš, že to je?
> 2. V jakém stavu jsou tvoje (nebo ukázková) výpočty?
> 3. Kde bys pokračoval/a jako první?
> 4. Jaký je podle tebe souhrnný výsledek školy?
> 5. Co bys udělal/a hned teď – jedním krokem?

**Nepomáhejte** s klikáním, dokud účastník sám nepožádá (max. po 2 minutách nasměrujte na záložku Přehled, pokud je ztracený).

## Co zapisovat (šablona)

```
Datum:
Role:
Zařízení (MŠ/ZŠ/SŠ):
Prohlížeč:

1) Co to je (citace):
2) Stav výpočtů (citace):
3) První krok (citace):
4) Souhrnný PHmax – pochopil? (ano/ne + citace):
5) Emoce (klid / zmatek / důvěra):

Poznámky pozorovatele (kde váhal, scroll, co přehlédl):
```

## Kritéria úspěchu (orientační)

- Do 5 s: zmíní **přehled / stav školy / kalkulačky**
- Najde **Stav školy** nebo KPI řádek bez nápovědy
- U vyplněných dat: pojmenuje **souhrnný PHmax** nebo alespoň modul s nejvyšší hodnotou
- První akce dává smysl (Pokračovat, konkrétní modul, ne „Import JSON“)

## Po pilotu

1. Seřadit problémy podle frevence (ne podle hlasitosti jednoho ředitele).
2. Teprve pak rozhodnout o UI vs. obsahu (SEO bloky, poradna).
3. Výsledky uložit do issue / poznámek k `docs/product-roadmap.md`.

## Co pilotem neřešit

- Přesnost výpočtu vs. oficiální metodika (to je jiné kolo s metodikem).
- IT import / export (pokud sám nezačne IT role).
