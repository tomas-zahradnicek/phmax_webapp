# Smoke checklist po 0.3.14

Orientační ruční kontrola po release. Automatizace: `npm run test:e2e` (mobil + desktop projekty v `playwright.config.ts`).

## Příprava

```bash
npm ci
npm run build
npm run test:golden
npm run lint
npm run test:e2e
```

E2E běží proti `npm run preview` – **build musí proběhnout před E2E** (CI už má pořadí `build` → `test:e2e`).

## Popisky PHmax (PV, ŠD, ZŠ, SŠ)

| Modul | Očekávaný popisek v docku (desktop) | Nesmí být |
|-------|-----------------------------------|-----------|
| PV | PHmax celkem | PHMAX CELKEM |
| ŠD | PHmax | PHMAX |
| ZŠ | PHmax celkem (záložka phmax) | PHMAX |
| SŠ | Součet PHmax | PHMAX |

## Dashboard

- [ ] Sekce **Kdo jste? Rychlý vstup** (role cards).
- [ ] Po seed ≥2 modulů: checkbox exportu → mini-wizard (krok IT).
- [ ] Pojmenovaná záloha ZŠ → sekce **Porovnání scénářů (ZŠ)**.
- [ ] Kontrolní list exportu obsahuje `appVersion`, `coherenceWarnings`, odkaz na IS docs.

## ZŠ

- [ ] Quick tour (základní režim, první návštěva).
- [ ] Přípravná třída: režim v ZŠ, ne MŠ v PV (viz handout „Kde zadat co“).

## Handout PDF (volitelně)

```bash
npm run docs:handout-pdf
```

Výstup dle `scripts/generate-handout-pdf.mjs` – po změně HTML/MD přegenerovat před tiskem pro ředitele.
