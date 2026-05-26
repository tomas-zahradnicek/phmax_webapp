import { describe, expect, it, vi } from "vitest";
import { findZsModeBySections, getZsInitialPreferredMode, loadZsHeroExample } from "./zs-hero-example-load";
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

describe("zs-hero-example-load", () => {
  it("getZsInitialPreferredMode vrací režim úplné ZŠ", () => {
    const mode = getZsInitialPreferredMode();
    expect(typeof mode).toBe("string");
    expect(mode.length).toBeGreaterThan(0);
  });

  it("findZsModeBySections najde režim pro psych_groups", () => {
    const mode = findZsModeBySections("psych_groups");
    expect(typeof mode).toBe("string");
  });

  it("loadZsHeroExample u prázdného klíče přepne na vlastní školu", () => {
    const setters = mockSetters();
    loadZsHeroExample("", {
      setters,
      createEmptyGymRow: (id) => ({ id, kind: "gym8", classes: 0, pupils: 0 }),
      createEmptyMixedRow: (id) => ({ id, stage: "first", majority: "zs", classes: 0, pupils: 0 }),
      createEmptyPhaRow: (id) => ({ id, kind: "zs1", classes: 0, pupils: 0 }),
      applyResetPhmax: vi.fn(),
      applyResetPha: vi.fn(),
      applyResetPhp: vi.fn(),
      resetNv75: vi.fn(),
    });
    expect(setters.setSelectedExample).toHaveBeenCalledWith("");
    expect(setters.setDataMode).toHaveBeenCalledWith("own");
  });
});
