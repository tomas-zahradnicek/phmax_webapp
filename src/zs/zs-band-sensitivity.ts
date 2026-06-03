import {
  B11_B13,
  B13_MORE_THAN_2,
  B14_B16,
  B17_B21,
  B22_B25,
  B26_B28,
  B34_MAX_2,
  B5,
  B6,
  B7,
  B8,
  B9_B10,
  type BasicType,
  type GymRow,
  type HealthRow,
  type PsychRow,
} from "../phmax-zs-logic";
import { buildBandUpgradeHint, formatBandUpgradeHint } from "../phmax-band-sensitivity";

const PSYCH_SECTION: Record<keyof typeof B14_B16, string> = {
  psych1: "Psychiatrie – 1. stupeň",
  psych2: "Psychiatrie – 2. stupeň",
  psychMix: "Psychiatrie – smíšený",
};

const HEALTH_SECTION: Record<keyof typeof B11_B13, string> = {
  health1: "Zdravotní – 1. stupeň",
  health2: "Zdravotní – 2. stupeň",
  healthMix: "Zdravotní – smíšený",
};

const GYM_SECTION: Record<keyof typeof B22_B25, string> = {
  gym6: "Gymnázium – 6leté",
  gym8: "Gymnázium – 8leté",
  sport8: "Sportovní – 8leté",
  sport6: "Sportovní – 6leté",
};

const MINORITY_SECTION: Record<keyof typeof B17_B21, string> = {
  minorityFull1: "Menšinová škola – 1. stupeň",
  minorityFull2: "Menšinová škola – 2. stupeň",
  minority1: "Menšinová – varianta 1",
  minority2: "Menšinová – varianta 2",
  minority3: "Menšinová – varianta 3",
};

export type ZsBandSensitivityInput = {
  tab: "phmax" | "pha" | "php";
  basicType: BasicType;
  basic1Classes: number;
  basic1Pupils: number;
  basic2Classes: number;
  basic2Pupils: number;
  incl1Classes: number;
  incl1Pupils: number;
  incl2Classes: number;
  incl2Pupils: number;
  psychRows: readonly PsychRow[];
  healthRows: readonly HealthRow[];
  minorityType: keyof typeof B17_B21;
  minority1Classes: number;
  minority1Pupils: number;
  minority2Classes: number;
  minority2Pupils: number;
  gymRows: readonly GymRow[];
  special1Classes: number;
  special1Pupils: number;
  special2Classes: number;
  special2Pupils: number;
  specialIIClasses: number;
  specialIIPupils: number;
};

function pushHint(out: string[], section: string, classes: number, pupils: number, bands: readonly { label: string; test: (x: number) => boolean; value: number }[]) {
  const hint = buildBandUpgradeHint(section, classes, pupils, bands);
  if (hint) out.push(formatBandUpgradeHint(hint));
}

function psychUsedAvg(row: PsychRow): number {
  const avgCurrent = row.currentClasses > 0 ? row.currentPupils / row.currentClasses : 0;
  const avgPrev = row.prevClasses > 0 ? row.prevPupils / row.prevClasses : 0;
  return row.mode === "current_only" ? avgCurrent : Math.max(avgCurrent, avgPrev);
}

