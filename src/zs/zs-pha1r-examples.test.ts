import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ZS_HERO_EXAMPLE_GROUPS, type ZsHeroExampleKey } from "../zs-hero-example-groups";
import { computeZsPhmaxTotalFromFields, zsPhmaxFieldsFromFormState } from "./zs-compute-phmax-total-from-snapshot";
import { applyZsResetNv75, applyZsResetPha, applyZsResetPhmax, applyZsResetPhp } from "./zs-form-reset";
import type { ZsFormSnapshotSetters } from "./zs-form-snapshot";
import { getZsInitialPhaMode, loadZsHeroExample } from "./zs-hero-example-load";
import {
  computeZsPha1r,
  EMPTY_PHA1R_SCHOOL_FLAGS,
  type Pha1rClassRow,
  type Pha1rSchoolFlags,
} from "./zs-pha1r";
import {
  formatZsPha1rExampleExplanation,
  ZS_PHA1R_HERO_EXAMPLE_KEYS,
  ZS_PHA1R_HERO_EXAMPLES,
  type ZsPha1rHeroExampleKey,
} from "./zs-pha1r-examples";
import { zsOverviewOrientationTotal } from "./zs-pha1r-ui";
import { resolveZsTabSection } from "./use-zs-section-scroll";

const OFFICIAL_EXAMPLES = [
  "priloha_uplna_zs_sec16",
  "priloha_zs_1st_sec16",
  "smisene_tridy",
  "priloha_phamax_uplna_zs_sec16_zss",
] as const satisfies readonly ZsHeroExampleKey[];

const EXPECTED: Record<
  ZsPha1rHeroExampleKey,
  { classes: Pha1rClassRow[]; relevant: number[]; eligible: number; hours: number; explanation: string }
> = {
  pha1r_14_pod_hranici: {
    classes: [{ id: 1, grade1Pupils: 14, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false }],
    relevant: [14],
    eligible: 0,
    hours: 0,
    explanation:
      "Ilustrační příklad PHA1Rmax, ne úplný výpočet školy. Žáci 1. ročníku: 14. Odečty: žádné. Relevantní žáci: 14. Práh: 15. Způsobilé třídy: 0. PHA1Rmax: 0 hodin týdně.",
  },
  pha1r_15_zpusobila: {
    classes: [{ id: 1, grade1Pupils: 15, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false }],
    relevant: [15],
    eligible: 1,
    hours: 20,
    explanation:
      "Ilustrační příklad PHA1Rmax, ne úplný výpočet školy. Žáci 1. ročníku: 15. Odečty: žádné. Relevantní žáci: 15. Práh: 15. Způsobilé třídy: 1. PHA1Rmax: 20 hodin týdně.",
  },
  pha1r_dve_tridy: {
    classes: [
      { id: 1, grade1Pupils: 15, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false },
      { id: 2, grade1Pupils: 16, grade1Par38: 0, grade1Par41: 0, establishedSec16_9: false },
    ],
    relevant: [15, 16],
    eligible: 2,
    hours: 40,
    explanation:
      "Ilustrační příklad PHA1Rmax, ne úplný výpočet školy. Třída 1: žáci 1. ročníku: 15. Odečty: žádné. Relevantní žáci: 15. Třída 2: žáci 1. ročníku: 16. Odečty: žádné. Relevantní žáci: 16. Práh: 15. Způsobilé třídy: 2. PHA1Rmax: 40 hodin týdně.",
  },
  pha1r_odecty_38_41: {
    classes: [{ id: 1, grade1Pupils: 18, grade1Par38: 2, grade1Par41: 1, establishedSec16_9: false }],
    relevant: [15],
    eligible: 1,
    hours: 20,
    explanation:
      "Ilustrační příklad PHA1Rmax, ne úplný výpočet školy. Žáci 1. ročníku: 18. Odečty: § 38 = 2, § 41 = 1. Relevantní žáci: 15. Práh: 15. Způsobilé třídy: 1. PHA1Rmax: 20 hodin týdně.",
  },
};

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

function loadInto(state: Record<string, unknown>, example: ZsHeroExampleKey): void {
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
}

function loadExample(example: ZsHeroExampleKey): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  loadInto(state, example);
  return state;
}

function schoolFlags(state: Record<string, unknown>): Pha1rSchoolFlags {
  return {
    schoolEstablishedSec16_9: state.schoolEstablishedSec16_9 === true,
    schoolAtInstitutionalOrProtectiveCare: state.schoolAtInstitutionalOrProtectiveCare === true,
    schoolAtHealthcareFacility: state.schoolAtHealthcareFacility === true,
  };
}

function pha1rOf(state: Record<string, unknown>) {
  return computeZsPha1r({
    classes: state.pha1rClasses as Pha1rClassRow[],
    flags: schoolFlags(state),
  });
}

