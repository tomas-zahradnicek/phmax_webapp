import { describe, expect, it } from "vitest";
import { parseScenarioLabelMigrationMarkerPayload } from "./scenario-label-migration-marker-payload";
import {
  buildScenarioLabelN3LegacyMarker,
  buildScenarioLabelN3NamespacedMarker,
  isScenarioLabelN3LegacyMarker,
  isScenarioLabelN3NamespacedMarker,
  parseScenarioLabelN3AuthorityMarker,
  parseScenarioLabelN3AuthorityMarkerJson,
  serializeScenarioLabelN3AuthorityMarker,
} from "./scenario-label-n3-authority-marker";
import { SCENARIO_LABEL_N3_MARKER_SCHEMA_VERSION } from "./scenario-label-n3-authority-types";

describe("N3-PROTO authority marker dual parser", () => {
  it("M1: valid v1 legacy", () => {
    const parsed = parseScenarioLabelN3AuthorityMarker({
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: "synced",
      authoritativePresence: "present",
    });
    expect(parsed).toEqual({
      status: "valid",
      payload: {
        schemaVersion: 1,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      },
    });
    if (parsed.status === "valid") {
      expect(isScenarioLabelN3LegacyMarker(parsed.payload)).toBe(true);
    }
  });

  it("M2: valid v2 namespaced", () => {
    const parsed = parseScenarioLabelN3AuthorityMarker({
      schemaVersion: SCENARIO_LABEL_N3_MARKER_SCHEMA_VERSION,
      authority: "namespaced",
      mirrorHealth: "synced",
      authoritativePresence: "absent",
    });
    expect(parsed.status).toBe("valid");
    if (parsed.status === "valid") {
      expect(isScenarioLabelN3NamespacedMarker(parsed.payload)).toBe(true);
      expect(parsed.payload).toEqual({
        schemaVersion: 2,
        authority: "namespaced",
        mirrorHealth: "synced",
        authoritativePresence: "absent",
      });
    }
  });

  it("M3: v2 + wrong authority", () => {
    expect(
      parseScenarioLabelN3AuthorityMarker({
        schemaVersion: 2,
        authority: "other",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    ).toEqual({ status: "invalid", reason: "invalid_authority" });
  });

  it("M4: v1 + namespaced rejected", () => {
    expect(
      parseScenarioLabelN3AuthorityMarker({
        schemaVersion: 1,
        authority: "namespaced",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    ).toEqual({ status: "invalid", reason: "schema_authority_mismatch" });
  });

  it("M5: v2 + legacy rejected", () => {
    expect(
      parseScenarioLabelN3AuthorityMarker({
        schemaVersion: 2,
        authority: "legacy",
        mirrorHealth: "synced",
        authoritativePresence: "present",
      }),
    ).toEqual({ status: "invalid", reason: "schema_authority_mismatch" });
  });

  it("M6: malformed JSON", () => {
    expect(parseScenarioLabelN3AuthorityMarkerJson("{not-json")).toEqual({
      status: "invalid",
      reason: "invalid_json",
    });
  });

  it("M7: extra field", () => {
    expect(
      parseScenarioLabelN3AuthorityMarker({
        schemaVersion: 2,
        authority: "namespaced",
        mirrorHealth: "synced",
        authoritativePresence: "present",
        surprise: true,
      }),
    ).toEqual({ status: "invalid", reason: "unknown_field" });
  });

  it("M8: wrong presence", () => {
    expect(
      parseScenarioLabelN3AuthorityMarker({
        schemaVersion: 2,
        authority: "namespaced",
        mirrorHealth: "synced",
        authoritativePresence: "missing",
      }),
    ).toEqual({ status: "invalid", reason: "invalid_authoritative_presence" });
  });

  it("M9: wrong health", () => {
    expect(
      parseScenarioLabelN3AuthorityMarker({
        schemaVersion: 2,
        authority: "namespaced",
        mirrorHealth: "skipped",
        authoritativePresence: "present",
      }),
    ).toEqual({ status: "invalid", reason: "invalid_mirror_health" });
  });

  it("M10: old N2 parser rejects v2 namespaced marker", () => {
    const v2 = {
      schemaVersion: 2,
      authority: "namespaced",
      mirrorHealth: "synced",
      authoritativePresence: "present",
    };
    expect(parseScenarioLabelMigrationMarkerPayload(v2)).toBeNull();
    expect(parseScenarioLabelN3AuthorityMarker(v2).status).toBe("valid");
  });

  it("serialize round-trip builders", () => {
    const legacy = buildScenarioLabelN3LegacyMarker({
      mirrorHealth: "dirty",
      authoritativePresence: "absent",
    });
    const namespaced = buildScenarioLabelN3NamespacedMarker({
      mirrorHealth: "synced",
      authoritativePresence: "present",
    });
    expect(parseScenarioLabelN3AuthorityMarkerJson(serializeScenarioLabelN3AuthorityMarker(legacy))).toEqual({
      status: "valid",
      payload: legacy,
    });
    expect(
      parseScenarioLabelN3AuthorityMarkerJson(serializeScenarioLabelN3AuthorityMarker(namespaced)),
    ).toEqual({ status: "valid", payload: namespaced });
  });

  it("null / missing", () => {
    expect(parseScenarioLabelN3AuthorityMarker(null)).toEqual({ status: "missing" });
    expect(parseScenarioLabelN3AuthorityMarkerJson(null)).toEqual({ status: "missing" });
  });
});
