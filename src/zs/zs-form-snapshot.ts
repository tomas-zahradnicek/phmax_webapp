import type { CalculatorMode } from "../config/calculator-config";
import {
  type BasicType,
  type GymRow,
  type HealthRow,
  type MixedRow,
  type PhaRow,
  type PsychRow,
} from "../phmax-zs-logic";
import type { ZsHeroExampleKey } from "../zs-hero-example-groups";
import { clampZsBasicWizardStep, type ZsBasicWizardStep } from "../zs-basic-wizard";
import { B17_B21 } from "../phmax-zs-logic";
import { sanitizeZsAutosaveSnapshot } from "./zs-snapshot-row-sanitize";

export const ZS_AUTOSAVE_STORAGE_KEY = "edu-cz-zs-calculator-state";

export type ZsTabKey = "phmax" | "pha" | "php";
export type ZsPhpWizardStep = "a" | "b" | "c" | "d";
export type ZsPhpMethodMode = "three_year_avg" | "short_period";
export type ZsWizardChoice =
  | ""
  | "php_small"
  | "php_deductions"
  | "ph_inclusion"
  | "ph_psych"
  | "ph_health"
  | "ph_mixed"
  | "ph_prep"
  | "ph_gym"
  | "ph_minority";
export type ZsDataMode = "own" | "example";

export type ZsFormSnapshotState = {
  tab: ZsTabKey;
  mode: CalculatorMode;
  basicType: BasicType;
  basic1Classes: number;
  basic1Pupils: number;
  basic2Classes: number;
  basic2Pupils: number;
  incl1Classes: number;
  incl1Pupils: number;
  incl2Classes: number;
  incl2Pupils: number;
  psychRows: PsychRow[];
  healthRows: HealthRow[];
  exportLabel: string;
  minorityType: keyof typeof B17_B21;
  minority1Classes: number;
  minority1Pupils: number;
  minority2Classes: number;
  minority2Pupils: number;
  gymRows: GymRow[];
  mixedRows: MixedRow[];
  special1Classes: number;
  special1Pupils: number;
  special2Classes: number;
  special2Pupils: number;
  specialIIClasses: number;
  specialIIPupils: number;
  prepClasses: number;
  prepChildren: number;
  prepSpecialClasses: number;
  prepSpecialChildren: number;
  p38First: number;
  p38Second: number;
  p41First: number;
  p41Second: number;
  phaRows: PhaRow[];
  phpYear1: number;
  phpYear2: number;
  phpYear3: number;
  phpWizardStep: ZsPhpWizardStep;
  phpMethodMode: ZsPhpMethodMode;
  phpExcludedAbroad: number;
  phpExcludedForeignSchoolCz: number;
  phpExcludedIndividual: number;
  phpExcludedSchool: boolean;
  selectedExample: ZsHeroExampleKey | "";
  wizardChoice: ZsWizardChoice;
  zsWizardStep: ZsBasicWizardStep;
  dataMode: ZsDataMode;
  nv75Role: "ucitel" | "reditel";
  nv75School: "plavecka_skola";
  nv75TeacherMin: number;
  nv75TeacherMax: number;
  mixedMethodFirstZsPupils: number;
  mixedMethodFirstZsClasses: number;
  mixedMethodFirstSpecialPupils: number;
  mixedMethodFirstSpecialClasses: number;
  mixedMethodSecondZsPupils: number;
  mixedMethodSecondZsClasses: number;
  mixedMethodSecondSpecialPupils: number;
  mixedMethodSecondSpecialClasses: number;
  auditTotals: {
    totalPhmax: number;
    totalPha: number;
    totalPhp: number;
    tab: ZsTabKey;
  };
};

