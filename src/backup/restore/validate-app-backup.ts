import { getBackupModuleAdapter } from "../backup-registry";
import { parseAppBackup } from "./parse-app-backup";
import {
  RESTORE_KNOWN_MODULE_IDS,
  type RestoreKnownModuleId,
  type ValidateAppBackupResult,
  type ValidatedBackupModule,
} from "./restore-types";
import { validateKnownModuleDataForRestore } from "./restore-module-validators";

function isKnownModuleId(id: string): id is RestoreKnownModuleId {
  return (RESTORE_KNOWN_MODULE_IDS as readonly string[]).includes(id);
}

function knownModuleLabel(moduleId: RestoreKnownModuleId): string {
  return getBackupModuleAdapter(moduleId)?.label ?? moduleId;
}

/**
 * Validate parsed envelope + known module payloads for restore depth.
 * Pure — no storage I/O / writes.
 */
export function validateAppBackupEnvelope(
  input: string | unknown,
): ValidateAppBackupResult {
  const parsed = parseAppBackup(input);
  if (parsed.status !== "parsed") {
    return parsed;
  }

  const { envelope } = parsed;
  const modules: ValidatedBackupModule[] = [];
  let hasInvalidKnownModule = false;

  for (const moduleId of RESTORE_KNOWN_MODULE_IDS) {
    const payload = envelope.modules[moduleId];
    const label = knownModuleLabel(moduleId);
    if (payload == null) {
      modules.push({ status: "missing", moduleId, label });
      continue;
    }

    const expectedSchema = getBackupModuleAdapter(moduleId)?.schemaVersion ?? 1;
    if (payload.schemaVersion != null && payload.schemaVersion !== expectedSchema) {
      hasInvalidKnownModule = true;
      modules.push({
        status: "present_invalid",
        moduleId,
        label,
        reason: `unsupported_module_schema:${String(payload.schemaVersion)}`,
      });
      continue;
    }

    const validated = validateKnownModuleDataForRestore(moduleId, payload.data);
    if (!validated.ok) {
      hasInvalidKnownModule = true;
      modules.push({
        status: "present_invalid",
        moduleId,
        label,
        reason: validated.reason,
      });
      continue;
    }

    modules.push({
      status: "present_valid",
      moduleId,
      label: payload.label || label,
      schemaVersion: payload.schemaVersion ?? expectedSchema,
      exportedAt: payload.exportedAt,
      data: validated.data,
    });
  }

  for (const [moduleId, payload] of Object.entries(envelope.modules)) {
    if (isKnownModuleId(moduleId)) continue;
    modules.push({
      status: "unknown",
      moduleId,
      label: payload.label,
      warning: `Neznámý modul zálohy „${moduleId}“ bude při obnově ignorován.`,
    });
  }

  // Preserve adapter order for known modules, then unknowns.
  const knownOrder = new Map(RESTORE_KNOWN_MODULE_IDS.map((id, index) => [id, index]));
  modules.sort((a, b) => {
    const ai = isKnownModuleId(a.moduleId) ? knownOrder.get(a.moduleId)! : 1000;
    const bi = isKnownModuleId(b.moduleId) ? knownOrder.get(b.moduleId)! : 1000;
    if (ai !== bi) return ai - bi;
    return a.moduleId.localeCompare(b.moduleId);
  });

  return {
    status: "validated",
    envelope: {
      format: envelope.format,
      schemaVersion: envelope.schemaVersion,
      exportedAt: envelope.exportedAt,
      ...(envelope.appVersion !== undefined ? { appVersion: envelope.appVersion } : {}),
    },
    modules,
    hasInvalidKnownModule,
  };
}
