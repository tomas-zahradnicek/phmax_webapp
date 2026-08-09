# Storage namespacing migration (N2 / N2-HARDEN)

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
- **No adoption.** Unbound data is not moved to school scope in N2 (see N2-ADOPT later).
- **N2-HARDEN** does **not** switch authority and does **not** bootstrap on read.

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

## Next phases (not in N2-HARDEN)

- **N2-ADOPT:** unbound→school when Identity becomes known (explicit; no cutover).
- **N3:** namespaced authority only after readiness; browsers that skipped N2 must bootstrap legacy→v2 before cutover.
- **N4:** legacy cleanup (later).

## Rollback / deploy safety

Because N2 keeps legacy authoritative and reads remain legacy, rolling the app back to pre-N2 / pre-HARDEN code leaves users on the same legacy values. Orphan v2 keys may remain until a later Full Reset / N4 cleanup.

## Not implemented

- N3 namespaced-authoritative read / cutover
- N4 legacy cleanup
- Cross-module namespacing
- Adoption unbound→school
- Copy-on-read / mount ensure / N3 bootstrap-on-read
