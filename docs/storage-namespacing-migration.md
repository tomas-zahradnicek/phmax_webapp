# Storage namespacing migration (N2 / N2-HARDEN / N2-ADOPT-PROTO / N2-ADOPT-WRITE)

Pilot resource: `phmax-scenario-label` / `value`  
Legacy authoritative key: `phmax-school-scenario-label`

## N2 status (this release)

- **Authority:** legacy only.
- **v2 keys:** shadow mirrors under `reditelsky-pruvodce:v2:…`.
- **Write order:** legacy authoritative → resolve target → invalidate marker → shadow write → raw verify → marker persist.
- **Shadow degradation:** if legacy succeeds and shadow fails, the business save is still **success** (`shadow: dirty`). Legacy remains source of truth.
- **Skipped target:** corrupted / unavailable Identity → legacy success, no shadow/marker (`shadow: skipped`).
- **No copy-on-read.** Reads never create v2 keys.
- **No cutover.** UI and Backup continue to read legacy only.
- **No Dashboard mount ensure.** Opening Dashboard without an edit does not create v2 keys or markers.
- **No unbound→school value copy.** Unbound is never the source of school shadow desired state (see N2-ADOPT-PROTO).
- **N2-HARDEN** does **not** switch authority and does **not** bootstrap on read.
- **N2-ADOPT-PROTO** types/tests the school-shadow establishment protocol only — **0 production hooks**.

## Raw semantics

- Missing (`getItem === null`) ≠ present empty string (`""`).
- Mirror equality uses exact raw presence + value (no trim / `|| ""` / `?? ""`).
- UI write path: trim; non-empty → present text; empty/whitespace → **clear** (remove), never present-empty.

## Legacy write confirmation (N2-HARDEN)

- Authoritative legacy success is determined by **storage API throw** on `setItem` / `removeItem`.
- Post-write raw equality is **not** used as a hard failure: concurrent tabs may overwrite between write and a later observation (last-writer-wins).
- Shadow raw verify remains required for mirror health (different role).

## Handoff / console snippet (N2-HARDEN)

- Production UI import resolves the shadow target at **actual apply** time from destination Identity.
- Console/IT snippet must **not** embed generation-time `school:<id>` keys.
- Destination live Identity is authority for v2 namespace:
  - missing → unbound
  - corrupted / unavailable → skipped (never guessed unbound)
- Handoff business payload is **not** authority for local storage namespace.

## Markers

Per physical target (unbound vs `school:<canonicalUuid>`).

Payload v1:

```json
{
  "schemaVersion": 1,
  "authority": "legacy",
  "mirrorHealth": "synced" | "dirty",
  "authoritativePresence": "present" | "absent"
}
```

- A `synced` marker is **historical evidence** of a successful verify, not proof of current equality under multi-tab races.
- Marker does **not** store value/hash.
- **N3 cutover must require:** healthy marker **and** fresh raw equality **and** presence consistency with fresh legacy.
- Marker alone is **never** cutover proof.
- Missing marker is fail-closed for N3.
- On shadow failure, prior healthy markers are invalidated; best-effort PROTO `dirty` marker may be written so a stale `synced` claim cannot remain trustable.
- `shadow: "synced"` means **data mirror health** after raw verify; it does **not** require that the marker row was persisted (marker persist failure → business success + synced data, readiness still NOT READY).
- After a verified clear, business lifecycle writes marker `synced` + `absent` (does not delete the marker). **Full Reset** removes all v2 keys including markers.

## Multi-tab

No BroadcastChannel / lock in N2. Concurrent tabs may leave temporary dirty mirrors; legacy remains authoritative (last-writer-wins). N3 must detect drift via fresh equality.

## Dual-write vs Restore transaction

| Path | Contract |
|------|----------|
| Dashboard / handoff / Level B / post-export clear | Legacy-first dual-write. **Not** atomic. Shadow failure is soft-degraded. |
| Restore-2A | Multi-key raw transaction with pre-write snapshot + rollback (legacy + v2 + marker). |

Do **not** describe ordinary dual-write as atomic.

## Restore (N2)

When scenario module is `present_valid` (non-empty string; empty/whitespace still rejected):

1. SET legacy
2. SET resolved v2 shadow
3. SET marker `legacy/synced/present`

Target policy (plan-time, post-restore dataset):

- Backup Identity A → `school:A`
- Scenario-only / no Profile → `unbound`
- Profile canonical UUID, no Identity → `school:Profile.id`
- Profile non-UUID, no Identity → **legacy-only** (no unbound orphan)
- Cross-school / corrupted local Identity → existing hard blocks

Dynamic allowlist is plan-context-aware (exact expected target). Prefix-only `reditelsky-pruvodce:v2:` allow is forbidden.

## Full Reset

