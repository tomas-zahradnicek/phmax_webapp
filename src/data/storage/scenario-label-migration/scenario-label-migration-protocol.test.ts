import { describe, expect, it } from "vitest";
import type { IdentityRegistryReadResult } from "../../identity/identity-registry-types";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../../identity/identity-registry-types";
import { parseNamespacedStorageKey } from "../namespaced-storage-address";
import {
  buildScenarioLabelMigrationMarkerPayload,
  buildScenarioLabelNamespacedAddress,
  buildScenarioLabelNamespacedKey,
  deriveScenarioLabelMirrorHealth,
  isSynchronizedAbsence,
  isSynchronizedPresentEmpty,
  planScenarioLabelShadowOutcome,
} from "./scenario-label-migration-protocol";
import {
  authoritativePresenceFromRaw,
  rawStoredTextEqual,
  rawStoredTextFromNullable,
} from "./scenario-label-migration-raw";
import {
  ScenarioLabelMigrationMarkerKeyError,
  parseScenarioLabelMigrationMarkerKey,
  serializeScenarioLabelMigrationMarkerKey,
} from "./scenario-label-migration-marker-key";
import {
  parseScenarioLabelMigrationMarkerPayload,
  parseScenarioLabelMigrationMarkerPayloadJson,
  serializeScenarioLabelMigrationMarkerPayload,
} from "./scenario-label-migration-marker-payload";
import {
  resolveScenarioLabelMigrationTarget,
} from "./scenario-label-migration-target";
import {
  SCENARIO_LABEL_WRITE_PHASE_ORDER,
  type ScenarioLabelMigrationMarkerPayload,
} from "./scenario-label-migration-types";

const SCHOOL_ID = "550e8400-e29b-41d4-a716-446655440000";
const SCHOOL_ID_UPPER = "550E8400-E29B-41D4-A716-446655440000";
const SCHOOL_ID_MIXED = "550e8400-E29B-41d4-A716-446655440000";

function missingRaw() {
  return rawStoredTextFromNullable(null);
}

function presentRaw(value: string) {
  return rawStoredTextFromNullable(value);
}

function validIdentityRegistry(schoolId: string = SCHOOL_ID): IdentityRegistryReadResult {
  return {
    ok: true,
    registry: {
      schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
      schoolId,
      schoolYears: [],
      updatedAt: "2026-08-09T00:00:00.000Z",
    },
  };
}

