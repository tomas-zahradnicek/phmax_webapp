import {
  B11_B13,
  B14_B16,
  B17_B21,
  B22_B25,
  PHA_TABLE,
  type BasicType,
  type GymRow,
  type HealthRow,
  type MixedRow,
  type PhaRow,
  type PsychRow,
} from "../phmax-zs-logic";
import { MODE_CONFIG, type CalculatorMode } from "../config/calculator-config";
import { DEFAULT_MODE } from "../config/default-form-state";
import type { ZsHeroExampleKey } from "../zs-hero-example-groups";
import { clampZsBasicWizardStep } from "../zs-basic-wizard";

const BASIC_TYPES = new Set<string>([
  "full_more_than_2",
  "full_max_2",
  "first_only_1",
  "first_only_2",
  "first_only_3",
  "first_only_4",
]);

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function rowMode(v: unknown): "higher_of_two" | "current_only" {
  return v === "higher_of_two" ? "higher_of_two" : "current_only";
}

export function sanitizePsychRows(raw: unknown): PsychRow[] {
  if (!Array.isArray(raw)) return [];
  const out: PsychRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const kind = r.kind;
    if (typeof kind !== "string" || !(kind in B14_B16)) continue;
    out.push({
      id: num(r.id, i + 1),
      kind: kind as PsychRow["kind"],
      mode: rowMode(r.mode),
      currentPupils: num(r.currentPupils),
      currentClasses: num(r.currentClasses),
      prevPupils: num(r.prevPupils),
      prevClasses: num(r.prevClasses),
    });
  }
  return out;
}

export function sanitizeHealthRows(raw: unknown): HealthRow[] {
  if (!Array.isArray(raw)) return [];
  const out: HealthRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const kind = r.kind;
    if (typeof kind !== "string" || !(kind in B11_B13)) continue;
    out.push({
      id: num(r.id, i + 1),
      kind: kind as HealthRow["kind"],
      mode: rowMode(r.mode),
      currentPupils: num(r.currentPupils),
      currentClasses: num(r.currentClasses),
      prevPupils: num(r.prevPupils),
      prevClasses: num(r.prevClasses),
    });
  }
  return out;
}

export function sanitizeGymRows(raw: unknown): GymRow[] {
  if (!Array.isArray(raw)) return [];
  const out: GymRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const kind = r.kind;
    if (typeof kind !== "string" || !(kind in B22_B25)) continue;
    out.push({
      id: num(r.id, i + 1),
      kind: kind as GymRow["kind"],
      classes: num(r.classes),
      pupils: num(r.pupils),
    });
  }
  return out;
}

export function sanitizeMixedRows(raw: unknown): MixedRow[] {
  if (!Array.isArray(raw)) return [];
  const out: MixedRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const majority = r.majority === "special" ? "special" : "zs";
    const stage = r.stage === "second" ? "second" : "first";
    out.push({
      id: num(r.id, i + 1),
      majority,
      stage,
      classes: num(r.classes),
      pupils: num(r.pupils),
    });
  }
  return out;
}

export function sanitizePhaRows(raw: unknown): PhaRow[] {
  if (!Array.isArray(raw)) return [];
  const out: PhaRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const kind = r.kind;
    if (typeof kind !== "string" || !(kind in PHA_TABLE)) continue;
    out.push({
      id: num(r.id, i + 1),
      kind: kind as PhaRow["kind"],
      classes: num(r.classes),
      pupils: num(r.pupils),
    });
  }
  return out;
}

export function sanitizeCalculatorMode(raw: unknown): CalculatorMode {
  if (typeof raw === "string" && raw in MODE_CONFIG) return raw as CalculatorMode;
  return DEFAULT_MODE;
}

export function parseZsWizardStep(raw: unknown): 1 | 2 | 3 | 4 | 5 | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return clampZsBasicWizardStep(raw);
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) return clampZsBasicWizardStep(n);
  }
  return undefined;
}

