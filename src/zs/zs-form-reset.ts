import type { ZsFormSnapshotSetters } from "./zs-form-snapshot";

export function applyZsResetPhmax(s: ZsFormSnapshotSetters): void {
  s.setBasicType("full_more_than_2");
  s.setBasic1Classes(0);
  s.setBasic1Pupils(0);
  s.setBasic2Classes(0);
  s.setBasic2Pupils(0);

  s.setIncl1Classes(0);
  s.setIncl1Pupils(0);
  s.setIncl2Classes(0);
  s.setIncl2Pupils(0);

  s.setPsychRows([]);
  s.setHealthRows([]);
  s.setMinorityType("minority1");
  s.setMinority1Classes(0);
  s.setMinority1Pupils(0);
  s.setMinority2Classes(0);
  s.setMinority2Pupils(0);

  s.setGymRows([]);
  s.setMixedRows([]);

  s.setSpecial1Classes(0);
  s.setMixedMethodFirstZsPupils(0);
  s.setMixedMethodFirstZsClasses(0);
  s.setMixedMethodFirstSpecialPupils(0);
  s.setMixedMethodFirstSpecialClasses(0);
  s.setMixedMethodSecondZsPupils(0);
  s.setMixedMethodSecondZsClasses(0);
  s.setMixedMethodSecondSpecialPupils(0);
  s.setMixedMethodSecondSpecialClasses(0);

  s.setSpecial1Pupils(0);
  s.setSpecial2Classes(0);
  s.setSpecial2Pupils(0);
  s.setSpecialIIClasses(0);
  s.setSpecialIIPupils(0);

  s.setPrepClasses(0);
  s.setPrepChildren(0);
  s.setPrepSpecialClasses(0);
  s.setPrepSpecialChildren(0);
  s.setP38First(0);
  s.setP38Second(0);
  s.setP41First(0);
  s.setP41Second(0);
}

export function applyZsResetPha(s: ZsFormSnapshotSetters): void {
  s.setPhaRows([]);
}

export function applyZsResetPhp(s: ZsFormSnapshotSetters): void {
  s.setPhpWizardStep("a");
  s.setPhpMethodMode("three_year_avg");
  s.setPhpYear1(0);
  s.setPhpYear2(0);
  s.setPhpYear3(0);
  s.setPhpExcludedAbroad(0);
  s.setPhpExcludedForeignSchoolCz(0);
  s.setPhpExcludedIndividual(0);
  s.setPhpExcludedSchool(false);
}

export function applyZsResetNv75(s: ZsFormSnapshotSetters): void {
  s.setNv75Role("ucitel");
  s.setNv75School("plavecka_skola");
  s.setNv75TeacherMin(22);
  s.setNv75TeacherMax(30);
}

export function applyZsResetAll(s: ZsFormSnapshotSetters): void {
  applyZsResetPhmax(s);
  applyZsResetPha(s);
  applyZsResetPhp(s);
  applyZsResetNv75(s);
  s.setSelectedExample("");
  s.setWizardChoice("");
  s.setDataMode("own");
  s.setExportLabel("");
  s.setTab("phmax");
}
