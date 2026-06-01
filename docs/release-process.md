# Release proces

## Automatický GitHub Release

Push tagu `v*` spouští workflow `.github/workflows/release.yml`:

- tělo release = `.github/release-notes/vX.Y.Z.md` (pokud existuje), jinak `CHANGELOG.md`
- vyžaduje oprávnění `contents: write` na repozitáři

Tagy `v0.3.1`, `v0.3.2` by měly mít release vytvořený workflow po `git push origin vX.Y.Z`.

## Lokální kontrola před tagem

```bash
npm run build
npm test
npm run lint
npm run test:e2e -- --project=desktop-chrome
```

## Ruční release (bez gh CLI)

1. GitHub → Releases → Draft new release
2. Tag: existující `vX.Y.Z`
3. Body: zkopírovat z `.github/release-notes/vX.Y.Z.md`
