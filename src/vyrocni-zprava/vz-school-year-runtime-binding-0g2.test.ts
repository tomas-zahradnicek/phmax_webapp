import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  APP_CONTEXT_LS_KEY,
  readAppContext,
} from "../data/app-context/app-context";
import {
  IDENTITY_REGISTRY_LS_KEY,
  readIdentityRegistry,
} from "../data/identity/identity-registry";
import { SCHOOL_PROFILE_LS_KEY } from "../school-profile/school-profile-constants";
import { createDefaultAnnualReport } from "./vyrocni-zprava-logic";
import {
  createFreshVyrocniZpravaStorage,
  saveVyrocniZpravaStorage,
  type VyrocniZpravaStorageSaveResult,
} from "./vyrocni-zprava-storage";
import {
  MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED,
  createSerializedVzSchoolYearBindingRunner,
  runVzSchoolYearBindingAfterPersist,
} from "./vz-school-year-persist-binding";
import { ensureVzSchoolYearPlatformBinding } from "./ensure-vz-school-year-platform-binding";

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

function sampleProfile(id: string) {
  return {
    id,
    name: "ZŠ Runtime Binding",
    ico: "12345678",
    redIzo: "600123456",
    izo: "102345678",
    schoolType: "Základní škola",
    address: "Hlavní 1",
    municipality: "Praha",
    region: "Hlavní město Praha",
    founder: "Město Praha",
    principalName: "Jan Novák",
    website: "https://skola.cz",
    email: "skola@skola.cz",
    phone: "+420111222333",
    dataBox: "abcdefg",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  };
}

function persistProfile(id: string) {
  localStorage.setItem(SCHOOL_PROFILE_LS_KEY, JSON.stringify(sampleProfile(id)));
}

/** Central persist+bind path used by useVyrocniZpravaReport.persist after ok. */
async function persistAndBind(schoolYear: string): Promise<{
  persistence: VyrocniZpravaStorageSaveResult;
  outcome: Awaited<ReturnType<typeof runVzSchoolYearBindingAfterPersist>>;
}> {
  const report = createDefaultAnnualReport(schoolYear);
  const persistence = saveVyrocniZpravaStorage({
    version: 1,
    report,
    selectedSectionId: report.sections[0]?.id ?? "01",
  });
  const outcome = await runVzSchoolYearBindingAfterPersist(
    persistence,
    ensureVzSchoolYearPlatformBinding,
  );
  return { persistence, outcome };
}

function readActiveSchoolYearId(): string | null {
  const context = readAppContext();
  expect(context.ok).toBe(true);
  if (!context.ok) return null;
  return context.context?.activeSchoolYearId ?? null;
}

function readSchoolYears() {
  const registry = readIdentityRegistry();
  expect(registry.ok).toBe(true);
  if (!registry.ok || !registry.registry) return [];
  return registry.registry.schoolYears;
}

