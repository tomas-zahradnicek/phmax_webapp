# Ověření CI (lokální proxy)

Workflow `.github/workflows/ci.yml` běží na push/PR do `master` / `main`:

- `npm ci`, `build`, manifest checks, `test:golden`, `npm test`, `lint`, `test:e2e` (všechny Playwright projekty; **build před E2E** – preview servíruje `dist/`)

## Poslední lokální kontrola (0.3.3)

Spusťte před tagem:

```bash
npm run build
npm run test:golden
npm test
npm run lint
npm run test:e2e -- --project=desktop-chrome
```

Desktop-only specy (0.3.14+): `dashboard-ux-013`, `metric-label-casing` – viz `playwright.config.ts` projekt `desktop-chrome`.

```bash
npm run test:e2e -- e2e/dashboard-ux-013.spec.ts e2e/metric-label-casing.spec.ts --project=desktop-chrome
```

GitHub Actions stav: záložka **Actions** na repozitáři po pushi na `master` nebo po otevření PR.

Release workflow (`.github/workflows/release.yml`) se spouští při push tagu `v*`.
