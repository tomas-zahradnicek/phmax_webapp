import { describe, expect, it } from "vitest";
import type { EntityId } from "../../../domain/shared/entity-id";
import { rawStoredTextEqual } from "./scenario-label-migration-raw";
import {
  buildScenarioLabelN3FenceRecord,
  parseScenarioLabelN3FenceRecord,
  parseScenarioLabelN3FenceRecordJson,
  serializeScenarioLabelN3FenceRecord,
} from "./scenario-label-n3-fence-record";
import {
  SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION,
  SCENARIO_LABEL_N3_FENCE_RESOURCE,
  SCENARIO_LABEL_N3_FENCE_SCHEMA_VERSION,
} from "./scenario-label-n3-fence-types";

const SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" as EntityId;
const SCHOOL_B = "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee" as EntityId;

describe("N3-FENCE-PROTO record schema / parser", () => {
  it("P1: valid legacy certificate roundtrip", () => {
    const record = buildScenarioLabelN3FenceRecord({
      authority: "legacy",
      schoolId: SCHOOL_A,
      committedRaw: { exists: true, value: "A" },
    });
    expect(record).toEqual({
      schemaVersion: SCENARIO_LABEL_N3_FENCE_SCHEMA_VERSION,
      protocolGeneration: SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION,
      authority: "legacy",
      markerSchemaVersion: 1,
      schoolId: SCHOOL_A,
      resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
      committedRaw: { exists: true, value: "A" },
    });
    const json = serializeScenarioLabelN3FenceRecord(record);
    expect(parseScenarioLabelN3FenceRecordJson(json)).toEqual({ status: "valid", record });
  });

  it("P2: valid namespaced certificate", () => {
    const record = buildScenarioLabelN3FenceRecord({
      authority: "namespaced",
      schoolId: SCHOOL_A,
      committedRaw: { exists: false },
    });
    expect(record.authority).toBe("namespaced");
    expect(record.markerSchemaVersion).toBe(2);
    expect(parseScenarioLabelN3FenceRecord(record).status).toBe("valid");
  });

  it("P3: wrong schemaVersion → invalid", () => {
    expect(
      parseScenarioLabelN3FenceRecord({
        schemaVersion: 99,
        protocolGeneration: 3,
        authority: "legacy",
        markerSchemaVersion: 1,
        schoolId: SCHOOL_A,
        resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
        committedRaw: { exists: false },
      }),
    ).toEqual({ status: "invalid", reason: "invalid_schema_version" });
  });

  it("P4: wrong protocolGeneration → invalid", () => {
    expect(
      parseScenarioLabelN3FenceRecord({
        schemaVersion: 1,
        protocolGeneration: 2,
        authority: "legacy",
        markerSchemaVersion: 1,
        schoolId: SCHOOL_A,
        resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
        committedRaw: { exists: false },
      }),
    ).toEqual({ status: "invalid", reason: "invalid_protocol_generation" });
  });

  it("P5: extra field → invalid", () => {
    expect(
      parseScenarioLabelN3FenceRecord({
        schemaVersion: 1,
        protocolGeneration: 3,
        authority: "legacy",
        markerSchemaVersion: 1,
        schoolId: SCHOOL_A,
        resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
        committedRaw: { exists: false },
        extra: true,
      }),
    ).toEqual({ status: "invalid", reason: "unknown_field" });
  });

  it("P6: bad authority → invalid", () => {
    expect(
      parseScenarioLabelN3FenceRecord({
        schemaVersion: 1,
        protocolGeneration: 3,
        authority: "hybrid",
        markerSchemaVersion: 1,
        schoolId: SCHOOL_A,
        resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
        committedRaw: { exists: false },
      }),
    ).toEqual({ status: "invalid", reason: "invalid_authority" });
  });

  it("P7: bad markerSchemaVersion → invalid", () => {
    expect(
      parseScenarioLabelN3FenceRecord({
        schemaVersion: 1,
        protocolGeneration: 3,
        authority: "legacy",
        markerSchemaVersion: 3,
        schoolId: SCHOOL_A,
        resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
        committedRaw: { exists: false },
      }),
    ).toEqual({ status: "invalid", reason: "invalid_marker_schema_version" });
  });

  it("P8: authority/schema mismatch → invalid", () => {
    expect(
      parseScenarioLabelN3FenceRecord({
        schemaVersion: 1,
        protocolGeneration: 3,
        authority: "legacy",
        markerSchemaVersion: 2,
        schoolId: SCHOOL_A,
        resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
        committedRaw: { exists: false },
      }),
    ).toEqual({ status: "invalid", reason: "authority_marker_schema_mismatch" });
    expect(
      parseScenarioLabelN3FenceRecord({
        schemaVersion: 1,
        protocolGeneration: 3,
        authority: "namespaced",
        markerSchemaVersion: 1,
        schoolId: SCHOOL_A,
        resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
        committedRaw: { exists: false },
      }),
    ).toEqual({ status: "invalid", reason: "authority_marker_schema_mismatch" });
  });

  it("P9: school payload must be canonical (uppercase reject)", () => {
    expect(
      parseScenarioLabelN3FenceRecord({
        schemaVersion: 1,
        protocolGeneration: 3,
        authority: "legacy",
        markerSchemaVersion: 1,
        schoolId: "AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE",
        resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
        committedRaw: { exists: false },
      }),
    ).toEqual({ status: "invalid", reason: "invalid_school_id" });
  });

  it("P10: resource mismatch → invalid", () => {
    expect(
      parseScenarioLabelN3FenceRecord({
        schemaVersion: 1,
        protocolGeneration: 3,
        authority: "legacy",
        markerSchemaVersion: 1,
        schoolId: SCHOOL_A,
        resource: "phmax-scenario-label/other",
        committedRaw: { exists: false },
      }),
    ).toEqual({ status: "invalid", reason: "invalid_resource" });
  });

  it("P11: malformed RawStoredText → invalid", () => {
    expect(
      parseScenarioLabelN3FenceRecord({
        schemaVersion: 1,
        protocolGeneration: 3,
        authority: "legacy",
        markerSchemaVersion: 1,
        schoolId: SCHOOL_A,
        resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
        committedRaw: { exists: true },
      }),
    ).toEqual({ status: "invalid", reason: "invalid_committed_raw" });
    expect(
      parseScenarioLabelN3FenceRecord({
        schemaVersion: 1,
        protocolGeneration: 3,
        authority: "legacy",
        markerSchemaVersion: 1,
        schoolId: SCHOOL_A,
        resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
        committedRaw: { exists: false, value: "" },
      }),
    ).toEqual({ status: "invalid", reason: "invalid_committed_raw" });
  });

  it("exact raw semantics: missing != present empty; no trim", () => {
    const missing = { exists: false } as const;
    const empty = { exists: true, value: "" } as const;
    const a = { exists: true, value: "A" } as const;
    const aSpace = { exists: true, value: "A " } as const;

    expect(rawStoredTextEqual(missing, missing)).toBe(true);
    expect(rawStoredTextEqual(empty, empty)).toBe(true);
    expect(rawStoredTextEqual(missing, empty)).toBe(false);
    expect(rawStoredTextEqual(a, aSpace)).toBe(false);

    expect(
      parseScenarioLabelN3FenceRecord(
        buildScenarioLabelN3FenceRecord({
          authority: "legacy",
          schoolId: SCHOOL_A,
          committedRaw: missing,
        }),
      ).status,
    ).toBe("valid");
    expect(
      parseScenarioLabelN3FenceRecord(
        buildScenarioLabelN3FenceRecord({
          authority: "legacy",
          schoolId: SCHOOL_A,
          committedRaw: empty,
        }),
      ).status,
    ).toBe("valid");
  });

  it("null / missing parse results", () => {
    expect(parseScenarioLabelN3FenceRecord(null)).toEqual({ status: "missing" });
    expect(parseScenarioLabelN3FenceRecordJson(null)).toEqual({ status: "missing" });
    expect(parseScenarioLabelN3FenceRecordJson("{")).toEqual({
      status: "invalid",
      reason: "invalid_json",
    });
  });

  it("school A payload identity is distinct from school B (binding prep)", () => {
    const a = buildScenarioLabelN3FenceRecord({
      authority: "legacy",
      schoolId: SCHOOL_A,
      committedRaw: { exists: true, value: "X" },
    });
    const b = buildScenarioLabelN3FenceRecord({
      authority: "legacy",
      schoolId: SCHOOL_B,
      committedRaw: { exists: true, value: "X" },
    });
    expect(a.schoolId).not.toBe(b.schoolId);
  });
});
