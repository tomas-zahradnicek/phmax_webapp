import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LEGACY_ANNUAL_REPORT_STATE_LS_KEY,
  readLegacySchoolYearHint,
} from "../data/legacy/legacy-school-year";
import {
  IDENTITY_REGISTRY_LS_KEY,
  readIdentityRegistry,
} from "../data/identity/identity-registry";
import { APP_CONTEXT_LS_KEY } from "../data/app-context/app-context";
import { createDefaultSchoolProfile } from "../school-profile/school-profile-logic";
import { ensureSchoolPlatformBinding } from "../school-profile/ensure-school-platform-binding";
import { SCHOOL_PROFILE_LS_KEY } from "../school-profile/school-profile-constants";
import { createDefaultAnnualReport } from "./vyrocni-zprava-logic";
import {
  loadVyrocniZpravaStorage,
  saveVyrocniZpravaStorage,
  VYROCNI_ZPRAVA_LS_KEY,
} from "./vyrocni-zprava-storage";

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

describe("VZ schoolYear empty default (0G-0)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.stubGlobal("sessionStorage", createLocalStorageMock());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("C: fresh VZ storage/default → schoolYear === \"\"", () => {
    expect(localStorage.getItem(VYROCNI_ZPRAVA_LS_KEY)).toBeNull();
    const loaded = loadVyrocniZpravaStorage();
    expect(loaded.report.schoolYear).toBe("");
  });

  it("D: fresh persisted empty year → readLegacySchoolYearHint has no startYear", () => {
    const report = createDefaultAnnualReport();
    expect(report.schoolYear).toBe("");
    expect(
      saveVyrocniZpravaStorage({
        version: 1,
        report,
        selectedSectionId: report.sections[0]?.id ?? "01",
      }),
    ).toEqual({ ok: true });

    const hint = readLegacySchoolYearHint();
    expect(hint).toEqual({ ok: true, label: null, startYear: null });
  });

  it("E: existing persisted valid year remains authoritative", () => {
    const report = createDefaultAnnualReport("2024/2025");
    expect(
      saveVyrocniZpravaStorage({
        version: 1,
        report,
        selectedSectionId: report.sections[0]?.id ?? "01",
      }),
    ).toEqual({ ok: true });

    const hint = readLegacySchoolYearHint();
    expect(hint).toEqual({ ok: true, label: "2024/2025", startYear: 2024 });
    expect(loadVyrocniZpravaStorage().report.schoolYear).toBe("2024/2025");
  });

  it("F: empty / missing year never invents current-date school year", () => {
    expect(readLegacySchoolYearHint()).toEqual({
      ok: true,
      label: null,
      startYear: null,
    });

    expect(
      saveVyrocniZpravaStorage({
        version: 1,
        report: createDefaultAnnualReport(""),
        selectedSectionId: "01",
      }),
    ).toEqual({ ok: true });

    const hint = readLegacySchoolYearHint();
    expect(hint.ok).toBe(true);
    if (!hint.ok) return;
    expect(hint.startYear).toBeNull();
    // Fake timers are in 2026 — must not invent 2025/2026 or 2026/2027
    expect(hint.startYear).not.toBe(2025);
    expect(hint.startYear).not.toBe(2026);
  });

  it("0F regression: persisted SchoolProfile + fresh empty VZ year → no SchoolYear identity", async () => {
    const profile = {
      ...createDefaultSchoolProfile(),
      id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      name: "ZŠ Empty Year",
      ico: "12345678",
    };
    localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(profile));

    const emptyReport = createDefaultAnnualReport();
    expect(emptyReport.schoolYear).toBe("");
    expect(
      saveVyrocniZpravaStorage({
        version: 1,
        report: emptyReport,
        selectedSectionId: emptyReport.sections[0]?.id ?? "01",
      }),
    ).toEqual({ ok: true });

    expect(readLegacySchoolYearHint()).toEqual({
      ok: true,
      label: null,
      startYear: null,
    });

    const result = await ensureSchoolPlatformBinding();
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.activeSchoolYearId).toBeNull();

    const registry = readIdentityRegistry();
    expect(registry.ok).toBe(true);
    if (!registry.ok || !registry.registry) return;
    expect(registry.registry.schoolYears).toEqual([]);
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeTruthy();
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBeTruthy();
    expect(localStorage.getItem(LEGACY_ANNUAL_REPORT_STATE_LS_KEY)).toBeTruthy();
  });
});
