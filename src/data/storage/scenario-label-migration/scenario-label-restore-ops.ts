import { PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY } from "../../../phmax-school-scenario-export";
import { parseNamespacedStorageKey } from "../namespaced-storage-address";
import {
  parseScenarioLabelMigrationMarkerKey,
  serializeScenarioLabelMigrationMarkerKey,
} from "./scenario-label-migration-marker-key";
import { serializeScenarioLabelMigrationMarkerPayload } from "./scenario-label-migration-marker-payload";
import {
  buildScenarioLabelMigrationMarkerPayload,
  buildScenarioLabelNamespacedKey,
} from "./scenario-label-migration-protocol";
import {
  SCENARIO_LABEL_MIGRATION_MODULE_ID,
  SCENARIO_LABEL_MIGRATION_RESOURCE_ID,
  type ScenarioLabelMigrationTarget,
} from "./scenario-label-migration-types";
import type { ScenarioLabelRestoreShadowPlan } from "./scenario-label-restore-target";

function targetsEqual(
  left: ScenarioLabelMigrationTarget,
  right: ScenarioLabelMigrationTarget,
): boolean {
  if (left.kind !== right.kind) return false;
  if (left.kind === "unbound") return true;
  return left.kind === "school" && right.kind === "school" && left.schoolId === right.schoolId;
}

export type ScenarioLabelRestorePhysicalOps = {
  readonly operations: Array<
    | {
        action: "set";
        key: string;
        serializedValue: string;
      }
    | {
        action: "remove";
        key: string;
      }
  >;
  readonly keySemantics: Array<{ key: string; effect: "set" | "remove" | "preserve" }>;
  readonly expectedTarget: ScenarioLabelMigrationTarget | null;
};

/**
 * Build Restore-2A physical ops for a present_valid non-empty scenario label.
 * Never calls the runtime dual-write repository.
 */
export function buildScenarioLabelRestorePhysicalOps(
  label: string,
  shadowPlan: ScenarioLabelRestoreShadowPlan,
): ScenarioLabelRestorePhysicalOps {
  const operations: ScenarioLabelRestorePhysicalOps["operations"] = [
    {
      action: "set",
      key: PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
      serializedValue: label,
    },
  ];
  const keySemantics: ScenarioLabelRestorePhysicalOps["keySemantics"] = [
    { key: PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, effect: "set" },
  ];

  if (shadowPlan.mode === "legacy_only") {
    return { operations, keySemantics, expectedTarget: null };
  }

  const target = shadowPlan.target;
  const v2Key = buildScenarioLabelNamespacedKey(target);
  const markerKey = serializeScenarioLabelMigrationMarkerKey(target);
  const markerValue = serializeScenarioLabelMigrationMarkerPayload(
    buildScenarioLabelMigrationMarkerPayload({
      mirrorHealth: "synced",
      authoritativeRaw: { exists: true, value: label },
    }),
  );

  operations.push({ action: "set", key: v2Key, serializedValue: label });
  operations.push({ action: "set", key: markerKey, serializedValue: markerValue });
  keySemantics.push({ key: v2Key, effect: "set" });
  keySemantics.push({ key: markerKey, effect: "set" });

  return { operations, keySemantics, expectedTarget: target };
}

/**
 * Plan-context-aware ownership for dynamic scenario-label v2 / marker keys.
 * Never accepts "any key under v2 root".
 */
export function isAllowedScenarioLabelRestoreDynamicKey(
  key: string,
  expectedTarget: ScenarioLabelMigrationTarget | null,
): boolean {
  if (expectedTarget == null) return false;

  const address = parseNamespacedStorageKey(key);
  if (address) {
    if (address.moduleId !== SCENARIO_LABEL_MIGRATION_MODULE_ID) return false;
    if (address.resourceId !== SCENARIO_LABEL_MIGRATION_RESOURCE_ID) return false;
    if (address.scope.kind === "schoolYear") return false;
    if (address.scope.kind === "unbound") {
      return expectedTarget.kind === "unbound";
    }
    if (address.scope.kind === "school") {
      return (
        expectedTarget.kind === "school" && expectedTarget.schoolId === address.scope.schoolId
      );
    }
    return false;
  }

  const markerTarget = parseScenarioLabelMigrationMarkerKey(key);
  if (markerTarget) {
    return targetsEqual(markerTarget, expectedTarget);
  }

  return false;
}
