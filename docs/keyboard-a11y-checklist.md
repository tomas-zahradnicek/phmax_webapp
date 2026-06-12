# Kontrola klávesnice (cca 15 min)

Ruční checklist po změnách přístupnosti. Otevřete každý modul (`?view=pv`, `sd`, `ss`, `zs`, `nv75`, `dash` / `/prehled`).

## Automaticky pokryto v kódu (0.3.16+)

| Oblast | Implementace |
|--------|----------------|
| Skip link | `SkipToMainLink` → `#phmax-calculator-main` / dashboard main |
| Modály (nápověda, slovníček, Co je nového, import) | `useModalDialogA11y` – Escape, focus trap, `body` scroll lock, návrat fokusu |
| Drawer Akce (mobil) | `HeroActionsDrawer` – `wasOpenRef` + focus na trigger po zavření |
| Toast po importu/exportu | `showUiToast(..., { assertive: true })` → `aria-live="assertive"` |
| Varování u polí | `.field-validation-warning` (`#7c2d12` na světlém pozadí) |
| Koherence na přehledu | `.dash-coherence-warnings` |

Kontrakt: `src/phmax-a11y-release-contract.test.ts`.

## Všechny moduly

1. **Tab** z adresního řádku — první fokus má být skip link („Přeskočit na výpočet“ / „Přeskočit na obsah“).
2. Aktivujte skip link **Enter** — fokus skočí do hlavního obsahu (formulář / přehled).
3. **Tab** dál: horní lišta (nápověda, slovníček kde je), workspace, dock, mobilní „Obsah stránky“ (pokud je vidět).

## Modály

| Dialog | Otevřít | Tab | Escape | Fokus po zavření |
|--------|---------|-----|--------|------------------|
| Nápověda | tlačítko v horní liště | cyklí uvnitř panelu | zavře | zpět na Nápověda |
| Slovníček | 📘 Slovníček | cyklí uvnitř | zavře | zpět na Slovníček |
| Co je nového | odkaz v patičce | cyklí uvnitř | zavře | zpět na odkaz |
| Import školy | Přehled → Import | cyklí uvnitř | zavře | zpět na Import |

Při otevřeném dialogu by stránka **neměla** scrollovat pod modálem (zamčené `body`).

## Mobilní obsah stránky (TOC)

Šířka &lt; 1100px nebo úzké okno:

1. **Obsah stránky** — Enter/Space rozbalí panel.
2. **Tab** v panelu — odkazy sekcí, tlačítko Nahoru.
3. **Escape** — panel se zavře, fokus na trigger.

## Drawer Akce (mobil, &lt; 900px)

PV / ŠD / SŠ / ZŠ / NV75:

1. **Akce…** — otevře panel zprava.
2. **Tab** cyklí uvnitř panelu.
3. **Escape** nebo Zavřít — fokus zpět na **Akce…**.

## Dock — Přejít k chybě

PV / ŠD / SŠ / NV75 / ZŠ (při nevyplněných vstupech):

1. Nechte prázdné povinné pole nebo chybný řádek.
2. V docku **Akce** otevřete „Přejít k chybě“.
3. Stránka posune na zvýrazněnou sekci (`card--needs-attention`).

## Záznam (vyplnit po ručním průchodu)

Poslední spot-check po 0.3.16 (kontrakt `phmax-a11y-release-contract` + E2E own-data). Sloupec **Poznámka** doplňte při změně modálu nebo layoutu.

| Modul | Skip link | Modály | TOC | Drawer Akce | Přejít k chybě | Poznámka |
|-------|-----------|--------|-----|-------------|----------------|----------|
| dash | ✓ | ✓ Import | — | — | — | checklist nového uživatele |
| pv | ✓ | ✓ Nápověda | ✓ | ✓ | ✓ | own-data E2E |
| sd | ✓ | ✓ | ✓ | ✓ | ✓ | |
| ss | ✓ | ✓ | ✓ | ✓ | ✓ | |
| zs | ✓ | ✓ | ✓ | ✓ | ✓ | |
| nv75 | ✓ | ✓ | ✓ | ✓ | ✓ | |
