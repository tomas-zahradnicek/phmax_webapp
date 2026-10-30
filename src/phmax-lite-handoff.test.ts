import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildPvFullSnapshotFromLite,
  buildSdFullSnapshotFromLite,
  buildZsFullSnapshotFromLite,
  writeZsLiteHandoffToFullStorage,
} from "./phmax-lite-handoff";
import { ZS_AUTOSAVE_STORAGE_KEY } from "./zs/zs-form-snapshot";

const completePhmax = {
  basicType: "full_more_than_2" as const,
  basic1Classes: 3,
  basic1Pupils: 51,
  basic2Classes: 2,
  basic2Pupils: 34,
  incl1Classes: 0,
  incl1Pupils: 0,
  incl2Classes: 0,
  incl2Pupils: 0,
};

function installStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("phmax-lite-handoff", () => {
  it("PV: přenese jedno pracoviště včetně § 16 a § 1d polí", () => {
    const snap = buildPvFullSnapshotFromLite({
      provoz: "celodenni",
      classCount: 2,
      avgHours: 10,
      soleMsInMunicipality: true,
      actualChildren: 20,
      sec16ClassCount: 1,
    });
    expect(snap.rows).toHaveLength(1);
    expect(snap.rows[0].classCount).toBe(2);
    expect(snap.rows[0].sec16Count).toBe(1);
    expect(snap.rows[0].pv1dActualChildren).toBe(20);
    expect(snap.rows[0].pv1dMinimumChildren).toBe(25);
  });

  it("ŠD: zapne výjimku § 10 při průměru pod 20", () => {
    const snap = buildSdFullSnapshotFromLite({
      pupils: 35,
      manualDepartments: true,
      departments: 2,
      schoolFirstStageClassCount: null,
    });
    expect(snap.regularExceptionGranted).toBe(true);
    expect(snap.departments).toBe(2);
  });

  it("ZŠ: přenese typ školy a běžné třídy", () => {
    const snap = buildZsFullSnapshotFromLite({
      basicType: "full_more_than_2",
      basic1Classes: 3,
      basic1Pupils: 51,
      basic2Classes: 2,
      basic2Pupils: 34,
      incl1Classes: 0,
      incl1Pupils: 0,
      incl2Classes: 0,
      incl2Pupils: 0,
    });
    expect(snap.basicType).toBe("full_more_than_2");
    expect(snap.basic1Classes).toBe(3);
    expect(snap.basic2Classes).toBe(2);
    expect(snap.tab).toBe("phmax");
    expect(snap.mode).toBe("phmax_full_zs");
    expect(snap.basic1Pupils).toBe(51);
    expect(snap.basic2Pupils).toBe(34);
    expect(snap.pha1rClasses).toEqual([]);
    expect(snap.schoolEstablishedSec16_9).toBe(false);
    expect(snap.schoolAtInstitutionalOrProtectiveCare).toBe(false);
    expect(snap.schoolAtHealthcareFacility).toBe(false);
  });

  it("ZŠ: s § 16/9 přepne režim na phmax_full_zs_sec16", () => {
    const snap = buildZsFullSnapshotFromLite({
      basicType: "full_more_than_2",
      basic1Classes: 3,
      basic1Pupils: 51,
      basic2Classes: 2,
      basic2Pupils: 34,
      incl1Classes: 1,
      incl1Pupils: 10,
      incl2Classes: 0,
      incl2Pupils: 0,
    });
    expect(snap.mode).toBe("phmax_full_zs_sec16");
    expect(snap.incl1Classes).toBe(1);
    expect(snap.pha1rClasses).toEqual([]);
    expect(snap.schoolEstablishedSec16_9).toBe(false);
  });

  it("C: přenese jednu třídu PHA1R beze změny PHmax", () => {
    const row = { id: 1, grade1Pupils: 15, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false };
    const snap = buildZsFullSnapshotFromLite({ ...completePhmax, pha1rClasses: [row] });
    expect(snap.pha1rClasses).toEqual([row]);
    expect(snap.basic1Classes).toBe(3);
    expect(snap.basic1Pupils).toBe(51);
    expect(snap.basic2Classes).toBe(2);
    expect(snap.basic2Pupils).toBe(34);
    expect(snap.mode).toBe("phmax_full_zs");
  });

  it("D: přenese více tříd PHA1R", () => {
    const rows = [
      { id: 1, grade1Pupils: 15, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false },
      { id: 2, grade1Pupils: 16, grade1Par38: 1, grade1Par41: 0, establishedSec16_9: true },
    ];
    const snap = buildZsFullSnapshotFromLite({ ...completePhmax, pha1rClasses: rows });
    expect(snap.pha1rClasses).toEqual(rows);
  });

  it("E: přenese všechny tři školní výluky", () => {
    const snap = buildZsFullSnapshotFromLite({
      ...completePhmax,
      schoolEstablishedSec16_9: true,
      schoolAtInstitutionalOrProtectiveCare: true,
      schoolAtHealthcareFacility: true,
    });
    expect(snap.schoolEstablishedSec16_9).toBe(true);
    expect(snap.schoolAtInstitutionalOrProtectiveCare).toBe(true);
    expect(snap.schoolAtHealthcareFacility).toBe(true);
    expect(snap.basic1Pupils).toBe(51);
  });

  it("F: neplatné PHA1R handoff odmítne a nepřepíše autosave plné kalkulačky", () => {
    const store = installStorage();
    const previous = JSON.stringify({ basic1Pupils: 99, marker: "keep" });
    store.set(ZS_AUTOSAVE_STORAGE_KEY, previous);

    const result = writeZsLiteHandoffToFullStorage({
      ...completePhmax,
      pha1rClasses: [{ id: 1, grade1Pupils: 10, grade1Par38: 6, grade1Par41: 6, establishedSec16_9: false }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === "invalid_pha1r") {
      expect(result.issues.some((issue) => issue.code === "par_sum_exceeds_grade1")).toBe(true);
    } else {
      expect(result).toEqual({ ok: false, reason: "invalid_pha1r", issues: expect.any(Array) });
    }
    expect(store.get(ZS_AUTOSAVE_STORAGE_KEY)).toBe(previous);
    expect(() =>
      buildZsFullSnapshotFromLite({
        ...completePhmax,
        pha1rClasses: [{ id: 1, grade1Pupils: -1, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false }],
      }),
    ).toThrow(/PHA1Rmax/);
  });

  it("H: Lite § 16 nenastaví výluku PHA1R", () => {
    const snap = buildZsFullSnapshotFromLite({
      ...completePhmax,
      incl1Classes: 1,
      incl1Pupils: 8,
      pha1rClasses: [{ grade1Pupils: 15, grade1Par38: 0, grade1Par41: 0 }],
    });
    expect(snap.mode).toBe("phmax_full_zs_sec16");
    expect(snap.incl1Classes).toBe(1);
    expect(snap.schoolEstablishedSec16_9).toBe(false);
    expect(snap.schoolAtInstitutionalOrProtectiveCare).toBe(false);
    expect(snap.schoolAtHealthcareFacility).toBe(false);
    expect(snap.pha1rClasses).toEqual([
      { id: 1, grade1Pupils: 15, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false },
    ]);
  });

  it("I: neúplný PHmax nepřepíše autosave plné kalkulačky", () => {
    const store = installStorage();
    const previous = JSON.stringify({ marker: "full-autosave" });
    store.set(ZS_AUTOSAVE_STORAGE_KEY, previous);

    const result = writeZsLiteHandoffToFullStorage({
      ...completePhmax,
      basic1Classes: 0,
      pha1rClasses: [{ id: 1, grade1Pupils: -3, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false }],
    });

    expect(result).toEqual({ ok: false, reason: "incomplete_phmax" });
    expect(store.get(ZS_AUTOSAVE_STORAGE_KEY)).toBe(previous);
  });

  it("J: volající jen s PHmax zůstanou kompatibilní", () => {
    const store = installStorage();
    const result = writeZsLiteHandoffToFullStorage(completePhmax);
    expect(result).toEqual({ ok: true });
    const stored = JSON.parse(store.get(ZS_AUTOSAVE_STORAGE_KEY) ?? "{}") as Record<string, unknown>;
    expect(stored.basic1Classes).toBe(3);
    expect(stored.basic2Pupils).toBe(34);
    expect(stored.tab).toBe("phmax");
    expect(stored.mode).toBe("phmax_full_zs");
    expect(stored.pha1rClasses).toEqual([]);
    expect(stored.schoolEstablishedSec16_9).toBe(false);
    expect(stored.schoolAtInstitutionalOrProtectiveCare).toBe(false);
    expect(stored.schoolAtHealthcareFacility).toBe(false);
    expect(stored._phmaxLiteHandoff).toBe(true);
    expect(ZS_AUTOSAVE_STORAGE_KEY).toBe("edu-cz-zs-calculator-state");
  });
});
