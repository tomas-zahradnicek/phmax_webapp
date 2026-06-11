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
  type MixedRow,
  type PsychRow,
  pickBand,
  round2,
} from "../phmax-zs-logic";

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Vstupy pro přepočet PHmax – stejná pole jako v autosave ZŠ (bez závislosti na aktivní záložce). */
export type ZsPhmaxComputeFields = {
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
  mixedMethodFirstZsPupils: number;
  mixedMethodFirstZsClasses: number;
  mixedMethodFirstSpecialPupils: number;
  mixedMethodFirstSpecialClasses: number;
  mixedMethodSecondZsPupils: number;
  mixedMethodSecondZsClasses: number;
  mixedMethodSecondSpecialPupils: number;
  mixedMethodSecondSpecialClasses: number;
};

export function parseZsPhmaxComputeFields(snapshot: Record<string, unknown>): ZsPhmaxComputeFields {
  return {
    basicType: (snapshot.basicType as BasicType) || "full_more_than_2",
    basic1Classes: num(snapshot.basic1Classes),
    basic1Pupils: num(snapshot.basic1Pupils),
    basic2Classes: num(snapshot.basic2Classes),
    basic2Pupils: num(snapshot.basic2Pupils),
    incl1Classes: num(snapshot.incl1Classes),
    incl1Pupils: num(snapshot.incl1Pupils),
    incl2Classes: num(snapshot.incl2Classes),
    incl2Pupils: num(snapshot.incl2Pupils),
    psychRows: arr<PsychRow>(snapshot.psychRows),
    healthRows: arr<HealthRow>(snapshot.healthRows),
    minorityType: (snapshot.minorityType as keyof typeof B17_B21) || "minorityFull1",
    minority1Classes: num(snapshot.minority1Classes),
    minority1Pupils: num(snapshot.minority1Pupils),
    minority2Classes: num(snapshot.minority2Classes),
    minority2Pupils: num(snapshot.minority2Pupils),
    gymRows: arr<GymRow>(snapshot.gymRows),
    mixedRows: arr<MixedRow>(snapshot.mixedRows),
    special1Classes: num(snapshot.special1Classes),
    special1Pupils: num(snapshot.special1Pupils),
    special2Classes: num(snapshot.special2Classes),
    special2Pupils: num(snapshot.special2Pupils),
    specialIIClasses: num(snapshot.specialIIClasses),
    specialIIPupils: num(snapshot.specialIIPupils),
    prepClasses: num(snapshot.prepClasses),
    prepChildren: num(snapshot.prepChildren),
    prepSpecialClasses: num(snapshot.prepSpecialClasses),
    prepSpecialChildren: num(snapshot.prepSpecialChildren),
    p38First: num(snapshot.p38First),
    p38Second: num(snapshot.p38Second),
    p41First: num(snapshot.p41First),
    p41Second: num(snapshot.p41Second),
    mixedMethodFirstZsPupils: num(snapshot.mixedMethodFirstZsPupils),
    mixedMethodFirstZsClasses: num(snapshot.mixedMethodFirstZsClasses),
    mixedMethodFirstSpecialPupils: num(snapshot.mixedMethodFirstSpecialPupils),
    mixedMethodFirstSpecialClasses: num(snapshot.mixedMethodFirstSpecialClasses),
    mixedMethodSecondZsPupils: num(snapshot.mixedMethodSecondZsPupils),
    mixedMethodSecondZsClasses: num(snapshot.mixedMethodSecondZsClasses),
    mixedMethodSecondSpecialPupils: num(snapshot.mixedMethodSecondSpecialPupils),
    mixedMethodSecondSpecialClasses: num(snapshot.mixedMethodSecondSpecialClasses),
  };
}

