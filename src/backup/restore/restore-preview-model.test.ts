import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IDENTITY_REGISTRY_SCHEMA_VERSION } from "../../data/identity/identity-registry-types";
import {
  APP_BACKUP_FORMAT,
  APP_BACKUP_SCHEMA_VERSION,
  RESTORE_KNOWN_MODULE_IDS,
  RESTORE_UI_MODULE_LABELS,
  buildRestorePreviewFromBackupText,
  buildRestorePreviewModel,
  buildAppBackupRestorePlan,
  validateAppBackupEnvelope,
  type RestoreEnvironment,
} from "./index";

const SCHOOL_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const SCHOOL_B = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const STORAGE_KEY_PATTERN =
  /reditelsky-pruvodce|phmax-|vyrocni-zprava|identity-registry|localStorage/i;

function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    store,
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key]! : null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
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

function sampleProfile(id: string, name = "ZŠ Restore") {
  return {
    id,
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

function sampleIdentity(schoolId: string) {
  return {
    schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
    schoolId,
    schoolYears: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function modulePayload(label: string, data: unknown) {
  return {
    label,
    schemaVersion: 1,
    exportedAt: "2026-08-08T12:00:00.000Z",
    data,
  };
}

function envelope(modules: Record<string, ReturnType<typeof modulePayload>>) {
  return {
    format: APP_BACKUP_FORMAT,
    schemaVersion: APP_BACKUP_SCHEMA_VERSION,
    exportedAt: "2026-08-08T12:00:00.000Z",
    appVersion: "0.3.16",
    modules,
  };
}

function emptyEnv(): RestoreEnvironment {
  return {
    identity: { status: "missing" },
    profile: { status: "missing" },
  };
}

function envIdentity(schoolId: string): RestoreEnvironment {
  return {
    identity: { status: "valid", schoolId },
    profile: { status: "missing" },
  };
}

function previewFromEnvelope(
  modules: Record<string, ReturnType<typeof modulePayload>>,
  env: RestoreEnvironment = emptyEnv(),
) {
  return buildRestorePreviewFromBackupText(JSON.stringify(envelope(modules)), {
    readEnvironment: () => env,
  });
}

function assertPreviewHasNoTechnicalLeaks(value: unknown) {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toMatch(UUID_PATTERN);
  expect(serialized).not.toMatch(STORAGE_KEY_PATTERN);
  expect(serialized).not.toContain("present_valid");
  expect(serialized).not.toContain("missing_preserve");
}

describe("Restore preview model (Restore-3A)", () => {
  let ls: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    ls = createLocalStorageMock();
    vi.stubGlobal("localStorage", ls);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("B: invalid JSON → parse error, no preview", () => {
    const result = buildRestorePreviewFromBackupText("{not-json");
    expect(result.status).toBe("parse_error");
    if (result.status !== "parse_error") return;
    expect(result.parseStatus).toBe("invalid_json");
    expect(result.message).toContain("platná záloha");
  });

  it("C: unsupported schema → blocked parse error", () => {
    const raw = JSON.stringify({
      format: APP_BACKUP_FORMAT,
      schemaVersion: 99,
      exportedAt: "2026-08-08T12:00:00.000Z",
      modules: {},
    });
    const result = buildRestorePreviewFromBackupText(raw);
    expect(result.status).toBe("parse_error");
    if (result.status !== "parse_error") return;
    expect(result.parseStatus).toBe("unsupported_schema");
    expect(result.schemaVersion).toBe(99);
  });

  it("D: valid partial backup → restore vs preserve groups", () => {
    const result = previewFromEnvelope({
      "phmax-scenario-label": modulePayload("Label", "Scénář A"),
    });
    expect(result.status).toBe("preview");
    if (result.status !== "preview") return;
    expect(result.preview.restoreModules.map((m) => m.label)).toEqual(["Scénář školy"]);
    expect(result.preview.preserveModules.map((m) => m.label)).toEqual([
      "Profil školy",
      "Identita školy",
      "Výroční zpráva",
      "PHmax MŠ",
      "PHmax ŠD",
      "PHmax ZŠ",
      "PHmax SŠ",
      "Banka odpočtů NV75",
    ]);
    expect(result.preview.warnings.some((w) => w.includes("zůstanou v tomto prohlížeči"))).toBe(
      true,
    );
    assertPreviewHasNoTechnicalLeaks(result.preview);
  });

  it("E: cross-school → blocked without UUID in preview model", () => {
    const result = previewFromEnvelope(
      {
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_B)),
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_B)),
      },
      envIdentity(SCHOOL_A),
    );
    expect(result.status).toBe("preview");
    if (result.status !== "preview") return;
    expect(result.preview.conflictCategory).toBe("different_school");
    expect(result.preview.canApply).toBe(false);
    expect(result.preview.blockedMessage).toContain("jiné škole");
    assertPreviewHasNoTechnicalLeaks(result.preview);
  });

  it("F: legacy identity unverifiable → blocked", () => {
    const result = previewFromEnvelope(
      {
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      },
      envIdentity(SCHOOL_A),
    );
    expect(result.status).toBe("preview");
    if (result.status !== "preview") return;
    expect(result.preview.conflictCategory).toBe("legacy_unverifiable");
    expect(result.preview.canApply).toBe(false);
    expect(result.preview.blockedMessage).toContain("Nelze bezpečně ověřit");
  });

  it("G: unknown module → warning, known valid modules still previewable", () => {
    const result = previewFromEnvelope({
      "phmax-scenario-label": modulePayload("Label", "Scénář A"),
      "future-module": modulePayload("Future", { secret: true }),
    });
    expect(result.status).toBe("preview");
    if (result.status !== "preview") return;
    expect(result.preview.unknownModuleWarning).toBe(true);
    expect(result.preview.warnings.some((w) => w.includes("novější verze aplikace"))).toBe(true);
    expect(result.preview.restoreModules.length).toBe(1);
    expect(JSON.stringify(result.preview)).not.toContain("future-module");
  });

  it("H: known invalid module → blocked", () => {
    const result = previewFromEnvelope({
      "school-profile": modulePayload("Profil", { broken: true }),
    });
    expect(result.status).toBe("preview");
    if (result.status !== "preview") return;
    expect(result.preview.canApply).toBe(false);
    expect(result.preview.invalidModules.some((m) => m.label === "Profil školy")).toBe(true);
    expect(result.preview.blockedMessage).toContain("poškozená");
  });

  it("I: empty known modules → hasRestorableModules false", () => {
    const result = previewFromEnvelope({
      "future-only": modulePayload("Future", { x: 1 }),
    });
    expect(result.status).toBe("preview");
    if (result.status !== "preview") return;
    expect(result.preview.hasRestorableModules).toBe(false);
    expect(result.preview.emptyBackupMessage).toContain("nejsou data");
  });

  it("J: school name only from valid profile with non-empty name", () => {
    const withName = previewFromEnvelope({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A, "ZŠ Náhled")),
    });
    expect(withName.status).toBe("preview");
    if (withName.status !== "preview") return;
    expect(withName.preview.schoolName).toBe("ZŠ Náhled");

    const withoutName = previewFromEnvelope({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A, "   ")),
    });
    expect(withoutName.status).toBe("preview");
    if (withoutName.status !== "preview") return;
    expect(withoutName.preview.schoolName).toBeNull();
  });

  it("K: module label map covers all 9 known modules", () => {
    expect(Object.keys(RESTORE_UI_MODULE_LABELS).sort()).toEqual(
      [...RESTORE_KNOWN_MODULE_IDS].sort(),
    );
    expect(RESTORE_UI_MODULE_LABELS["phmax-pv"]).toBe("PHmax MŠ");
    expect(RESTORE_UI_MODULE_LABELS["phmax-scenario-label"]).toBe("Scénář školy");
  });

  it("L: preview model contains no raw keys / UUID / internal enums", () => {
    const validated = validateAppBackupEnvelope(
      envelope({
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "phmax-scenario-label": modulePayload("Label", "X"),
      }),
    );
    if (validated.status !== "validated") return;
    const plan = buildAppBackupRestorePlan(validated, emptyEnv());
    const preview = buildRestorePreviewModel(plan, validated);
    assertPreviewHasNoTechnicalLeaks(preview);
  });

  it("N: preview planning performs zero storage writes", () => {
    const setItem = vi.spyOn(ls, "setItem");
    const removeItem = vi.spyOn(ls, "removeItem");
    const clear = vi.spyOn(ls, "clear");

    previewFromEnvelope({
      "phmax-scenario-label": modulePayload("Label", "Scénář A"),
    });

    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });

  it("local corrupted identity → blocked preview", () => {
    const result = previewFromEnvelope(
      {
        "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
        "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
      },
      {
        identity: { status: "corrupted" },
        profile: { status: "corrupted" },
      },
    );
    expect(result.status).toBe("preview");
    if (result.status !== "preview") return;
    expect(result.preview.conflictCategory).toBe("local_data_corrupted");
    expect(result.preview.canApply).toBe(false);
  });

  it("storage unavailable environment → blocked preview", () => {
    const result = previewFromEnvelope(
      {
        "phmax-scenario-label": modulePayload("Label", "Scénář A"),
      },
      {
        identity: { status: "storage_unavailable" },
        profile: { status: "storage_unavailable" },
      },
    );
    expect(result.status).toBe("preview");
    if (result.status !== "preview") return;
    expect(result.preview.conflictCategory).toBe("storage_unavailable");
    expect(result.preview.blockedMessage).toContain("nelze bezpečně");
  });

  it("invalid envelope → parse error", () => {
    const result = buildRestorePreviewFromBackupText(
      JSON.stringify({ format: "wrong", schemaVersion: 1, exportedAt: "x", modules: {} }),
    );
    expect(result.status).toBe("parse_error");
    if (result.status !== "parse_error") return;
    expect(result.parseStatus).toBe("invalid_envelope");
  });

  it("modern vs legacy backupKind", () => {
    const modern = previewFromEnvelope({
      "identity-registry": modulePayload("Identita", sampleIdentity(SCHOOL_A)),
    });
    expect(modern.status).toBe("preview");
    if (modern.status !== "preview") return;
    expect(modern.preview.backupKind).toBe("modern");

    const legacy = previewFromEnvelope({
      "school-profile": modulePayload("Profil", sampleProfile(SCHOOL_A)),
    });
    expect(legacy.status).toBe("preview");
    if (legacy.status !== "preview") return;
    expect(legacy.preview.backupKind).toBe("legacy");
  });
});
