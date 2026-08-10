# Storage namespacing migration (N2 / N2-HARDEN / N2-ADOPT / N3-PROTO / N3-FENCE-PROTO / N3-FENCE-WRITE / N3-PREP / N3-AWARE-CORE)

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

## N3-PROTO (authority cutover pure protocol)

Pilot remains: `phmax-scenario-label` / `value` on `school:<canonicalUuid>` only.

**Production authority is unchanged:** legacy key remains the sole business authority.
N3-PROTO adds **pure** types/planners/tests only — **0 production call sites**, **0 storage I/O**, **0 runtime lifecycle wiring**.

### Marker schema v2

Do **not** silently widen v1 `authority`. Semantic referents change under namespaced authority:

| Field | v1 (`schemaVersion: 1`, `authority: "legacy"`) | v2 (`schemaVersion: 2`, `authority: "namespaced"`) |
|-------|-----------------------------------------------|-----------------------------------------------------|
| `authoritativePresence` | legacy existence | **v2** authoritative existence |
| `mirrorHealth` | v2 shadow vs legacy | **legacy compatibility mirror** vs v2 |

Dual parser: valid v1 legacy **or** valid v2 namespaced. Mixed pairs (`v1+namespaced`, `v2+legacy`) are invalid.

**Old N2 compatibility fact:** current N2 v1 parser rejects schema v2 → `null` → establishment treats marker as invalid and would **repair/downgrade to legacy**. This is why **N3-FENCE + N3-AWARE** are mandatory before cutover.

### Authority scope

- Per **resource** + per **physical school target** (`school:<canonical lowercase UUID>`).
- **No** global cutover flag.
- **Unbound never cut over** (may remain N2 shadow state only).
- Uppercase / mixed-case / whitespace schoolId: reject (no normalization into keys).

### State model

`LEGACY_UNPREPARED` → `LEGACY_PREPARED` → (metadata-last cutover) → `NAMESPACED_ACTIVE`
(`NAMESPACED_DEGRADED` when namespaced marker exists but mirror/equality/presence is unhealthy)
Malformed / ambiguous marker loss → `AUTHORITY_BLOCKED`.
No persistent cutover-in-progress state.

### Cutover (planned; not executed in PROTO)

1. Fresh legacy/v2 equality **before** marker write
2. Replace marker only: v1 legacy/synced → v2 namespaced/synced
3. Marker read-back (strict parse)
4. Fresh equality **after** marker read-back

Crash before marker commit → legacy remains. Marker v2 persisted → namespaced begins.

Bootstrap/repair from **fresh legacy** is a **separate** phase (reuse N2-ADOPT semantics; never from unbound). Skip-N2 browsers must bootstrap before cutover.

### Strict compatibility mirror + rollback-to-N2

During the N3 compatibility window, every **successful** namespaced business write must finish with exact `v2 raw == legacy raw`.
That makes **deployment rollback** to current N2-ADOPT-WRITE expose the same logical value via legacy reads.

**Distinct hazard:** an already-open old N2 tab can still legacy-write / repair-downgrade markers. Deployment rollback ≠ mixed-version concurrent tabs. **Production cutover is blocked until N3-FENCE.**

### Read routing (pure decision only)

- v1 legacy marker → legacy
- v2 namespaced + school → school v2 (even if legacy diverges → degraded signal; **no silent legacy substitute**)
- unbound → legacy
- malformed / namespaced v2 unavailable / presence inconsistent / marker-loss divergence → **blocked**
- **No unsafe silent fallback.**

### Future writers / hooks (inventory only in PROTO)

Before cutover, all must become authority-aware: repository, handoff, console snippet, Level B / post-export clear, Restore ops, Profile/VZ/Restore establishment hooks.
Under namespaced authority, N2-ADOPT establishment must **NO-OP** (prevent downgrade).
Restore/clear planners preserve current authority (namespaced restore must not emit legacy marker).
Backup **omits** authority metadata; logical value only.

### Roadmap after N3-PROTO

`N3-PROTO` ✅ → `N3-FENCE-PROTO` ✅ → `N3-FENCE-WRITE` ✅ → `N3-PREP` ✅ → `N3-AWARE-CORE` ✅ (inert) → `N3-AWARE-WIRING` → `N3-CUTOVER-WRITE` → `N3-HARDEN` → `N4`

N3-PROTO must not jump into any of these runtime phases.

## N3-FENCE-PROTO (persistent commit certificate — pure protocol)

Pilot remains: `phmax-scenario-label` / `value` on `school:<canonicalUuid>` only.

**Purpose:** a persistent per-target commit certificate so a future N3 runtime can recognize whether the current raw + marker state was completed by a fence-aware writer.