export function buildZsFormSnapshot(state: ZsFormSnapshotState): Record<string, unknown> {
  return {
    tab: state.tab,
    mode: state.mode,
    basicType: state.basicType,
    basic1Classes: state.basic1Classes,
    basic1Pupils: state.basic1Pupils,
    basic2Classes: state.basic2Classes,
    basic2Pupils: state.basic2Pupils,
    incl1Classes: state.incl1Classes,
    incl1Pupils: state.incl1Pupils,
    incl2Classes: state.incl2Classes,
    incl2Pupils: state.incl2Pupils,
    psychRows: state.psychRows,
    healthRows: state.healthRows,
    exportLabel: state.exportLabel,
    minorityType: state.minorityType,
    minority1Classes: state.minority1Classes,
    minority1Pupils: state.minority1Pupils,
    minority2Classes: state.minority2Classes,
    minority2Pupils: state.minority2Pupils,
    gymRows: state.gymRows,
    mixedRows: state.mixedRows,
    special1Classes: state.special1Classes,
    special1Pupils: state.special1Pupils,
    special2Classes: state.special2Classes,
    special2Pupils: state.special2Pupils,
    specialIIClasses: state.specialIIClasses,
    specialIIPupils: state.specialIIPupils,
    prepClasses: state.prepClasses,
    prepChildren: state.prepChildren,
    prepSpecialClasses: state.prepSpecialClasses,
    prepSpecialChildren: state.prepSpecialChildren,
    p38First: state.p38First,
    p38Second: state.p38Second,
    p41First: state.p41First,
    p41Second: state.p41Second,
    phaRows: state.phaRows,
    phpYear1: state.phpYear1,
    phpYear2: state.phpYear2,
    phpYear3: state.phpYear3,
    phpWizardStep: state.phpWizardStep,
    phpMethodMode: state.phpMethodMode,
    phpExcludedAbroad: state.phpExcludedAbroad,
    phpExcludedForeignSchoolCz: state.phpExcludedForeignSchoolCz,
    phpExcludedIndividual: state.phpExcludedIndividual,
    phpExcludedSchool: state.phpExcludedSchool,
    selectedExample: state.selectedExample,
    wizardChoice: state.wizardChoice,
    zsWizardStep: state.zsWizardStep,
    dataMode: state.dataMode,
    nv75Role: state.nv75Role,
    nv75School: state.nv75School,
    nv75TeacherMin: state.nv75TeacherMin,
    nv75TeacherMax: state.nv75TeacherMax,
    mixedMethodFirstZsPupils: state.mixedMethodFirstZsPupils,
    mixedMethodFirstZsClasses: state.mixedMethodFirstZsClasses,
    mixedMethodFirstSpecialPupils: state.mixedMethodFirstSpecialPupils,
    mixedMethodFirstSpecialClasses: state.mixedMethodFirstSpecialClasses,
    mixedMethodSecondZsPupils: state.mixedMethodSecondZsPupils,
    mixedMethodSecondZsClasses: state.mixedMethodSecondZsClasses,
    mixedMethodSecondSpecialPupils: state.mixedMethodSecondSpecialPupils,
    mixedMethodSecondSpecialClasses: state.mixedMethodSecondSpecialClasses,
    _phmaxAuditTotals: state.auditTotals,
  };
}

