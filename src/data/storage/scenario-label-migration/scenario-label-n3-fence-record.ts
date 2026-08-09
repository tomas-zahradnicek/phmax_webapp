/**
 * N3-FENCE-PROTO — strict fence record serializer / parser.
 *
 * Independent schemaVersion (fence serialization) and protocolGeneration (writer generation).
 * No repair. No normalization. Exact RawStoredText only.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import { isUuid, normalizeUuid } from "../../identity/identity-uuid";
import type { RawStoredText } from "./scenario-label-migration-types";
import {
  SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION,
  SCENARIO_LABEL_N3_FENCE_RESOURCE,
  SCENARIO_LABEL_N3_FENCE_SCHEMA_VERSION,
  type ScenarioLabelN3FenceAuthority,
  type ScenarioLabelN3FenceMarkerSchemaVersion,
  type ScenarioLabelN3FenceRecord,
  type ScenarioLabelN3FenceRecordInvalidReason,
  type ScenarioLabelN3FenceRecordParseResult,
} from "./scenario-label-n3-fence-types";

const ALLOWED_RECORD_KEYS = new Set([
  "schemaVersion",
  "protocolGeneration",
  "authority",
  "markerSchemaVersion",
  "schoolId",
  "resource",
  "committedRaw",
]);

const ALLOWED_AUTHORITIES = new Set<ScenarioLabelN3FenceAuthority>(["legacy", "namespaced"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCanonicalSchoolId(value: unknown): value is EntityId {
  return typeof value === "string" && isUuid(value) && value === normalizeUuid(value);
}

function invalid(reason: ScenarioLabelN3FenceRecordInvalidReason): ScenarioLabelN3FenceRecordParseResult {
  return { status: "invalid", reason };
}

function parseCommittedRaw(value: unknown): RawStoredText | null {
  if (!isRecord(value)) return null;
  const keys = Object.keys(value);
  if (value.exists === false) {
    if (keys.length !== 1 || keys[0] !== "exists") return null;
    return { exists: false };
  }
  if (value.exists === true) {
    if (keys.length !== 2) return null;
    if (!keys.includes("exists") || !keys.includes("value")) return null;
    if (typeof value.value !== "string") return null;
    return { exists: true, value: value.value };
  }
  return null;
}

function authorityMarkerSchemaCoherent(
  authority: ScenarioLabelN3FenceAuthority,
  markerSchemaVersion: ScenarioLabelN3FenceMarkerSchemaVersion,
): boolean {
  if (authority === "legacy") return markerSchemaVersion === 1;
  return markerSchemaVersion === 2;
}

/**
 * Parse an already-deserialized fence object.
 * Invalid → typed invalid result. No repair.
 */
export function parseScenarioLabelN3FenceRecord(
  value: unknown,
): ScenarioLabelN3FenceRecordParseResult {
  if (value == null) return { status: "missing" };
  if (!isRecord(value)) return invalid("invalid_shape");

  for (const key of Object.keys(value)) {
    if (!ALLOWED_RECORD_KEYS.has(key)) return invalid("unknown_field");
  }

  if (value.schemaVersion !== SCENARIO_LABEL_N3_FENCE_SCHEMA_VERSION) {
    return invalid("invalid_schema_version");
  }
  if (value.protocolGeneration !== SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION) {
    return invalid("invalid_protocol_generation");
  }

  if (!ALLOWED_AUTHORITIES.has(value.authority as ScenarioLabelN3FenceAuthority)) {
    return invalid("invalid_authority");
  }
  const authority = value.authority as ScenarioLabelN3FenceAuthority;

  if (value.markerSchemaVersion !== 1 && value.markerSchemaVersion !== 2) {
    return invalid("invalid_marker_schema_version");
  }
  const markerSchemaVersion = value.markerSchemaVersion as ScenarioLabelN3FenceMarkerSchemaVersion;

  if (!authorityMarkerSchemaCoherent(authority, markerSchemaVersion)) {
    return invalid("authority_marker_schema_mismatch");
  }

  if (!isCanonicalSchoolId(value.schoolId)) {
    return invalid("invalid_school_id");
  }

  if (value.resource !== SCENARIO_LABEL_N3_FENCE_RESOURCE) {
    return invalid("invalid_resource");
  }

  const committedRaw = parseCommittedRaw(value.committedRaw);
  if (committedRaw == null) {
    return invalid("invalid_committed_raw");
  }

  // All required fields present (explicit undefined guard).
  if (
    value.schemaVersion === undefined ||
    value.protocolGeneration === undefined ||
    value.authority === undefined ||
    value.markerSchemaVersion === undefined ||
    value.schoolId === undefined ||
    value.resource === undefined ||
    value.committedRaw === undefined
  ) {
    return invalid("invalid_shape");
  }

  const record: ScenarioLabelN3FenceRecord = {
    schemaVersion: SCENARIO_LABEL_N3_FENCE_SCHEMA_VERSION,
    protocolGeneration: SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION,
    authority,
    markerSchemaVersion,
    schoolId: value.schoolId,
    resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
    committedRaw,
  };
  return { status: "valid", record };
}

export function parseScenarioLabelN3FenceRecordJson(
  json: unknown,
): ScenarioLabelN3FenceRecordParseResult {
  if (json == null) return { status: "missing" };
  if (typeof json !== "string") return invalid("invalid_shape");
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    return invalid("invalid_json");
  }
  return parseScenarioLabelN3FenceRecord(parsed);
}

export function serializeScenarioLabelN3FenceRecord(record: ScenarioLabelN3FenceRecord): string {
  const parsed = parseScenarioLabelN3FenceRecord(record);
  if (parsed.status !== "valid") {
    throw new Error(`Cannot serialize invalid N3 fence record (${parsed.status}).`);
  }
  return JSON.stringify(parsed.record);
}

export function buildScenarioLabelN3FenceRecord(params: {
  readonly authority: ScenarioLabelN3FenceAuthority;
  readonly schoolId: EntityId;
  readonly committedRaw: RawStoredText;
}): ScenarioLabelN3FenceRecord {
  const markerSchemaVersion: ScenarioLabelN3FenceMarkerSchemaVersion =
    params.authority === "legacy" ? 1 : 2;

  const record: ScenarioLabelN3FenceRecord = {
    schemaVersion: SCENARIO_LABEL_N3_FENCE_SCHEMA_VERSION,
    protocolGeneration: SCENARIO_LABEL_N3_FENCE_PROTOCOL_GENERATION,
    authority: params.authority,
    markerSchemaVersion,
    schoolId: params.schoolId,
    resource: SCENARIO_LABEL_N3_FENCE_RESOURCE,
    committedRaw: params.committedRaw,
  };

  const parsed = parseScenarioLabelN3FenceRecord(record);
  if (parsed.status !== "valid") {
    throw new Error(`Cannot build invalid N3 fence record (${parsed.status}).`);
  }
  return parsed.record;
}
