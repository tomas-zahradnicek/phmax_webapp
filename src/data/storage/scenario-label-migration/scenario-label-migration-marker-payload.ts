import {
  SCENARIO_LABEL_MIGRATION_MARKER_SCHEMA_VERSION,
  type ScenarioLabelMigrationAuthority,
  type ScenarioLabelMigrationAuthoritativePresence,
  type ScenarioLabelMigrationMarkerPayload,
  type ScenarioLabelMigrationMirrorHealth,
} from "./scenario-label-migration-types";

export type ScenarioLabelMigrationMarkerPayloadErrorCode =
  | "invalid_json"
  | "invalid_shape"
  | "invalid_schema_version"
  | "invalid_authority"
  | "invalid_mirror_health"
  | "invalid_authoritative_presence"
  | "unknown_field";

export class ScenarioLabelMigrationMarkerPayloadError extends Error {
  readonly code: ScenarioLabelMigrationMarkerPayloadErrorCode;

  constructor(code: ScenarioLabelMigrationMarkerPayloadErrorCode, message: string) {
    super(message);
    this.name = "ScenarioLabelMigrationMarkerPayloadError";
    this.code = code;
  }
}

const ALLOWED_PAYLOAD_KEYS = new Set([
  "schemaVersion",
  "authority",
  "mirrorHealth",
  "authoritativePresence",
]);

const ALLOWED_AUTHORITIES = new Set<ScenarioLabelMigrationAuthority>(["legacy"]);
const ALLOWED_MIRROR_HEALTH = new Set<ScenarioLabelMigrationMirrorHealth>(["synced", "dirty"]);
const ALLOWED_PRESENCE = new Set<ScenarioLabelMigrationAuthoritativePresence>([
  "present",
  "absent",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseScenarioLabelMigrationMarkerPayload(
  value: unknown,
): ScenarioLabelMigrationMarkerPayload | null {
  if (!isRecord(value)) return null;

  for (const key of Object.keys(value)) {
    if (!ALLOWED_PAYLOAD_KEYS.has(key)) return null;
  }

  if (value.schemaVersion !== SCENARIO_LABEL_MIGRATION_MARKER_SCHEMA_VERSION) return null;
  if (!ALLOWED_AUTHORITIES.has(value.authority as ScenarioLabelMigrationAuthority)) return null;
  if (!ALLOWED_MIRROR_HEALTH.has(value.mirrorHealth as ScenarioLabelMigrationMirrorHealth)) {
    return null;
  }
  if (
    !ALLOWED_PRESENCE.has(value.authoritativePresence as ScenarioLabelMigrationAuthoritativePresence)
  ) {
    return null;
  }

  if (
    value.schemaVersion === undefined ||
    value.authority === undefined ||
    value.mirrorHealth === undefined ||
    value.authoritativePresence === undefined
  ) {
    return null;
  }

  return {
    schemaVersion: SCENARIO_LABEL_MIGRATION_MARKER_SCHEMA_VERSION,
    authority: value.authority as ScenarioLabelMigrationAuthority,
    mirrorHealth: value.mirrorHealth as ScenarioLabelMigrationMirrorHealth,
    authoritativePresence: value.authoritativePresence as ScenarioLabelMigrationAuthoritativePresence,
  };
}

export function parseScenarioLabelMigrationMarkerPayloadStrict(
  value: unknown,
): ScenarioLabelMigrationMarkerPayload {
  const parsed = parseScenarioLabelMigrationMarkerPayload(value);
  if (!parsed) {
    throw new ScenarioLabelMigrationMarkerPayloadError("invalid_shape", "Invalid marker payload.");
  }
  return parsed;
}

export function serializeScenarioLabelMigrationMarkerPayload(
  payload: ScenarioLabelMigrationMarkerPayload,
): string {
  const validated = parseScenarioLabelMigrationMarkerPayload(payload);
  if (!validated) {
    throw new ScenarioLabelMigrationMarkerPayloadError(
      "invalid_shape",
      "Cannot serialize an invalid marker payload.",
    );
  }
  return JSON.stringify(validated);
}

export function parseScenarioLabelMigrationMarkerPayloadJson(
  json: unknown,
): ScenarioLabelMigrationMarkerPayload | null {
  if (typeof json !== "string") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    return null;
  }
  return parseScenarioLabelMigrationMarkerPayload(parsed);
}