export function sanitizeZsAutosaveSnapshot(raw: Record<string, unknown>): Record<string, unknown> {
  const basicTypeRaw = raw.basicType;
  const basicType =
    typeof basicTypeRaw === "string" && BASIC_TYPES.has(basicTypeRaw)
      ? basicTypeRaw
      : "full_more_than_2";

  const minorityRaw = raw.minorityType;
  const minorityType =
    typeof minorityRaw === "string" && minorityRaw in B17_B21
      ? minorityRaw
      : "minorityFull1";

  const tabRaw = raw.tab;
  const tab = tabRaw === "pha" || tabRaw === "php" ? tabRaw : "phmax";

  const wizardStep = parseZsWizardStep(raw.zsWizardStep);

  return {
    ...raw,
    tab,
    mode: sanitizeCalculatorMode(raw.mode),
    basicType: basicType as BasicType,
    basic1Classes: num(raw.basic1Classes),
    basic1Pupils: num(raw.basic1Pupils),
    basic2Classes: num(raw.basic2Classes),
    basic2Pupils: num(raw.basic2Pupils),
    incl1Classes: num(raw.incl1Classes),
    incl1Pupils: num(raw.incl1Pupils),
    incl2Classes: num(raw.incl2Classes),
    incl2Pupils: num(raw.incl2Pupils),
    psychRows: sanitizePsychRows(raw.psychRows),
    healthRows: sanitizeHealthRows(raw.healthRows),
    gymRows: sanitizeGymRows(raw.gymRows),
    mixedRows: sanitizeMixedRows(raw.mixedRows),
    phaRows: sanitizePhaRows(raw.phaRows),
    minorityType: minorityType as keyof typeof B17_B21,
    minority1Classes: num(raw.minority1Classes),
    minority1Pupils: num(raw.minority1Pupils),
    minority2Classes: num(raw.minority2Classes),
    minority2Pupils: num(raw.minority2Pupils),
    special1Classes: num(raw.special1Classes),
    special1Pupils: num(raw.special1Pupils),
    special2Classes: num(raw.special2Classes),
    special2Pupils: num(raw.special2Pupils),
    specialIIClasses: num(raw.specialIIClasses),
    specialIIPupils: num(raw.specialIIPupils),
    prepClasses: num(raw.prepClasses),
    prepChildren: num(raw.prepChildren),
    prepSpecialClasses: num(raw.prepSpecialClasses),
    prepSpecialChildren: num(raw.prepSpecialChildren),
    p38First: num(raw.p38First),
    p38Second: num(raw.p38Second),
    p41First: num(raw.p41First),
    p41Second: num(raw.p41Second),
    phpYear1: num(raw.phpYear1),
    phpYear2: num(raw.phpYear2),
    phpYear3: num(raw.phpYear3),
    phpWizardStep:
      raw.phpWizardStep === "b" || raw.phpWizardStep === "c" || raw.phpWizardStep === "d"
        ? raw.phpWizardStep
        : "a",
    phpMethodMode: raw.phpMethodMode === "short_period" ? "short_period" : "three_year_avg",
    phpExcludedAbroad: num(raw.phpExcludedAbroad),
    phpExcludedForeignSchoolCz: num(raw.phpExcludedForeignSchoolCz),
    phpExcludedIndividual: num(raw.phpExcludedIndividual),
    phpExcludedSchool: Boolean(raw.phpExcludedSchool),
    exportLabel: typeof raw.exportLabel === "string" ? raw.exportLabel : "",
    selectedExample: typeof raw.selectedExample === "string" ? (raw.selectedExample as ZsHeroExampleKey) : "",
    wizardChoice: typeof raw.wizardChoice === "string" ? raw.wizardChoice : "",
    ...(wizardStep != null ? { zsWizardStep: wizardStep } : {}),
    dataMode: raw.dataMode === "example" ? "example" : "own",
    nv75Role: raw.nv75Role === "reditel" ? "reditel" : "ucitel",
    nv75School: "plavecka_skola",
    nv75TeacherMin: num(raw.nv75TeacherMin, 22),
    nv75TeacherMax: num(raw.nv75TeacherMax, 30),
    mixedMethodFirstZsPupils: num(raw.mixedMethodFirstZsPupils),
    mixedMethodFirstZsClasses: num(raw.mixedMethodFirstZsClasses),
    mixedMethodFirstSpecialPupils: num(raw.mixedMethodFirstSpecialPupils),
    mixedMethodFirstSpecialClasses: num(raw.mixedMethodFirstSpecialClasses),
    mixedMethodSecondZsPupils: num(raw.mixedMethodSecondZsPupils),
    mixedMethodSecondZsClasses: num(raw.mixedMethodSecondZsClasses),
    mixedMethodSecondSpecialPupils: num(raw.mixedMethodSecondSpecialPupils),
    mixedMethodSecondSpecialClasses: num(raw.mixedMethodSecondSpecialClasses),
  };
}