/** Jediný přepočet PHmax ze vstupních polí ZŠ – používá stránka, autosave i koherence. */
export function computeZsPhmaxTotalFromFields(fields: ZsPhmaxComputeFields): number {
  const {
    basicType,
    basic1Classes,
    basic1Pupils,
    basic2Classes,
    basic2Pupils,
    incl1Classes,
    incl1Pupils,
    incl2Classes,
    incl2Pupils,
    psychRows,
    healthRows,
    minorityType,
    minority1Classes,
    minority1Pupils,
    minority2Classes,
    minority2Pupils,
    gymRows,
    mixedRows,
    special1Classes,
    special1Pupils,
    special2Classes,
    special2Pupils,
    specialIIClasses,
    specialIIPupils,
    prepClasses,
    prepChildren,
    prepSpecialClasses,
    prepSpecialChildren,
    p38First,
    p38Second,
    p41First,
    p41Second,
    mixedMethodFirstZsPupils,
    mixedMethodFirstZsClasses,
    mixedMethodFirstSpecialPupils,
    mixedMethodFirstSpecialClasses,
    mixedMethodSecondZsPupils,
    mixedMethodSecondZsClasses,
    mixedMethodSecondSpecialPupils,
    mixedMethodSecondSpecialClasses,
  } = fields;

  const isFull = basicType === "full_more_than_2" || basicType === "full_max_2";
  const basic1Avg = basic1Classes > 0 ? basic1Pupils / basic1Classes : 0;
  const basic2Avg = basic2Classes > 0 ? basic2Pupils / basic2Classes : 0;

  const basicFirstBand =
    basicType === "full_more_than_2"
      ? pickBand(basic1Avg, B13_MORE_THAN_2.first)
      : basicType === "full_max_2"
        ? pickBand(basic1Avg, B34_MAX_2.first)
        : basicType === "first_only_1"
          ? pickBand(basic1Avg, B5)
          : basicType === "first_only_2"
            ? pickBand(basic1Avg, B6)
            : basicType === "first_only_3"
              ? pickBand(basic1Avg, B7)
              : pickBand(basic1Avg, B8);

  const basicSecondBand =
    basicType === "full_more_than_2"
      ? pickBand(basic2Avg, B13_MORE_THAN_2.second)
      : basicType === "full_max_2"
        ? pickBand(basic2Avg, B34_MAX_2.second)
        : { label: "–", value: 0, test: () => false };

  const incl1Avg = incl1Classes > 0 ? incl1Pupils / incl1Classes : 0;
  const incl2Avg = incl2Classes > 0 ? incl2Pupils / incl2Classes : 0;
  const incl1Band = pickBand(incl1Avg, B9_B10.first);
  const incl2Band = pickBand(incl2Avg, B9_B10.second);

  const psychPhmax = round2(
    psychRows.reduce((sum, row) => {
      const avgCurrent = row.currentClasses > 0 ? row.currentPupils / row.currentClasses : 0;
      const avgPrev = row.prevClasses > 0 ? row.prevPupils / row.prevClasses : 0;
      const usedAvg = row.mode === "current_only" ? avgCurrent : Math.max(avgCurrent, avgPrev);
      const band = pickBand(usedAvg, B14_B16[row.kind]);
      return sum + row.currentClasses * band.value;
    }, 0),
  );

  const healthPhmax = round2(
    healthRows.reduce((sum, row) => {
      const avgCurrent = row.currentClasses > 0 ? row.currentPupils / row.currentClasses : 0;
      const avgPrev = row.prevClasses > 0 ? row.prevPupils / row.prevClasses : 0;
      const usedAvg = row.mode === "current_only" ? avgCurrent : Math.max(avgCurrent, avgPrev);
      const band = pickBand(usedAvg, B11_B13[row.kind]);
      return sum + row.currentClasses * band.value;
    }, 0),
  );

  const minority1Avg = minority1Classes > 0 ? minority1Pupils / minority1Classes : 0;
  const minority1Band = pickBand(minority1Avg, B17_B21[minorityType]);
  const minority2Avg = minority2Classes > 0 ? minority2Pupils / minority2Classes : 0;
  const minority2Band = pickBand(minority2Avg, B17_B21.minorityFull2);

  const gymPhmax = round2(
    gymRows.reduce((sum, row) => {
      const avg = row.classes > 0 ? row.pupils / row.classes : 0;
      const band = pickBand(avg, B22_B25[row.kind]);
      return sum + row.classes * band.value;
    }, 0),
  );

  const special1Avg = special1Classes > 0 ? special1Pupils / special1Classes : 0;
  const special2Avg = special2Classes > 0 ? special2Pupils / special2Classes : 0;
  const specialIIAvg = specialIIClasses > 0 ? specialIIPupils / specialIIClasses : 0;
  const special1Band = pickBand(special1Avg, B26_B28.special1);
  const special2Band = pickBand(special2Avg, B26_B28.special2);
  const specialIIBand = pickBand(specialIIAvg, B26_B28.specialII);

  const mixedPhmax = round2(
    mixedRows.reduce((sum, row) => {
      const avg = row.classes > 0 ? row.pupils / row.classes : 0;
      const band =
        row.majority === "zs"
          ? pickBand(avg, row.stage === "first" ? B9_B10.first : B9_B10.second)
          : pickBand(avg, row.stage === "first" ? B26_B28.special1 : B26_B28.special2);
      return sum + row.classes * band.value;
    }, 0),
  );

  const mixedMethodFirstZsAvg = mixedMethodFirstZsClasses > 0 ? mixedMethodFirstZsPupils / mixedMethodFirstZsClasses : 0;
  const mixedMethodSecondZsAvg = mixedMethodSecondZsClasses > 0 ? mixedMethodSecondZsPupils / mixedMethodSecondZsClasses : 0;
  const mixedMethodFirstSpecialAvg =
    mixedMethodFirstSpecialClasses > 0 ? mixedMethodFirstSpecialPupils / mixedMethodFirstSpecialClasses : 0;
  const mixedMethodSecondSpecialAvg =
    mixedMethodSecondSpecialClasses > 0 ? mixedMethodSecondSpecialPupils / mixedMethodSecondSpecialClasses : 0;

  const mixedMethodFirstZsBand = pickBand(mixedMethodFirstZsAvg, B9_B10.first);
  const mixedMethodSecondZsBand = pickBand(mixedMethodSecondZsAvg, B9_B10.second);
  const mixedMethodFirstSpecialBand = pickBand(mixedMethodFirstSpecialAvg, B26_B28.special1);
  const mixedMethodSecondSpecialBand = pickBand(mixedMethodSecondSpecialAvg, B26_B28.special2);

  const mixedMethodFirstZsResult = round2(mixedMethodFirstZsClasses * mixedMethodFirstZsBand.value);
  const mixedMethodSecondZsResult = round2(mixedMethodSecondZsClasses * mixedMethodSecondZsBand.value);
  const mixedMethodFirstSpecialResult = round2(mixedMethodFirstSpecialClasses * mixedMethodFirstSpecialBand.value);
  const mixedMethodSecondSpecialResult = round2(mixedMethodSecondSpecialClasses * mixedMethodSecondSpecialBand.value);
  const mixedMethodFirstTotal = round2(mixedMethodFirstZsResult + mixedMethodFirstSpecialResult);
  const mixedMethodSecondTotal = round2(mixedMethodSecondZsResult + mixedMethodSecondSpecialResult);
  const mixedMethodTotal = round2(mixedMethodFirstTotal + mixedMethodSecondTotal);

  const hasMixedMethodTableData =
    mixedMethodFirstZsPupils > 0 ||
    mixedMethodFirstZsClasses > 0 ||
    mixedMethodFirstSpecialPupils > 0 ||
    mixedMethodFirstSpecialClasses > 0 ||
    mixedMethodSecondZsPupils > 0 ||
    mixedMethodSecondZsClasses > 0 ||
    mixedMethodSecondSpecialPupils > 0 ||
    mixedMethodSecondSpecialClasses > 0;

  const mixedForTotal = round2(hasMixedMethodTableData ? mixedMethodTotal : mixedPhmax);

  const basicPhmax = round2(basic1Classes * basicFirstBand.value + (isFull ? basic2Classes * basicSecondBand.value : 0));
  const inclPhmax = round2(incl1Classes * incl1Band.value + incl2Classes * incl2Band.value);
  const minorityPhmax = round2(
    minority1Classes * minority1Band.value + (minorityType === "minorityFull1" ? minority2Classes * minority2Band.value : 0),
  );
  const specialPhmax = round2(
    special1Classes * special1Band.value + special2Classes * special2Band.value + specialIIClasses * specialIIBand.value,
  );

  const prepAvg = prepClasses > 0 ? prepChildren / prepClasses : 0;
  const prepPh = prepAvg < 10 ? 14 : 22;
  const prepSpecialAvg = prepSpecialClasses > 0 ? prepSpecialChildren / prepSpecialClasses : 0;
  const prepSpecialPh = prepSpecialAvg < 4 ? 10 : 40;
  const prepClassPhmax = round2(prepClasses * prepPh);
  const prepSpecialPhmax = round2(prepSpecialClasses * prepSpecialPh);
  const par38Phmax = round2(p38First * 0.25 + p38Second * 0.5);
  const par41Phmax = round2(p41First * 0.25 + p41Second * 0.5);
  const extrasPhmax = round2(prepClassPhmax + prepSpecialPhmax + par38Phmax + par41Phmax);

  return round2(
    basicPhmax + inclPhmax + psychPhmax + healthPhmax + minorityPhmax + gymPhmax + specialPhmax + mixedForTotal + extrasPhmax,
  );
}

