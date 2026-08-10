/**
 * N3-AWARE-CORE — inert authority-aware clear dispatcher.
 *
 * Legacy: delegate current lifecycle clear semantics.
 * Namespaced: v2 remove → legacy remove → verify → schema2 marker → fence LAST.
 * No downgrade to v1. No cutover.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import { isUuid, normalizeUuid } from "../../identity/identity-uuid";
import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { serializeScenarioLabelMigrationMarkerKey } from "./scenario-label-migration-marker-key";
import { buildScenarioLabelNamespacedKey } from "./scenario-label-migration-protocol";
import {
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
  ScenarioLabelAwareClearResult,
  ScenarioLabelAwareStorage,
  ScenarioLabelRuntimeAuthorityAssessment,
} from "./scenario-label-n3-aware-types";
import {
  SCENARIO_LABEL_N3_AWARE_NO_CUTOVER,
  SCENARIO_LABEL_N3_AWARE_NO_LEGACY_TO_SCHEMA2,
  SCENARIO_LABEL_N3_AWARE_NO_NAMESPACED_LEGACY_FALLBACK,
} from "./scenario-label-n3-aware-types";
import { finalizeScenarioLabelNamespacedFenceCertificate } from "./scenario-label-n3-namespaced-fence-finalize";
import {
  clearScenarioLabelLifecycle,
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

export type ClearScenarioLabelNamespacedInput = {
  readonly storage: ScenarioLabelAwareStorage;
  readonly schoolId: EntityId;
};

/**
 * Namespaced clear: remove authoritative v2 first, then legacy mirror,
 * sync schema2 namespaced absent marker, fence LAST. Never writes v1.
 */
export function clearScenarioLabelNamespaced(
  input: ClearScenarioLabelNamespacedInput,
): ScenarioLabelAwareClearResult {
  void SCENARIO_LABEL_N3_AWARE_NO_CUTOVER;
  void SCENARIO_LABEL_N3_AWARE_NO_LEGACY_TO_SCHEMA2;
  void SCENARIO_LABEL_N3_AWARE_NO_NAMESPACED_LEGACY_FALLBACK;

  if (!isCanonicalSchoolId(input.schoolId)) {
    return { status: "blocked_authority", reason: "target_unresolved" };
  }

  const { storage, schoolId } = input;
  const absent: RawStoredText = { exists: false };

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
    return { status: "blocked_authority", reason: "concurrent_authority_change" };
  }

  const schoolTarget = { kind: "school" as const, schoolId };
  const schoolKey = buildScenarioLabelNamespacedKey(schoolTarget);
  const markerKey = serializeScenarioLabelMigrationMarkerKey(schoolTarget);

  let priorV2: RawStoredText;
  let priorLegacy: RawStoredText;
  try {
    priorV2 = readRaw(storage, schoolKey);
    priorLegacy = readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
  } catch {
    return { status: "storage_unavailable" };
  }

  const priorPresence = priorV2.exists ? "present" : "absent";
  const presenceChanging = priorPresence !== "absent";

  // 1. v2 remove authoritative
  try {
    writeRawDesired(storage, schoolKey, absent);
  } catch {
    return {
      status: "authoritative_failed",
      code: "v2_write_failed",
      legacyAdvanced: false,
    };
  }

  // 2. legacy remove mirror
  try {
    writeRawDesired(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, absent);
  } catch {
    const rolled = restoreRawExact(storage, schoolKey, priorV2);
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
      phase: "clear_mirror",
    };
  }

  // 3. verify both absent
  let postV2: RawStoredText;
  let postLegacy: RawStoredText;
  try {
    postV2 = readRaw(storage, schoolKey);
    postLegacy = readRaw(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY);
  } catch {
    restoreRawExact(storage, schoolKey, priorV2);
    restoreRawExact(storage, PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, priorLegacy);
    return { status: "storage_unavailable" };
  }

  if (
    !rawStoredTextEqual(postV2, absent) ||
    !rawStoredTextEqual(postLegacy, absent)
  ) {
    const rolledV2 = restoreRawExact(storage, schoolKey, priorV2);
    const rolledLegacy = restoreRawExact(
      storage,
      PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
      priorLegacy,
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

  // 4. schema2 namespaced marker synced/absent — never v1 downgrade
  const desiredMarker = buildScenarioLabelN3NamespacedMarker({
    mirrorHealth: "synced",
    authoritativePresence: "absent",
  });

  let markerOk = false;
  try {
    storage.setItem(markerKey, serializeScenarioLabelN3AuthorityMarker(desiredMarker));
    const back = parseScenarioLabelN3AuthorityMarkerJson(storage.getItem(markerKey));
    markerOk =
      back.status === "valid" &&
      isScenarioLabelN3NamespacedMarker(back.payload) &&
      back.payload.authoritativePresence === "absent" &&
      back.payload.mirrorHealth === "synced";
  } catch {
    markerOk = false;
  }

  if (!markerOk) {
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

  // 5. namespaced fence LAST
  const fenceResult = finalizeScenarioLabelNamespacedFenceCertificate({
    storage,
    schoolId,
  });

  if (fenceResult.status === "committed" || fenceResult.status === "already_committed") {
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

  if (fenceResult.status === "incomplete") {
    return {
      status: "fence_incomplete",
      reason: "fence_write_failed",
      dataSettled: true,
    };
  }
  if (fenceResult.status === "verify_failed") {
    return {
      status: "fence_incomplete",
      reason:
        fenceResult.reason === "read_back_malformed"
          ? "read_back_malformed"
          : "assessment_not_namespaced_committed",
      dataSettled: true,
    };
  }
  if (fenceResult.status === "concurrent_drift") {
    return {
      status: "fence_incomplete",
      reason: "concurrent_drift",
      dataSettled: true,
    };
  }
  if (fenceResult.status === "storage_unavailable") {
    return {
      status: "fence_incomplete",
      reason: "storage_unavailable",
      dataSettled: true,
    };
  }

  return {
    status: "fence_incomplete",
    reason: "assessment_not_namespaced_committed",
    dataSettled: true,
  };
}

export type ClearScenarioLabelAwareLogicalInput = {
  readonly storage: ScenarioLabelAwareStorage;
  readonly schoolId: EntityId | null;
  readonly readIdentity?: ScenarioLabelRepositoryDependencies["readIdentity"];
};

/**
 * Authority-aware clear dispatcher.
 * AUTHORITY_BLOCKED → blocked, 0 business writes.
 */
export function clearScenarioLabelAwareLogical(
  input: ClearScenarioLabelAwareLogicalInput,
): ScenarioLabelAwareClearResult {
  void SCENARIO_LABEL_N3_AWARE_NO_CUTOVER;

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
      return clearScenarioLabelNamespaced({
        storage: input.storage,
        schoolId: input.schoolId,
      });
    }

    case "UNBOUND":
    case "LEGACY_READY":
    case "LEGACY_COMPAT_UNPREPARED":
    case "LEGACY_VIOLATED_RECOVERABLE": {
      const deps: ScenarioLabelRepositoryDependencies = {
        storage: input.storage as ScenarioLabelStorage,
        readIdentity: input.readIdentity,
      };
      const legacy = clearScenarioLabelLifecycle(deps);
      if (legacy.status === "authoritative_failed") {
        return {
          status: "authoritative_failed",
          code:
            legacy.code === "storage_unavailable"
              ? "storage_unavailable"
              : "legacy_write_failed",
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