describe("VZ SchoolYear runtime binding (0G-2 integration)", () => {
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

  it("I: fresh empty year → no year identity, no warning", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);

    const { persistence, outcome } = await persistAndBind("");
    expect(persistence).toEqual({ ok: true });
    expect(outcome).toEqual({
      bindingAttempted: true,
      binding: { status: "noop", reason: "no_valid_year", schoolId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" },
      metadataNotice: null,
    });
    expect(readSchoolYears()).toEqual([]);
    expect(readActiveSchoolYearId()).toBeNull();
  });

  it("J: legacy valid year first successful persist → year identity reconcile", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);

    // Pre-persist legacy VZ (as if already in LS before mount), then first autosave-equivalent bind.
    const legacy = createDefaultAnnualReport("2024/2025");
    expect(
      saveVyrocniZpravaStorage({
        version: 1,
        report: legacy,
        selectedSectionId: legacy.sections[0]?.id ?? "01",
      }),
    ).toEqual({ ok: true });

    const { persistence, outcome } = await persistAndBind("2024/2025");
    expect(persistence).toEqual({ ok: true });
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.binding.status).toBe("ready");
    expect(outcome.metadataNotice).toBeNull();
    if (outcome.binding.status !== "ready") return;

    expect(outcome.binding.startYear).toBe(2024);
    expect(readActiveSchoolYearId()).toBe(outcome.binding.schoolYearId);
    const years = readSchoolYears();
    expect(years).toHaveLength(1);
    expect(years[0]?.startYear).toBe(2024);
  });

  it("K: invalid intermediate → active unchanged", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);

    const first = await persistAndBind("2025/2026");
    expect(first.outcome.bindingAttempted).toBe(true);
    if (!first.outcome.bindingAttempted || first.outcome.binding.status !== "ready") return;
    const yearA = first.outcome.binding.schoolYearId;

    for (const label of ["2", "20", "2026/", "2026/2"]) {
      const step = await persistAndBind(label);
      expect(step.persistence).toEqual({ ok: true });
      expect(step.outcome).toEqual({
        bindingAttempted: true,
        binding: { status: "noop", reason: "no_valid_year", schoolId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" },
        metadataNotice: null,
      });
      expect(readActiveSchoolYearId()).toBe(yearA);
    }

    expect(readSchoolYears()).toHaveLength(1);
    expect(readSchoolYears()[0]?.startYear).toBe(2025);
  });

  it("L: A → B → active B, A remains, VZ payload year only", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);

    const first = await persistAndBind("2025/2026");
    expect(first.outcome.bindingAttempted).toBe(true);
    if (!first.outcome.bindingAttempted || first.outcome.binding.status !== "ready") return;
    const yearA = first.outcome.binding.schoolYearId;

    const second = await persistAndBind("2026/2027");
    expect(second.outcome.bindingAttempted).toBe(true);
    if (!second.outcome.bindingAttempted || second.outcome.binding.status !== "ready") return;

    expect(second.outcome.binding.schoolYearId).not.toBe(yearA);
    expect(readActiveSchoolYearId()).toBe(second.outcome.binding.schoolYearId);

    const years = readSchoolYears();
    expect(years).toHaveLength(2);
    expect(years.find((y) => y.id === yearA)?.startYear).toBe(2025);
    expect(years.find((y) => y.id === second.outcome.binding.schoolYearId)?.startYear).toBe(2026);
  });

  it("M: repeated same-year autosave → same yearId", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);

    const first = await persistAndBind("2026/2027");
    expect(first.outcome.bindingAttempted).toBe(true);
    if (!first.outcome.bindingAttempted || first.outcome.binding.status !== "ready") return;

    const second = await persistAndBind("2026/2027");
    expect(second.outcome.bindingAttempted).toBe(true);
    if (!second.outcome.bindingAttempted || second.outcome.binding.status !== "ready") return;

    expect(second.outcome.binding.schoolYearId).toBe(first.outcome.binding.schoolYearId);
    expect(readSchoolYears()).toHaveLength(1);
  });

  it("N: missing Profile → VZ success / no blocking warning", async () => {
    const { persistence, outcome } = await persistAndBind("2026/2027");
    expect(persistence).toEqual({ ok: true });
    expect(outcome).toEqual({
      bindingAttempted: true,
      binding: { status: "empty" },
      metadataNotice: null,
    });
    expect(localStorage.getItem(IDENTITY_REGISTRY_LS_KEY)).toBeNull();
    expect(localStorage.getItem(APP_CONTEXT_LS_KEY)).toBeNull();
  });

  it("O: metadata error → VZ persistence success remains true", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);
    localStorage.setItem(IDENTITY_REGISTRY_LS_KEY, "{broken-identity");

    const report = createDefaultAnnualReport("2026/2027");
    const persistence = saveVyrocniZpravaStorage({
      version: 1,
      report,
      selectedSectionId: report.sections[0]?.id ?? "01",
    });
    expect(persistence).toEqual({ ok: true });

    const outcome = await runVzSchoolYearBindingAfterPersist(
      persistence,
      ensureVzSchoolYearPlatformBinding,
    );
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted) return;
    expect(outcome.binding.status).toBe("error");
    expect(outcome.metadataNotice).toBe(MSG_VZ_SCHOOL_YEAR_METADATA_BINDING_FAILED);
    // Business VZ payload untouched by metadata failure path.
    expect(JSON.parse(localStorage.getItem("vyrocni-zprava-state-v1")!).report.schoolYear).toBe(
      "2026/2027",
    );
  });

  it("P: rapid A → B → final active metadata = B (serialized + live SoT)", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);

    const runner = createSerializedVzSchoolYearBindingRunner(ensureVzSchoolYearPlatformBinding);

    // Sequential completed sync for A first (so A entry exists), then rapid re-queue A+B
    // after B is already the live persisted SoT — final active must be B; A remains.
    const settledA = await persistAndBind("2025/2026");
    expect(settledA.outcome.bindingAttempted).toBe(true);
    if (!settledA.outcome.bindingAttempted || settledA.outcome.binding.status !== "ready") return;
    const yearAId = settledA.outcome.binding.schoolYearId;

    const reportA = createDefaultAnnualReport("2025/2026");
    const persistA = saveVyrocniZpravaStorage({
      version: 1,
      report: reportA,
      selectedSectionId: reportA.sections[0]?.id ?? "01",
    });
    expect(persistA).toEqual({ ok: true });
    const bindA = runner.afterPersist(persistA);

    const reportB = createDefaultAnnualReport("2026/2027");
    const persistB = saveVyrocniZpravaStorage({
      version: 1,
      report: reportB,
      selectedSectionId: reportB.sections[0]?.id ?? "01",
    });
    expect(persistB).toEqual({ ok: true });
    const bindB = runner.afterPersist(persistB);

    const [outcomeA, outcomeB] = await Promise.all([bindA, bindB]);
    expect(outcomeA.bindingAttempted).toBe(true);
    expect(outcomeB.bindingAttempted).toBe(true);

    // Live SoT: queued work reads current LS; final active must be newest valid year B.
    const years = readSchoolYears();
    const yearB = years.find((y) => y.startYear === 2026);
    expect(yearB).toBeTruthy();
    expect(years.find((y) => y.id === yearAId)?.startYear).toBe(2025);
    expect(readActiveSchoolYearId()).toBe(yearB!.id);
  });

  it("clearReport-equivalent persist reuses same year and does not clear active", async () => {
    const profileId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    persistProfile(profileId);

    const first = await persistAndBind("2026/2027");
    expect(first.outcome.bindingAttempted).toBe(true);
    if (!first.outcome.bindingAttempted || first.outcome.binding.status !== "ready") return;
    const yearId = first.outcome.binding.schoolYearId;

    const fresh = createFreshVyrocniZpravaStorage("2026/2027");
    const persistence = saveVyrocniZpravaStorage(fresh);
    expect(persistence).toEqual({ ok: true });
    const outcome = await runVzSchoolYearBindingAfterPersist(
      persistence,
      ensureVzSchoolYearPlatformBinding,
    );
    expect(outcome.bindingAttempted).toBe(true);
    if (!outcome.bindingAttempted || outcome.binding.status !== "ready") return;
    expect(outcome.binding.schoolYearId).toBe(yearId);
    expect(readActiveSchoolYearId()).toBe(yearId);
  });

  it("persist fail gate never calls ensure (integration)", async () => {
    const ensure = vi.fn(ensureVzSchoolYearPlatformBinding);
    const outcome = await runVzSchoolYearBindingAfterPersist(
      { ok: false, saveIssue: { code: "quota_exceeded" } },
      ensure,
    );
    expect(ensure).not.toHaveBeenCalled();
    expect(outcome.bindingAttempted).toBe(false);
  });
});
