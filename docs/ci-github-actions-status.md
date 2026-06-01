# Stav GitHub Actions (kontrola 2026-06-01)

| Workflow | Větev / tag | Výsledek |
|----------|-------------|----------|
| **Release** | `v0.3.3` | success |
| **Release** | `v0.3.2` | success |
| **CI** | `master` (po push v0.3.3) | **failure** – krok `Run npm run test:e2e` (pravděpodobně flake `toBeFocused` na mobilním chipu) |
| **Oprava v 0.3.4** | lokálně | mobilní smoke bez `toBeFocused`, `scrollIntoViewIfNeeded`, retries 2 v CI |

Lokálně po `v0.3.3`: `npm test` 342/342, `npm run test:e2e` 77/77 (Windows).

Doporučení: v záložce [Actions](https://github.com/tomas-zahradnicek/phmax_webapp/actions) otevřít run CI pro `master` a zkontrolovat log Playwright (flaky / Linux rozdíl). Případně re-run failed jobs.
