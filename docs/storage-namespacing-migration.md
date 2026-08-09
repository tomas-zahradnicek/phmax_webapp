# Storage namespacing migration (N2)

Pilot resource: `phmax-scenario-label` / `value`  
Legacy authoritative key: `phmax-school-scenario-label`

## N2 status (this release)

- **Authority:** legacy only.
- **v2 keys:** shadow mirrors under `reditelsky-pruvodce:v2:…`.
- **Write order:** legacy authoritative → resolve target → shadow write → raw verify → marker persist.
- **Shadow degradation:** if legacy succeeds and shadow fails, the business save is still **success** (`shadow: dirty`). Legacy remains source of truth.
- **Skipped target:** corrupted / unavailable Identity → legacy success, no shadow/marker (`shadow: skipped`).
- **No copy-on-read.** Reads never create v2 keys.
- **No cutover.** UI and Backup continue to read legacy only.
- **No Dashboard mount ensure.** Opening Dashboard without an edit does not create v2 keys or markers.
- **No adoption.** Unbound data is not moved to school scope in N2.

## Raw semantics

- Missing (`getItem === null`) ≠ present empty string (`""`).
- Mirror equality uses exact raw presence + value (no trim / `|| ""` / `?? ""`).
- UI write path: trim; non-empty → present text; empty/whitespace → **clear** (remove), never present-empty.

## Markers

Per physical target (unbound vs `school:<canonicalUuid>`).

Payload v1:

```json
{
  "schemaVersion": 1,
  "authority": "legacy",
  "mirrorHealth": "synced",
  "authoritativePresence": "present" | "absent"
}
```

- A `synced` marker is a **historical** successful verify, not proof of current equality under multi-tab races.
- Marker does **not** store value/hash.
- **N3 cutover must require:** healthy marker **and** fresh raw equality.
- Missing marker is fail-closed for N3.
- N2 does not write dirty markers. On shadow failure the prior marker for that target is invalidated (removed) best-effort so it cannot falsely claim health for a new authoritative value.
- After a verified clear, business lifecycle writes marker `synced` + `absent` (does not delete the marker). **Full Reset** removes all v2 keys including markers.

## Multi-tab

No BroadcastChannel / lock in N2. Concurrent tabs may leave temporary dirty mirrors; legacy remains authoritative.

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

## Rollback / deploy safety

Because N2 keeps legacy authoritative and reads remain legacy, rolling the app back to pre-N2 code leaves users on the same legacy values. Orphan v2 keys may remain until a later Full Reset / N4 cleanup.

## Not implemented

- N3 namespaced-authoritative read / cutover
- N4 legacy cleanup
- Cross-module namespacing
- Adoption unbound→school
