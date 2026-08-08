import { APP_BACKUP_FORMAT, APP_BACKUP_SCHEMA_VERSION } from "../src/backup/restore/restore-types";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../src/data/identity/identity-registry-types";

export const RESTORE_E2E_SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
export const RESTORE_E2E_SCHOOL_B = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
export const RESTORE_E2E_YEAR_ID = "cccccccc-dddd-4eee-8fff-000000000000";
export const RESTORE_E2E_STALE_YEAR_ID = "dddddddd-eeee-4fff-8000-111111111111";
export const RESTORE_E2E_EXPORTED_AT = "2026-08-08T12:00:00.000Z";

export const RESTORE_E2E_KEYS = {
  profile: "reditelsky-pruvodce-school-profile-v1",
  identity: "reditelsky-pruvodce-identity-registry-v1",
  appContext: "reditelsky-pruvodce-app-context-v1",
  scenario: "phmax-school-scenario-label",
  calculator: "edu-cz-pv-calculator-state",
  vzMain: "vyrocni-zprava-state-v1",
  foreign: "foreign-restore-e2e-key",
} as const;

export function sampleRestoreProfile(schoolId: string, name: string) {
  return {
    id: schoolId,
    name,
    ico: "12345678",
    redIzo: "600123456",
    izo: "102345678",
    schoolType: "Základní škola",
    address: "Hlavní 1",
    municipality: "Praha",
    region: "Hlavní město Praha",
    founder: "Město",
    principalName: "Jan Novák",
    website: "https://skola.cz",
    email: "a@b.cz",
    phone: "123",
    dataBox: "abcdefg",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  };
}

export function sampleRestoreIdentity(schoolId: string, startYear?: number) {
  return {
    schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
    schoolId,
    schoolYears:
      startYear == null
        ? []
        : [{ id: RESTORE_E2E_YEAR_ID, schoolId, startYear }],
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

export function sampleRestoreVzMain(schoolYear = "2026/2027") {
  return {
    version: 1,
    report: {
      schoolYear,
      sections: [{ id: "01", title: "Základní údaje" }],
    },
    selectedSectionId: "01",
  };
}

export function modulePayload(label: string, data: unknown) {
  return {
    label,
    schemaVersion: 1,
    exportedAt: RESTORE_E2E_EXPORTED_AT,
    data,
  };
}

export type RestoreE2eBackupModules = Record<string, ReturnType<typeof modulePayload>>;

export function buildRestoreBackupEnvelope(modules: RestoreE2eBackupModules) {
  return {
    format: APP_BACKUP_FORMAT,
    schemaVersion: APP_BACKUP_SCHEMA_VERSION,
    exportedAt: RESTORE_E2E_EXPORTED_AT,
    modules,
  };
}

export function backupFilePayload(modules: RestoreE2eBackupModules) {
  return {
    name: "restore-e2e-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(buildRestoreBackupEnvelope(modules))),
  };
}

export function buildHappyPathBackupModules(): RestoreE2eBackupModules {
  return {
    "school-profile": modulePayload(
      "Profil",
      sampleRestoreProfile(RESTORE_E2E_SCHOOL_A, "ZŠ Restored B"),
    ),
    "identity-registry": modulePayload(
      "Identita",
      sampleRestoreIdentity(RESTORE_E2E_SCHOOL_A, 2026),
    ),
    "annual-report": modulePayload("VZ", { main: sampleRestoreVzMain("2026/2027") }),
    "phmax-scenario-label": modulePayload("Scénář", "Restored Scenario NEW"),
  };
}

export function buildCrossSchoolBackupModules(): RestoreE2eBackupModules {
  return {
    "school-profile": modulePayload(
      "Profil",
      sampleRestoreProfile(RESTORE_E2E_SCHOOL_B, "ZŠ School B"),
    ),
    "identity-registry": modulePayload(
      "Identita",
      sampleRestoreIdentity(RESTORE_E2E_SCHOOL_B, 2026),
    ),
    "phmax-scenario-label": modulePayload("Scénář", "School B Scenario"),
  };
}

export function buildPartialBackupModules(): RestoreE2eBackupModules {
  return {
    "identity-registry": modulePayload(
      "Identita",
      sampleRestoreIdentity(RESTORE_E2E_SCHOOL_A, 2026),
    ),
    "phmax-scenario-label": modulePayload("Scénář", "Partial Scenario NEW"),
  };
}
