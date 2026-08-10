/**
 * N3-AWARE-CORE — inert namespaced writer + logical write dispatcher.
 *
 * Namespaced executor preserves already-namespaced authority only.
 * No cutover. No legacy→schema2. No fallback to legacy writer.
 * Fresh authority gate immediately before mutation.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import { isUuid, normalizeUuid } from "../../identity/identity-uuid";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import {
  authoritativePresenceFromRaw,
  rawStoredTextEqual,
  rawStoredTextFromNullable,
} from "./scenario-label-migration-raw";
import type { RawStoredText } from "./scenario-label-migration-types";
import {
  buildScenarioLabelN3NamespacedMarker,
  isScenarioLabelN3NamespacedMarker,
  parseScenarioLabelN3AuthorityMarkerJson,
  serializeScenarioLabelN3AuthorityMarker,
} from "./scenario-label-n3-authority-marker";
import { assessScenarioLabelRuntimeAuthority } from "./scenario-label-n3-aware-assessment";
import type {
  ScenarioLabelAwareStorage,
  ScenarioLabelAwareWriteResult,
  ScenarioLabelRuntimeAuthorityAssessment,
} from "./scenario-label-n3-aware-types";
import {
  SCENARIO_LABEL_N3_AWARE_NO_CUTOVER,
  SCENARIO_LABEL_N3_AWARE_NO_LEGACY_TO_SCHEMA2,
  SCENARIO_LABEL_N3_AWARE_NO_NAMESPACED_LEGACY_FALLBACK,
} from "./scenario-label-n3-aware-types";
import { serializeScenarioLabelN3FenceKey } from "./scenario-label-n3-fence-key";
import { finalizeScenarioLabelNamespacedFenceCertificate } from "./scenario-label-n3-namespaced-fence-finalize";
import {
  writeScenarioLabelRaw,
  type ScenarioLabelRepositoryDependencies,
  type ScenarioLabelStorage,
} from "./scenario-label-repository";

function isCanonicalSchoolId(value: unknown): value is EntityId {
  return typeof value === "string" && isUuid(value) && value === normalizeUuid(value);
}

function readRaw(storage: ScenarioLabelAwareStorage, key: string): RawStoredText {
  return rawStoredTextFromNullable(storage.getItem(key));
}

function writeRawDesired(
  storage: ScenarioLabelAwareStorage,
  key: string,
  desired: RawStoredText,
): void {
  if (desired.exists) {
    storage.setItem(key, desired.value);
  } else {
    storage.removeItem(key);
  }
}

function restoreRawExact(
  storage: ScenarioLabelAwareStorage,
  key: string,
  prior: RawStoredText,
): boolean {
  try {
    writeRawDesired(storage, key, prior);
    return true;
  } catch {
    return false;
  }
}

export type WriteScenarioLabelNamespacedInput = {
  readonly storage: ScenarioLabelAwareStorage;
  readonly schoolId: EntityId;
  readonly desiredRaw: RawStoredText;
};

type NamespacedSnapshot = {
  readonly schoolV2: RawStoredText;
  readonly legacy: RawStoredText;
  readonly markerJson: string | null;
  readonly fenceJson: string | null;
};

function takeSnapshot(
  storage: ScenarioLabelAwareStorage,
  schoolId: EntityId,
): NamespacedSnapshot {
  const schoolTarget = { kind: "school" as const, schoolId };
  const schoolKey = buildScenarioLabelNamespacedKey(schoolTarget);
  const markerKey = serializeScenarioLabelMigrationMarkerKey(schoolTarget);
  const fenceKey = serializeScenarioLabelN3FenceKey(schoolTarget);
  return {
    schoolV2: readRaw(storage, schoolKey),
    legacy: readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY),
    markerJson: storage.getItem(markerKey),
    fenceJson: storage.getItem(fenceKey),
  };
}

function mapFenceFinalizeToIncomplete(
  reason:
    | "fence_write_failed"
    | "read_back_malformed"
    | "assessment_not_namespaced_committed"
    | "concurrent_drift"
    | "storage_unavailable"
    | "not_certifiable",
): ScenarioLabelAwareWriteResult {
  if (reason === "not_certifiable") {
    return {
      status: "fence_incomplete",
      reason: "assessment_not_namespaced_committed",
      dataSettled: true,
    };
  }
  return {
    status: "fence_incomplete",
    reason:
      reason === "fence_write_failed"
        ? "fence_write_failed"
        : reason === "read_back_malformed"
          ? "read_back_malformed"
          : reason === "concurrent_drift"
            ? "concurrent_drift"
            : reason === "storage_unavailable"
              ? "storage_unavailable"
              : "assessment_not_namespaced_committed",
    dataSettled: true,
  };
}

/**
 * Dedicated namespaced writer for already-namespaced authority.
 * Order: gate → snapshot → v2 → legacy mirror → verify → schema2 marker → fence LAST.
 */
