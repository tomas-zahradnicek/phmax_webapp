import { describe, expect, it, vi } from "vitest";
import { B11_B13, PHA_TABLE, pickBand, round2 } from "../phmax-zs-logic";
import { findZsModeBySections, loadZsHeroExample } from "./zs-hero-example-load";
import type { ZsFormSnapshotSetters } from "./zs-form-snapshot";

function mockSetters(): ZsFormSnapshotSetters {
  const keys = [
    "setTab",
    "setMode",
    "setBasicType",
    "setBasic1Classes",
    "setBasic1Pupils",
    "setBasic2Classes",
    "setBasic2Pupils",
    "setIncl1Classes",
    "setIncl1Pupils",
    "setIncl2Classes",
    "setIncl2Pupils",
    "setPsychRows",
    "setHealthRows",
    "setExportLabel",
    "setMinorityType",
    "setMinority1Classes",
    "setMinority1Pupils",
    "setMinority2Classes",
    "setMinority2Pupils",
    "setGymRows",
    "setMixedRows",
    "setSpecial1Classes",
    "setSpecial1Pupils",
    "setSpecial2Classes",
    "setSpecial2Pupils",
    "setSpecialIIClasses",
    "setSpecialIIPupils",
    "setPrepClasses",
    "setPrepChildren",
    "setPrepSpecialClasses",
    "setPrepSpecialChildren",
    "setP38First",
    "setP38Second",
    "setP41First",
    "setP41Second",
    "setPhaRows",
    "setPhpYear1",
    "setPhpYear2",
    "setPhpYear3",
    "setPhpWizardStep",
    "setPhpMethodMode",
    "setPhpExcludedAbroad",
    "setPhpExcludedForeignSchoolCz",
    "setPhpExcludedIndividual",
    "setPhpExcludedSchool",
    "setSelectedExample",
    "setWizardChoice",
    "setZsWizardStep",
    "setDataMode",
    "setNv75Role",
    "setNv75School",
    "setNv75TeacherMin",
    "setNv75TeacherMax",
    "setMixedMethodFirstZsPupils",
    "setMixedMethodFirstZsClasses",
    "setMixedMethodFirstSpecialPupils",
    "setMixedMethodFirstSpecialClasses",
    "setMixedMethodSecondZsPupils",
    "setMixedMethodSecondZsClasses",
    "setMixedMethodSecondSpecialPupils",
    "setMixedMethodSecondSpecialClasses",
  ] as const;
  const out = {} as ZsFormSnapshotSetters;
  for (const key of keys) {
    (out as Record<string, ReturnType<typeof vi.fn>>)[key] = vi.fn();
  }
  return out;
}

function heroCtx(setters: ZsFormSnapshotSetters) {
  return {
    setters,
    createEmptyGymRow: (id: number) => ({ id, kind: "gym8" as const, classes: 0, pupils: 0 }),
    createEmptyMixedRow: (id: number) => ({ id, stage: "first" as const, majority: "zs" as const, classes: 0, pupils: 0 }),
    createEmptyPhaRow: (id: number) => ({ id, kind: "zs1" as const, classes: 0, pupils: 0 }),
    applyResetPhmax: () => undefined,
    applyResetPha: () => undefined,
    applyResetPhp: () => undefined,
    resetNv75: () => undefined,
  };
}

describe("ZŠ metodika B11–B13 a B45", () => {
  it("findZsModeBySections najde režim pro health_groups", () => {
    expect(findZsModeBySections("health_groups")).toBe("phmax_health_facility");
  });

  it("loadZsHeroExample zdravotnicke_zs nastaví health_rows", () => {
    const setters = mockSetters();
    loadZsHeroExample("zdravotnicke_zs", heroCtx(setters));
    expect(setters.setHealthRows).toHaveBeenCalledWith([
      expect.objectContaining({ kind: "health1", currentPupils: 8, currentClasses: 1 }),
    ]);
  });

  it("loadZsHeroExample pha_zss_prep_b45 otevře PHA s řádkem B45", () => {
    const setters = mockSetters();
    loadZsHeroExample("pha_zss_prep_b45", heroCtx(setters));
    expect(setters.setTab).toHaveBeenCalledWith("pha");
    expect(setters.setPhaRows).toHaveBeenCalledWith([{ id: 1, kind: "zssPrep", classes: 1, pupils: 4 }]);
  });

  it("B11 průměr 8 žáků → 19 h/třída (golden)", () => {
    const band = pickBand(8, B11_B13.health1);
    expect(band.value).toBe(19);
    expect(round2(1 * band.value)).toBe(19);
  });

  it("PHA B45 – 4 žáci ve třídě → 20 h (golden)", () => {
    const band = pickBand(4, PHA_TABLE.zssPrep);
    expect(band.value).toBe(20);
    expect(round2(1 * band.value)).toBe(20);
  });
});
