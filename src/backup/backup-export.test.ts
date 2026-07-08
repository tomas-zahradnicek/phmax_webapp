import { beforeEach, describe, expect, it, vi } from "vitest";
import { SCHOOL_PROFILE_LS_KEY } from "../school-profile/school-profile-constants";
import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { createDefaultAnnualReport, refreshAllSections } from "../vyrocni-zprava/vyrocni-zprava-logic";
import { VYROCNI_ZPRAVA_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-storage";
import {
  APP_BACKUP_FORMAT,
  APP_BACKUP_SCHEMA_VERSION,
} from "./backup-types";
import {
  buildAppBackupEnvelope,
  buildAppBackupFilename,
  downloadAppBackup,
  exportAppBackup,
  serializeAppBackupEnvelope,
} from "./backup-export";
import {
  listRegisteredBackupStorageKeys,
  VYROCNI_ZPRAVA_DIAGNOSTIC_BACKUP_KEY_PREFIX,
} from "./backup-registry";

const downloadTextFileMock = vi.fn();

vi.mock("../export-utils", () => ({
  downloadTextFile: (...args: unknown[]) => downloadTextFileMock(...args),
}));

function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    store,
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      for (const key of Object.keys(store)) delete store[key];
    },
    get length() {
      return Object.keys(store).length;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
  };
}

