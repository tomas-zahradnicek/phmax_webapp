import { describe, expect, it } from "vitest";
import type { CalculatorMode } from "../config/calculator-config";
import {
  B13_MORE_THAN_2,
  B26_B28,
  B7,
  B9_B10,
  PHA_TABLE,
  pickBand,
  round2,
  type BasicType,
  type PhaRow,
} from "../phmax-zs-logic";
import { ZS_HERO_EXAMPLE_GROUPS, type ZsHeroExampleKey } from "../zs-hero-example-groups";
import { computeZsPhmaxTotalFromFields, zsPhmaxFieldsFromFormState } from "./zs-compute-phmax-total-from-snapshot";
import type { ZsFormSnapshotSetters } from "./zs-form-snapshot";
import { loadZsHeroExample } from "./zs-hero-example-load";
import { applyZsResetNv75, applyZsResetPha, applyZsResetPhmax, applyZsResetPhp } from "./zs-form-reset";

/** Hodiny jednoho řádku stejně jako stránka ZŠ a computeZsPhmaxTotalFromFields: třídy × pásmo. */
function lineHours(classes: number, pupils: number, bands: Parameters<typeof pickBand>[1]): number {
  const avg = classes > 0 ? pupils / classes : 0;
  return round2(classes * pickBand(avg, bands).value);
}

function recordingSetters(state: Record<string, unknown>): ZsFormSnapshotSetters {
  return new Proxy({} as ZsFormSnapshotSetters, {
    get(_target, prop) {
      if (typeof prop !== "string" || !prop.startsWith("set")) return undefined;
      return (value: unknown) => {
        const key = prop.slice(3, 4).toLowerCase() + prop.slice(4);
        state[key] = value;
      };
    },
  });
}

function loadExample(example: ZsHeroExampleKey): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  const setters = recordingSetters(state);
  loadZsHeroExample(example, {
    setters,
    createEmptyGymRow: (id) => ({ id, kind: "gym8", classes: 0, pupils: 0 }),
    createEmptyMixedRow: (id) => ({ id, stage: "first", majority: "zs", classes: 0, pupils: 0 }),
    createEmptyPhaRow: (id) => ({ id, kind: "zs1", classes: 0, pupils: 0 }),
    applyResetPhmax: () => applyZsResetPhmax(setters),
    applyResetPha: () => applyZsResetPha(setters),
    applyResetPhp: () => applyZsResetPhp(setters),
    resetNv75: () => applyZsResetNv75(setters),
  });
  return state;
}

function phmaxTotal(state: Record<string, unknown>): number {
  return computeZsPhmaxTotalFromFields(
    zsPhmaxFieldsFromFormState(state as Parameters<typeof zsPhmaxFieldsFromFormState>[0]),
  );
}

function phaLineHours(rows: PhaRow[]): number[] {
  return rows.map((row) => {
    const avg = row.classes > 0 ? row.pupils / row.classes : 0;
    return round2(row.classes * pickBand(avg, PHA_TABLE[row.kind]).value);
  });
}

function selectableValues(): string[] {
  return ZS_HERO_EXAMPLE_GROUPS.flatMap((group) => group.options.map((option) => option.value));
}

