import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_CONTEXT_LS_KEY } from "../data/app-context/app-context-types";
import {
  IDENTITY_REGISTRY_LS_KEY,
  IDENTITY_REGISTRY_SCHEMA_VERSION,
} from "../data/identity/identity-registry-types";
import { PHMAX_MODULE_AUTOSAVE_LS_KEYS } from "../phmax-school-scenario-export";
import { VYROCNI_ZPRAVA_LS_KEY } from "../vyrocni-zprava/vyrocni-zprava-storage";
import { SCHOOL_PROFILE_LS_KEY } from "./school-profile-constants";
import {
  identitySensitiveLockMode,
  readIdentityRegistryPresence,
} from "./school-profile-identity-policy";
import {
  applySchoolProfileEdits,
  createDefaultSchoolProfile,
  resetSchoolProfileFields,
} from "./school-profile-logic";
import { loadSchoolProfileFromStorage } from "./school-profile-storage";
import { replaceSchoolProfileState } from "./use-school-profile";

function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
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

function sampleEstablishedProfile(id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee") {
  return {
    ...createDefaultSchoolProfile(),
    id,
    name: "ZŠ Alfa",
    ico: "12345678",
    redIzo: "600123456",
    izo: "102345678",
    address: "Hlavní 1",
    municipality: "Praha",
    region: "Hlavní město Praha",
    founder: "Město",
    principalName: "Jan Novák",
    website: "https://alfa.cz",
    email: "info@alfa.cz",
    phone: "123",
    dataBox: "abcd",
    schoolType: "Základní škola",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };
}

function seedValidRegistry(schoolId: string): void {
  localStorage.setItem(
    IDENTITY_REGISTRY_LS_KEY,
    JSON.stringify({
      schemaVersion: IDENTITY_REGISTRY_SCHEMA_VERSION,
      schoolId,
      schoolYears: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
    }),
  );
}

function resetProfileLikeHook(): void {
  const current = loadSchoolProfileFromStorage();
  replaceSchoolProfileState(resetSchoolProfileFields(current));
}

function saveProfileLikeHook(nextProfile: ReturnType<typeof sampleEstablishedProfile>) {
  const current = loadSchoolProfileFromStorage();
  const status = readIdentityRegistryPresence();
  const { profile, identityChangeBlocked } = applySchoolProfileEdits(current, nextProfile, {
    identityLockMode: identitySensitiveLockMode(status),
  });
  replaceSchoolProfileState(profile);
  return { identityChangeBlocked, status };
}

describe("Identity Registry presence (fail-closed)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("missing registry → legacy identity edit povolen", () => {
    expect(readIdentityRegistryPresence()).toBe("missing");
    expect(identitySensitiveLockMode("missing")).toBe("none");
    const current = sampleEstablishedProfile();
    const result = applySchoolProfileEdits(
      current,
      { ...current, id: "other-id", ico: "87654321" },
      { identityLockMode: "none" },
    );
    expect(result.identityChangeBlocked).toBe(false);
    expect(result.profile.ico).toBe("87654321");
    expect(result.profile.id).toBe(current.id);
  });

  it("valid registry → změna již vyplněného ico / redIzo / izo blokována", () => {
    seedValidRegistry(sampleEstablishedProfile().id);
    expect(readIdentityRegistryPresence()).toBe("valid");
    const current = sampleEstablishedProfile();
    expect(
      applySchoolProfileEdits(current, { ...current, ico: "87654321" }, { identityLockMode: "established_only" })
        .identityChangeBlocked,
    ).toBe(true);
    expect(
      applySchoolProfileEdits(
        current,
        { ...current, redIzo: "600999999" },
        { identityLockMode: "established_only" },
      ).profile.redIzo,
    ).toBe(current.redIzo);
    expect(
      applySchoolProfileEdits(current, { ...current, izo: "102999999" }, { identityLockMode: "established_only" })
        .profile.izo,
    ).toBe(current.izo);
  });

  it("corrupted registry → identity-sensitive edit blokována a storage beze změny", () => {
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, "{broken");
    expect(readIdentityRegistryPresence()).toBe("corrupted");
    expect(identitySensitiveLockMode("corrupted")).toBe("all");
    const before = localStorage.getItem(IDENTITY_REGISTRY_LS_KEY);
    const current = sampleEstablishedProfile();
    const result = applySchoolProfileEdits(
      current,
      { ...current, ico: "87654321", website: "https://ok.cz" },
      { identityLockMode: "all" },
    );
    expect(result.identityChangeBlocked).toBe(true);
    expect(result.profile.ico).toBe(current.ico);
    expect(result.profile.website).toBe("https://ok.cz");
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(before);
  });

  it("corrupted registry blokuje i první vyplnění identifikátoru (fail-closed)", () => {
    const current = { ...sampleEstablishedProfile(), ico: "", redIzo: "", izo: "" };
    const result = applySchoolProfileEdits(
      current,
      { ...current, ico: "12345678" },
      { identityLockMode: "all" },
    );
    expect(result.identityChangeBlocked).toBe(true);
    expect(result.profile.ico).toBe("");
  });

  it("storage unavailable → identity-sensitive edit fail-closed", () => {
    expect(identitySensitiveLockMode("storage_unavailable")).toBe("all");
    vi.stubGlobal("localStorage", undefined);
    expect(readIdentityRegistryPresence()).toBe("storage_unavailable");
    const current = sampleEstablishedProfile();
    const result = applySchoolProfileEdits(
      current,
      { ...current, ico: "87654321" },
      { identityLockMode: identitySensitiveLockMode(readIdentityRegistryPresence()) },
    );
    expect(result.identityChangeBlocked).toBe(true);
    expect(result.profile.ico).toBe(current.ico);
  });

  it("běžná změna website/phone/principal při valid registry funguje", () => {
    const current = sampleEstablishedProfile();
    const result = applySchoolProfileEdits(
      current,
      { ...current, website: "https://nova.cz", phone: "999", principalName: "Petra Nová" },
      { identityLockMode: "established_only" },
    );
    expect(result.identityChangeBlocked).toBe(false);
    expect(result.profile.website).toBe("https://nova.cz");
    expect(result.profile.phone).toBe("999");
    expect(result.profile.principalName).toBe("Petra Nová");
    expect(result.profile.id).toBe(current.id);
  });

  it("save/edit nemůže změnit profile.id (ani z draftu)", () => {
    const current = sampleEstablishedProfile();
    const result = applySchoolProfileEdits(
      current,
      { ...current, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "X" },
      { identityLockMode: "none" },
    );
    expect(result.profile.id).toBe(current.id);
  });
});