describe("backup-export", () => {
  beforeEach(() => {
    downloadTextFileMock.mockReset();
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  it("exportuje prázdnou aplikaci s validním envelope", () => {
    const result = buildAppBackupEnvelope(new Date("2026-07-08T12:00:00.000Z"));

    expect(result.envelope.format).toBe(APP_BACKUP_FORMAT);
    expect(result.envelope.schemaVersion).toBe(APP_BACKUP_SCHEMA_VERSION);
    expect(result.envelope.exportedAt).toBe("2026-07-08T12:00:00.000Z");
    expect(result.envelope.modules).toEqual({});
    expect(result.moduleStatuses.every((status) => !status.hasData)).toBe(true);
    expect(result.filename).toBe("reditelsky-pruvodce-zaloha-2026-07-08.json");
    expect(() => JSON.parse(serializeAppBackupEnvelope(result.envelope))).not.toThrow();
  });

  it("exportuje profil školy", () => {
    const profile = { ...createDefaultSchoolProfile(), name: "ZŠ E2E Test", ico: "12345678" };
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(profile));

    const result = buildAppBackupEnvelope();

    expect(result.envelope.modules["school-profile"]).toBeDefined();
    expect((result.envelope.modules["school-profile"]?.data as { name?: string }).name).toBe("ZŠ E2E Test");
    const status = result.moduleStatuses.find((item) => item.id === "school-profile");
    expect(status?.hasData).toBe(true);
  });

  it("exportuje výroční zprávu", () => {
    const profile = createDefaultSchoolProfile();
    const report = refreshAllSections({ ...createDefaultAnnualReport("2024/2025") }, profile);
    localStorage.setItem(
      VYROCNI_ZPRAVA_LS_KEY,
      JSON.stringify({
        version: 1,
        report,
        selectedSectionId: "1.1",
      }),
    );

    const result = buildAppBackupEnvelope();

    expect(result.envelope.modules["annual-report"]).toBeDefined();
    const data = result.envelope.modules["annual-report"]?.data as { main?: { version?: number } };
    expect(data.main?.version).toBe(1);
  });

  it("exportuje více modulů najednou", () => {
    const profile = { ...createDefaultSchoolProfile(), name: "Více modulů škola" };
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(profile));
    localStorage.setItem("phmax-school-scenario-label", "Testovací scénář");

    const result = buildAppBackupEnvelope();

    expect(Object.keys(result.envelope.modules).sort()).toEqual(["phmax-scenario-label", "school-profile"]);
  });

  it("nezahrnuje diagnostické klíče výroční zprávy", () => {
    localStorage.setItem(`${VYROCNI_ZPRAVA_DIAGNOSTIC_BACKUP_KEY_PREFIX}2026-07-08T10:00:00.000Z`, "{broken");
    const profile = { ...createDefaultSchoolProfile(), name: "Diagnostika test" };
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(profile));

    const result = buildAppBackupEnvelope();
    const serialized = serializeAppBackupEnvelope(result.envelope);

    expect(serialized).not.toContain(VYROCNI_ZPRAVA_DIAGNOSTIC_BACKUP_KEY_PREFIX);
    expect(Object.keys(result.envelope.modules)).toEqual(["school-profile"]);
  });

  it("neexportuje neznámé localStorage klíče automaticky", () => {
    localStorage.setItem("unknown-random-key", JSON.stringify({ secret: true }));
    localStorage.setItem("phmax-dash-role-v1", "reditel");

    const result = buildAppBackupEnvelope();
    const serialized = serializeAppBackupEnvelope(result.envelope);

    expect(serialized).not.toContain("unknown-random-key");
    expect(serialized).not.toContain("phmax-dash-role-v1");
    expect(Object.keys(result.envelope.modules)).toHaveLength(0);
  });

  it("registrované klíče pokrývají pouze explicitní moduly", () => {
    const registered = new Set(listRegisteredBackupStorageKeys());
    expect(registered.has(SCHOOL_PROFILE_LS_KEY)).toBe(true);
    expect(registered.has(VYROCNI_ZPRAVA_LS_KEY)).toBe(true);
    expect(registered.has("unknown-random-key")).toBe(false);
  });

  it("výstup je validní JSON bez funkcí", () => {
    const profile = { ...createDefaultSchoolProfile(), name: "JSON test" };
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(profile));

    const parsed = JSON.parse(serializeAppBackupEnvelope(buildAppBackupEnvelope().envelope)) as {
      format: string;
      modules: Record<string, unknown>;
    };

    expect(parsed.format).toBe(APP_BACKUP_FORMAT);
    expect(typeof parsed.modules).toBe("object");
  });

  it("export nevolá console.log s obsahem dat", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const profile = { ...createDefaultSchoolProfile(), name: "Tajný název školy", ico: "99887766" };
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(profile));

    exportAppBackup();

    for (const call of logSpy.mock.calls) {
      const joined = call.map((part) => String(part)).join(" ");
      expect(joined).not.toContain("Tajný název školy");
      expect(joined).not.toContain("99887766");
    }
    logSpy.mockRestore();
  });

  it("chyba čtení modulu nepoloží celý export", () => {
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, "{invalid-json");
    localStorage.setItem("phmax-school-scenario-label", "Scénář");

    const result = buildAppBackupEnvelope();

    const schoolStatus = result.moduleStatuses.find((item) => item.id === "school-profile");
    expect(schoolStatus?.error).toBe("invalid_json");
    expect(result.envelope.modules["school-profile"]).toBeUndefined();
    expect(result.envelope.modules["phmax-scenario-label"]).toBeDefined();
  });

  it("downloadAppBackup volá downloadTextFile s očekávaným názvem", () => {
    const envelope = buildAppBackupEnvelope(new Date("2026-07-08T15:30:00.000Z")).envelope;
    const result = downloadAppBackup(envelope);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.filename).toBe("reditelsky-pruvodce-zaloha-2026-07-08.json");
    }
    expect(downloadTextFileMock).toHaveBeenCalledTimes(1);
    expect(downloadTextFileMock.mock.calls[0]?.[0]).toBe("reditelsky-pruvodce-zaloha-2026-07-08.json");
  });

  it("buildAppBackupFilename používá lokální datum", () => {
    const noonLocal = new Date(2026, 11, 31, 12, 0, 0);
    expect(buildAppBackupFilename(noonLocal)).toBe("reditelsky-pruvodce-zaloha-2026-12-31.json");
  });
});
