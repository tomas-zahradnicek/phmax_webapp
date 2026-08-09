/**
 * N3-PROTO — dual authority marker parser (v1 legacy + v2 namespaced).
 *
 * Reuses the existing N2 v1 strict parser without widening its authority union.
 * Schema v2 introduces namespaced authority with flipped semantic referents:
 * - authoritativePresence → v2 authority presence
 * - mirrorHealth → legacy compatibility mirror vs v2
 */

import { parseScenarioLabelMigrationMarkerPayload } from "./scenario-label-migration-marker-payload";
import type { ScenarioLabelMigrationMarkerPayload } from "./scenario-label-migration-types";
import {
  SCENARIO_LABEL_N3_MARKER_SCHEMA_VERSION,
  type ScenarioLabelN3AuthorityMarkerParseResult,
  type ScenarioLabelN3AuthorityMarkerPayload,
  type ScenarioLabelN3LegacyMarkerPayload,
  type ScenarioLabelN3MarkerInvalidReason,
  type ScenarioLabelN3NamespacedMarkerPayload,
} from "./scenario-label-n3-authority-types";

const ALLOWED_PAYLOAD_KEYS = new Set([
  "schemaVersion",
  "authority",
  "mirrorHealth",
  "authoritativePresence",
]);

const ALLOWED_MIRROR_HEALTH = new Set(["synced", "dirty"]);
const ALLOWED_PRESENCE = new Set(["present", "absent"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function invalid(reason: ScenarioLabelN3MarkerInvalidReason): ScenarioLabelN3AuthorityMarkerParseResult {
  return { status: "invalid", reason };
}

function parseNamespacedV2(
  value: Record<string, unknown>,
): ScenarioLabelN3AuthorityMarkerParseResult {
  for (const key of Object.keys(value)) {
    if (!ALLOWED_PAYLOAD_KEYS.has(key)) return invalid("unknown_field");
  }

  if (value.schemaVersion !== SCENARIO_LABEL_N3_MARKER_SCHEMA_VERSION) {
    return invalid("invalid_schema_version");
  }

  // v2 may only carry namespaced authority (v2+legacy rejected).
  if (value.authority === "legacy") {
    return invalid("schema_authority_mismatch");
  }
  if (value.authority !== "namespaced") {
    return invalid("invalid_authority");
  }

  if (!ALLOWED_MIRROR_HEALTH.has(value.mirrorHealth as string)) {
    return invalid("invalid_mirror_health");
  }
  if (!ALLOWED_PRESENCE.has(value.authoritativePresence as string)) {
    return invalid("invalid_authoritative_presence");
  }

  if (
    value.mirrorHealth === undefined ||
    value.authoritativePresence === undefined
  ) {
    return invalid("invalid_shape");
  }

  const payload: ScenarioLabelN3NamespacedMarkerPayload = {
    schemaVersion: SCENARIO_LABEL_N3_MARKER_SCHEMA_VERSION,
    authority: "namespaced",
    mirrorHealth: value.mirrorHealth as ScenarioLabelN3NamespacedMarkerPayload["mirrorHealth"],
    authoritativePresence:
      value.authoritativePresence as ScenarioLabelN3NamespacedMarkerPayload["authoritativePresence"],
  };
  return { status: "valid", payload };
}

/**
 * Parse an already-deserialized marker object into the N3 dual-schema union.
 * Does not mutate N2 v1 parser behavior — delegates v1 to the existing parser.
 */
export function parseScenarioLabelN3AuthorityMarker(
  value: unknown,
): ScenarioLabelN3AuthorityMarkerParseResult {
  if (value == null) return { status: "missing" };
  if (!isRecord(value)) return invalid("invalid_shape");

  // Prefer explicit schemaVersion discrimination.
  if (value.schemaVersion === SCENARIO_LABEL_N3_MARKER_SCHEMA_VERSION) {
    return parseNamespacedV2(value);
  }

  // v1 + namespaced is rejected by the N2 parser (authority not allowed) and by us.
  if (value.schemaVersion === 1 && value.authority === "namespaced") {
    return invalid("schema_authority_mismatch");
  }

  const v1 = parseScenarioLabelMigrationMarkerPayload(value);
  if (v1) {
    const payload: ScenarioLabelN3LegacyMarkerPayload = {
      schemaVersion: 1,
      authority: "legacy",
      mirrorHealth: v1.mirrorHealth,
      authoritativePresence: v1.authoritativePresence,
    };
    return { status: "valid", payload };
  }

  // Map common N2 rejection shapes to explicit reasons when possible.
  if (value.schemaVersion !== 1 && value.schemaVersion !== SCENARIO_LABEL_N3_MARKER_SCHEMA_VERSION) {
    return invalid("invalid_schema_version");
  }
  return invalid("invalid_shape");
}

export function parseScenarioLabelN3AuthorityMarkerJson(
  json: unknown,
): ScenarioLabelN3AuthorityMarkerParseResult {
  if (json == null) return { status: "missing" };
  if (typeof json !== "string") return invalid("invalid_shape");
  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    return invalid("invalid_json");
  }
  return parseScenarioLabelN3AuthorityMarker(parsed);
}

export function serializeScenarioLabelN3AuthorityMarker(
  payload: ScenarioLabelN3AuthorityMarkerPayload,
): string {
  const parsed = parseScenarioLabelN3AuthorityMarker(payload);
  if (parsed.status !== "valid") {
    throw new Error(`Cannot serialize invalid N3 authority marker (${parsed.status}).`);
  }
  return JSON.stringify(parsed.payload);
}

export function buildScenarioLabelN3LegacyMarker(params: {
  mirrorHealth: ScenarioLabelN3LegacyMarkerPayload["mirrorHealth"];
  authoritativePresence: ScenarioLabelN3LegacyMarkerPayload["authoritativePresence"];
}): ScenarioLabelN3LegacyMarkerPayload {
  return {
    schemaVersion: 1,
    authority: "legacy",
    mirrorHealth: params.mirrorHealth,
    authoritativePresence: params.authoritativePresence,
  };
}

export function buildScenarioLabelN3NamespacedMarker(params: {
  mirrorHealth: ScenarioLabelN3NamespacedMarkerPayload["mirrorHealth"];
  authoritativePresence: ScenarioLabelN3NamespacedMarkerPayload["authoritativePresence"];
}): ScenarioLabelN3NamespacedMarkerPayload {
  return {
    schemaVersion: SCENARIO_LABEL_N3_MARKER_SCHEMA_VERSION,
    authority: "namespaced",
    mirrorHealth: params.mirrorHealth,
    authoritativePresence: params.authoritativePresence,
  };
}

/** Narrow helper: coerce a proven N2 v1 payload into the N3 legacy marker type. */
export function asScenarioLabelN3LegacyMarker(
  payload: ScenarioLabelMigrationMarkerPayload,
): ScenarioLabelN3LegacyMarkerPayload {
  return {
    schemaVersion: 1,
    authority: "legacy",
    mirrorHealth: payload.mirrorHealth,
    authoritativePresence: payload.authoritativePresence,
  };
}

export function isScenarioLabelN3LegacyMarker(
  payload: ScenarioLabelN3AuthorityMarkerPayload,
): payload is ScenarioLabelN3LegacyMarkerPayload {
  return payload.schemaVersion === 1 && payload.authority === "legacy";
}

export function isScenarioLabelN3NamespacedMarker(
  payload: ScenarioLabelN3AuthorityMarkerPayload,
): payload is ScenarioLabelN3NamespacedMarkerPayload {
  return (
    payload.schemaVersion === SCENARIO_LABEL_N3_MARKER_SCHEMA_VERSION &&
    payload.authority === "namespaced"
  );
}
