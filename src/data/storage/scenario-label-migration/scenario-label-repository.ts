import type { EntityId } from "../../../domain/shared/entity-id";
import {
  readIdentityRegistry,
  readIdentityRegistryFromStorage,
} from "../../identity/identity-registry-storage";
import type { IdentityRegistryReadResult } from "../../identity/identity-registry-types";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import {
  serializeScenarioLabelMigrationMarkerKey,
} from "./scenario-label-migration-marker-key";
import {
  serializeScenarioLabelMigrationMarkerPayload,
} from "./scenario-label-migration-marker-payload";
import {
  buildScenarioLabelMigrationMarkerPayload,
  buildScenarioLabelNamespacedKey,
  planScenarioLabelShadowOutcome,
} from "./scenario-label-migration-protocol";
import { rawStoredTextEqual, rawStoredTextFromNullable } from "./scenario-label-migration-raw";
import { resolveScenarioLabelMigrationTarget } from "./scenario-label-migration-target";
import type {
  RawStoredText,
  ScenarioLabelFenceWriteOutcome,
  ScenarioLabelMigrationTarget,
  ScenarioLabelWriteResult,
} from "./scenario-label-migration-types";
import { finalizeScenarioLabelLegacyFenceCertificate } from "./scenario-label-n3-fence-finalize";
import type { ScenarioLabelFenceFinalizeResult } from "./scenario-label-n3-fence-finalize";

/** Minimal storage surface used by the N2 scenario-label executor. */
export type ScenarioLabelStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type ScenarioLabelRepositoryDependencies = {
  storage?: ScenarioLabelStorage;
  readIdentity?: () => IdentityRegistryReadResult;
};

function resolveStorage(deps: ScenarioLabelRepositoryDependencies): ScenarioLabelStorage | null {
  if (deps.storage) return deps.storage;
  try {
    if (typeof localStorage === "undefined" || localStorage == null) return null;
    return localStorage;
  } catch {
    return null;
  }
}

function resolveReadIdentity(
  storage: ScenarioLabelStorage,
  deps: ScenarioLabelRepositoryDependencies,
): () => IdentityRegistryReadResult {
  if (deps.readIdentity) return deps.readIdentity;
  // Align Identity with the same destination storage used for scenario writes.
  if (deps.storage) {
    return () => readIdentityRegistryFromStorage(storage);
  }
  return readIdentityRegistry;
}

function readRaw(storage: ScenarioLabelStorage, key: string): RawStoredText {
  try {
    return rawStoredTextFromNullable(storage.getItem(key));
  } catch {
    throw new Error("storage_read_failed");
  }
}

function writeRawDesired(storage: ScenarioLabelStorage, key: string, desired: RawStoredText): void {
  if (desired.exists) {
    storage.setItem(key, desired.value);
  } else {
    storage.removeItem(key);
  }
}

/** Best-effort marker removal so a prior synced marker cannot outlive a new authoritative write. */
function invalidateMarkerBestEffort(
  storage: ScenarioLabelStorage,
  target: ScenarioLabelMigrationTarget,
): boolean {
  try {
    const key = serializeScenarioLabelMigrationMarkerKey(target);
    storage.removeItem(key);
    return storage.getItem(key) == null;
  } catch {
    return false;
  }
}

function persistMarker(
  storage: ScenarioLabelStorage,
  target: ScenarioLabelMigrationTarget,
  mirrorHealth: "synced" | "dirty",
  authoritativeRaw: RawStoredText,
): boolean {
  try {
    const key = serializeScenarioLabelMigrationMarkerKey(target);
    const payload = buildScenarioLabelMigrationMarkerPayload({
      mirrorHealth,
      authoritativeRaw,
    });
    storage.setItem(key, serializeScenarioLabelMigrationMarkerPayload(payload));
    return true;
  } catch {
    return false;
  }
}

function mapFenceFinalizeResult(
  result: ScenarioLabelFenceFinalizeResult,
): ScenarioLabelFenceWriteOutcome {
  switch (result.status) {
    case "already_committed":
      return "already_committed";
    case "committed":
      return "committed";
    case "skipped":
      return "skipped";
    case "not_certifiable":
      return "not_certifiable";
    case "incomplete":
      return "incomplete";
    case "verify_failed":
      return "verify_failed";
    case "concurrent_drift":
      return "concurrent_drift";
    case "storage_unavailable":
      return "storage_unavailable";
    default: {
      const exhaustive: never = result;
      void exhaustive;
      return "incomplete";
    }
  }
}

/**
 * Soft fence finalization after a school-synced mutation.
 * Fence failure never overturns business success.
 */