`APPLICATION_LOCAL_STORAGE_PREFIXES` includes `reditelsky-pruvodce:v2:`.  
Removes all v2 business keys and migration markers. Foreign keys preserved. No `localStorage.clear()`.

## Future N3 readiness (pure helper)

`assessScenarioLabelCutoverReadiness` is a **pure** invariant primitive (no storage I/O, **0 production call sites** in N2-HARDEN).

READY only when: target resolved, marker valid + `authority=legacy` + `mirrorHealth=synced`, fresh legacy/v2 raw equality, and marker presence matches fresh legacy presence.

## N2-ADOPT-PROTO (school-shadow establishment)

Roadmap label remains **N2-ADOPT**. Actual semantics are **school-shadow establishment** (not “unbound adoption” / move / migration copy).

| Contract | Rule |
|----------|------|
| Source of truth | **Fresh LEGACY raw** only |
| Unbound value | **Never copied** into school shadow (no resurrection from unbound) |
| Unbound key / marker | **PRESERVE** (PROTO declares school-only ops) |
| Target | `school:<canonical lowercase UUID>` only — never `unbound` / `schoolYear` |
| Authority | **No cutover** — legacy remains authoritative |
| Runtime | **0 production hooks** in PROTO (Profile / VZ / Restore / Dashboard / Backup untouched) |
| Rollback | Trivial: PROTO has no runtime wiring, so deploy rollback cannot auto-establish shadows |

Desired school state examples:

- legacy `L2`, unbound `L1` → desired school = `L2`
- legacy missing, unbound stale `U` → desired school = **missing** (synchronized absence)

Future WRITE phase order (documented; not executed in PROTO):

`legacy_read_initial` → `target_inspect` → `marker_invalidate` → `school_shadow_write` → `school_shadow_verify` → `legacy_read_final` → `marker_persist`

Healthy synced marker may be persisted only if **final** fresh legacy equals verified school shadow (cross-tab change ⇒ not ready / dirty — marker must not lie).

### N2-ADOPT-WRITE stop conditions (resolved)

1. **Restore rollback ordering** — establishment runs **only after** verification success (past rollback boundary). Soft failure / throw does **not** invalidate verified Restore success; no orphan from failed reconcile/verify.
2. **Lifecycle ownership** — establishment is **not** inside `ensureSchoolPlatformBinding` / `ensureVzSchoolYearPlatformBinding`. Owned by post-ready runners (`runPlatformBindingAfterProfilePersist`, `runPlatformBindingOnMount`, `runVzSchoolYearBindingAfterPersist`) + Restore post-verify phase. Nested VZ→school ensure does not double-fire.
3. **Soft UX** — Profile/VZ business persistence must not fail solely because establishment metadata failed (`marker_incomplete` / soft `shadow_dirty` / throw).

## N2-ADOPT-WRITE (school-shadow establishment runtime)

First automatic school-shadow establishment after valid Identity is available.

| Contract | Rule |
|----------|------|
| Executor | `establishScenarioLabelSchoolShadowFromLegacy` |
| Source | Fresh **LEGACY** raw only |
| Unbound | **PRESERVE** (never source; never written) |
| `ensureSchool` / `ensureVz` | Remain free of scenario establishment side effects (`noop` may expose nested `schoolId` only) |
| Profile Save / mount | After binding `ready` → establishment; soft metadata warning on degrade |
| VZ afterPersist | After `ready` / `noop` → establishment once; SchoolYear error MSG precedence; soft generic notice on establishment degrade |
| Restore | **Post-verification** best-effort, before `{status:"success"}`; failure/throw still returns success |
| Authority | **No N3 cutover** — legacy remains sole business authority |
| Cross-tab | Residual limitation; final legacy re-read blocks false synced markers |
| Rollback to PROTO | Safe — legacy authoritative; school shadow/marker become inert residue |

Production automatic write call sites:

1. Profile Save ready
2. Profile mount ready
3. VZ afterPersist ready/noop
4. Restore post-success

## Next phases

- **N3:** namespaced authority only after readiness; browsers that skipped N2 must bootstrap legacy→v2 before cutover.
- **N4:** legacy cleanup (later).

## Rollback / deploy safety

Because N2 keeps legacy authoritative and reads remain legacy, rolling the app back to pre-N2 / pre-HARDEN code leaves users on the same legacy values. Orphan v2 keys may remain until a later Full Reset / N4 cleanup.

N2-ADOPT-PROTO adds **no runtime hooks**, so rolling back a PROTO-only deploy cannot start automatic school-shadow establishment.

Rolling N2-ADOPT-WRITE back to PROTO leaves legacy authoritative; any school shadow/marker written by WRITE become inert residue until Full Reset / N4.

## Not implemented

- N3 namespaced-authoritative read / cutover
- N4 legacy cleanup
- Cross-module namespacing
- Copy-on-read / mount ensure / N3 bootstrap-on-read
