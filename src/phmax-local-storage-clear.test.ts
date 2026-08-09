import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_CONTEXT_LS_KEY } from "./data/app-context/app-context-types";
import { IDENTITY_REGISTRY_LS_KEY } from "./data/identity/identity-registry-types";
import {
  clearAllPhmaxLocalStorage,
  clearSchoolScenarioExportWorkingLocalStorage,
  PHMAX_APP_LOCAL_STORAGE_KEYS,
  PHMAX_SCHOOL_SCENARIO_EXPORT_WORKING_LS_KEYS,
} from "./phmax-local-storage-clear";
import {
  PHMAX_MODULE_AUTOSAVE_LS_KEYS,
  PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY,
} from "./phmax-school-scenario-export";
import { SCHOOL_PROFILE_LS_KEY } from "./school-profile/school-profile-constants";
import { clearSchoolProfileStorage } from "./school-profile/school-profile-storage";
import { VYROCNI_ZPRAVA_PERSONNEL_LS_KEY } from "./vyrocni-zprava/vyrocni-zprava-personnel-logic";
import { clearPersonnelDataStorage } from "./vyrocni-zprava/vyrocni-zprava-personnel-storage";
import { VYROCNI_ZPRAVA_SECTION01_LS_KEY } from "./vyrocni-zprava/vyrocni-zprava-section01-data-logic";
import {
  clearVyrocniZpravaStorage,
  VYROCNI_ZPRAVA_LS_KEY,
} from "./vyrocni-zprava/vyrocni-zprava-storage";
import { NAMED_SNAPSHOTS_LS_KEY } from "./zs-named-snapshots";

const PRESERVED_KEYS = [
  SCHOOL_PROFILE_LS_KEY,
  IDENTITY_REGISTRY_LS_KEY,
  APP_CONTEXT_LS_KEY,
  VYROCNI_ZPRAVA_LS_KEY,
  VYROCNI_ZPRAVA_PERSONNEL_LS_KEY,
  VYROCNI_ZPRAVA_SECTION01_LS_KEY,
] as const;

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

describe("clearAllPhmaxLocalStorage (level B calculator clear)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("inventář neobsahuje SchoolProfile, Identity, AppContext ani VZ klíče", () => {
    expect(PHMAX_APP_LOCAL_STORAGE_KEYS).not.toContain(SCHOOL_PROFILE_LS_KEY);
    expect(PHMAX_APP_LOCAL_STORAGE_KEYS).not.toContain(IDENTITY_REGISTRY_LS_KEY);
    expect(PHMAX_APP_LOCAL_STORAGE_KEYS).not.toContain(APP_CONTEXT_LS_KEY);
    expect(PHMAX_APP_LOCAL_STORAGE_KEYS.every((k) => !k.startsWith("vyrocni-zprava-"))).toBe(true);
  });

  it("odstraní PHmax autosave, NV75, named snapshots a scenario metadata; zachová platformu a VZ", () => {
    const profile = JSON.stringify({ schoolName: "ZŠ Test", ico: "12345678" });
    const identity = JSON.stringify({ schemaVersion: 1, schoolId: "sch_test", schoolYears: {} });
    const appContext = JSON.stringify({
      schemaVersion: 1,
      activeSchoolId: "sch_test",
      activeSchoolYearId: null,
    });
    const vzMain = JSON.stringify({ version: 1, report: {}, selectedSectionId: null });
    const vzPersonnel = JSON.stringify({ schemaVersion: 1, data: {} });
    const vzSection = JSON.stringify({ schemaVersion: 1, data: {} });
    const namedSnap = JSON.stringify({ items: [{ id: "1", name: "A", savedAt: "t", snapshot: {} }] });

    localStorage.setItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv, '{"x":1}');
    localStorage.setItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.sd, '{"x":1}');
    localStorage.setItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.zs, '{"x":1}');
    localStorage.setItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.ss, '{"x":1}');
    localStorage.setItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.nv75, '{"rows":[]}');
    localStorage.setItem("edu-cz-pv-named-snapshots-v1", namedSnap);
    localStorage.setItem("edu-cz-sd-named-snapshots-v1", namedSnap);
    localStorage.setItem(NAMED_SNAPSHOTS_LS_KEY, namedSnap);
    localStorage.setItem("phmax-ss-named-snapshots-v1", namedSnap);
    localStorage.setItem("edu-cz-nv75-deputy-bank-named-snapshots", namedSnap);
    localStorage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "Scénář A");
    localStorage.setItem("phmax-dash-last-visit-pv", "2026-01-01");

    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, profile);
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, identity);
    localStorage.setItem(APP_CONTEXT_LS_KEY, appContext);
    localStorage.setItem(VYROCNI_ZPRAVA_LS_KEY, vzMain);
    localStorage.setItem(VYROCNI_ZPRAVA_PERSONNEL_LS_KEY, vzPersonnel);
    localStorage.setItem(VYROCNI_ZPRAVA_SECTION01_LS_KEY, vzSection);

    const removed = clearAllPhmaxLocalStorage();
    expect(removed).toBeGreaterThan(0);

    expect(localStorage.getItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv)).toBeNull();
    expect(localStorage.getItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.nv75)).toBeNull();
    expect(localStorage.getItem(NAMED_SNAPSHOTS_LS_KEY)).toBeNull();
    expect(localStorage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBeNull();
    expect(localStorage.getItem("phmax-dash-last-visit-pv")).toBeNull();

    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(profile);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(identity);
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBe(appContext);
    expect(localStorage.getItem(VYROCNI_ZPRAVA_LS_KEY)).toBe(vzMain);
    expect(localStorage.getItem(VYROCNI_ZPRAVA_PERSONNEL_LS_KEY)).toBe(vzPersonnel);
    expect(localStorage.getItem(VYROCNI_ZPRAVA_SECTION01_LS_KEY)).toBe(vzSection);
  });

  it("modulové clear funkce zůstávají samostatné (non-regression source contract)", () => {
    expect(typeof clearSchoolProfileStorage).toBe("function");
    expect(typeof clearVyrocniZpravaStorage).toBe("function");
    expect(typeof clearPersonnelDataStorage).toBe("function");
    const src = readFileSync(resolve("src/phmax-local-storage-clear.ts"), "utf8");
    expect(src).not.toContain("clearSchoolProfileStorage");
    expect(src).not.toContain("clearVyrocniZpravaStorage");
    expect(src).not.toContain("IDENTITY_REGISTRY");
    expect(src).not.toContain("APP_CONTEXT");
  });
});

