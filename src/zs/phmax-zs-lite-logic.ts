import {
  B13_MORE_THAN_2,
  B34_MAX_2,
  B5,
  B6,
  B7,
  B8,
  B9_B10,
  type BasicType,
  pickBand,
  round2,
} from "../phmax-zs-logic";
import { computeZsPhmaxTotalFromSnapshot } from "./zs-compute-phmax-total-from-snapshot";

export type ZsLiteInput = {
  basicType: BasicType;
  basic1Classes: number;
  basic1Pupils: number;
  basic2Classes: number;
  basic2Pupils: number;
  incl1Classes: number;
  incl1Pupils: number;
  incl2Classes: number;
  incl2Pupils: number;
};

export type ZsLiteResult = {
  ok: true;
  basicType: BasicType;
  basic1Classes: number;
  basic1Pupils: number;
  basic2Classes: number;
  basic2Pupils: number;
  incl1Classes: number;
  incl1Pupils: number;
  incl2Classes: number;
  incl2Pupils: number;
  basic1Avg: number;
  basic2Avg: number;
  firstBandLabel: string;
  firstBandValue: number;
  secondBandLabel: string | null;
  secondBandValue: number | null;
  firstStagePhmax: number;
  secondStagePhmax: number;
  sec16FirstPhmax: number;
  sec16SecondPhmax: number;
  phmaxHours: number;
  summaryText: string;
};

export type ZsLiteError = {
  ok: false;
  message: string;
};

function isFullBasicType(basicType: BasicType): boolean {
  return basicType === "full_more_than_2" || basicType === "full_max_2";
}

function minFirstStageClasses(basicType: BasicType): number | null {
  if (basicType === "first_only_1") return 1;
  if (basicType === "first_only_2") return 2;
  if (basicType === "first_only_3") return 3;
  if (basicType === "first_only_4") return 4;
  return null;
}

function pickFirstBand(basicType: BasicType, avg: number) {
  if (basicType === "full_more_than_2") return pickBand(avg, B13_MORE_THAN_2.first);
  if (basicType === "full_max_2") return pickBand(avg, B34_MAX_2.first);
  if (basicType === "first_only_1") return pickBand(avg, B5);
  if (basicType === "first_only_2") return pickBand(avg, B6);
  if (basicType === "first_only_3") return pickBand(avg, B7);
  return pickBand(avg, B8);
}

function pickSecondBand(basicType: BasicType, avg: number) {
  if (basicType === "full_more_than_2") return pickBand(avg, B13_MORE_THAN_2.second);
  if (basicType === "full_max_2") return pickBand(avg, B34_MAX_2.second);
  return null;
}