describe("ZV v6 oficiální modelové příklady (s. 17–23)", () => {
  it("čtyři příklady přílohy jsou ve výběru hero", () => {
    const values = selectableValues();
    expect(values).toEqual(expect.arrayContaining([
      "priloha_uplna_zs_sec16",
      "priloha_zs_1st_sec16",
      "smisene_tridy",
      "priloha_phamax_uplna_zs_sec16_zss",
    ]));
    for (const value of [
      "priloha_uplna_zs_sec16",
      "priloha_zs_1st_sec16",
      "smisene_tridy",
      "priloha_phamax_uplna_zs_sec16_zss",
    ]) {
      expect(values.filter((item) => item === value)).toHaveLength(1);
    }
  });

  it("úplná ZŠ + § 16/9: 300 + 368 + 130 + 136 = 934", () => {
    const state = loadExample("priloha_uplna_zs_sec16");
    expect(state.selectedExample).toBe("priloha_uplna_zs_sec16");
    expect(state.dataMode).toBe("example");
    expect(state.tab).toBe("phmax");
    expect(state.mode).toBe<CalculatorMode>("phmax_full_zs_sec16");
    expect(state.basicType).toBe<BasicType>("full_more_than_2");
    expect(state.basic1Classes).toBe(10);
    expect(state.basic1Pupils).toBe(250);
    expect(state.basic2Classes).toBe(8);
    expect(state.basic2Pupils).toBe(225);
    expect(state.incl1Classes).toBe(5);
    expect(state.incl1Pupils).toBe(40);
    expect(state.incl2Classes).toBe(4);
    expect(state.incl2Pupils).toBe(32);

    const basic1 = lineHours(10, 250, B13_MORE_THAN_2.first);
    const basic2 = lineHours(8, 225, B13_MORE_THAN_2.second);
    const sec16First = lineHours(5, 40, B9_B10.first);
    const sec16Second = lineHours(4, 32, B9_B10.second);
    expect([basic1, basic2, sec16First, sec16Second]).toEqual([300, 368, 130, 136]);
    expect(basic1 + basic2 + sec16First + sec16Second).toBe(934);
    expect(phmaxTotal(state)).toBe(934);
  });

  it("ZŠ jen 1. stupeň + § 16/9: 66 + 26 = 92", () => {
    const state = loadExample("priloha_zs_1st_sec16");
    expect(state.selectedExample).toBe("priloha_zs_1st_sec16");
    expect(state.dataMode).toBe("example");
    expect(state.tab).toBe("phmax");
    expect(state.mode).toBe<CalculatorMode>("phmax_first_stage_only");
    expect(state.basicType).toBe<BasicType>("first_only_3");
    expect(state.basic1Classes).toBe(3);
    expect(state.basic1Pupils).toBe(30);
    expect(state.basic2Classes).toBe(0);
    expect(state.incl1Classes).toBe(1);
    expect(state.incl1Pupils).toBe(6);
    expect(state.incl2Classes).toBe(0);
    expect(state.incl2Pupils).toBe(0);

    const basic1 = lineHours(3, 30, B7);
    const sec16First = lineHours(1, 6, B9_B10.first);
    expect([basic1, sec16First]).toEqual([66, 26]);
    expect(basic1 + sec16First).toBe(92);
    expect(phmaxTotal(state)).toBe(92);
  });

  it("smíšené třídy C/01 a B/01: 124 + 129 + 117 + 200 = 570", () => {
    const state = loadExample("smisene_tridy");
    expect(state.selectedExample).toBe("smisene_tridy");
    expect(state.dataMode).toBe("example");
    expect(state.tab).toBe("phmax");
    expect(state.mode).toBe<CalculatorMode>("phmax_dominant_field");
    expect(state.mixedMethodFirstZsPupils).toBe(47);
    expect(state.mixedMethodFirstZsClasses).toBe(4);
    expect(state.mixedMethodSecondZsPupils).toBe(38);
    expect(state.mixedMethodSecondZsClasses).toBe(3);
    expect(state.mixedMethodFirstSpecialPupils).toBe(26);
    expect(state.mixedMethodFirstSpecialClasses).toBe(3);
    expect(state.mixedMethodSecondSpecialPupils).toBe(31);
    expect(state.mixedMethodSecondSpecialClasses).toBe(4);

    const cFirst = lineHours(4, 47, B9_B10.first);
    const cSecond = lineHours(3, 38, B9_B10.second);
    const bFirst = lineHours(3, 26, B26_B28.special1);
    const bSecond = lineHours(4, 31, B26_B28.special2);
    expect([cFirst, cSecond, bFirst, bSecond]).toEqual([124, 129, 117, 200]);
    expect(cFirst + cSecond + bFirst + bSecond).toBe(570);
    expect(phmaxTotal(state)).toBe(570);
  });

  it("PHAmax úplná ZŠ a speciální třídy: 48 + 48 + 93 + 69 + 174 + 42 = 474", () => {
    const state = loadExample("priloha_phamax_uplna_zs_sec16_zss");
    expect(state.selectedExample).toBe("priloha_phamax_uplna_zs_sec16_zss");
    expect(state.dataMode).toBe("example");
    expect(state.tab).toBe("pha");
    expect(state.mode).toBe<CalculatorMode>("phamax_zs_sec16_special");
    expect(state.phaRows).toEqual([
      { id: 1, kind: "zs1", classes: 2, pupils: 15 },
      { id: 2, kind: "zs1Heavy", classes: 1, pupils: 7 },
      { id: 3, kind: "zs2", classes: 3, pupils: 21 },
      { id: 4, kind: "zss1Heavy", classes: 1, pupils: 6 },
      { id: 5, kind: "zss2Heavy", classes: 2, pupils: 11 },
      { id: 6, kind: "zssII", classes: 1, pupils: 6 },
    ]);

    const lines = phaLineHours(state.phaRows as PhaRow[]);
    expect(lines).toEqual([48, 48, 93, 69, 174, 42]);
    expect(round2(lines.reduce((sum, hours) => sum + hours, 0))).toBe(474);
  });
});