**Threat model:** already-open old N2 tab, saved console handoff snippet, other stale same-origin writers. Not a hostile attacker.

**Client-only hard revocation of already-running old JS is impossible.** Safety bar is detect → fail closed → recover — not impossible write denial. Tab registry / BroadcastChannel alone cannot provide correctness (saved snippets survive after all old tabs are gone).

### Fence ≠ business authority

| Concern | Owner |
|---------|--------|
| legacy vs namespaced **business** authority | migration marker |
| whether current physical state + marker was committed by a compatible protocol | **fence certificate** |

Fence `committedRaw` is **verification metadata only** — never an alternate business read source. Fence must not become a source of business value.

### Fence key

```
reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:<canonicalUuid>
```

- under `reditelsky-pruvodce:v2:` root
- outside business `StorageAddress` grammar
- outside `migration-state`
- per school / module / resource
- canonical UUID only (no unbound / schoolYear)

Ownership facts (current runtimes unchanged):

| Surface | Fence key |
|---------|-----------|
| Level B / post-export clear | **does not** target it |
| Restore scenario physical ops | **do not** touch it |
| Full Reset v2-prefix clear | **removes** it |
| Central Backup | **omits** it (local protocol metadata) |

Old N2 repository / handoff / snippet / Profile/VZ establishment / Level B / Restore must not know or remove the fence key. Full Reset is the intended exception.

### Fence record schema (independent versions)

```json
{
  "schemaVersion": 1,
  "protocolGeneration": 3,
  "authority": "legacy" | "namespaced",
  "markerSchemaVersion": 1 | 2,
  "schoolId": "<canonicalUuid>",
  "resource": "phmax-scenario-label/value",
  "committedRaw": { "exists": false } | { "exists": true, "value": "..." }
}
```

- `schemaVersion` = fence serialization version
- `protocolGeneration` = compatible writer generation
- exact `RawStoredText` only (missing ≠ present `""`; no trim / hash / digest)
- authority/markerSchema coherence required (`legacy`↔v1, `namespaced`↔v2)
- payload `schoolId` / `resource` must bind to key/target

**Revision/generation alone is invalid proof** — an old N2 writer can change raw without changing generation. Fence readiness requires exact `committedRaw` comparison.

### State machine

`UNESTABLISHED` | `LEGACY_COMMITTED` | `NAMESPACED_COMMITTED` | `VIOLATED` | `INVALID` | `UNAVAILABLE`

| State | Meaning |
|-------|---------|
| `UNESTABLISHED` | fence missing + legacy/pre-cutover → business legacy may continue; cutover **not** fence-ready |
| `LEGACY_COMMITTED` | exact legacy cert + synced v1 marker + exact raw equality → material `fenceReady` for pre-cutover |
| `NAMESPACED_COMMITTED` | exact namespaced cert + synced v2 marker + exact raw equality |
| `VIOLATED` | valid cert exists but certified tuple changed (raw / authority / presence / equal-copy downgrade / divergent write) |
| `INVALID` | malformed fence / target mismatch / payload↔key mismatch |
| `UNAVAILABLE` | storage/read unavailable (distinct from `UNESTABLISHED`) |

Namespaced marker + no valid fence → **never** `NAMESPACED_COMMITTED` (blocked/violated).

Old writer examples (all → `VIOLATED`, no silent recertification):

- cert namespaced A + old N2 writes B/B + v1 legacy marker
- cert namespaced A + raw still A/A but marker downgraded to v1 legacy
- cert A + legacy B while v2 shadow remains A

Recovery is **deferred**: equal-copy may later allow explicit re-certification; divergent must block / manual recovery. No automatic recovery in PROTO.

### Fence written LAST

Future FENCE-WRITE order:

- **legacy:** legacy data → school v2 shadow → verify → v1 legacy marker → **fence last**
- **namespaced:** school v2 → legacy mirror → verify → v2 namespaced marker → **fence last**

Fence-first is forbidden. Marker changes with stale/missing fence → next aware runtime must **not** accept state as committed.

### Data + fence eligibility (not full production cutover)

`planScenarioLabelAuthorityCutover.status === "ready"` remains **lower-level DATA PLANE** readiness.

N3-FENCE-PROTO composes:

- N3 school-only cutover readiness (`ready_for_cutover`)
- fence assessment `LEGACY_COMMITTED`
- same school target

→ `eligible` at **data+fence** layer only.

Does **not** use old N2 `assessScenarioLabelCutoverReadiness` (historically permits unbound READY).
Does **not** claim entire production system is ready — full cutover also requires **N3-AWARE** completion.

BroadcastChannel / storage events may be an optional secondary live UX layer later — **not** a correctness prerequisite.

### N3-FENCE-PROTO status

