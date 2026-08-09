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
  type ScenarioLabelMigrationTarget,
} from "./scenario-label-migration-types";

export const SCENARIO_LABEL_MIGRATION_MARKER_SEGMENT = "migration-state" as const;

export const SCENARIO_LABEL_MIGRATION_MARKER_ROOT_PREFIX =
  `${NAMESPACED_STORAGE_NAMESPACE}${NAMESPACED_STORAGE_SEPARATOR}${NAMESPACED_STORAGE_VERSION_SEGMENT}${NAMESPACED_STORAGE_SEPARATOR}${SCENARIO_LABEL_MIGRATION_MARKER_SEGMENT}${NAMESPACED_STORAGE_SEPARATOR}` as const;

export const SCENARIO_LABEL_MIGRATION_MARKER_SCOPE_LABELS = {
  unbound: "unbound",
  school: "school",
} as const;

function isSegmentEntityId(value: unknown): value is EntityId {
  return typeof value === "string" && isUuid(value) && value === normalizeUuid(value);
}

function targetTailSegments(target: ScenarioLabelMigrationTarget): readonly string[] {
  const labels = SCENARIO_LABEL_MIGRATION_MARKER_SCOPE_LABELS;
  switch (target.kind) {
    case "unbound":
      return [labels.unbound];
    case "school":
      if (!isSegmentEntityId(target.schoolId)) {
        throw new ScenarioLabelMigrationMarkerKeyError(
          "invalid_school_id",
          "schoolId must be a canonical UUID EntityId.",
        );
      }
      return [labels.school, target.schoolId];
    default: {
      const exhaustive: never = target;
      throw new ScenarioLabelMigrationMarkerKeyError(
        "invalid_target",
        `Unsupported migration target: ${JSON.stringify(exhaustive)}`,
      );
    }
  }
}

export class ScenarioLabelMigrationMarkerKeyError extends Error {
  readonly code: "invalid_school_id" | "invalid_target";

  constructor(code: "invalid_school_id" | "invalid_target", message: string) {
    super(message);
    this.name = "ScenarioLabelMigrationMarkerKeyError";
    this.code = code;
  }
}

export function serializeScenarioLabelMigrationMarkerKey(
  target: ScenarioLabelMigrationTarget,
): string {
  return [
    NAMESPACED_STORAGE_NAMESPACE,
    NAMESPACED_STORAGE_VERSION_SEGMENT,
    SCENARIO_LABEL_MIGRATION_MARKER_SEGMENT,
    SCENARIO_LABEL_MIGRATION_MODULE_ID,
    SCENARIO_LABEL_MIGRATION_RESOURCE_ID,
    ...targetTailSegments(target),
  ].join(NAMESPACED_STORAGE_SEPARATOR);
}

function parseTargetTail(rest: readonly string[]): ScenarioLabelMigrationTarget | null {
  const labels = SCENARIO_LABEL_MIGRATION_MARKER_SCOPE_LABELS;

  if (rest.length === 1 && rest[0] === labels.unbound) {
    return { kind: "unbound" };
  }

  if (rest.length === 2 && rest[0] === labels.school) {
    if (!isSegmentEntityId(rest[1])) return null;
    return { kind: "school", schoolId: rest[1] };
  }

  return null;
}

export function parseScenarioLabelMigrationMarkerKey(
  key: unknown,
): ScenarioLabelMigrationTarget | null {
  if (typeof key !== "string") return null;

  const parts = key.split(NAMESPACED_STORAGE_SEPARATOR);
  if (parts.some((segment) => segment === "")) return null;

  if (
    parts.length !== 6 &&
    parts.length !== 7
  ) {
    return null;
  }

  if (parts[0] !== NAMESPACED_STORAGE_NAMESPACE) return null;
  if (parts[1] !== NAMESPACED_STORAGE_VERSION_SEGMENT) return null;
  if (parts[2] !== SCENARIO_LABEL_MIGRATION_MARKER_SEGMENT) return null;
  if (parts[3] !== SCENARIO_LABEL_MIGRATION_MODULE_ID) return null;
  if (parts[4] !== SCENARIO_LABEL_MIGRATION_RESOURCE_ID) return null;

  return parseTargetTail(parts.slice(5));
}

export function isScenarioLabelMigrationMarkerKey(key: unknown): boolean {
  return parseScenarioLabelMigrationMarkerKey(key) !== null;
}
