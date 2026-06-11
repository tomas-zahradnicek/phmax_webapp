# Kontrola po nasazení (PHmax webapp)

Orientační checklist po push na `master` a deployi na Vercel (např. https://phmax-webapp.vercel.app).

**Pilot s řediteli:** viz [pilot-reditel-5min.md](./pilot-reditel-5min.md).  
**SEO:** `public/robots.txt`, `public/sitemap.xml`, `vercel.json` (SPA rewrite); title/meta/OG/JSON-LD + FAQ schema podle modulu (`src/phmax-document-head.ts`). Čisté URL: `/prehled`, `/phmax-zakladni-skola`, … (`src/product-view-paths.ts`). SEO bloky pod kalkulačkou: `PhmaxModuleSeoSection`.

**Analytika:** Google Analytics (`G-LRMBR1Y874`) a Microsoft Clarity v `index.html` (Vite SPA, ne Next.js `layout.tsx`).

**Ikona a logo:** `public/favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `reditelskypruvodce-logo.png` – po výměně loga: `node scripts/generate-favicon-ico.mjs` (vyžaduje jednorázově `npm install --no-save to-ico`).

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
npm run test:e2e -- e2e/dashboard-post-deploy-smoke.spec.ts
```

Automatický smoke po deployi: `e2e/dashboard-post-deploy-smoke.spec.ts` (Přehled → Otevřít PV → export CSV, toast po „Začít u ukázky“, odkaz Návod v záložkách modulu).

Round-trip import: `src/phmax-import-roundtrip.test.ts` (CSV z `docs/import-templates/`).

Generovaný handoff JSON: `npm run import:csv-handoff` → `docs/import-templates/phmax-is-handoff.generated.json`.