/** Orientační nápovědy: kolik žáků/tříd chybí k vyššímu pásmu PHmax (záložka phmax). */
export function buildZsBandUpgradeHints(input: ZsBandSensitivityInput, maxHints = 6): string[] {
  if (input.tab !== "phmax") return [];

  const out: string[] = [];
  const isFull = input.basicType === "full_more_than_2" || input.basicType === "full_max_2";

  if (input.basic1Classes > 0 && input.basic1Pupils >= 0) {
    const bands =
      input.basicType === "full_more_than_2"
        ? B13_MORE_THAN_2.first
        : input.basicType === "full_max_2"
          ? B34_MAX_2.first
          : input.basicType === "first_only_1"
            ? B5
            : input.basicType === "first_only_2"
              ? B6
              : input.basicType === "first_only_3"
                ? B7
                : B8;
    pushHint(out, "Základní škola – 1. stupeň", input.basic1Classes, input.basic1Pupils, bands);
  }

  if (isFull && input.basic2Classes > 0) {
    const bands =
      input.basicType === "full_more_than_2" ? B13_MORE_THAN_2.second : B34_MAX_2.second;
    pushHint(out, "Základní škola – 2. stupeň", input.basic2Classes, input.basic2Pupils, bands);
  }

  if (input.incl1Classes > 0) pushHint(out, "Inkluzivní – 1. stupeň", input.incl1Classes, input.incl1Pupils, B9_B10.first);
  if (input.incl2Classes > 0) pushHint(out, "Inkluzivní – 2. stupeň", input.incl2Classes, input.incl2Pupils, B9_B10.second);

  for (const row of input.psychRows) {
    if (row.currentClasses <= 0) continue;
    const avg = psychUsedAvg(row);
    const pupils = row.currentClasses * avg;
    pushHint(out, PSYCH_SECTION[row.kind], row.currentClasses, Math.round(pupils), B14_B16[row.kind]);
  }

  for (const row of input.healthRows) {
    if (row.currentClasses <= 0) continue;
    const avgCurrent = row.currentClasses > 0 ? row.currentPupils / row.currentClasses : 0;
    const avgPrev = row.prevClasses > 0 ? row.prevPupils / row.prevClasses : 0;
    const avg = row.mode === "current_only" ? avgCurrent : Math.max(avgCurrent, avgPrev);
    pushHint(out, HEALTH_SECTION[row.kind], row.currentClasses, Math.round(row.currentClasses * avg), B11_B13[row.kind]);
  }

  if (input.minority1Classes > 0) {
    pushHint(out, MINORITY_SECTION[input.minorityType], input.minority1Classes, input.minority1Pupils, B17_B21[input.minorityType]);
  }
  if (input.minorityType === "minorityFull1" && input.minority2Classes > 0) {
    pushHint(out, MINORITY_SECTION.minorityFull2, input.minority2Classes, input.minority2Pupils, B17_B21.minorityFull2);
  }

  for (const row of input.gymRows) {
    if (row.classes <= 0) continue;
    pushHint(out, GYM_SECTION[row.kind], row.classes, row.pupils, B22_B25[row.kind]);
  }

  if (input.special1Classes > 0) pushHint(out, "ZŠ speciální I", input.special1Classes, input.special1Pupils, B26_B28.special1);
  if (input.special2Classes > 0) pushHint(out, "ZŠ speciální II", input.special2Classes, input.special2Pupils, B26_B28.special2);
  if (input.specialIIClasses > 0) pushHint(out, "ZŠ speciální II. stupeň", input.specialIIClasses, input.specialIIPupils, B26_B28.specialII);

  return out.slice(0, maxHints);
}

export function buildZsBandUpgradeHintsFromSnapshot(snapshot: unknown, maxHints = 6): string[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const s = snapshot as Record<string, unknown>;
  if (s.tab !== "phmax" && s.tab !== undefined) {
    if (typeof s.tab === "string" && s.tab !== "phmax") return [];
  }

  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

  return buildZsBandUpgradeHints(
    {
      tab: "phmax",
      basicType: (s.basicType as BasicType) || "full_more_than_2",
      basic1Classes: num(s.basic1Classes),
      basic1Pupils: num(s.basic1Pupils),
      basic2Classes: num(s.basic2Classes),
      basic2Pupils: num(s.basic2Pupils),
      incl1Classes: num(s.incl1Classes),
      incl1Pupils: num(s.incl1Pupils),
      incl2Classes: num(s.incl2Classes),
      incl2Pupils: num(s.incl2Pupils),
      psychRows: arr<PsychRow>(s.psychRows),
      healthRows: arr<HealthRow>(s.healthRows),
      minorityType: (s.minorityType as keyof typeof B17_B21) || "minorityFull1",
      minority1Classes: num(s.minority1Classes),
      minority1Pupils: num(s.minority1Pupils),
      minority2Classes: num(s.minority2Classes),
      minority2Pupils: num(s.minority2Pupils),
      gymRows: arr<GymRow>(s.gymRows),
      special1Classes: num(s.special1Classes),
      special1Pupils: num(s.special1Pupils),
      special2Classes: num(s.special2Classes),
      special2Pupils: num(s.special2Pupils),
      specialIIClasses: num(s.specialIIClasses),
      specialIIPupils: num(s.specialIIPupils),
    },
    maxHints,
  );
}
