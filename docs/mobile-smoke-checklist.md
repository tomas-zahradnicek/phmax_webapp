# Mobilní smoke (cca 5 min)

Rychlá kontrola po UX změnách 0.2.4. Otevřete na telefonu nebo v prohlížeči s šířkou **&lt; 1100 px** (DevTools → responsive, např. iPhone 12).

Spuštění lokálně: `npm run preview` → `http://localhost:4173/?view=pv` (nebo `ss`, `zs`).

## 1. Plovoucí souhrn (PV nebo SŠ)

1. Načtěte modul a **posuňte dolů** – dole se objeví souhrn (hlavní číslo + případně statistiky).
2. **Klepněte na souhrn** – stránka posune k docku nahoře.
3. Ověřte, že **pod formulářem není velká prázdná mezera** (výška rezervy odpovídá panelu, ne max. 46vh).
4. Klepněte **Skrýt souhrn** – zůstane chip **Zobrazit souhrn** vpravo dole; formulář má víc místa.
5. Chip **Zobrazit souhrn** panel znovu otevře.

## 2. Záložka Obsah

1. Se souhrnem viditelným: vpravo nad panelem je vertikální **Obsah**.
2. Klepněte **Obsah** – rozbalí se seznam sekcí; výběr sekce posune formulář.
3. Po **Skrýt souhrn** sedí Obsah nad chipem (bez překryvu).

## 3. Banner neúplných vstupů

| Modul | Jak vyvolat | Co ověřit |
|-------|-------------|-----------|
| PV | Nechte prázdnou průměrnou denní dobu u pracoviště | Žlutý banner nahoře + **Přejít k chybě** |
| ZŠ | Smažte počty žáků u vyplněných tříd | Jeden banner se seznamem (bez duplicitní karty Kontrola vstupů); při scrollu zůstává nahoře |
| SŠ | Neúplný řádek v tabulce | Banner + scroll na sekci vstupů |

## 4. Dashboard

1. `?view=dash` – sekce **Pokračovat** ukazuje **Ještě nevyplněno** nebo **Vstupy v pořádku**.
2. Nadpis přehledu **bez** slova localStorage.

## Záznam

| Datum | Zařízení / prohlížeč | Souhrn + Obsah | Skrýt souhrn | Banner | Poznámka |
|-------|----------------------|----------------|--------------|--------|----------|
|       |                      | OK / NOK       | OK / NOK     | OK / NOK |          |

**NOK** = screenshot + stručný popis (modul, krok checklistu).