export function computeZsLitePhmax(input: ZsLiteInput): ZsLiteResult | ZsLiteError {
  const basicType = input.basicType;
  const basic1Classes = Math.max(0, Math.floor(input.basic1Classes));
  const basic1Pupils = Math.max(0, Math.floor(input.basic1Pupils));
  const basic2Classes = Math.max(0, Math.floor(input.basic2Classes));
  const basic2Pupils = Math.max(0, Math.floor(input.basic2Pupils));
  const incl1Classes = Math.max(0, Math.floor(input.incl1Classes));
  const incl1Pupils = Math.max(0, Math.floor(input.incl1Pupils));
  const incl2Classes = Math.max(0, Math.floor(input.incl2Classes));
  const incl2Pupils = Math.max(0, Math.floor(input.incl2Pupils));
  const isFull = isFullBasicType(basicType);

  if (basic1Classes < 1 || basic1Pupils < 1) {
    return { ok: false, message: "Zadejte počet tříd a žáků 1. stupně." };
  }

  const minFirst = minFirstStageClasses(basicType);
  if (minFirst != null && basic1Classes < minFirst) {
    return {
      ok: false,
      message: `Pro zvolený typ neúplné ZŠ zadejte alespoň ${minFirst} ${
        minFirst === 1 ? "třídu" : minFirst < 5 ? "třídy" : "tříd"
      } 1. stupně.`,
    };
  }

  if (isFull && (basic2Classes < 1 || basic2Pupils < 1)) {
    return { ok: false, message: "Zadejte počet tříd a žáků 2. stupně." };
  }

  if (incl1Classes > 0 && incl1Pupils < 1) {
    return { ok: false, message: "U tříd § 16/9 na 1. stupni doplňte počet žáků." };
  }
  if (incl1Classes < 1 && incl1Pupils > 0) {
    return { ok: false, message: "U tříd § 16/9 na 1. stupni doplňte počet tříd." };
  }
  if (isFull && incl2Classes > 0 && incl2Pupils < 1) {
    return { ok: false, message: "U tříd § 16/9 na 2. stupni doplňte počet žáků." };
  }
  if (isFull && incl2Classes < 1 && incl2Pupils > 0) {
    return { ok: false, message: "U tříd § 16/9 na 2. stupni doplňte počet tříd." };
  }

  const snapshot = {
    tab: "phmax" as const,
    basicType,
    basic1Classes,
    basic1Pupils,
    basic2Classes: isFull ? basic2Classes : 0,
    basic2Pupils: isFull ? basic2Pupils : 0,
    incl1Classes,
    incl1Pupils,
    incl2Classes: isFull ? incl2Classes : 0,
    incl2Pupils: isFull ? incl2Pupils : 0,
  };

  const phmaxHours = computeZsPhmaxTotalFromSnapshot(snapshot);
  if (phmaxHours == null) {
    return { ok: false, message: "Výpočet se nepodařil – zkontrolujte vstupy." };
  }

  const basic1Avg = basic1Pupils / basic1Classes;
  const basic2Avg = basic2Classes > 0 ? basic2Pupils / basic2Classes : 0;
  const firstBand = pickFirstBand(basicType, basic1Avg);
  const secondBand = isFull ? pickSecondBand(basicType, basic2Avg) : null;
  const firstStagePhmax = round2(basic1Classes * firstBand.value);
  const secondStagePhmax =
    isFull && secondBand ? round2(basic2Classes * secondBand.value) : 0;

  const incl1Avg = incl1Classes > 0 ? incl1Pupils / incl1Classes : 0;
  const incl2Avg = incl2Classes > 0 ? incl2Pupils / incl2Classes : 0;
  const sec16FirstBand = incl1Classes > 0 ? pickBand(incl1Avg, B9_B10.first) : null;
  const sec16SecondBand = incl2Classes > 0 ? pickBand(incl2Avg, B9_B10.second) : null;
  const sec16FirstPhmax =
    sec16FirstBand && incl1Classes > 0 ? round2(incl1Classes * sec16FirstBand.value) : 0;
  const sec16SecondPhmax =
    sec16SecondBand && incl2Classes > 0 ? round2(incl2Classes * sec16SecondBand.value) : 0;

  const avg1Fmt = basic1Avg.toLocaleString("cs-CZ", { maximumFractionDigits: 2 });
  const phFmt = phmaxHours.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let summaryText =
    `Běžné třídy – 1. stupeň: ${basic1Classes} tříd, průměr ${avg1Fmt} žáků → pásmo „${firstBand.label}“ (${firstBand.value} h/třída), ` +
    `celkem ${firstStagePhmax.toLocaleString("cs-CZ")} h týdně.`;

  if (isFull && secondBand) {
    const avg2Fmt = basic2Avg.toLocaleString("cs-CZ", { maximumFractionDigits: 2 });
    summaryText +=
      ` 2. stupeň: ${basic2Classes} tříd, průměr ${avg2Fmt} žáků → pásmo „${secondBand.label}“ (${secondBand.value} h/třída), ` +
      `celkem ${secondStagePhmax.toLocaleString("cs-CZ")} h týdně.`;
  }

  if (sec16FirstPhmax > 0 && sec16FirstBand) {
    summaryText +=
      ` § 16/9 – 1. stupeň: ${incl1Classes} tříd → pásmo „${sec16FirstBand.label}“ (${sec16FirstBand.value} h/třída), ` +
      `celkem ${sec16FirstPhmax.toLocaleString("cs-CZ")} h týdně.`;
  }
  if (sec16SecondPhmax > 0 && sec16SecondBand) {
    summaryText +=
      ` § 16/9 – 2. stupeň: ${incl2Classes} tříd → pásmo „${sec16SecondBand.label}“ (${sec16SecondBand.value} h/třída), ` +
      `celkem ${sec16SecondPhmax.toLocaleString("cs-CZ")} h týdně.`;
  }

  summaryText += ` Orientační PHmax celkem: ${phFmt} h týdně.`;

  return {
    ok: true,
    basicType,
    basic1Classes,
    basic1Pupils,
    basic2Classes: isFull ? basic2Classes : 0,
    basic2Pupils: isFull ? basic2Pupils : 0,
    incl1Classes,
    incl1Pupils,
    incl2Classes: isFull ? incl2Classes : 0,
    incl2Pupils: isFull ? incl2Pupils : 0,
    basic1Avg,
    basic2Avg,
    firstBandLabel: firstBand.label,
    firstBandValue: firstBand.value,
    secondBandLabel: secondBand?.label ?? null,
    secondBandValue: secondBand?.value ?? null,
    firstStagePhmax,
    secondStagePhmax,
    sec16FirstPhmax,
    sec16SecondPhmax,
    phmaxHours,
    summaryText,
  };
}
