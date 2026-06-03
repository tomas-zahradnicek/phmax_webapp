# Kontrola po nasazení (PHmax webapp)

Orientační checklist po push na `master` a deployi na Vercel (např. https://phmax-webapp.vercel.app).

## Prohlížeč

1. **Tvrdé obnovení** – `Ctrl+F5` (Windows) / `Cmd+Shift+R` (Mac), případně anonymní okno.
2. **Vyskakovací okna** – povolit pro doménu aplikace (tisk „Kontrola před jednáním“, „Tisk shrnutí“ v modulech).
3. **localStorage** – při pádu ZŠ po starém autosave smazat klíč `edu-cz-zs-calculator-state` a znovu načíst stránku.

## Dashboard – import / export

1. **Šablona importu** – znovu stáhnout **phmax-import-skola-v2.xlsx** (list ŠD: sloupec **Počet účastníků**, ne „Počet žáků“).
2. **Import** – nahrát vyplněný soubor → náhled → potvrzení; ověřit toast a součet PHmax.
3. **Tisk** – „Kontrola před jednáním (tisk)“ otevře náhled s obsahem (ne prázdné `about:blank`).
4. **Export JSON** – volitelně zkontrolovat pole `displayForHumansCs` (čitelné součty s čárkou a `h./týd.`).

## Moduly (rychlý smoke)

| Modul | Co ověřit |
|-------|-----------|
| ZŠ | `?view=zs` načte bez ErrorBoundary; záložky PHmax / PHAmax / PHPmax; banner „orientace k pásmu“ |
| PV | Tisk shrnutí; nápověda k vyššímu pásmu doby |
| ŠD | Import/export štítku účastníků |
| NV75 | Nápověda k vyššímu pásmu §4b (jednotky) |
| Dashboard | Blok „Orientace k vyššímu PHmax“ pod cross-součtem |

## IT / automatické testy

```bash
npm run lint
npm run build
npx vitest run src/phmax-import-roundtrip.test.ts src/phmax-import-pv-zs.test.ts
```

Round-trip import: `src/phmax-import-roundtrip.test.ts` (CSV z `docs/import-templates/`).

Generovaný handoff JSON: `npm run import:csv-handoff` → `docs/import-templates/phmax-is-handoff.generated.json`.