function finalizeSchoolFenceSoft(
  storage: ScenarioLabelStorage,
  schoolId: EntityId,
): ScenarioLabelFenceWriteOutcome {
  try {
    return mapFenceFinalizeResult(
      finalizeScenarioLabelLegacyFenceCertificate({ storage, schoolId }),
    );
  } catch {
    return "incomplete";
  }
}

function applyShadowPipeline(
  storage: ScenarioLabelStorage,
  target: ScenarioLabelMigrationTarget,
  desiredRaw: RawStoredText,
): {
  shadowWriteSucceeded: boolean;
  shadowRaw: RawStoredText;
  markerPersisted: boolean;
  markerInvalidationSucceeded: boolean;
} {
  // Invalidate any prior healthy marker before mutating shadow for this target.
  const markerInvalidationSucceeded = invalidateMarkerBestEffort(storage, target);

  const shadowKey = buildScenarioLabelNamespacedKey(target);
  let shadowWriteSucceeded = false;
  try {
    writeRawDesired(storage, shadowKey, desiredRaw);
    shadowWriteSucceeded = true;
  } catch {
    shadowWriteSucceeded = false;
  }

  let shadowRaw: RawStoredText = { exists: false };
  try {
    shadowRaw = readRaw(storage, shadowKey);
  } catch {
    shadowWriteSucceeded = false;
    shadowRaw = { exists: false };
  }

  const verified =
    shadowWriteSucceeded && rawStoredTextEqual(desiredRaw, shadowRaw);

  if (!verified) {
    // Ensure a stale synced marker cannot claim health for the new authoritative value.
    invalidateMarkerBestEffort(storage, target);
    // Fail-closed metadata: PROTO-compatible dirty marker (best-effort).
    persistMarker(storage, target, "dirty", desiredRaw);
    return {
      shadowWriteSucceeded: false,
      shadowRaw,
      markerPersisted: false,
      markerInvalidationSucceeded,
    };
  }

  // Invalidation may have failed, but a fresh synced overwrite after verify re-establishes health.
  const markerPersisted = persistMarker(storage, target, "synced", desiredRaw);
  return {
    shadowWriteSucceeded: true,
    shadowRaw,
    markerPersisted,
    markerInvalidationSucceeded,
  };
}

/**
 * Raw legacy read (`getItem` semantics). Missing → `{ exists: false }`.
 * Never reads v2. Never writes.
 */
export function readScenarioLabelRaw(
  deps: ScenarioLabelRepositoryDependencies = {},
): RawStoredText {
  const storage = resolveStorage(deps);
  if (storage == null) return { exists: false };
  try {
    return readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
  } catch {
    return { exists: false };
  }
}

/**
 * UI-facing legacy read: trim; missing/blank → `""`.
 * Never reads v2. Never writes.
 */
export function readScenarioLabelUi(deps: ScenarioLabelRepositoryDependencies = {}): string {
  const raw = readScenarioLabelRaw(deps);
  if (!raw.exists) return "";
  return raw.value.trim();
}

/**
 * Legacy-first dual-write for exact desired raw state.
 *
 * Shadow failure / marker failure never overturns an authoritative legacy success.
 * Legacy write success is determined by storage API throw only — not post-write equality
 * (concurrent tabs may overwrite between write and a later observation).
 */
export function writeScenarioLabelRaw(
  desiredRaw: RawStoredText,
  deps: ScenarioLabelRepositoryDependencies = {},
): ScenarioLabelWriteResult {
  const storage = resolveStorage(deps);
  if (storage == null) {
    return { status: "authoritative_failed", code: "storage_unavailable" };
  }

  try {
    writeRawDesired(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, desiredRaw);
  } catch {
    return { status: "authoritative_failed", code: "legacy_write_failed" };
  }

  const readIdentity = resolveReadIdentity(storage, deps);
  const targetResolution = resolveScenarioLabelMigrationTarget(readIdentity());

  if (targetResolution.status === "skipped") {
    const planned = planScenarioLabelShadowOutcome({
      targetResolution,
      authoritativeWriteSucceeded: true,
      shadowWriteSucceeded: false,
      authoritativeRaw: desiredRaw,
      shadowRaw: { exists: false },
    });
    return planned.status === "success"
      ? { ...planned, fence: "skipped" }
      : planned;
  }

  const shadow = applyShadowPipeline(storage, targetResolution.target, desiredRaw);

  const planned = planScenarioLabelShadowOutcome({
    targetResolution,
    authoritativeWriteSucceeded: true,
    shadowWriteSucceeded: shadow.shadowWriteSucceeded,
    authoritativeRaw: desiredRaw,
    shadowRaw: shadow.shadowRaw,
  });

  // Marker persist failure after verified shadow → still success + synced
  // (PROTO: shadow synced = data mirror health; marker missing remains N3 fail-closed).
  // Fence LAST only when school target + shadow synced (marker may still be incomplete → not_certifiable).
  if (
    planned.status === "success" &&
    planned.shadow === "synced" &&
    targetResolution.target.kind === "school"
  ) {
    const fence = finalizeSchoolFenceSoft(storage, targetResolution.target.schoolId);
    return { ...planned, fence };
  }

  if (planned.status === "success" && targetResolution.target.kind === "unbound") {
    return { ...planned, fence: "skipped" };
  }

  if (planned.status === "success" && planned.shadow !== "synced") {
    return { ...planned, fence: "not_certifiable" };
  }

  return planned;
}

