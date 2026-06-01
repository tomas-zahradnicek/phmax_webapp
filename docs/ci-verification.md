# Ověření CI (lokální proxy)

Workflow `.github/workflows/ci.yml` běží na push/PR do `master` / `main`:

- `npm ci`, `build`, manifest checks, `test:golden`, `npm test`, `lint`, `test:e2e` (všechny Playwright projekty)

## Poslední lokální kontrola (0.3.3)

Spusťte před tagem:

```bash
npm run build
npm test
npm run lint
npm run test:e2e -- --project=desktop-chrome
```

GitHub Actions stav: záložka **Actions** na repozitáři po pushi na `master` nebo po otevření PR.

Release workflow (`.github/workflows/release.yml`) se spouští při push tagu `v*`.
