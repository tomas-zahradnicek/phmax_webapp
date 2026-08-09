import { NAMESPACED_STORAGE_SCHEMA_VERSION } from "../namespaced-storage-schema";
import {
  serializeStorageAddress,
  type StorageAddress,
} from "../namespaced-storage-address";
import {
  authoritativePresenceFromRaw,
  rawStoredTextEqual,
  rawStoredTextFromNullable,
} from "./scenario-label-migration-raw";
import type {
  RawStoredText,
  ScenarioLabelMigrationMarkerPayload,
  ScenarioLabelMigrationMirrorHealth,
  ScenarioLabelMigrationTarget,
  ScenarioLabelMigrationTargetResolution,
  ScenarioLabelShadowOutcome,
  ScenarioLabelWriteResult,
} from "./scenario-label-migration-types";
import {
  SCENARIO_LABEL_MIGRATION_MARKER_SCHEMA_VERSION,
  SCENARIO_LABEL_MIGRATION_MODULE_ID,
  SCENARIO_LABEL_MIGRATION_RESOURCE_ID,
} from "./scenario-label-migration-types";

export function deriveScenarioLabelMirrorHealth(
  authoritativeRaw: RawStoredText,
  shadowRaw: RawStoredText,
): ScenarioLabelMigrationMirrorHealth {
  return rawStoredTextEqual(authoritativeRaw, shadowRaw) ? "synced" : "dirty";
}

export function buildScenarioLabelMigrationMarkerPayload(params: {
  mirrorHealth: ScenarioLabelMigrationMirrorHealth;
  authoritativeRaw: RawStoredText;
}): ScenarioLabelMigrationMarkerPayload {
  return {
    schemaVersion: SCENARIO_LABEL_MIGRATION_MARKER_SCHEMA_VERSION,
    authority: "legacy",
    mirrorHealth: params.mirrorHealth,
    authoritativePresence: authoritativePresenceFromRaw(params.authoritativeRaw),
  };
}

export function buildScenarioLabelNamespacedAddress(
  resolution: ScenarioLabelMigrationTargetResolution,
): StorageAddress | null {
  if (resolution.status === "skipped") {
    return null;
  }

  const base = {
    version: NAMESPACED_STORAGE_SCHEMA_VERSION,
    moduleId: SCENARIO_LABEL_MIGRATION_MODULE_ID,
    resourceId: SCENARIO_LABEL_MIGRATION_RESOURCE_ID,
  } as const;

  if (resolution.target.kind === "unbound") {
    return {
      ...base,
      scope: { kind: "unbound" },
    };
  }

  return {
    ...base,
    scope: { kind: "school", schoolId: resolution.target.schoolId },
  };
}

export function buildScenarioLabelNamespacedKey(
  target: ScenarioLabelMigrationTarget,
): string {
  const address: StorageAddress =
    target.kind === "unbound"
      ? {
          version: NAMESPACED_STORAGE_SCHEMA_VERSION,
          scope: { kind: "unbound" },
          moduleId: SCENARIO_LABEL_MIGRATION_MODULE_ID,
          resourceId: SCENARIO_LABEL_MIGRATION_RESOURCE_ID,
        }
      : {
          version: NAMESPACED_STORAGE_SCHEMA_VERSION,
          scope: { kind: "school", schoolId: target.schoolId },
          moduleId: SCENARIO_LABEL_MIGRATION_MODULE_ID,
          resourceId: SCENARIO_LABEL_MIGRATION_RESOURCE_ID,
        };

  return serializeStorageAddress(address);
}

export function planScenarioLabelShadowOutcome(params: {
  targetResolution: ScenarioLabelMigrationTargetResolution;
  authoritativeWriteSucceeded: boolean;
  shadowWriteSucceeded: boolean;
  authoritativeRaw: RawStoredText;
  shadowRaw: RawStoredText;
}): ScenarioLabelWriteResult {
  if (!params.authoritativeWriteSucceeded) {
    return { status: "authoritative_failed", code: "legacy_write_failed" };
  }

  if (params.targetResolution.status === "skipped") {
    return { status: "success", shadow: "skipped" };
  }

  const mirrorHealth = deriveScenarioLabelMirrorHealth(
    params.authoritativeRaw,
    params.shadowRaw,
  );

  if (!params.shadowWriteSucceeded || mirrorHealth === "dirty") {
    return { status: "success", shadow: "dirty" };
  }

  return { status: "success", shadow: "synced" };
}

export function rawStoredTextToLegacyWriteValue(raw: RawStoredText): string | null {
  return raw.exists ? raw.value : null;
}

export function legacyWriteValueToRawStoredText(value: string | null): RawStoredText {
  return rawStoredTextFromNullable(value);
}

export function isSynchronizedAbsence(
  authoritativeRaw: RawStoredText,
  shadowRaw: RawStoredText,
): boolean {
  return (
    deriveScenarioLabelMirrorHealth(authoritativeRaw, shadowRaw) === "synced" &&
    !authoritativeRaw.exists &&
    !shadowRaw.exists
  );
}

export function isSynchronizedPresentEmpty(
  authoritativeRaw: RawStoredText,
  shadowRaw: RawStoredText,
): boolean {
  return (
    deriveScenarioLabelMirrorHealth(authoritativeRaw, shadowRaw) === "synced" &&
    authoritativeRaw.exists &&
    authoritativeRaw.value === "" &&
    shadowRaw.exists &&
    shadowRaw.value === ""
  );
}

export type ScenarioLabelShadowOutcomePlannerInput = {
  targetResolution: ScenarioLabelMigrationTargetResolution;
  authoritativeWriteSucceeded: boolean;
  shadowWriteSucceeded: boolean;
  authoritativeRaw: RawStoredText;
  shadowRaw: RawStoredText;
};

export type { ScenarioLabelShadowOutcome };
