import type { EntityId } from "../../../domain/shared/entity-id";
import type { IdentityRegistryReadResult } from "../../identity/identity-registry-types";
import { isUuid, normalizeUuid } from "../../identity/identity-uuid";
import type {
  ScenarioLabelMigrationTarget,
  ScenarioLabelMigrationTargetResolution,
} from "./scenario-label-migration-types";

function isCanonicalEntityId(value: unknown): value is EntityId {
  return typeof value === "string" && isUuid(value) && value === normalizeUuid(value);
}

/**
 * Pure target resolution from an already-read Identity Registry result.
 *
 * Never reads storage, never bootstraps Identity, and never falls back to
 * profile identifiers.
 */
export function resolveScenarioLabelMigrationTarget(
  identity: IdentityRegistryReadResult,
): ScenarioLabelMigrationTargetResolution {
  if (!identity.ok) {
    return {
      status: "skipped",
      reason: identity.code,
    };
  }

  if (identity.registry == null) {
    return {
      status: "resolved",
      target: { kind: "unbound" },
    };
  }

  const schoolId = identity.registry.schoolId;
  if (!isCanonicalEntityId(schoolId)) {
    return {
      status: "skipped",
      reason: "corrupted",
    };
  }

  return {
    status: "resolved",
    target: { kind: "school", schoolId },
  };
}

export function isScenarioLabelMigrationTarget(
  value: unknown,
): value is ScenarioLabelMigrationTarget {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as ScenarioLabelMigrationTarget;
  if (candidate.kind === "unbound") return true;
  if (candidate.kind === "school") {
    return isCanonicalEntityId(candidate.schoolId);
  }
  return false;
}
