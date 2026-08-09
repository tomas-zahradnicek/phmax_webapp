/**
 * N3-FENCE-PROTO — dedicated per-school protocol-commit key grammar.
 *
 * Conceptual:
 *   reditelsky-pruvodce:v2:protocol-commit:phmax-scenario-label:value:school:<canonicalUuid>
 *
 * Outside business StorageAddress grammar and outside migration-state.
 * Survives Level B / post-export / Restore scenario ops; removed by Full Reset v2-prefix clear.
 */

import type { EntityId } from "../../../domain/shared/entity-id";
import { isUuid, normalizeUuid } from "../../identity/identity-uuid";
import {
  NAMESPACED_STORAGE_NAMESPACE,
  NAMESPACED_STORAGE_SEPARATOR,
  NAMESPACED_STORAGE_VERSION_SEGMENT,
} from "../namespaced-storage-schema";
import {
  SCENARIO_LABEL_MIGRATION_MODULE_ID,
  SCENARIO_LABEL_MIGRATION_RESOURCE_ID,
} from "./scenario-label-migration-types";
import {
  SCENARIO_LABEL_N3_FENCE_SEGMENT,
  type ScenarioLabelN3FenceTarget,
} from "./scenario-label-n3-fence-types";

const SCHOOL_LABEL = "school" as const;

/** Exact segment count for a school fence key. */
export const SCENARIO_LABEL_N3_FENCE_KEY_SEGMENT_COUNT = 7 as const;

export const SCENARIO_LABEL_N3_FENCE_KEY_ROOT_PREFIX =
  `${NAMESPACED_STORAGE_NAMESPACE}${NAMESPACED_STORAGE_SEPARATOR}${NAMESPACED_STORAGE_VERSION_SEGMENT}${NAMESPACED_STORAGE_SEPARATOR}${SCENARIO_LABEL_N3_FENCE_SEGMENT}${NAMESPACED_STORAGE_SEPARATOR}` as const;

function isSegmentEntityId(value: unknown): value is EntityId {
  return typeof value === "string" && isUuid(value) && value === normalizeUuid(value);
}

export class ScenarioLabelN3FenceKeyError extends Error {
  readonly code: "invalid_school_id" | "invalid_target";

  constructor(code: "invalid_school_id" | "invalid_target", message: string) {
    super(message);
    this.name = "ScenarioLabelN3FenceKeyError";
    this.code = code;
  }
}

/**
 * Serialize the dedicated fence key for a canonical school target.
 * Rejects unbound / non-canonical IDs (throws — no silent repair).
 */
export function serializeScenarioLabelN3FenceKey(target: ScenarioLabelN3FenceTarget): string {
  if (target.kind !== "school") {
    throw new ScenarioLabelN3FenceKeyError(
      "invalid_target",
      "N3 fence key exists only for school:<canonicalId>.",
    );
  }
  if (!isSegmentEntityId(target.schoolId)) {
    throw new ScenarioLabelN3FenceKeyError(
      "invalid_school_id",
      "schoolId must be a canonical UUID EntityId.",
    );
  }

  return [
    NAMESPACED_STORAGE_NAMESPACE,
    NAMESPACED_STORAGE_VERSION_SEGMENT,
    SCENARIO_LABEL_N3_FENCE_SEGMENT,
    SCENARIO_LABEL_MIGRATION_MODULE_ID,
    SCENARIO_LABEL_MIGRATION_RESOURCE_ID,
    SCHOOL_LABEL,
    target.schoolId,
  ].join(NAMESPACED_STORAGE_SEPARATOR);
}

/**
 * Strict fence key parser.
 * Exact segment count, canonical schoolId only, no suffixes / unbound / schoolYear.
 */
export function parseScenarioLabelN3FenceKey(key: unknown): ScenarioLabelN3FenceTarget | null {
  if (typeof key !== "string") return null;

  const parts = key.split(NAMESPACED_STORAGE_SEPARATOR);
  if (parts.some((segment) => segment === "")) return null;
  if (parts.length !== SCENARIO_LABEL_N3_FENCE_KEY_SEGMENT_COUNT) return null;

  if (parts[0] !== NAMESPACED_STORAGE_NAMESPACE) return null;
  if (parts[1] !== NAMESPACED_STORAGE_VERSION_SEGMENT) return null;
  if (parts[2] !== SCENARIO_LABEL_N3_FENCE_SEGMENT) return null;
  if (parts[3] !== SCENARIO_LABEL_MIGRATION_MODULE_ID) return null;
  if (parts[4] !== SCENARIO_LABEL_MIGRATION_RESOURCE_ID) return null;
  if (parts[5] !== SCHOOL_LABEL) return null;
  if (!isSegmentEntityId(parts[6])) return null;

  return { kind: "school", schoolId: parts[6] };
}

export function isScenarioLabelN3FenceKey(key: unknown): boolean {
  return parseScenarioLabelN3FenceKey(key) !== null;
}