export type ZsFormSnapshotSetters = {
  setTab: (v: ZsTabKey) => void;
  setMode: (v: CalculatorMode) => void;
  setBasicType: (v: BasicType) => void;
  setBasic1Classes: (v: number) => void;
  setBasic1Pupils: (v: number) => void;
  setBasic2Classes: (v: number) => void;
  setBasic2Pupils: (v: number) => void;
  setIncl1Classes: (v: number) => void;
  setIncl1Pupils: (v: number) => void;
  setIncl2Classes: (v: number) => void;
  setIncl2Pupils: (v: number) => void;
  setPsychRows: (v: PsychRow[]) => void;
  setHealthRows: (v: HealthRow[]) => void;
  setExportLabel: (v: string) => void;
  setMinorityType: (v: keyof typeof B17_B21) => void;
  setMinority1Classes: (v: number) => void;
  setMinority1Pupils: (v: number) => void;
  setMinority2Classes: (v: number) => void;
  setMinority2Pupils: (v: number) => void;
  setGymRows: (v: GymRow[]) => void;
  setMixedRows: (v: MixedRow[]) => void;
  setSpecial1Classes: (v: number) => void;
  setSpecial1Pupils: (v: number) => void;
  setSpecial2Classes: (v: number) => void;
  setSpecial2Pupils: (v: number) => void;
  setSpecialIIClasses: (v: number) => void;
  setSpecialIIPupils: (v: number) => void;
  setPrepClasses: (v: number) => void;
  setPrepChildren: (v: number) => void;
  setPrepSpecialClasses: (v: number) => void;
  setPrepSpecialChildren: (v: number) => void;
  setP38First: (v: number) => void;
  setP38Second: (v: number) => void;
  setP41First: (v: number) => void;
  setP41Second: (v: number) => void;
  setPhaRows: (v: PhaRow[]) => void;
  setPhpYear1: (v: number) => void;
  setPhpYear2: (v: number) => void;
  setPhpYear3: (v: number) => void;
  setPhpWizardStep: (v: ZsPhpWizardStep) => void;
  setPhpMethodMode: (v: ZsPhpMethodMode) => void;
  setPhpExcludedAbroad: (v: number) => void;
  setPhpExcludedForeignSchoolCz: (v: number) => void;
  setPhpExcludedIndividual: (v: number) => void;
  setPhpExcludedSchool: (v: boolean) => void;
  setSelectedExample: (v: ZsHeroExampleKey | "") => void;
  setWizardChoice: (v: ZsWizardChoice) => void;
  setZsWizardStep: (v: ZsBasicWizardStep) => void;
  setDataMode: (v: ZsDataMode) => void;
  setNv75Role: (v: "ucitel" | "reditel") => void;
  setNv75School: (v: "plavecka_skola") => void;
  setNv75TeacherMin: (v: number) => void;
  setNv75TeacherMax: (v: number) => void;
  setMixedMethodFirstZsPupils: (v: number) => void;
  setMixedMethodFirstZsClasses: (v: number) => void;
  setMixedMethodFirstSpecialPupils: (v: number) => void;
  setMixedMethodFirstSpecialClasses: (v: number) => void;
  setMixedMethodSecondZsPupils: (v: number) => void;
  setMixedMethodSecondZsClasses: (v: number) => void;
  setMixedMethodSecondSpecialPupils: (v: number) => void;
  setMixedMethodSecondSpecialClasses: (v: number) => void;
};

