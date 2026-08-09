import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { IdentityRegistryReadResult } from "../../identity/identity-registry-types";
import type { ScenarioLabelMigrationMarkerPayload } from "./scenario-label-migration-types";
import {
  SCHOOL_SHADOW_ESTABLISHMENT_PHASE_ORDER,
  SCHOOL_SHADOW_ESTABLISHMENT_UNBOUND_CONTRACT,
  SCHOOL_SHADOW_ESTABLISHMENT_WRITE_STOP_CONDITIONS,
  assessSyncedMarkerEligibilityAfterFinalLegacyRead,
  classifySchoolShadowEstablishmentOutcome,
  planSchoolShadowEstablishment,
  resolveCanonicalSchoolIdForEstablishment,
  resolveSchoolShadowEstablishmentTarget,
  schoolShadowEstablishmentAllowedOperationTargets,
  type SchoolShadowEstablishmentPlan,
} from "./scenario-label-school-shadow-establishment";

const SCHOOL_A = "11111111-1111-4111-8111-111111111111";
/** Same shape with uppercase hex — valid format but non-canonical for EntityId. */
const SCHOOL_NONCANONICAL_UPPER = "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const PROTO_SOURCE_FILES = [
  "src/data/storage/scenario-label-migration/scenario-label-school-shadow-establishment.ts",
] as const;

const PROTO_SYMBOLS = [
  "planSchoolShadowEstablishment",
  "resolveSchoolShadowEstablishmentTarget",
  "resolveCanonicalSchoolIdForEstablishment",
  "assessSyncedMarkerEligibilityAfterFinalLegacyRead",
  "classifySchoolShadowEstablishmentOutcome",
  "SCHOOL_SHADOW_ESTABLISHMENT_PHASE_ORDER",
  "SCHOOL_SHADOW_ESTABLISHMENT_UNBOUND_CONTRACT",
] as const;

function present(value: string) {
  return { exists: true as const, value };
}
function missing() {
  return { exists: false as const };
}

function syncedPresent(): ScenarioLabelMigrationMarkerPayload {
  return {
    schemaVersion: 1,
    authority: "legacy",
    mirrorHealth: "synced",
    authoritativePresence: "present",
  };
}

function syncedAbsent(): ScenarioLabelMigrationMarkerPayload {
  return {
    schemaVersion: 1,
    authority: "legacy",
    mirrorHealth: "synced",
    authoritativePresence: "absent",
  };
}

function dirtyPresent(): ScenarioLabelMigrationMarkerPayload {
  return {
    schemaVersion: 1,
    authority: "legacy",
    mirrorHealth: "dirty",
    authoritativePresence: "present",
  };
}

function planBase(
  overrides: Partial<Parameters<typeof planSchoolShadowEstablishment>[0]> & {
    freshLegacyRaw: ReturnType<typeof present> | ReturnType<typeof missing>;
    currentSchoolShadowRaw: ReturnType<typeof present> | ReturnType<typeof missing>;
  },
): SchoolShadowEstablishmentPlan {
  return planSchoolShadowEstablishment({
    schoolId: SCHOOL_A,
    markerState: { status: "missing" },
    ...overrides,
  });
}