- Pure protocol delivered (types/key/record/assessor/eligibility composer)
- **next runtime phase = N3-FENCE-WRITE** (below)

## N3-FENCE-WRITE (persistent commit certificate — runtime)

**ACTIVE metadata write phase.** Legacy remains the **sole business source of truth**.

### What it does

Compatible school-target scenario mutations finish by writing an N3 fence certificate **LAST**:

legacy → school v2 → verify → v1 legacy marker → **fence last** → read-back + full pure assessment.

`committed` means post-write assessment === `LEGACY_COMMITTED` — `setItem` alone is insufficient.

### What it does not do

- no schemaVersion 2 / namespaced marker production writes
- no namespaced business reads / routing through fence
- no authority cutover
- no PREP bootstrap for already-ready fence-less states
- no passive fence write on Dashboard mount/read
- no unbound fence
- Backup still omits fence; Full Reset still clears via `reditelsky-pruvodce:v2:`

### Soft failure

Legacy authoritative success + fence failure → **business success** + fence metadata degraded (`incomplete` / `verify_failed` / …).
Same soft rule for Profile/VZ establishment metadata and Restore post-verify.

### Ownership

| Surface | Fence owner |
|---------|-------------|
| Dashboard / handoff UI | repository finalizer |
| Level B / post-export | `clearScenarioLabelLifecycle` only |
| Profile/VZ | establishment only when it **mutates** (`already_ready` = 0 fence writes; PREP owns bootstrap) |
| Restore | post-verification soft zone only (never pre-verify / never in raw txn) |
| Console snippet | inline school fence LAST (controlled duplication + contract tests) |

### Old writers

Old N2 tabs/snippets still mutate without updating fence → certificate becomes **VIOLATED**. Detection exists; **enforcement awaits N3-AWARE**. Between FENCE-WRITE and AWARE, UI continues legacy business reads.

### Explicit mutation may supersede INVALID/VIOLATED

A new compatible fence-aware mutation that fully re-verifies the tuple may issue a fresh certificate. Mount/read/`already_ready` must **not** passively recertify via the mutation finalizer. **N3-PREP** is the separate passive bootstrap path (below).

### Next

**N3-PREP** — ACTIVE (below).

## N3-PREP (healthy UNESTABLISHED fence preparation)

**ACTIVE metadata-only phase.** Legacy remains the **sole business source of truth**.

### What it does

For an already-healthy school tuple that still has **no** fence certificate (typical after N2-ADOPT `already_ready` with no later compatible mutation), PREP may write a school-scoped N3 fence certificate:

healthy legacy + school-v2 + v1 synced marker + fence physically missing + assessment `UNESTABLISHED` → **fence last** → read-back + full pure `LEGACY_COMMITTED`.

### What it writes

**Only** the canonical school fence key (`serializeScenarioLabelN3FenceKey`).

### What it does not do

- no legacy / school-v2 / unbound / migration-marker / Identity / AppContext / SchoolYear writes
- no N2 repair / adopt / shadow copy
- no schemaVersion 2 / `authority:"namespaced"` marker writes
- no namespaced business reads / routing
- no authority cutover / AWARE enforcement
- no historic boolean `fenceReady` production gate use
- no unbound fence; unbound residue is ignored
- no Dashboard / app-bootstrap / Backup / Restore-window / business-read owner
- Backup still omits fence; Full Reset still clears via `reditelsky-pruvodce:v2:`

### Fence-state policy (stricter than FENCE-WRITE)

| State | PREP |
|-------|------|
| `UNESTABLISHED` + healthy + physically missing | may prepare |
| `LEGACY_COMMITTED` | `already_prepared` — 0 writes |
| `VIOLATED` | **blocked** — never passively recertify |
| `INVALID` | **blocked** — never passively replace |
| `UNAVAILABLE` | soft skip — 0 writes |
| namespaced / `NAMESPACED_COMMITTED` | `unsupported_authority` — 0 writes |

**UNESTABLISHED alone is insufficient** — PREP also requires the fence key to be physically missing and the full healthy legacy admission invariant.

### Ownership

Single production owner: Profile/VZ **post-school-ready** orchestration (`runScenarioLabelEstablishmentAfterSchoolReady`).

- establishment **mutated** (`established`) → FENCE-WRITE already owns the certificate; PREP not required
- establishment **`already_ready`** → dedicated `prepareScenarioLabelN3LegacyFenceCertificate` may prepare

Profile mount is allowed only as that existing serialized platform-binding runner (not arbitrary component-body fence code). Dashboard open/render/read and app bootstrap are **not** PREP owners.

### Soft failure

PREP failure is metadata-only and must not claim Profile/VZ/Restore business failure. Legacy business continues until AWARE.

### Relationship to FENCE-WRITE

