import { authoritativePresenceFromRaw } from "./scenario-label-migration-raw";
import type {
  RawStoredText,
  ScenarioLabelMigrationMarkerPayload,
  ScenarioLabelMigrationTargetResolution,
} from "./scenario-label-migration-types";
import { rawStoredTextEqual } from "./scenario-label-migration-raw";

/**
 * Pure N3 cutover readiness assessment.
 *
 * Zero storage I/O. Zero production call sites in N2-HARDEN.
 * Evaluates whether a supplied (already-loaded) state is a safe candidate
 * for future namespaced authority — without performing any cutover.
 */
export type ScenarioLabelCutoverReadinessReason =
  | "target_unresolved"
  | "marker_missing"
  | "marker_invalid"
  | "marker_not_legacy"
  | "marker_not_synced"
  | "presence_mismatch"
  | "raw_mismatch";

export type ScenarioLabelCutoverReadinessInput = {
  readonly targetResolution: ScenarioLabelMigrationTargetResolution;
  /** `null` / `undefined` → marker missing. Invalid shapes → marker_invalid. */
  readonly marker: ScenarioLabelMigrationMarkerPayload | null | undefined;
  readonly legacyRaw: RawStoredText;
  readonly shadowRaw: RawStoredText;
};

export type ScenarioLabelCutoverReadinessResult =
  | { readonly ready: true }
  | { readonly ready: false; readonly reason: ScenarioLabelCutoverReadinessReason };

/**
 * Assess whether scenario-label state is ready for a future N3 cutover.
 *
 * READY only when all of:
 * 1. target safely resolved (not skipped)
 * 2. marker exists and is strict-schema valid (caller supplies parsed payload or null)
 * 3. authority === "legacy"
 * 4. mirrorHealth === "synced"
 * 5. fresh legacy/v2 raw equality
 * 6. marker.authoritativePresence matches fresh legacy existence
 *
 * Does not adopt unbound↔school, does not bootstrap, does not read storage.
 */
export function assessScenarioLabelCutoverReadiness(
  input: ScenarioLabelCutoverReadinessInput,
): ScenarioLabelCutoverReadinessResult {
  if (input.targetResolution.status === "skipped") {
    return { ready: false, reason: "target_unresolved" };
  }

  const marker = input.marker;
  if (marker == null) {
    return { ready: false, reason: "marker_missing" };
  }

  // Caller should pass only parse-validated payloads; defend against incomplete objects.
  if (
    marker.schemaVersion !== 1 ||
    marker.authority == null ||
    marker.mirrorHealth == null ||
    marker.authoritativePresence == null
  ) {
    return { ready: false, reason: "marker_invalid" };
  }

  if (marker.authority !== "legacy") {
    return { ready: false, reason: "marker_not_legacy" };
  }

  if (marker.mirrorHealth !== "synced") {
    return { ready: false, reason: "marker_not_synced" };
  }

  const expectedPresence = authoritativePresenceFromRaw(input.legacyRaw);
  if (marker.authoritativePresence !== expectedPresence) {
    return { ready: false, reason: "presence_mismatch" };
  }

  if (!rawStoredTextEqual(input.legacyRaw, input.shadowRaw)) {
    return { ready: false, reason: "raw_mismatch" };
  }

  return { ready: true };
}