describe("scenario-label migration protocol (N2-PROTO)", () => {
  it("A: target with no Identity registry document resolves to unbound", () => {
    expect(resolveScenarioLabelMigrationTarget({ ok: true, registry: null })).toEqual({
      status: "resolved",
      target: { kind: "unbound" },
    });
  });

  it("B: target with valid Identity resolves to school scope", () => {
    expect(resolveScenarioLabelMigrationTarget(validIdentityRegistry())).toEqual({
      status: "resolved",
      target: { kind: "school", schoolId: SCHOOL_ID },
    });
  });

  it("C: target resolver API does not accept Profile — only Identity read result", () => {
    expect(resolveScenarioLabelMigrationTarget.length).toBe(1);
    expect(
      resolveScenarioLabelMigrationTarget({ ok: true, registry: null }).status,
    ).toBe("resolved");
  });

  it("D: corrupted Identity resolves to skipped", () => {
    expect(
      resolveScenarioLabelMigrationTarget({ ok: false, code: "corrupted", detail: "invalid_json" }),
    ).toEqual({
      status: "skipped",
      reason: "corrupted",
    });
  });

  it("E: unavailable Identity resolves to skipped", () => {
    expect(resolveScenarioLabelMigrationTarget({ ok: false, code: "storage_unavailable" })).toEqual({
      status: "skipped",
      reason: "storage_unavailable",
    });
  });

  it("F: builds unbound namespaced data address", () => {
    const resolution = resolveScenarioLabelMigrationTarget({ ok: true, registry: null });
    expect(buildScenarioLabelNamespacedAddress(resolution)).toEqual({
      version: 2,
      scope: { kind: "unbound" },
      moduleId: "phmax-scenario-label",
      resourceId: "value",
    });
    expect(buildScenarioLabelNamespacedKey({ kind: "unbound" })).toBe(
      "reditelsky-pruvodce:v2:unbound:module:phmax-scenario-label:resource:value",
    );
  });

  it("G: builds school namespaced data address", () => {
    const resolution = resolveScenarioLabelMigrationTarget(validIdentityRegistry());
    expect(buildScenarioLabelNamespacedAddress(resolution)).toEqual({
      version: 2,
      scope: { kind: "school", schoolId: SCHOOL_ID },
      moduleId: "phmax-scenario-label",
      resourceId: "value",
    });
    expect(buildScenarioLabelNamespacedKey({ kind: "school", schoolId: SCHOOL_ID })).toBe(
      `reditelsky-pruvodce:v2:school:${SCHOOL_ID}:module:phmax-scenario-label:resource:value`,
    );
  });

  it("H: skipped target resolution yields no namespaced address", () => {
    expect(
      buildScenarioLabelNamespacedAddress({
        status: "skipped",
        reason: "corrupted",
      }),
    ).toBeNull();
  });

  it("I: serializes and parses unbound marker key", () => {
    const key = serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" });
    expect(key).toBe(
      "reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:unbound",
    );
    expect(parseScenarioLabelMigrationMarkerKey(key)).toEqual({ kind: "unbound" });
  });

  it("J: serializes and parses school marker key", () => {
    const key = serializeScenarioLabelMigrationMarkerKey({ kind: "school", schoolId: SCHOOL_ID });
    expect(key).toBe(
      `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${SCHOOL_ID}`,
    );
    expect(parseScenarioLabelMigrationMarkerKey(key)).toEqual({
      kind: "school",
      schoolId: SCHOOL_ID,
    });
  });

  it("K: rejects uppercase school UUID in marker serializer and parser", () => {
    expect(() =>
      serializeScenarioLabelMigrationMarkerKey({ kind: "school", schoolId: SCHOOL_ID_UPPER }),
    ).toThrow(ScenarioLabelMigrationMarkerKeyError);
    expect(
      parseScenarioLabelMigrationMarkerKey(
        `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${SCHOOL_ID_UPPER}`,
      ),
    ).toBeNull();
  });

  it("L: rejects mixed-case school UUID in marker serializer and parser", () => {
    expect(() =>
      serializeScenarioLabelMigrationMarkerKey({ kind: "school", schoolId: SCHOOL_ID_MIXED }),
    ).toThrow(ScenarioLabelMigrationMarkerKeyError);
    expect(
      parseScenarioLabelMigrationMarkerKey(
        `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school:${SCHOOL_ID_MIXED}`,
      ),
    ).toBeNull();
  });

  it("M: rejects whitespace-padded school UUID in marker parser", () => {
    expect(
      parseScenarioLabelMigrationMarkerKey(
        `reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:school: ${SCHOOL_ID} `,
      ),
    ).toBeNull();
  });

  it("N: rejects wrong module/resource marker keys", () => {
    expect(
      parseScenarioLabelMigrationMarkerKey(
        "reditelsky-pruvodce:v2:migration-state:phmax-pv:value:unbound",
      ),
    ).toBeNull();
    expect(
      parseScenarioLabelMigrationMarkerKey(
        "reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:main:unbound",
      ),
    ).toBeNull();
  });

  it("O: rejects extra and missing marker segments", () => {
    expect(
      parseScenarioLabelMigrationMarkerKey(
        "reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value",
      ),
    ).toBeNull();
    expect(
      parseScenarioLabelMigrationMarkerKey(
        "reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:unbound:extra",
      ),
    ).toBeNull();
    expect(
      parseScenarioLabelMigrationMarkerKey(
        "reditelsky-pruvodce:v2:migration-state:phmax-scenario-label:value:",
      ),
    ).toBeNull();
  });

  it("P: marker key is rejected by business StorageAddress parser", () => {
    const markerKey = serializeScenarioLabelMigrationMarkerKey({ kind: "unbound" });
    expect(parseNamespacedStorageKey(markerKey)).toBeNull();
  });

  it("Q: accepts valid synced-present marker payload", () => {
    const payload: ScenarioLabelMigrationMarkerPayload = {
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "present",
    };
    expect(parseScenarioLabelMigrationMarkerPayload(payload)).toEqual(payload);
    expect(parseScenarioLabelMigrationMarkerPayloadJson(JSON.stringify(payload))).toEqual(payload);
  });

  it("R: accepts valid synced-absent marker payload", () => {
    const payload: ScenarioLabelMigrationMarkerPayload = {
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "absent",
    };
    expect(parseScenarioLabelMigrationMarkerPayload(payload)).toEqual(payload);
  });

  it("S: accepts valid dirty-present marker payload", () => {
    const payload: ScenarioLabelMigrationMarkerPayload = {
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "dirty",
      authoritativePresence: "present",
    };
    expect(parseScenarioLabelMigrationMarkerPayload(payload)).toEqual(payload);
  });

  it("T: accepts valid dirty-absent marker payload", () => {
    const payload: ScenarioLabelMigrationMarkerPayload = {
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "dirty",
      authoritativePresence: "absent",
    };
    expect(parseScenarioLabelMigrationMarkerPayload(payload)).toEqual(payload);
  });

  it("U: rejects unknown payload field", () => {
    expect(
      parseScenarioLabelMigrationMarkerPayload({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "present",
        surprise: true,
      }),
    ).toBeNull();
  });

  it("V: rejects missing payload field", () => {
    expect(
      parseScenarioLabelMigrationMarkerPayload({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "synced",
      }),
    ).toBeNull();
  });

  it("W: rejects wrong schemaVersion", () => {
    expect(
      parseScenarioLabelMigrationMarkerPayload({
        schemaVersion: 2,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    ).toBeNull();
  });

  it("X: rejects wrong authority", () => {
    expect(
      parseScenarioLabelMigrationMarkerPayload({
        schemaVersion: 1,
        authority: "namespaced",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    ).toBeNull();
  });

  it("Y: rejects wrong mirrorHealth", () => {
    expect(
      parseScenarioLabelMigrationMarkerPayload({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "skipped",
        authoritativePresence: "present",
      }),
    ).toBeNull();
  });

  it("Z: rejects wrong authoritativePresence", () => {
    expect(
      parseScenarioLabelMigrationMarkerPayload({
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "missing",
      }),
    ).toBeNull();
  });

  it("AA: raw missing equals missing", () => {
    expect(rawStoredTextEqual(missingRaw(), missingRaw())).toBe(true);
  });

  it("AB: raw present empty equals present empty", () => {
    expect(rawStoredTextEqual(presentRaw(""), presentRaw(""))).toBe(true);
  });

  it("AC: raw missing does not equal present empty", () => {
    expect(rawStoredTextEqual(missingRaw(), presentRaw(""))).toBe(false);
  });

  it("AD: same text is synced", () => {
    expect(deriveScenarioLabelMirrorHealth(presentRaw("A"), presentRaw("A"))).toBe("synced");
  });

  it("AE: different text is dirty", () => {
    expect(deriveScenarioLabelMirrorHealth(presentRaw("A"), presentRaw("B"))).toBe("dirty");
  });

  it("AF: legacy missing + stale v2 is dirty", () => {
    expect(deriveScenarioLabelMirrorHealth(missingRaw(), presentRaw("B"))).toBe("dirty");
  });

  it("AG: empty string + missing is dirty", () => {
    expect(deriveScenarioLabelMirrorHealth(presentRaw(""), missingRaw())).toBe("dirty");
  });

  it("AH: synchronized absence maps to authoritativePresence absent", () => {
    expect(isSynchronizedAbsence(missingRaw(), missingRaw())).toBe(true);
    const payload = buildScenarioLabelMigrationMarkerPayload({
      mirrorHealth: "synced",
      authoritativeRaw: missingRaw(),
    });
    expect(payload.authoritativePresence).toBe("absent");
  });

  it("AI: present empty string maps to authoritativePresence present", () => {
    expect(isSynchronizedPresentEmpty(presentRaw(""), presentRaw(""))).toBe(true);
    expect(authoritativePresenceFromRaw(presentRaw(""))).toBe("present");
  });

  it("AJ: future write result distinguishes authoritative failure from shadow health", () => {
    expect(
      planScenarioLabelShadowOutcome({
        targetResolution: { status: "resolved", target: { kind: "unbound" } },
        authoritativeWriteSucceeded: false,
        shadowWriteSucceeded: false,
        authoritativeRaw: presentRaw("A"),
        shadowRaw: missingRaw(),
      }),
    ).toEqual({ status: "authoritative_failed", code: "legacy_write_failed" });

    expect(
      planScenarioLabelShadowOutcome({
        targetResolution: { status: "resolved", target: { kind: "unbound" } },
        authoritativeWriteSucceeded: true,
        shadowWriteSucceeded: false,
        authoritativeRaw: presentRaw("A"),
        shadowRaw: missingRaw(),
      }),
    ).toEqual({ status: "success", shadow: "dirty" });

    expect(
      planScenarioLabelShadowOutcome({
        targetResolution: { status: "skipped", reason: "corrupted" },
        authoritativeWriteSucceeded: true,
        shadowWriteSucceeded: false,
        authoritativeRaw: presentRaw("A"),
        shadowRaw: missingRaw(),
      }),
    ).toEqual({ status: "success", shadow: "skipped" });

    expect(
      planScenarioLabelShadowOutcome({
        targetResolution: { status: "resolved", target: { kind: "unbound" } },
        authoritativeWriteSucceeded: true,
        shadowWriteSucceeded: true,
        authoritativeRaw: presentRaw("A"),
        shadowRaw: presentRaw("A"),
      }),
    ).toEqual({ status: "success", shadow: "synced" });
  });

  it("AJ2: marker payload roundtrip is strict and deterministic", () => {
    const payload = buildScenarioLabelMigrationMarkerPayload({
      mirrorHealth: "dirty",
      authoritativeRaw: missingRaw(),
    });
    expect(parseScenarioLabelMigrationMarkerPayloadJson(serializeScenarioLabelMigrationMarkerPayload(payload))).toEqual(
      payload,
    );
  });

  it("legacy-first write phase order is fixed", () => {
    expect(SCENARIO_LABEL_WRITE_PHASE_ORDER[0]).toBe("legacy_authoritative");
    expect(SCENARIO_LABEL_WRITE_PHASE_ORDER).toEqual([
      "legacy_authoritative",
      "shadow_mirror",
      "shadow_verify",
      "marker_persist",
    ]);
  });
});