describe("N2-ADOPT-PROTO school-shadow establishment", () => {
  it("A: legacy L + school missing → establish L", () => {
    const plan = planBase({
      freshLegacyRaw: present("L"),
      currentSchoolShadowRaw: missing(),
      markerState: { status: "missing" },
    });
    expect(plan.kind).toBe("establish_present");
    expect(plan.desiredSchoolRaw).toEqual(present("L"));
    expect(plan.schoolDataAction).toBe("write_present");
    expect(plan.schoolWriteRequired).toBe(true);
    expect(plan.markerAction).toBe("establish");
    expect(plan.markerWriteRequired).toBe(true);
  });

  it("B: legacy L2 + hypothetical unbound L1 → desired school L2", () => {
    const plan = planBase({
      freshLegacyRaw: present("L2"),
      currentSchoolShadowRaw: missing(),
      hypotheticalUnboundRaw: present("L1"),
    });
    expect(plan.desiredSchoolRaw).toEqual(present("L2"));
    expect(plan.desiredSchoolRaw).not.toEqual(present("L1"));
  });

  it("C: legacy missing + hypothetical stale unbound U → desired school missing", () => {
    const plan = planBase({
      freshLegacyRaw: missing(),
      currentSchoolShadowRaw: missing(),
      hypotheticalUnboundRaw: present("U"),
      markerState: { status: "missing" },
    });
    expect(plan.desiredSchoolRaw).toEqual(missing());
    expect(plan.kind).toBe("establish_absent");
    expect(plan.schoolDataAction).toBe("none");
  });

  it("D: school stale S + legacy L → repair to L", () => {
    const plan = planBase({
      freshLegacyRaw: present("L"),
      currentSchoolShadowRaw: present("S"),
      markerState: { status: "valid", payload: syncedPresent() },
    });
    expect(plan.kind).toBe("repair_present");
    expect(plan.desiredSchoolRaw).toEqual(present("L"));
    expect(plan.schoolDataAction).toBe("write_present");
    expect(plan.schoolWriteRequired).toBe(true);
    // Stale synced marker must not be already_ready
    expect(plan.kind).not.toBe("already_ready");
  });

  it("E: school L + healthy marker → already_ready", () => {
    const plan = planBase({
      freshLegacyRaw: present("L"),
      currentSchoolShadowRaw: present("L"),
      markerState: { status: "valid", payload: syncedPresent() },
    });
    expect(plan).toMatchObject({
      kind: "already_ready",
      schoolWriteRequired: false,
      markerWriteRequired: false,
      schoolDataAction: "none",
      markerAction: "none",
    });
  });

  it("F: school L + marker missing → marker establishment needed", () => {
    const plan = planBase({
      freshLegacyRaw: present("L"),
      currentSchoolShadowRaw: present("L"),
      markerState: { status: "missing" },
    });
    expect(plan.kind).toBe("establish_present");
    expect(plan.schoolWriteRequired).toBe(false);
    expect(plan.markerAction).toBe("establish");
    expect(plan.markerWriteRequired).toBe(true);
  });

  it("G: school L + dirty marker → repair metadata", () => {
    const plan = planBase({
      freshLegacyRaw: present("L"),
      currentSchoolShadowRaw: present("L"),
      markerState: { status: "valid", payload: dirtyPresent() },
    });
    expect(plan.kind).toBe("repair_present");
    expect(plan.schoolWriteRequired).toBe(false);
    expect(plan.markerAction).toBe("repair");
    expect(plan.kind).not.toBe("already_ready");
  });

  it("H: school L + invalid marker → not already_ready", () => {
    const plan = planBase({
      freshLegacyRaw: present("L"),
      currentSchoolShadowRaw: present("L"),
      markerState: { status: "invalid" },
    });
    expect(plan.kind).not.toBe("already_ready");
    expect(plan.markerAction).toBe("repair");
    expect(plan.markerWriteRequired).toBe(true);
  });

  it("I: legacy missing + school missing + synced/absent → already_ready", () => {
    const plan = planBase({
      freshLegacyRaw: missing(),
      currentSchoolShadowRaw: missing(),
      markerState: { status: "valid", payload: syncedAbsent() },
    });
    expect(plan.kind).toBe("already_ready");
  });

  it("J: legacy missing + school missing + marker missing → establish absence metadata", () => {
    const plan = planBase({
      freshLegacyRaw: missing(),
      currentSchoolShadowRaw: missing(),
      markerState: { status: "missing" },
    });
    expect(plan.kind).toBe("establish_absent");
    expect(plan.desiredAuthoritativePresence).toBe("absent");
    expect(plan.schoolDataAction).toBe("none");
    expect(plan.markerAction).toBe("establish");
  });

  it('K: legacy present "" + school present "" + synced/present → already_ready', () => {
    const plan = planBase({
      freshLegacyRaw: present(""),
      currentSchoolShadowRaw: present(""),
      markerState: { status: "valid", payload: syncedPresent() },
    });
    expect(plan.kind).toBe("already_ready");
    expect(plan.desiredAuthoritativePresence).toBe("present");
  });

  it('L: legacy present "" + school missing → establish present "" (not remove)', () => {
    const plan = planBase({
      freshLegacyRaw: present(""),
      currentSchoolShadowRaw: missing(),
      markerState: { status: "missing" },
    });
    expect(plan.kind).toBe("establish_present");
    expect(plan.desiredSchoolRaw).toEqual(present(""));
    expect(plan.schoolDataAction).toBe("write_present");
    expect(plan.schoolDataAction).not.toBe("remove");
  });

  it("M: initial legacy A / school write A / final legacy B → no synced marker", () => {
    const eligibility = assessSyncedMarkerEligibilityAfterFinalLegacyRead({
      verifiedSchoolRaw: present("A"),
      finalLegacyRaw: present("B"),
    });
    expect(eligibility).toEqual({
      eligible: false,
      reason: "legacy_diverged_or_mismatch",
    });

    const plan = planBase({
      freshLegacyRaw: present("A"),
      currentSchoolShadowRaw: missing(),
    });
    const outcome = classifySchoolShadowEstablishmentOutcome({
      plan,
      schoolWriteSucceeded: true,
      schoolVerifyMatched: true,
      finalLegacyMatchesVerifiedSchool: false,
      markerPersistSucceeded: true,
    });
    expect(outcome.status).toBe("shadow_dirty");
  });

  it("N: shadow write fail semantics → shadow_dirty", () => {
    const plan = planBase({
      freshLegacyRaw: present("L"),
      currentSchoolShadowRaw: missing(),
    });
    expect(
      classifySchoolShadowEstablishmentOutcome({
        plan,
        schoolWriteSucceeded: false,
        schoolVerifyMatched: false,
        finalLegacyMatchesVerifiedSchool: false,
        markerPersistSucceeded: false,
      }).status,
    ).toBe("shadow_dirty");
  });

  it("O: marker fail after verified data → marker_incomplete", () => {
    const plan = planBase({
      freshLegacyRaw: present("L"),
      currentSchoolShadowRaw: missing(),
    });
    expect(
      classifySchoolShadowEstablishmentOutcome({
        plan,
        schoolWriteSucceeded: true,
        schoolVerifyMatched: true,
        finalLegacyMatchesVerifiedSchool: true,
        markerPersistSucceeded: false,
      }).status,
    ).toBe("marker_incomplete");
  });

  it("P: invalid/noncanonical schoolId → reject/skip fail-closed", () => {
    expect(resolveCanonicalSchoolIdForEstablishment("not-a-uuid")).toEqual({
      status: "skipped",
      reason: "invalid_school_id",
    });
    expect(resolveCanonicalSchoolIdForEstablishment(SCHOOL_NONCANONICAL_UPPER)).toEqual({
      status: "skipped",
      reason: "invalid_school_id",
    });
    expect(resolveCanonicalSchoolIdForEstablishment(` ${SCHOOL_A} `)).toEqual({
      status: "skipped",
      reason: "invalid_school_id",
    });
    expect(resolveCanonicalSchoolIdForEstablishment(SCHOOL_A)).toEqual({
      status: "school",
      schoolId: SCHOOL_A,
    });
  });

  it("Q: unbound preservation contract (school-only ops)", () => {
    expect(SCHOOL_SHADOW_ESTABLISHMENT_UNBOUND_CONTRACT).toEqual({
      unboundKey: "preserve",
      unboundMarker: "preserve",
    });
    expect([...schoolShadowEstablishmentAllowedOperationTargets()]).toEqual([
      "school_data",
      "school_marker",
    ]);
    expect(schoolShadowEstablishmentAllowedOperationTargets()).not.toContain("unbound_data");
    expect(schoolShadowEstablishmentAllowedOperationTargets()).not.toContain("unbound_marker");
  });

  it("R: planner result independent of hypothetical unbound value", () => {
    const base = {
      schoolId: SCHOOL_A,
      freshLegacyRaw: present("L"),
      currentSchoolShadowRaw: missing(),
      markerState: { status: "missing" as const },
    };
    const withU1 = planSchoolShadowEstablishment({
      ...base,
      hypotheticalUnboundRaw: present("U1"),
    });
    const withU2 = planSchoolShadowEstablishment({
      ...base,
      hypotheticalUnboundRaw: present("U2"),
    });
    expect(withU1).toEqual(withU2);

    const missingLegacyU = planSchoolShadowEstablishment({
      schoolId: SCHOOL_A,
      freshLegacyRaw: missing(),
      currentSchoolShadowRaw: present("stale-school"),
      markerState: { status: "missing" },
      hypotheticalUnboundRaw: present("U-stale"),
    });
    expect(missingLegacyU.desiredSchoolRaw).toEqual(missing());
    expect(missingLegacyU.schoolDataAction).toBe("remove");
  });

  it("S: no legacy write contract (phase order is school-shadow mirror only)", () => {
    expect(SCHOOL_SHADOW_ESTABLISHMENT_PHASE_ORDER).toEqual([
      "legacy_read_initial",
      "target_inspect",
      "marker_invalidate",
      "school_shadow_write",
      "school_shadow_verify",
      "legacy_read_final",
      "marker_persist",
    ]);
    expect(SCHOOL_SHADOW_ESTABLISHMENT_PHASE_ORDER).not.toContain("legacy_authoritative");
    expect(SCHOOL_SHADOW_ESTABLISHMENT_PHASE_ORDER).not.toContain("legacy_write");

    const source = fs.readFileSync(
      path.join(repoRoot, PROTO_SOURCE_FILES[0]),
      "utf8",
    );
    expect(source).not.toMatch(/setItem\s*\(\s*[^)]*legacy/i);
    expect(source).not.toContain("legacy_authoritative");
    expect(source).not.toMatch(/removeItem\([^)]*legacy/i);
  });

  it("T: source contract — zero runtime/storage/browser imports", () => {
    for (const relative of PROTO_SOURCE_FILES) {
      const source = fs.readFileSync(path.join(repoRoot, relative), "utf8");
      expect(source, relative).not.toContain("localStorage");
      expect(source, relative).not.toContain("sessionStorage");
      expect(source, relative).not.toContain("window.");
      expect(source, relative).not.toContain("document.");
      expect(source, relative).not.toContain("globalThis.");
      expect(source, relative).not.toMatch(/from\s+["'][^"']*ProfilSkoly/);
      expect(source, relative).not.toMatch(/from\s+["'][^"']*vyrocni-zprava/);
      expect(source, relative).not.toMatch(/from\s+["'][^"']*backup/);
      expect(source, relative).not.toMatch(/from\s+["'][^"']*restore/);
      expect(source, relative).not.toMatch(/from\s+["'][^"']*Dashboard/);
      expect(source, relative).not.toContain("applyAppBackupRestore");
      expect(source, relative).not.toContain("restore-owned-keys");
      expect(source, relative).not.toContain("copyUnboundToSchool");
      // No executable ensure hooks — names may appear only in WRITE stop-condition notes.
      expect(source, relative).not.toMatch(
        /(?:import|require)\([^)]*ensure(?:School|VzSchoolYear)PlatformBinding/,
      );
    }
  });

  it("U: zero production call sites for establishment symbols", () => {
    const srcRoot = path.join(repoRoot, "src");
    const hits: string[] = [];

    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
        if (entry.name.includes("school-shadow-establishment")) continue;
        const text = fs.readFileSync(full, "utf8");
        for (const symbol of PROTO_SYMBOLS) {
          if (text.includes(symbol)) {
            hits.push(`${path.relative(repoRoot, full)}:${symbol}`);
          }
        }
      }
    }
    walk(srcRoot);
    expect(hits).toEqual([]);
  });

  it("Identity: missing → skipped (never unbound); corrupted/unavailable skipped; valid → school", () => {
    const missingIdentity: IdentityRegistryReadResult = { ok: true, registry: null };
    expect(resolveSchoolShadowEstablishmentTarget(missingIdentity)).toEqual({
      status: "skipped",
      reason: "missing",
    });

    expect(
      resolveSchoolShadowEstablishmentTarget({
        ok: false,
        code: "corrupted",
      }),
    ).toEqual({ status: "skipped", reason: "corrupted" });

    expect(
      resolveSchoolShadowEstablishmentTarget({
        ok: false,
        code: "storage_unavailable",
      }),
    ).toEqual({ status: "skipped", reason: "storage_unavailable" });

    expect(
      resolveSchoolShadowEstablishmentTarget({
        ok: true,
        registry: {
          schemaVersion: 1,
          schoolId: SCHOOL_A,
          schoolYears: [],
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    ).toEqual({ status: "school", schoolId: SCHOOL_A });
  });

  it("schoolYear / unbound targets are excluded from establishment target resolution", () => {
    const source = fs.readFileSync(path.join(repoRoot, PROTO_SOURCE_FILES[0]), "utf8");
    expect(source).not.toContain('kind: "unbound"');
    expect(source).not.toContain('kind: "schoolYear"');
    expect(source).not.toContain("copyUnboundToSchool");
  });

  it("already_ready requires raw equality AND healthy synced marker (stale synced → repair)", () => {
    // legacy B, school A, marker synced → REPAIR (section 10)
    const plan = planBase({
      freshLegacyRaw: present("B"),
      currentSchoolShadowRaw: present("A"),
      markerState: { status: "valid", payload: syncedPresent() },
    });
    expect(plan.kind).toBe("repair_present");
    expect(plan.desiredSchoolRaw).toEqual(present("B"));
  });

  it("presence mismatch on otherwise synced marker is not already_ready", () => {
    const plan = planBase({
      freshLegacyRaw: missing(),
      currentSchoolShadowRaw: missing(),
      markerState: { status: "valid", payload: syncedPresent() },
    });
    expect(plan.kind).not.toBe("already_ready");
    expect(plan.markerAction).toBe("repair");
  });

  it("successful establishment outcome when write+verify+final+marker all ok", () => {
    const plan = planBase({
      freshLegacyRaw: present("L"),
      currentSchoolShadowRaw: missing(),
    });
    expect(
      classifySchoolShadowEstablishmentOutcome({
        plan,
        schoolWriteSucceeded: true,
        schoolVerifyMatched: true,
        finalLegacyMatchesVerifiedSchool: true,
        markerPersistSucceeded: true,
      }),
    ).toEqual({ status: "established" });
  });

  it("WRITE stop conditions are documented for N2-ADOPT-WRITE", () => {
    expect(SCHOOL_SHADOW_ESTABLISHMENT_WRITE_STOP_CONDITIONS.restoreRollbackOrdering).toMatch(
      /Restore/,
    );
    expect(SCHOOL_SHADOW_ESTABLISHMENT_WRITE_STOP_CONDITIONS.lifecycleOwnership).toMatch(
      /ensureSchoolPlatformBinding/,
    );
    expect(SCHOOL_SHADOW_ESTABLISHMENT_WRITE_STOP_CONDITIONS.softUx).toMatch(/marker_incomplete/);
  });

  it("final legacy equal to verified school → synced marker eligible", () => {
    expect(
      assessSyncedMarkerEligibilityAfterFinalLegacyRead({
        verifiedSchoolRaw: present("A"),
        finalLegacyRaw: present("A"),
      }),
    ).toEqual({ eligible: true });

    expect(
      assessSyncedMarkerEligibilityAfterFinalLegacyRead({
        verifiedSchoolRaw: missing(),
        finalLegacyRaw: missing(),
      }),
    ).toEqual({ eligible: true });
  });

  it("missing ≠ present empty remains intact through planner", () => {
    const establishEmpty = planBase({
      freshLegacyRaw: present(""),
      currentSchoolShadowRaw: missing(),
    });
    const establishAbsent = planBase({
      freshLegacyRaw: missing(),
      currentSchoolShadowRaw: present(""),
    });
    expect(establishEmpty.desiredSchoolRaw).toEqual(present(""));
    expect(establishEmpty.schoolDataAction).toBe("write_present");
    expect(establishAbsent.desiredSchoolRaw).toEqual(missing());
    expect(establishAbsent.schoolDataAction).toBe("remove");
    expect(establishEmpty.desiredAuthoritativePresence).toBe("present");
    expect(establishAbsent.desiredAuthoritativePresence).toBe("absent");
  });
});