export function applyZsFormSnapshot(
  s: Record<string, unknown>,
  setters: ZsFormSnapshotSetters,
  notice: string,
  onNotice: (message: string) => void,
): void {
  const safe = sanitizeZsAutosaveSnapshot(s);
  if (safe.tab) setters.setTab(safe.tab as ZsTabKey);
  if (safe.mode) setters.setMode(safe.mode as CalculatorMode);
  if (safe.basicType) setters.setBasicType(safe.basicType as BasicType);
  setters.setBasic1Classes((safe.basic1Classes as number) ?? 0);
  setters.setBasic1Pupils((safe.basic1Pupils as number) ?? 0);
  setters.setBasic2Classes((safe.basic2Classes as number) ?? 0);
  setters.setBasic2Pupils((safe.basic2Pupils as number) ?? 0);
  setters.setIncl1Classes((safe.incl1Classes as number) ?? 0);
  setters.setIncl1Pupils((safe.incl1Pupils as number) ?? 0);
  setters.setIncl2Classes((safe.incl2Classes as number) ?? 0);
  setters.setIncl2Pupils((safe.incl2Pupils as number) ?? 0);
  setters.setPsychRows((safe.psychRows as PsychRow[]) ?? []);
  setters.setHealthRows((safe.healthRows as HealthRow[]) ?? []);
  setters.setExportLabel(typeof safe.exportLabel === "string" ? safe.exportLabel : "");
  if (safe.minorityType) setters.setMinorityType(safe.minorityType as keyof typeof B17_B21);
  setters.setMinority1Classes((safe.minority1Classes as number) ?? 0);
  setters.setMinority1Pupils((safe.minority1Pupils as number) ?? 0);
  setters.setMinority2Classes((safe.minority2Classes as number) ?? 0);
  setters.setMinority2Pupils((safe.minority2Pupils as number) ?? 0);
  setters.setGymRows((safe.gymRows as GymRow[]) ?? []);
  setters.setMixedRows((safe.mixedRows as MixedRow[]) ?? []);
  setters.setSpecial1Classes((safe.special1Classes as number) ?? 0);
  setters.setSpecial1Pupils((safe.special1Pupils as number) ?? 0);
  setters.setSpecial2Classes((safe.special2Classes as number) ?? 0);
  setters.setSpecial2Pupils((safe.special2Pupils as number) ?? 0);
  setters.setSpecialIIClasses((safe.specialIIClasses as number) ?? 0);
  setters.setSpecialIIPupils((safe.specialIIPupils as number) ?? 0);
  setters.setPrepClasses((safe.prepClasses as number) ?? 0);
  setters.setPrepChildren((safe.prepChildren as number) ?? 0);
  setters.setPrepSpecialClasses((safe.prepSpecialClasses as number) ?? 0);
  setters.setPrepSpecialChildren((safe.prepSpecialChildren as number) ?? 0);
  setters.setP38First((safe.p38First as number) ?? 0);
  setters.setP38Second((safe.p38Second as number) ?? 0);
  setters.setP41First((safe.p41First as number) ?? 0);
  setters.setP41Second((safe.p41Second as number) ?? 0);
  setters.setPhaRows((safe.phaRows as PhaRow[]) ?? []);
  setters.setPhpYear1((safe.phpYear1 as number) ?? 0);
  setters.setPhpYear2((safe.phpYear2 as number) ?? 0);
  setters.setPhpYear3((safe.phpYear3 as number) ?? 0);
  if (safe.phpWizardStep) setters.setPhpWizardStep(safe.phpWizardStep as ZsPhpWizardStep);
  if (safe.phpMethodMode) setters.setPhpMethodMode(safe.phpMethodMode as ZsPhpMethodMode);
  setters.setPhpExcludedAbroad((safe.phpExcludedAbroad as number) ?? 0);
  setters.setPhpExcludedForeignSchoolCz((safe.phpExcludedForeignSchoolCz as number) ?? 0);
  setters.setPhpExcludedIndividual((safe.phpExcludedIndividual as number) ?? 0);
  setters.setPhpExcludedSchool(Boolean(safe.phpExcludedSchool));
  setters.setSelectedExample((safe.selectedExample as ZsHeroExampleKey) ?? "");
  setters.setWizardChoice((safe.wizardChoice as ZsWizardChoice) ?? "");
  if (typeof safe.zsWizardStep === "number") {
    setters.setZsWizardStep(clampZsBasicWizardStep(safe.zsWizardStep));
  }
  setters.setDataMode((safe.dataMode as ZsDataMode) ?? "own");
  setters.setNv75Role(safe.nv75Role === "reditel" ? "reditel" : "ucitel");
  setters.setNv75School("plavecka_skola");
  setters.setNv75TeacherMin(typeof safe.nv75TeacherMin === "number" ? safe.nv75TeacherMin : 22);
  setters.setNv75TeacherMax(typeof safe.nv75TeacherMax === "number" ? safe.nv75TeacherMax : 30);
  setters.setMixedMethodFirstZsPupils((safe.mixedMethodFirstZsPupils as number) ?? 0);
  setters.setMixedMethodFirstZsClasses((safe.mixedMethodFirstZsClasses as number) ?? 0);
  setters.setMixedMethodFirstSpecialPupils((safe.mixedMethodFirstSpecialPupils as number) ?? 0);
  setters.setMixedMethodFirstSpecialClasses((safe.mixedMethodFirstSpecialClasses as number) ?? 0);
  setters.setMixedMethodSecondZsPupils((safe.mixedMethodSecondZsPupils as number) ?? 0);
  setters.setMixedMethodSecondZsClasses((safe.mixedMethodSecondZsClasses as number) ?? 0);
  setters.setMixedMethodSecondSpecialPupils((safe.mixedMethodSecondSpecialPupils as number) ?? 0);
  setters.setMixedMethodSecondSpecialClasses((safe.mixedMethodSecondSpecialClasses as number) ?? 0);
  onNotice(notice);
}