/**
 * Dashboard/handoff UI write: trim; non-empty → present text; empty → clear (remove).
 * Never persists present-empty `""`.
 */
export function writeScenarioLabelFromUiInput(
  label: string,
  deps: ScenarioLabelRepositoryDependencies = {},
): ScenarioLabelWriteResult {
  const trimmed = label.trim();
  const desired: RawStoredText = trimmed
    ? { exists: true, value: trimmed }
    : { exists: false };
  return writeScenarioLabelRaw(desired, deps);
}

/**
 * Compatibility adapter for call sites that previously let `setItem` throw.
 * Throws only on authoritative legacy failure. Shadow dirty/skipped never throw.
 */
export function writeScenarioLabelFromUiInputOrThrow(
  label: string,
  deps: ScenarioLabelRepositoryDependencies = {},
): ScenarioLabelWriteResult {
  const result = writeScenarioLabelFromUiInput(label, deps);
  if (result.status === "authoritative_failed") {
    throw new Error(
      result.code === "storage_unavailable"
        ? "localStorage není k dispozici."
        : "Uložení názvu scénáře se nezdařilo.",
    );
  }
  return result;
}

/**
 * Clear authoritative legacy label (+ resolved shadow when possible).
 * Prefer {@link clearScenarioLabelLifecycle} for Level B / post-export.
 */
export function clearScenarioLabel(
  deps: ScenarioLabelRepositoryDependencies = {},
): ScenarioLabelWriteResult {
  return writeScenarioLabelRaw({ exists: false }, deps);
}

function clearOneTargetShadow(
  storage: ScenarioLabelStorage,
  target: ScenarioLabelMigrationTarget,
): "synced" | "dirty" {
  const result = applyShadowPipeline(storage, target, { exists: false });
  if (!result.shadowWriteSucceeded) return "dirty";
  // applyShadowPipeline persists synced+absent marker on verified clear.
  return "synced";
}

/**
 * Lifecycle clear for Level B / post-export:
 * - authoritative legacy remove
 * - always clear unbound shadow (+ synced absent marker)
 * - if Identity valid → also clear school shadow (+ synced absent marker)
 * - corrupted/unavailable Identity → school target skipped
 *
 * Does not scan arbitrary school UUID keys.
 */
export function clearScenarioLabelLifecycle(
  deps: ScenarioLabelRepositoryDependencies = {},
): ScenarioLabelWriteResult {
  const storage = resolveStorage(deps);
  if (storage == null) {
    return { status: "authoritative_failed", code: "storage_unavailable" };
  }

  try {
    storage.removeItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
  } catch {
    return { status: "authoritative_failed", code: "legacy_write_failed" };
  }

  // H4: successful removeItem without throw is authoritative clear success.
  // Do not treat a concurrent re-write as legacy_write_failed.

  const unboundOutcome = clearOneTargetShadow(storage, { kind: "unbound" });

  const readIdentity = resolveReadIdentity(storage, deps);
  const targetResolution = resolveScenarioLabelMigrationTarget(readIdentity());

  if (targetResolution.status === "skipped") {
    return {
      status: "success",
      shadow: unboundOutcome === "synced" ? "skipped" : "dirty",
      fence: "skipped",
    };
  }

  if (targetResolution.target.kind === "unbound") {
    return { status: "success", shadow: unboundOutcome, fence: "skipped" };
  }

  const schoolOutcome = clearOneTargetShadow(storage, targetResolution.target);
  if (unboundOutcome === "dirty" || schoolOutcome === "dirty") {
    return { status: "success", shadow: "dirty", fence: "not_certifiable" };
  }

  const fence = finalizeSchoolFenceSoft(storage, targetResolution.target.schoolId);
  return { status: "success", shadow: "synced", fence };
}