describe("school profile reset / persistence with identity guard", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    const profile = sampleEstablishedProfile();
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(profile));
    seedValidRegistry(profile.id);
    localStorage.setItem(
      APP_CONTEXT_LS_KEY,
      JSON.stringify({
        schemaVersion: 1,
        activeSchoolId: profile.id,
        activeSchoolYearId: null,
      }),
    );
    localStorage.setItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv, '{"draft":true}');
    localStorage.setItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.nv75, '{"rows":[]}');
    localStorage.setItem(VYROCNI_ZPRAVA_LS_KEY, '{"version":1,"report":{}}');
    replaceSchoolProfileState(loadSchoolProfileFromStorage(), false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reset zachová id, Identity, AppContext a business data", () => {
    const identityBefore = localStorage.getItem(IDENTITY_REGISTRY_LS_KEY);
    const idBefore = JSON.parse(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)!).id as string;
    resetProfileLikeHook();
    const stored = JSON.parse(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)!) as {
      id: string;
      ico: string;
      name: string;
    };
    expect(stored.id).toBe(idBefore);
    expect(stored.ico).toBe("12345678");
    expect(stored.name).toBe("");
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(identityBefore);
  });

  it("reset při corrupted registry nepřepisuje registry a zachová id + identifikátory", () => {
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, "{broken");
    const before = localStorage.getItem(IDENTITY_REGISTRY_LS_KEY);
    const idBefore = loadSchoolProfileFromStorage().id;
    resetProfileLikeHook();
    const after = loadSchoolProfileFromStorage();
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(before);
    expect(after.id).toBe(idBefore);
    expect(after.ico).toBe("12345678");
    expect(after.redIzo).toBe("600123456");
    expect(after.izo).toBe("102345678");
  });

  it("valid registry: save blokuje IČO, povolí website", () => {
    const current = loadSchoolProfileFromStorage();
    const result = saveProfileLikeHook({ ...current, ico: "87654321", website: "https://x.cz" });
    expect(result.status).toBe("valid");
    expect(result.identityChangeBlocked).toBe(true);
    const stored = loadSchoolProfileFromStorage();
    expect(stored.ico).toBe("12345678");
    expect(stored.website).toBe("https://x.cz");
    expect(stored.id).toBe(current.id);
  });

  it("missing registry: legacy změna IČO povolena, id zachováno", () => {
    localStorage.removeItem(IDENTITY_REGISTRY_LS_KEY);
    expect(readIdentityRegistryPresence()).toBe("missing");
    const current = loadSchoolProfileFromStorage();
    const result = saveProfileLikeHook({ ...current, ico: "87654321" });
    expect(result.identityChangeBlocked).toBe(false);
    expect(loadSchoolProfileFromStorage().ico).toBe("87654321");
    expect(loadSchoolProfileFromStorage().id).toBe(current.id);
  });

  it("corrupted registry: save blokuje identity změnu a registry zůstane", () => {
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, "{broken");
    const before = localStorage.getItem(IDENTITY_REGISTRY_LS_KEY);
    const current = loadSchoolProfileFromStorage();
    const result = saveProfileLikeHook({ ...current, ico: "87654321", phone: "555" });
    expect(result.status).toBe("corrupted");
    expect(result.identityChangeBlocked).toBe(true);
    expect(loadSchoolProfileFromStorage().ico).toBe("12345678");
    expect(loadSchoolProfileFromStorage().phone).toBe("555");
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(before);
  });

  it("valid registry umožní první vyplnění prázdného IČO", () => {
    const emptyIds = {
      ...sampleEstablishedProfile(),
      ico: "",
      redIzo: "",
      izo: "",
    };
    replaceSchoolProfileState(emptyIds);
    const result = applySchoolProfileEdits(
      emptyIds,
      { ...emptyIds, ico: "12345678" },
      { identityLockMode: "established_only" },
    );
    expect(result.identityChangeBlocked).toBe(false);
    expect(result.profile.ico).toBe("12345678");
  });
});