/** Přepočet PHmax ze ZŠ autosave – jen při záložce phmax (koherence na přehledu). */
export function computeZsPhmaxTotalFromSnapshot(snapshot: unknown): number | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const s = snapshot as Record<string, unknown>;
  const tab = typeof s.tab === "string" ? s.tab : "phmax";
  if (tab !== "phmax") return null;
  return computeZsPhmaxTotalFromFields(parseZsPhmaxComputeFields(s));
}

/** Mapování stavu formuláře na vstupy přepočtu (autosave, stránka ZŠ). */
export function zsPhmaxFieldsFromFormState(state: {
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
  mixedMethodFirstZsPupils: number;
  mixedMethodFirstZsClasses: number;
  mixedMethodFirstSpecialPupils: number;
  mixedMethodFirstSpecialClasses: number;
  mixedMethodSecondZsPupils: number;
  mixedMethodSecondZsClasses: number;
  mixedMethodSecondSpecialPupils: number;
  mixedMethodSecondSpecialClasses: number;
}): ZsPhmaxComputeFields {
  return {
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
    mixedMethodFirstZsPupils: state.mixedMethodFirstZsPupils,
    mixedMethodFirstZsClasses: state.mixedMethodFirstZsClasses,
    mixedMethodFirstSpecialPupils: state.mixedMethodFirstSpecialPupils,
    mixedMethodFirstSpecialClasses: state.mixedMethodFirstSpecialClasses,
    mixedMethodSecondZsPupils: state.mixedMethodSecondZsPupils,
    mixedMethodSecondZsClasses: state.mixedMethodSecondZsClasses,
    mixedMethodSecondSpecialPupils: state.mixedMethodSecondSpecialPupils,
    mixedMethodSecondSpecialClasses: state.mixedMethodSecondSpecialClasses,
  };
}