export function writeScenarioLabelNamespacedRaw(
  input: WriteScenarioLabelNamespacedInput,
): ScenarioLabelAwareWriteResult {
  void SCENARIO_LABEL_N3_AWARE_NO_CUTOVER;
  void SCENARIO_LABEL_N3_AWARE_NO_LEGACY_TO_SCHEMA2;
  void SCENARIO_LABEL_N3_AWARE_NO_NAMESPACED_LEGACY_FALLBACK;

  if (!isCanonicalSchoolId(input.schoolId)) {
    return {
      status: "blocked_authority",
      reason: "target_unresolved",
    };
  }

  const { storage, schoolId, desiredRaw } = input;

  // 1. Fresh authority gate — no stale UI token.
  let assessment: ScenarioLabelRuntimeAuthorityAssessment;
  try {
    assessment = assessScenarioLabelRuntimeAuthority({ storage, schoolId });
  } catch {
    return { status: "storage_unavailable" };
  }

  if (assessment.kind === "STORAGE_UNAVAILABLE") {
    return { status: "storage_unavailable" };
  }
  if (assessment.kind === "AUTHORITY_BLOCKED") {
    return { status: "blocked_authority", reason: assessment.reason };
  }
  if (
    assessment.kind !== "NAMESPACED_READY" &&
    assessment.kind !== "NAMESPACED_DEGRADED"
  ) {
    // Never legacy → schema2. Never cutover from this executor.
    return {
      status: "blocked_authority",
      reason: "concurrent_authority_change",
    };
  }

  const schoolTarget = { kind: "school" as const, schoolId };
  const schoolKey = buildScenarioLabelNamespacedKey(schoolTarget);
  const markerKey = serializeScenarioLabelMigrationMarkerKey(schoolTarget);

  // 2. Raw snapshot
  let snapshot: NamespacedSnapshot;
  try {
    snapshot = takeSnapshot(storage, schoolId);
  } catch {
    return { status: "storage_unavailable" };
  }

  const priorPresence = authoritativePresenceFromRaw(snapshot.schoolV2);
  const desiredPresence = authoritativePresenceFromRaw(desiredRaw);
  const presenceChanging = priorPresence !== desiredPresence;

  // 3. Write school-v2 authoritative
  try {
    writeRawDesired(storage, schoolKey, desiredRaw);
  } catch {
    // Legacy MUST remain unchanged.
    return {
      status: "authoritative_failed",
      code: "v2_write_failed",
      legacyAdvanced: false,
    };
  }

  // 4. Write legacy compatibility mirror
  try {
    writeRawDesired(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, desiredRaw);
  } catch {
    // 5-path: rollback v2 to exact prior RawStoredText
    const rolled = restoreRawExact(storage, schoolKey, snapshot.schoolV2);
    if (rolled) {
      return {
        status: "rollback_succeeded",
        business: "failed",
        phase: "legacy_mirror",
      };
    }
    return {
      status: "fatal_partial",
      reason: "rollback_failed_after_partial_write",
      phase: "legacy_mirror",
    };
  }

  // 5. Fresh verify: legacy == v2 == desired
  let postV2: RawStoredText;
  let postLegacy: RawStoredText;
  try {
    postV2 = readRaw(storage, schoolKey);
    postLegacy = readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
  } catch {
    const rolled = restoreRawExact(storage, schoolKey, snapshot.schoolV2);
    restoreRawExact(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, snapshot.legacy);
    if (!rolled) {
      return {
        status: "fatal_partial",
        reason: "rollback_failed_after_partial_write",
        phase: "verify",
      };
    }
    return { status: "storage_unavailable" };
  }

  if (
    !rawStoredTextEqual(postV2, desiredRaw) ||
    !rawStoredTextEqual(postLegacy, desiredRaw)
  ) {
    // Concurrent mirror overwrite / drift — rollback both to snapshot.
    const rolledV2 = restoreRawExact(storage, schoolKey, snapshot.schoolV2);
    const rolledLegacy = restoreRawExact(
      storage,
      PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
      snapshot.legacy,
    );
    if (rolledV2 && rolledLegacy) {
      return {
        status: "rollback_succeeded",
        business: "failed",
        phase: "verify",
      };
    }
    return {
      status: "fatal_partial",
      reason: "rollback_failed_after_partial_write",
      phase: "verify",
    };
  }

  // 6. Write schemaVersion:2 / authority:"namespaced" marker (preservation only)
  const desiredMarker = buildScenarioLabelN3NamespacedMarker({
    mirrorHealth: "synced",
    authoritativePresence: desiredPresence,
  });

  let markerWriteOk = false;
  try {
    storage.setItem(markerKey, serializeScenarioLabelN3AuthorityMarker(desiredMarker));
    markerWriteOk = true;
  } catch {
    markerWriteOk = false;
  }

  // 7. Read marker back and strict parse
  let markerReadBackOk = false;
  if (markerWriteOk) {
    try {
      const back = parseScenarioLabelN3AuthorityMarkerJson(storage.getItem(markerKey));
      markerReadBackOk =
        back.status === "valid" &&
        isScenarioLabelN3NamespacedMarker(back.payload) &&
        back.payload.mirrorHealth === "synced" &&
        back.payload.authoritativePresence === desiredPresence;
    } catch {
      markerReadBackOk = false;
    }
  }

  if (!markerWriteOk || !markerReadBackOk) {
    // N3-PROTO policy: value-only vs presence transition.
    if (presenceChanging) {
      return {
        status: "marker_incomplete",
        kind: "presence_change",
        business: "failed_conservative",
      };
    }
    return {
      status: "marker_incomplete",
      kind: "value_only",
      business: "data_ok_metadata_incomplete",
    };
  }

  // 8. Finalize namespaced fence LAST
  const fenceResult = finalizeScenarioLabelNamespacedFenceCertificate({
    storage,
    schoolId,
  });

  if (fenceResult.status === "committed" || fenceResult.status === "already_committed") {
    // 9. Full fresh assessment must be NAMESPACED_READY
    const post = assessScenarioLabelRuntimeAuthority({ storage, schoolId });
    if (post.kind === "NAMESPACED_READY") {
      return {
        status: "success",
        authority: "namespaced",
        fence: fenceResult.status === "committed" ? "committed" : "already_committed",
      };
    }
    return {
      status: "fence_incomplete",
      reason: "assessment_not_namespaced_committed",
      dataSettled: true,
    };
  }

  // Fence failure: DO NOT roll back entire value tuple.
  // Data settled but NOT safely committed.
  if (fenceResult.status === "incomplete") {
    return mapFenceFinalizeToIncomplete("fence_write_failed");
  }
  if (fenceResult.status === "verify_failed") {
    return mapFenceFinalizeToIncomplete(
      fenceResult.reason === "read_back_malformed"
        ? "read_back_malformed"
        : "assessment_not_namespaced_committed",
    );
  }
  if (fenceResult.status === "concurrent_drift") {
    return mapFenceFinalizeToIncomplete("concurrent_drift");
  }
  if (fenceResult.status === "storage_unavailable") {
    return mapFenceFinalizeToIncomplete("storage_unavailable");
  }
  if (fenceResult.status === "not_certifiable" || fenceResult.status === "skipped") {
    return mapFenceFinalizeToIncomplete("not_certifiable");
  }

  return mapFenceFinalizeToIncomplete("assessment_not_namespaced_committed");
}

