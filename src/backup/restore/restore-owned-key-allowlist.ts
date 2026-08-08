import { RESTORE_KNOWN_MODULE_IDS } from "./restore-types";
import { ownedKeysForModule } from "./restore-owned-keys";

/** All keys that may appear in RestorePlan.operations (module-owned business keys). */
export function allRestoreOperationKeys(): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const moduleId of RESTORE_KNOWN_MODULE_IDS) {
    for (const key of ownedKeysForModule(moduleId)) {
      keys.add(key);
    }
  }
  return keys;
}
