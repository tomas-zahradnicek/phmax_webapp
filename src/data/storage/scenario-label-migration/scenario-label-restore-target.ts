import type { EntityId } from "../../../domain/shared/entity-id";
import type { IdentityRegistry } from "../../identity/identity-registry-types";
import { isUuid, normalizeUuid } from "../../identity/identity-uuid";
import type { ScenarioLabelMigrationTarget } from "./scenario-label-migration-types";

function isCanonicalEntityId(value: unknown): value is EntityId {
  return typeof value === "string" && isUuid(value) && value === normalizeUuid(value);
}

/**
 * Plan-time Restore target for scenario-label shadow + marker ops.
 *
 * Resolves the POST-RESTORE authoritative dataset — not local pre-apply Identity alone.
 *
 * - `target` set → legacy + v2 + marker ops for that physical target
 * - `target: null` → legacy-only (non-deterministic post-reconcile schoolId)
 *
 * Runtime Profile fallback remains forbidden; Profile.id is Restore-plan context only.
 */
export type ScenarioLabelRestoreShadowPlan =
  | { readonly mode: "shadow"; readonly target: ScenarioLabelMigrationTarget }
  | { readonly mode: "legacy_only" };

export function resolveScenarioLabelRestoreShadowPlan(params: {
  backupIdentity: IdentityRegistry | null;
  identityModuleStatus: "missing" | "present_valid" | "present_invalid";
  backupProfileId: string | null;
}): ScenarioLabelRestoreShadowPlan {
  if (params.identityModuleStatus === "present_valid" && params.backupIdentity) {
    const schoolId = params.backupIdentity.schoolId;
    if (isCanonicalEntityId(schoolId)) {
      return { mode: "shadow", target: { kind: "school", schoolId } };
    }
    // Non-canonical backup Identity should already fail validation; fail closed to legacy-only.
    return { mode: "legacy_only" };
  }

  // No Identity in backup — Profile-only legacy bootstrap path.
  if (params.backupProfileId != null) {
    if (isCanonicalEntityId(params.backupProfileId)) {
      return {
        mode: "shadow",
        target: { kind: "school", schoolId: params.backupProfileId },
      };
    }
    // Non-UUID Profile.id → ensureSchool creates a new UUID at reconcile time.
    // Do not write unbound (orphan risk) and do not invent schoolId.
    return { mode: "legacy_only" };
  }

  // Business-only / scenario-only → unbound.
  return { mode: "shadow", target: { kind: "unbound" } };
}