export type WriteScenarioLabelAwareLogicalInput = {
  readonly storage: ScenarioLabelAwareStorage;
  readonly schoolId: EntityId | null;
  readonly desiredRaw: RawStoredText;
  /** Optional Identity DI for legacy repository path (same storage). */
  readonly readIdentity?: ScenarioLabelRepositoryDependencies["readIdentity"];
};

/**
 * Inert logical write dispatcher.
 * Fresh authority assessment immediately before mutation.
 * Never: legacy state + "eligible" → namespaced writer.
 */
export function writeScenarioLabelAwareLogical(
  input: WriteScenarioLabelAwareLogicalInput,
): ScenarioLabelAwareWriteResult {
  void SCENARIO_LABEL_N3_AWARE_NO_CUTOVER;
  void SCENARIO_LABEL_N3_AWARE_NO_LEGACY_TO_SCHEMA2;

  const assessment = assessScenarioLabelRuntimeAuthority({
    storage: input.storage,
    schoolId: input.schoolId,
  });

  switch (assessment.kind) {
    case "STORAGE_UNAVAILABLE":
      return { status: "storage_unavailable" };

    case "AUTHORITY_BLOCKED":
      return { status: "blocked_authority", reason: assessment.reason };

    case "NAMESPACED_READY":
    case "NAMESPACED_DEGRADED": {
      if (input.schoolId == null || !isCanonicalSchoolId(input.schoolId)) {
        return { status: "blocked_authority", reason: "target_unresolved" };
      }
      return writeScenarioLabelNamespacedRaw({
        storage: input.storage,
        schoolId: input.schoolId,
        desiredRaw: input.desiredRaw,
      });
    }

    case "UNBOUND":
    case "LEGACY_READY":
    case "LEGACY_COMPAT_UNPREPARED":
    case "LEGACY_VIOLATED_RECOVERABLE": {
      // Legacy writer semantics — never namespaced / never cutover.
      const deps: ScenarioLabelRepositoryDependencies = {
        storage: input.storage as ScenarioLabelStorage,
        readIdentity: input.readIdentity,
      };
      const legacy = writeScenarioLabelRaw(input.desiredRaw, deps);
      if (legacy.status === "authoritative_failed") {
        return {
          status: "authoritative_failed",
          code: legacy.code === "storage_unavailable" ? "storage_unavailable" : "legacy_write_failed",
          legacyAdvanced: false,
        };
      }
      return {
        status: "success",
        authority: "legacy",
        fence:
          legacy.fence === "committed" || legacy.fence === "already_committed"
            ? legacy.fence
            : undefined,
      };
    }

    default: {
      const _exhaustive: never = assessment;
      void _exhaustive;
      return { status: "blocked_authority", reason: "winner_unprovable" };
    }
  }
}