describe("PHA1Rmax ilustrační příklady", () => {
  it("skupina je v Začněte zde a oficiální příklady přílohy zůstávají", () => {
    const group = ZS_HERO_EXAMPLE_GROUPS.find((item) => item.label === "PHA1Rmax – příklady pro 1. ročník");
    expect(group?.options.map((option) => option.value)).toEqual([...ZS_PHA1R_HERO_EXAMPLE_KEYS]);
    expect(group?.options.map((option) => option.label)).toEqual([
      "14 prvňáků – pod hranicí (0 h)",
      "15 prvňáků – způsobilá třída (20 h)",
      "Dvě způsobilé třídy (40 h)",
      "Odečty § 38 a § 41 (20 h)",
    ]);
    const labels = new Map(
      ZS_HERO_EXAMPLE_GROUPS.flatMap((item) => item.options.map((option) => [option.value, option.label] as const)),
    );
    expect(labels.get("priloha_uplna_zs_sec16")).toBe("Úplná ZŠ + třídy § 16/9 (obě st., 934 h dle modelu A–D)");
    expect(labels.get("priloha_zs_1st_sec16")).toBe("ZŠ jen 1. stupeň + § 16/9 (92 h dle modelu A–D)");
    expect(labels.get("smisene_tridy")).toBe("Smíšené třídy § 16/9 + obory C/01 a B/01 (570 h, příloha)");
    expect(labels.get("priloha_phamax_uplna_zs_sec16_zss")).toBe(
      "Úplná ZŠ § 16/9 + ZŠ speciální, rozlišení AD1/AD2 (474 h, ř. B35–B44 dle metodiky v6)",
    );
  });

  it.each(ZS_PHA1R_HERO_EXAMPLE_KEYS)("loadZsHeroExample %s naplní PHA1R a nepřidá hodiny do přehledu", (key) => {
    const expected = EXPECTED[key];
    const state = loadExample(key);
    expect(ZS_PHA1R_HERO_EXAMPLES[key].classes).toEqual(expected.classes);
    expect(state.selectedExample).toBe(key);
    expect(state.dataMode).toBe("example");
    expect(state.tab).toBe("pha");
    expect(resolveZsTabSection(String(state.tab), String(state.selectedExample))).toBe("pha1r");
    expect(state.mode).toBe(getZsInitialPhaMode());
    expect(state.pha1rClasses).toEqual(expected.classes);
    expect(schoolFlags(state)).toEqual(EMPTY_PHA1R_SCHOOL_FLAGS);
    expect(state.basic1Classes).toBe(0);
    expect(state.basic1Pupils).toBe(0);
    expect(state.basic2Classes).toBe(0);
    expect(state.basic2Pupils).toBe(0);
    expect(state.phaRows).toEqual([]);
    expect(state.phpYear1).toBe(0);
    expect(state.phpYear2).toBe(0);
    expect(state.phpYear3).toBe(0);

    const result = pha1rOf(state);
    expect(result.classes.map((row) => row.relevantGrade1Pupils)).toEqual(expected.relevant);
    expect(result.eligibleClassCount).toBe(expected.eligible);
    expect(result.totalPha1r).toBe(expected.hours);
    const phmax = computeZsPhmaxTotalFromFields(
      zsPhmaxFieldsFromFormState(state as Parameters<typeof zsPhmaxFieldsFromFormState>[0]),
    );
    expect(phmax).toBe(0);
    const orientation = zsOverviewOrientationTotal(phmax, 0, 0);
    expect(orientation).toBe(0);
    expect(orientation).toBe(phmax);
    if (expected.hours > 0) expect(orientation).not.toBe(expected.hours);

    const option = ZS_HERO_EXAMPLE_GROUPS.flatMap((group) => group.options).find((item) => item.value === key);
    expect(option?.title).toBe(expected.explanation);
    expect(formatZsPha1rExampleExplanation(state.pha1rClasses as Pha1rClassRow[], schoolFlags(state))).toBe(
      expected.explanation,
    );
  });

  it("přepnutí příkladů smaže předchozí třídy, odečty i vyloučení", () => {
    const state: Record<string, unknown> = {
      schoolEstablishedSec16_9: true,
      schoolAtHealthcareFacility: true,
      pha1rClasses: [{ id: 9, grade1Pupils: 30, grade1Par38: 9, grade1Par41: 9, establishedSec16_9: true }],
      phaRows: [{ id: 1, kind: "zs1", classes: 2, pupils: 15 }],
      basic1Pupils: 250,
    };
    loadInto(state, "pha1r_odecty_38_41");
    expect(state.pha1rClasses).toEqual(EXPECTED.pha1r_odecty_38_41.classes);
    expect(schoolFlags(state)).toEqual(EMPTY_PHA1R_SCHOOL_FLAGS);
    expect(pha1rOf(state).totalPha1r).toBe(20);

    loadInto(state, "pha1r_14_pod_hranici");
    expect(state.pha1rClasses).toEqual(EXPECTED.pha1r_14_pod_hranici.classes);
    expect(schoolFlags(state)).toEqual(EMPTY_PHA1R_SCHOOL_FLAGS);
    expect(pha1rOf(state).classes[0]?.relevantGrade1Pupils).toBe(14);
    expect(pha1rOf(state).totalPha1r).toBe(0);
    expect(state.phaRows).toEqual([]);
    expect(state.basic1Pupils).toBe(0);

    loadInto(state, "priloha_phamax_uplna_zs_sec16_zss");
    expect(state.tab).toBe("pha");
    expect(state.pha1rClasses).toEqual([]);
    expect(schoolFlags(state)).toEqual(EMPTY_PHA1R_SCHOOL_FLAGS);
    expect(state.phaRows).toEqual([
      { id: 1, kind: "zs1", classes: 2, pupils: 15 },
      { id: 2, kind: "zs1Heavy", classes: 1, pupils: 7 },
      { id: 3, kind: "zs2", classes: 3, pupils: 21 },
      { id: 4, kind: "zss1Heavy", classes: 1, pupils: 6 },
      { id: 5, kind: "zss2Heavy", classes: 2, pupils: 11 },
      { id: 6, kind: "zssII", classes: 1, pupils: 6 },
    ]);
    expect(pha1rOf(state).totalPha1r).toBe(0);

    loadInto(state, "pha1r_dve_tridy");
    expect(state.phaRows).toEqual([]);
    expect(state.pha1rClasses).toEqual(EXPECTED.pha1r_dve_tridy.classes);
    expect(pha1rOf(state).totalPha1r).toBe(40);
    expect(resolveZsTabSection("pha", "priloha_phamax_uplna_zs_sec16_zss")).toBe("pha");
    expect(resolveZsTabSection("phmax", "pha1r_dve_tridy")).toBe("basic");
    expect(resolveZsTabSection("php", "pha1r_dve_tridy")).toBe("php");
  });

  it("oficiální příklady po PHA1R příkladu nenesou jeho třídy", () => {
    for (const official of OFFICIAL_EXAMPLES) {
      const state = loadExample("pha1r_odecty_38_41");
      loadInto(state, official);
      expect(state.selectedExample).toBe(official);
      expect(state.pha1rClasses).toEqual([]);
      expect(schoolFlags(state)).toEqual(EMPTY_PHA1R_SCHOOL_FLAGS);
      expect(pha1rOf(state).totalPha1r).toBe(0);
    }
    const uplna = loadExample("priloha_uplna_zs_sec16");
    expect(uplna.tab).toBe("phmax");
    expect(uplna.basic1Classes).toBe(10);
    expect(uplna.basic1Pupils).toBe(250);
    expect(uplna.incl2Pupils).toBe(32);
    const prvni = loadExample("priloha_zs_1st_sec16");
    expect(prvni.basic1Classes).toBe(3);
    expect(prvni.incl1Pupils).toBe(6);
    const smisene = loadExample("smisene_tridy");
    expect(smisene.mixedMethodSecondSpecialClasses).toBe(4);
    expect(smisene.tab).toBe("phmax");
  });

  it("třída podle § 16 odst. 9 a školní vyloučení dají 0 hodin", () => {
    const loaded = loadExample("pha1r_15_zpusobila");
    const excludedClass = (loaded.pha1rClasses as Pha1rClassRow[]).map((row) => ({
      ...row,
      establishedSec16_9: true,
    }));
    const classResult = computeZsPha1r({ classes: excludedClass, flags: EMPTY_PHA1R_SCHOOL_FLAGS });
    expect(classResult.classes[0]?.relevantGrade1Pupils).toBe(15);
    expect(classResult.eligibleClassCount).toBe(0);
    expect(classResult.totalPha1r).toBe(0);

    const openClass = EXPECTED.pha1r_15_zpusobila.classes;
    for (const reason of [
      "schoolEstablishedSec16_9",
      "schoolAtInstitutionalOrProtectiveCare",
      "schoolAtHealthcareFacility",
    ] as const) {
      const flags: Pha1rSchoolFlags = { ...EMPTY_PHA1R_SCHOOL_FLAGS, [reason]: true };
      const result = computeZsPha1r({ classes: openClass, flags });
      expect(result.schoolExcluded).toBe(true);
      expect(result.eligibleClassCount).toBe(0);
      expect(result.totalPha1r).toBe(0);
    }
  });

  it("výběr otevře sekci PHA1Rmax a součet přehledu ji nepřičítá", () => {
    expect(readFileSync("src/zs/use-zs-page-derived-state.ts", "utf8")).toContain(
      "useZsSectionScroll(tab, selectedExample)",
    );
    const section = readFileSync("src/zs/ZsPha1rSection.tsx", "utf8");
    expect(section).toContain("illustrativeNote");
    expect(section).toContain('data-section="pha1r"');
    expect(section).toContain("<ResultCard");
    const overview = readFileSync("src/zs/ZsOverviewSection.tsx", "utf8");
    expect(overview).toContain("zsOverviewOrientationTotal(totalPhmax, totalPha, totalPhp)");
    expect(overview).not.toContain("totalPhmax + totalPha + totalPhp + totalPha1r");
    expect(zsOverviewOrientationTotal(100, 20, 5)).toBe(125);
  });
});