Mutation finalizer may still supersede `INVALID`/`VIOLATED` after an explicit compatible business mutation. PREP must **not** weaken that path and must **not** reuse the finalizer as its executor.

### Next

**N3-AWARE-CORE** — IMPLEMENTED / INERT (below).

## N3-AWARE-CORE (inert authority-aware runtime primitives)

**IMPLEMENTED / INERT.** Production behavior remains **N3-PREP** (legacy sole business authority).

### What it provides

Inert, fully tested authority-aware primitives for the pilot `phmax-scenario-label` / `value`:

| Primitive | Role |
|-----------|------|
| `assessScenarioLabelRuntimeAuthority` | Canonical assessor (legacy + namespaced + blocked/degraded) |
| `readScenarioLabelAwareLogical` | Logical read (RawStoredText; 0 writes; never `fence.committedRaw`) |
| `writeScenarioLabelAwareLogical` / `writeScenarioLabelNamespacedRaw` | Dispatcher + namespaced v2-first writer |
| `finalizeScenarioLabelNamespacedFenceCertificate` | Namespaced fence LAST (`NAMESPACED_COMMITTED` required) |
| `clearScenarioLabelAwareLogical` / `clearScenarioLabelNamespaced` | Authority-aware clear (schema2 preserved; no v1 downgrade) |
| `decideScenarioLabelAwareEstablishment` | Pure establishment gate for future WIRING |

### What it does NOT do

- **0 production consumers** outside CORE implementation / unit / source-contract tests
- no Dashboard / Backup / Restore / handoff / console snippet / Level B / Profile-VZ wiring
- no cutover (`planScenarioLabelAuthorityCutover` unused in CORE mutation)
- no legacy → schema2 marker write (schema2 only inside already-namespaced executors)
- no namespaced → legacy fallback
- no PREP-on-read / write-on-read
- no partial wiring — **WIRING is a separate atomic PR**

### Authority states

`UNBOUND` | `LEGACY_READY` | `LEGACY_COMPAT_UNPREPARED` | `LEGACY_VIOLATED_RECOVERABLE` | `NAMESPACED_READY` | `NAMESPACED_DEGRADED` | `AUTHORITY_BLOCKED` | `STORAGE_UNAVAILABLE`

- Healthy legacy + missing fence → **`LEGACY_COMPAT_UNPREPARED`** (not blocked)
- Stale legacy fence with unambiguous v1 world → **`LEGACY_VIOLATED_RECOVERABLE`** (not generic “allow legacy”)
- Any namespaced evidence conflict / namespaced marker without fence → **`AUTHORITY_BLOCKED`**

### Namespaced writer (preservation only)

Order: fresh gate → snapshot → **school-v2** → legacy mirror → verify → schema2 marker → fence LAST → full assessment `NAMESPACED_READY`.

Fence failure after settled data → explicit **`fence_incomplete`** (no false success; no blind full rollback).

### Next

**N3-AWARE-WIRING** — atomically wire CORE into production surfaces (forbidden to land partially).

## Rollback / deploy safety

Because N2 keeps legacy authoritative and reads remain legacy, rolling the app back to pre-N2 / pre-HARDEN code leaves users on the same legacy values. Orphan v2 keys may remain until a later Full Reset / N4 cleanup.

N2-ADOPT-PROTO adds **no runtime hooks**, so rolling back a PROTO-only deploy cannot start automatic school-shadow establishment.

Rolling N2-ADOPT-WRITE back to PROTO leaves legacy authoritative; any school shadow/marker written by WRITE become inert residue until Full Reset / N4.

N3-PROTO likewise adds **no runtime hooks**; production remains N2-ADOPT-WRITE business behavior after merge.

N3-FENCE-PROTO defined pure certificates only.

N3-FENCE-WRITE adds runtime fence finalization after compatible mutations; **business authority remains legacy**. Rolling back FENCE-WRITE leaves legacy authoritative; fence keys become inert residue under v2 root until Full Reset / N4.

**Deployment rollback** (strict legacy==v2 mirror) remains distinct from **already-open old tab / saved snippet** (detected by fence certificate mismatch).

## Not implemented

- N3-AWARE-WIRING (production consumers of AWARE-CORE)
- N3 namespaced-authoritative production read / write / cutover (WIRING + CUTOVER-WRITE)
- N3-CUTOVER-WRITE / HARDEN
- N4 legacy cleanup
- Cross-module namespacing
- Copy-on-read / mount ensure / N3 bootstrap-on-read
- BroadcastChannel / cross-tab lock / tab registry / service worker implementation
- Automatic fence recovery UX for VIOLATED/INVALID (deferred)
- Dashboard / app-bootstrap PREP owners (intentionally not implemented)
