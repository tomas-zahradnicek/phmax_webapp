import { describe, expect, it, vi } from "vitest";
import {
  applyZsResetAll,
  applyZsResetNv75,
  applyZsResetPhmax,
  applyZsResetPhp,
} from "./zs-form-reset";
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

describe("zs-form-reset", () => {
  it("applyZsResetPhmax vynuluje běžné třídy a řádky", () => {
    const s = mockSetters();
    applyZsResetPhmax(s);
    expect(s.setBasic1Classes).toHaveBeenCalledWith(0);
    expect(s.setPsychRows).toHaveBeenCalledWith([]);
    expect(s.setMixedRows).toHaveBeenCalledWith([]);
  });

  it("applyZsResetPhp nastaví výchozí režim", () => {
    const s = mockSetters();
    applyZsResetPhp(s);
    expect(s.setPhpMethodMode).toHaveBeenCalledWith("three_year_avg");
    expect(s.setPhpExcludedSchool).toHaveBeenCalledWith(false);
  });

  it("applyZsResetNv75 nastaví výchozí roli a rozsah", () => {
    const s = mockSetters();
    applyZsResetNv75(s);
    expect(s.setNv75Role).toHaveBeenCalledWith("ucitel");
    expect(s.setNv75TeacherMin).toHaveBeenCalledWith(22);
  });

  it("applyZsResetAll vymaže formulář a přepne na phmax", () => {
    const s = mockSetters();
    applyZsResetAll(s);
    expect(s.setTab).toHaveBeenCalledWith("phmax");
    expect(s.setDataMode).toHaveBeenCalledWith("own");
    expect(s.setPhaRows).toHaveBeenCalledWith([]);
  });
});
