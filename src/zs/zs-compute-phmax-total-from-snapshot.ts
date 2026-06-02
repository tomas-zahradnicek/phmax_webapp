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

/** Přepočet PHmax ze ZŠ autosave (záložka phmax) – stejná logika jako na stránce ZŠ. */
export function computeZsPhmaxTotalFromSnapshot(snapshot: unknown): number | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const s = snapshot as Record<string, unknown>;
  const tab = typeof s.tab === "string" ? s.tab : "phmax";
  if (tab !== "phmax") return null;

  const basicType = (s.basicType as BasicType) || "full_more_than_2";
  const basic1Classes = num(s.basic1Classes);
  const basic1Pupils = num(s.basic1Pupils);
  const basic2Classes = num(s.basic2Classes);
  const basic2Pupils = num(s.basic2Pupils);
  const incl1Classes = num(s.incl1Classes);
  const incl1Pupils = num(s.incl1Pupils);
  const incl2Classes = num(s.incl2Classes);
  const incl2Pupils = num(s.incl2Pupils);
  const psychRows = arr<PsychRow>(s.psychRows);
  const healthRows = arr<HealthRow>(s.healthRows);
  const minorityType = (s.minorityType as keyof typeof B17_B21) || "minorityFull1";
  const minority1Classes = num(s.minority1Classes);
  const minority1Pupils = num(s.minority1Pupils);
  const minority2Classes = num(s.minority2Classes);
  const minority2Pupils = num(s.minority2Pupils);
  const gymRows = arr<GymRow>(s.gymRows);
  const mixedRows = arr<MixedRow>(s.mixedRows);
  const special1Classes = num(s.special1Classes);
  const special1Pupils = num(s.special1Pupils);
  const special2Classes = num(s.special2Classes);
  const special2Pupils = num(s.special2Pupils);
  const specialIIClasses = num(s.specialIIClasses);
  const specialIIPupils = num(s.specialIIPupils);
  const prepClasses = num(s.prepClasses);
  const prepChildren = num(s.prepChildren);
  const prepSpecialClasses = num(s.prepSpecialClasses);
  const prepSpecialChildren = num(s.prepSpecialChildren);
  const p38First = num(s.p38First);
  const p38Second = num(s.p38Second);
  const p41First = num(s.p41First);
  const p41Second = num(s.p41Second);
  const mixedMethodFirstZsPupils = num(s.mixedMethodFirstZsPupils);
  const mixedMethodFirstZsClasses = num(s.mixedMethodFirstZsClasses);
  const mixedMethodFirstSpecialPupils = num(s.mixedMethodFirstSpecialPupils);
  const mixedMethodFirstSpecialClasses = num(s.mixedMethodFirstSpecialClasses);
  const mixedMethodSecondZsPupils = num(s.mixedMethodSecondZsPupils);
  const mixedMethodSecondZsClasses = num(s.mixedMethodSecondZsClasses);
  const mixedMethodSecondSpecialPupils = num(s.mixedMethodSecondSpecialPupils);
  const mixedMethodSecondSpecialClasses = num(s.mixedMethodSecondSpecialClasses);

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
