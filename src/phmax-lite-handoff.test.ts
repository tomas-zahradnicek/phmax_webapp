import { describe, expect, it } from "vitest";
import {
  buildPvFullSnapshotFromLite,
  buildSdFullSnapshotFromLite,
  buildZsFullSnapshotFromLite,
} from "./phmax-lite-handoff";

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
  });
});
