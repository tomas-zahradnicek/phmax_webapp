import { B9_B10, B26_B28, pickBand, type MixedRow } from "../phmax-zs-logic";

export type ZsSummaryRowsInput = {
  basic1Phmax: number;
  basic2Phmax: number;
  basicPhmax: number;
  incl1Phmax: number;
  incl2Phmax: number;
  inclPhmax: number;
  psychPhmax: number;
  healthPhmax: number;
  minority1Phmax: number;
  minority2Phmax: number;
  minorityPhmax: number;
  gymPhmax: number;
  mixedRows: MixedRow[];
  mixedMethodFirstTotal: number;
  mixedMethodSecondTotal: number;
  mixedMethodTotal: number;
  mixedPhmax: number;
  special1PhmaxPart: number;
  special2PhmaxPart: number;
  specialIIPhmaxPart: number;
  specialPhmax: number;
  prepClassPhmax: number;
  prepSpecialPhmax: number;
  par38Phmax: number;
  par41Phmax: number;
  extrasPhmax: number;
  totalPhmax: number;
  totalPha: number;
  phpBaseValue: number;
  phpExcludedTotal: number;
  phpAdjustedValue: number;
  totalPhp: number;
};

function mixedStageTotal(rows: MixedRow[], stage: "first" | "second"): number {
  return rows
    .filter((row) => row.stage === stage)
    .reduce((sum, row) => {
      const avg = row.classes > 0 ? row.pupils / row.classes : 0;
      const band =
        row.majority === "zs"
          ? pickBand(avg, stage === "first" ? B9_B10.first : B9_B10.second)
          : pickBand(avg, stage === "first" ? B26_B28.special1 : B26_B28.special2);
      return sum + row.classes * band.value;
    }, 0);
}

/** Řádky souhrnu pro export CSV/XLSX – stejná struktura jako dříve v PhmaxZsPage. */
export function buildZsSummaryRows(input: ZsSummaryRowsInput): readonly (readonly [string, string | number])[] {
  const mixedFirst = input.mixedMethodFirstTotal || mixedStageTotal(input.mixedRows, "first");
  const mixedSecond = input.mixedMethodSecondTotal || mixedStageTotal(input.mixedRows, "second");
  const mixedTotal = input.mixedMethodTotal || input.mixedPhmax;

  return [
    ["Běžné třídy ZŠ – 1. stupeň", input.basic1Phmax],
    ["Běžné třídy ZŠ – 2. stupeň", input.basic2Phmax],
    ["Běžné třídy ZŠ – celkem", input.basicPhmax],
    ["Třídy podle § 16 odst. 9 – 1. stupeň", input.incl1Phmax],
    ["Třídy podle § 16 odst. 9 – 2. stupeň", input.incl2Phmax],
    ["Třídy podle § 16 odst. 9 – celkem", input.inclPhmax],
    ["Škola při psychiatrické nemocnici", input.psychPhmax],
    ["ZŠ při zdravotnickém zařízení (mimo psychiatrii), ř. B11–B13", input.healthPhmax],
    ["ZŠ s jazykem národnostní menšiny – 1. stupeň", input.minority1Phmax],
    ["ZŠ s jazykem národnostní menšiny – 2. stupeň", input.minority2Phmax],
    ["ZŠ s jazykem národnostní menšiny – celkem", input.minorityPhmax],
    ["Nižší ročníky víceletých gymnázií", input.gymPhmax],
    ["Smíšené třídy § 16 odst. 9 a ZŠ speciální – 1. stupeň", mixedFirst],
    ["Smíšené třídy § 16 odst. 9 a ZŠ speciální – 2. stupeň", mixedSecond],
    ["Smíšené třídy § 16 odst. 9 a ZŠ speciální – celkem", mixedTotal],
    ["ZŠ speciální – I. díl 1. stupeň", input.special1PhmaxPart],
    ["ZŠ speciální – I. díl 2. stupeň", input.special2PhmaxPart],
    ["ZŠ speciální – II. díl", input.specialIIPhmaxPart],
    ["ZŠ speciální – celkem", input.specialPhmax],
    ["Samostatné položky – přípravná třída", input.prepClassPhmax],
    ["Samostatné položky – přípravný stupeň ZŠS", input.prepSpecialPhmax],
    ["Samostatné položky – § 38", input.par38Phmax],
    ["Samostatné položky – § 41", input.par41Phmax],
    ["Samostatné položky PHmax – celkem", input.extrasPhmax],
    ["Výsledek PHmax", input.totalPhmax],
    ["Výsledek PHAmax", input.totalPha],
    ["PHPmax – rozhodná hodnota", input.phpBaseValue],
    ["PHPmax – nezapočítávaní žáci", input.phpExcludedTotal],
    ["PHPmax – očištěná hodnota", input.phpAdjustedValue],
    ["Výsledek PHPmax", input.totalPhp],
  ];
}