describe("clearSchoolScenarioExportWorkingLocalStorage (post-export scope)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("scope je přesně autosave modulů; scenario label clearí shadow-aware lifecycle", () => {
    expect(PHMAX_SCHOOL_SCENARIO_EXPORT_WORKING_LS_KEYS).toEqual([
      PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv,
      PHMAX_MODULE_AUTOSAVE_LS_KEYS.sd,
      PHMAX_MODULE_AUTOSAVE_LS_KEYS.zs,
      PHMAX_MODULE_AUTOSAVE_LS_KEYS.ss,
      PHMAX_MODULE_AUTOSAVE_LS_KEYS.nv75,
    ]);
  });

  it("smaže exportovaná pracovní data a nesmaže SchoolProfile, named snapshot ani klíče mimo scope", () => {
    const profile = '{"schoolName":"ZŠ"}';
    const named = '{"items":[{"id":"n1","name":"Záloha","savedAt":"t","snapshot":{}}]}';
    const identity = '{"schemaVersion":1,"schoolId":"sch_x","schoolYears":{}}';
    const uiPref = "expert";

    localStorage.setItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.pv, '{"draft":true}');
    localStorage.setItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.zs, '{"draft":true}');
    localStorage.setItem(PHMAX_MODULE_AUTOSAVE_LS_KEYS.nv75, '{"rows":[1]}');
    localStorage.setItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY, "Exportovaný");
    localStorage.setItem(NAMED_SNAPSHOTS_LS_KEY, named);
    localStorage.setItem("edu-cz-pv-named-snapshots-v1", named);
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, profile);
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, identity);
    localStorage.setItem(APP_CONTEXT_LS_KEY, '{"schemaVersion":1}');
    localStorage.setItem(VYROCNI_ZPRAVA_LS_KEY, '{"version":1}');
    localStorage.setItem("phmax-zs-view-mode", uiPref);
    localStorage.setItem("phmax-display-density", "compact");

    const beforeKeys = new Set(
      Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!),
    );
    const removed = clearSchoolScenarioExportWorkingLocalStorage();
    expect(removed).toBe(4);

    for (const key of PHMAX_SCHOOL_SCENARIO_EXPORT_WORKING_LS_KEYS) {
      if (
        key === PHMAX_MODULE_AUTOSAVE_LS_KEYS.sd ||
        key === PHMAX_MODULE_AUTOSAVE_LS_KEYS.ss
      ) {
        continue; // nebyly nastaveny
      }
      expect(localStorage.getItem(key)).toBeNull();
    }
    expect(localStorage.getItem(PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY)).toBeNull();

    expect(localStorage.getItem(SCHOOL_PROFILE_LS_KEY)).toBe(profile);
    expect(localStorage.getItem(NAMED_SNAPSHOTS_LS_KEY)).toBe(named);
    expect(localStorage.getItem("edu-cz-pv-named-snapshots-v1")).toBe(named);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBe(identity);
    expect(localStorage.getItem("phmax-zs-view-mode")).toBe(uiPref);
    expect(localStorage.getItem("phmax-display-density")).toBe("compact");
    expect(localStorage.getItem(VYROCNI_ZPRAVA_LS_KEY)).toBe('{"version":1}');

    const afterKeys = new Set(
      Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!),
    );
    for (const key of beforeKeys) {
      if (
        (PHMAX_SCHOOL_SCENARIO_EXPORT_WORKING_LS_KEYS as readonly string[]).includes(key) ||
        key === PHMAX_SCHOOL_SCENARIO_LABEL_LS_KEY
      ) {
        expect(afterKeys.has(key)).toBe(false);
      } else {
        expect(afterKeys.has(key)).toBe(true);
      }
    }

    for (const key of PRESERVED_KEYS) {
      if (localStorage.getItem(key) != null) {
        expect(localStorage.getItem(key)).toBeTruthy();
      }
    }
  });
});
