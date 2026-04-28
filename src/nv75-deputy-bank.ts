type AppendixGroup = "p2" | "p3";

export type Nv75DeputyKindP2 = "ms" | "ms_internat" | "zs" | "ss_konz" | "sd";
export type Nv75DeputyKindP3 =
  | "internat"
  | "zus_individual"
  | "zus_group"
  | "jazykova"
  | "ustavni"
  | "domov_mladeze"
  | "poradenske"
  | "vos"
  | "skolni_klub";

export type Nv75DeputyKind = Nv75DeputyKindP2 | Nv75DeputyKindP3;

export type Nv75DeputyActivity = {
  kind: Nv75DeputyKind;
  /** Počet jednotek dle § 4 (u některých druhů není pro tabulku povinný). */
  units: number;
  /**
   * Počet dalších pracovišť splňujících podmínky § 4d.
   * - MŠ/ZŠ/SŠ/Konzervatoř: +2 h za každé další pracoviště s min. 3 jednotkami.
   * - ŠPZ: +1 h za každé další pracoviště.
   */
  additionalWorkplacesEligible?: number;
};

export type Nv75DeputyBankInput = {
  activities: Nv75DeputyActivity[];
  /**
   * § 4c odst. 1 – žáci/studenti praktického vyučování nebo přípravy (po případných vyloučeních dle odst. 3).
   * 1–120 => +7 h, pak +2 h za každých dalších započatých 120.
   */
  practicalStudentsGeneral?: number;
  /**
   * § 4c odst. 1 – žáci/studenti praktického vyučování nebo přípravy mimo odborný výcvik E/H/L0.
   * Pokud je vyplněno spolu s `practicalStudentsOvEhl0`, použije se tento rozpad přednostně.
   */
  practicalStudentsGeneralNonOv?: number;
  /**
   * Žáci odborného výcviku v oborech E/H/L0.
   * Do §4c se započítají jen pokud je ekvivalent skupin OV < 10 (viz §4c odst. 3 + vyhl. 13/2005).
   */
  practicalStudentsOvEhl0?: number;
  /** Skupiny odborného výcviku vedené školou. */
  ovGroupsSchool?: number;
  /** Skupiny vedené instruktorem; počítá se 1/2 zaokrouhlená dolů. */
  ovGroupsInstructor?: number;
  /**
   * § 4c odst. 2 – žáci praktického vyučování ve škole dle §16/9.
   * 1–42 => +7 h, pak +2 h za každých dalších započatých 42.
   */
  practicalStudentsSec16?: number;
};

export type Nv75DeputyBankResult = {
  bankHoursTotal: number;
  bankHoursBase4b: number;
  bonus4cHours: number;
  bonus4dHours: number;
  appliedRule: "4b1" | "4b2a" | "4b2b" | "4b3" | "4b4" | "4b5a" | "4b5b" | "none";
  breakdown: readonly {
    kind: Nv75DeputyKind;
    units: number;
    appendix: AppendixGroup;
    hoursByKind: number;
    reductionBand: string;
    bonus4dHours: number;
    bonus4dRule: string;
  }[];
  notes: string[];
  ovGroupsEquivalent: number;
  ovDeputyEntitlementCount: number;
  ovDeputyEntitlementText: string;
  practicalStudentsGeneralCounted: number;
};

const APPENDIX_GROUP: Record<Nv75DeputyKind, AppendixGroup> = {
  ms: "p2",
  ms_internat: "p2",
  zs: "p2",
  ss_konz: "p2",
  sd: "p2",
  internat: "p3",
  zus_individual: "p3",
  zus_group: "p3",
  jazykova: "p3",
  ustavni: "p3",
  domov_mladeze: "p3",
  poradenske: "p3",
  vos: "p3",
  skolni_klub: "p3",
};

function ceilDivPositive(a: number, b: number) {
  return Math.floor((a + b - 1) / b);
}

function clampInt(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

type ReductionBand = {
  min?: number;
  max?: number;
  hours: number;
};

type ReductionTable = {
  bands: readonly ReductionBand[];
  repeatAfter?: {
    baseUnits: number;
    baseHours: number;
    stepUnits: number;
    stepHours: number;
  };
};
type Bonus4dRule = {
  bonusPerEligibleWorkplace: number;
};
type ReductionMatch = {
  hours: number;
  bandLabel: string;
};

const NV75_REDUCTION_TABLES: Record<Nv75DeputyKind, ReductionTable> = {
  ms: {
    bands: [
      { min: 4, max: 6, hours: 11 },
      { min: 7, max: 9, hours: 14 },
      { min: 10, max: 12, hours: 17 },
    ],
    repeatAfter: { baseUnits: 12, baseHours: 17, stepUnits: 3, stepHours: 3 },
  },
  ms_internat: {
    bands: [{ min: 3, hours: 15 }],
  },
  zs: {
    bands: [
      { min: 5, max: 6, hours: 9 },
      { min: 7, max: 14, hours: 11 },
      { min: 15, max: 17, hours: 15 },
      { min: 18, max: 26, hours: 22 },
      { min: 27, max: 35, hours: 33 },
    ],
    repeatAfter: { baseUnits: 35, baseHours: 33, stepUnits: 9, stepHours: 11 },
  },
  ss_konz: {
    bands: [
      { min: 4, max: 8, hours: 7 },
      { min: 9, max: 14, hours: 11 },
      { min: 15, max: 17, hours: 16 },
      { min: 18, max: 26, hours: 22 },
      { min: 27, max: 35, hours: 33 },
    ],
    repeatAfter: { baseUnits: 35, baseHours: 33, stepUnits: 9, stepHours: 11 },
  },
  sd: {
    bands: [
      { min: 2, max: 3, hours: 3 },
      { min: 4, max: 6, hours: 5 },
      { min: 7, max: 11, hours: 7 },
      { min: 12, max: 14, hours: 9 },
      { min: 15, hours: 11 },
    ],
  },
  internat: {
    bands: [
      { min: 5, max: 14, hours: 16 },
      { min: 15, max: 22, hours: 18 },
      { min: 23, hours: 19 },
    ],
  },
  zus_individual: {
    bands: [
      { min: 1, max: 14, hours: 11 },
      { min: 15, max: 29, hours: 14 },
      { min: 30, max: 39, hours: 18 },
      { min: 40, max: 49, hours: 23 },
      { min: 50, hours: 28 },
    ],
  },
  zus_group: {
    bands: [
      { min: 1, max: 14, hours: 9 },
      { min: 15, max: 29, hours: 12 },
      { min: 30, max: 39, hours: 16 },
      { min: 40, max: 49, hours: 21 },
      { min: 50, hours: 26 },
    ],
  },
  jazykova: {
    bands: [
      { min: 1, max: 14, hours: 9 },
      { min: 15, max: 29, hours: 12 },
      { min: 30, hours: 15 },
    ],
  },
  ustavni: {
    bands: [
      { min: 5, max: 14, hours: 14 },
      { min: 15, max: 22, hours: 16 },
      { min: 23, hours: 17 },
    ],
  },
  domov_mladeze: {
    bands: [{ min: 1, max: 5, hours: 10 }],
    repeatAfter: { baseUnits: 5, baseHours: 10, stepUnits: 7, stepHours: 2 },
  },
  poradenske: {
    bands: [{ min: 0, hours: 12 }],
  },
  vos: {
    bands: [
      { min: 1, max: 8, hours: 7 },
      { min: 9, max: 14, hours: 11 },
      { min: 15, max: 17, hours: 16 },
      { min: 18, max: 26, hours: 22 },
      { min: 27, hours: 33 },
    ],
  },
  skolni_klub: {
    bands: [{ min: 0, hours: 3 }],
  },
};
const NV75_BONUS4D_RULES: Partial<Record<Nv75DeputyKind, Bonus4dRule>> = {
  ms: { bonusPerEligibleWorkplace: 2 },
  zs: { bonusPerEligibleWorkplace: 2 },
  ss_konz: { bonusPerEligibleWorkplace: 2 },
  poradenske: { bonusPerEligibleWorkplace: 1 },
};
const NV75_BONUS4D_RULE_TEXTS: Partial<Record<Nv75DeputyKind, string>> = {
  ms: "§ 4d NV 75/2005 Sb.: +2 h týdně za každé další pracoviště, pokud je na něm alespoň 1 třída/skupina/oddělení (min. 3 jednotky).",
  zs: "§ 4d NV 75/2005 Sb.: +2 h týdně za každé další pracoviště, pokud je na něm alespoň 1 třída/skupina/oddělení (min. 3 jednotky).",
  ss_konz:
    "§ 4d NV 75/2005 Sb.: +2 h týdně za každé další pracoviště, pokud je na něm alespoň 1 třída/skupina/oddělení (min. 3 jednotky).",
  poradenske: "§ 4d NV 75/2005 Sb.: +1 h týdně za každé další pracoviště školského poradenského zařízení.",
};

function formatBandLabel(min: number, max: number) {
  if (max === Number.POSITIVE_INFINITY) return `${min}+`;
  if (min === max) return `${min}`;
  return `${min}-${max}`;
}

function reductionFromTable(table: ReductionTable, units: number): ReductionMatch {
  for (const band of table.bands) {
    const min = band.min ?? 0;
    const max = band.max ?? Number.POSITIVE_INFINITY;
    if (units >= min && units <= max) {
      return { hours: band.hours, bandLabel: formatBandLabel(min, max) };
    }
  }
  if (table.repeatAfter && units > table.repeatAfter.baseUnits) {
    const steps = ceilDivPositive(units - table.repeatAfter.baseUnits, table.repeatAfter.stepUnits);
    return {
      hours: table.repeatAfter.baseHours + steps * table.repeatAfter.stepHours,
      bandLabel: `${table.repeatAfter.baseUnits}+ (po ${table.repeatAfter.stepUnits})`,
    };
  }
  return { hours: 0, bandLabel: "mimo pásmo" };
}

function reductionByKind(kind: Nv75DeputyKind, unitsIn: number): ReductionMatch {
  const units = clampInt(unitsIn);
  return reductionFromTable(NV75_REDUCTION_TABLES[kind], units);
}

function bonus4dByKind(kind: Nv75DeputyKind, additionalEligibleIn: number) {
  const additionalEligible = clampInt(additionalEligibleIn);
  if (additionalEligible <= 0) return 0;
  const rule = NV75_BONUS4D_RULES[kind];
  if (!rule) return 0;
  return additionalEligible * rule.bonusPerEligibleWorkplace;
}

function bonus4dRuleLabel(kind: Nv75DeputyKind) {
  return NV75_BONUS4D_RULE_TEXTS[kind] ?? "§ 4d NV 75/2005 Sb. se na tento druh školy/zařízení nepoužije.";
}

function bonus4cGeneral(studentsIn: number) {
  const students = clampInt(studentsIn);
  if (students <= 0) return 0;
  if (students <= 120) return 7;
  return 7 + ceilDivPositive(students - 120, 120) * 2;
}

function bonus4cSec16(studentsIn: number) {
  const students = clampInt(studentsIn);
  if (students <= 0) return 0;
  if (students <= 42) return 7;
  return 7 + ceilDivPositive(students - 42, 42) * 2;
}

function ovDeputyEntitlementCountByGroups(groupsIn: number) {
  const groups = clampInt(groupsIn);
  if (groups < 10) return 0;
  if (groups < 20) return 1;
  return 2 + Math.floor((groups - 20) / 20);
}

function ovDeputyEntitlementText(count: number, groupsSchool: number, groupsInstructor: number) {
  if (count <= 0) return "Nevzniká samostatný výstup pro funkce OV.";
  if (groupsInstructor > 0) {
    if (count === 1) return "1 vedoucí učitel odborného výcviku";
    if (count <= 4) return `${count} vedoucí učitelé odborného výcviku`;
    return `${count} vedoucích učitelů odborného výcviku`;
  }
  if (groupsSchool > 0 && count === 1) {
    return "1 zástupce ředitele školy pro odborný výcvik nebo 1 vedoucí učitel odborného výcviku";
  }
  if (groupsSchool > 0 && count === 2) {
    return "2 zástupci ředitele školy pro odborný výcvik nebo 1 zástupce ředitele školy pro odborný výcvik a 1 vedoucí učitel odborného výcviku";
  }
  return `${count} funkcí pro odborný výcvik (zástupce ředitele školy pro odborný výcvik nebo vedoucí učitel odborného výcviku)`;
}

export function calculateNv75DeputyBank(input: Nv75DeputyBankInput): Nv75DeputyBankResult {
  const rows = input.activities.map((a) => {
    const reduction = reductionByKind(a.kind, a.units);
    const bonus4d = bonus4dByKind(a.kind, a.additionalWorkplacesEligible ?? 0);
    return {
      kind: a.kind,
      units: clampInt(a.units),
      appendix: APPENDIX_GROUP[a.kind],
      hoursByKind: reduction.hours,
      reductionBand: reduction.bandLabel,
      bonus4dHours: bonus4d,
      bonus4dRule: bonus4dRuleLabel(a.kind),
    };
  });

  const p2 = rows.filter((x) => x.appendix === "p2");
  const p3 = rows.filter((x) => x.appendix === "p3");
  const p2Kinds = [...new Set(p2.map((x) => x.kind as Nv75DeputyKindP2))];
  const p3Kinds = [...new Set(p3.map((x) => x.kind as Nv75DeputyKindP3))];
  const notes: string[] = [];

  const p2Count = p2Kinds.length;
  const p3Count = p3Kinds.length;

  const p2HoursSimple = p2.reduce((acc, x) => acc + x.hoursByKind, 0);
  const p3HoursSimple = p3.reduce((acc, x) => acc + x.hoursByKind, 0);

  const p2CombinedUnits = p2.reduce((acc, x) => acc + x.units, 0);
  const p2CandidateKinds = p2Kinds.filter((k) => k !== "sd");
  let p2HoursCombined = 0;
  if (p2CandidateKinds.length > 0) {
    p2HoursCombined = Math.max(...p2CandidateKinds.map((k) => reductionByKind(k, p2CombinedUnits).hours));
  } else if (p2Count > 1 && p2Kinds[0] === "sd") {
    notes.push(
      "§ 4b odst. 3: při více druzích z přílohy č. 2 nelze rozhodující hodnotu určovat podle školní družiny; v datech je pouze ŠD.",
    );
  }

  let base4b = 0;
  let rule: Nv75DeputyBankResult["appliedRule"] = "none";
  if (p2Count === 1 && p3Count === 0) {
    base4b = p2HoursSimple;
    rule = "4b1";
  } else if (p2Count === 0 && p3Count === 1) {
    base4b = p3HoursSimple;
    rule = "4b1";
  } else if (p2Count === 0 && p3Count > 1) {
    base4b = p3HoursSimple;
    rule = "4b4";
  } else if (p2Count === 1 && p3Count === 1) {
    base4b = p2HoursSimple + p3HoursSimple;
    rule = "4b2a";
  } else if (p2Count === 1 && p3Count > 1) {
    base4b = p2HoursSimple + p3HoursSimple;
    rule = "4b2b";
  } else if (p2Count > 1 && p3Count === 0) {
    base4b = p2HoursCombined;
    rule = "4b3";
  } else if (p2Count > 1 && p3Count === 1) {
    base4b = p2HoursCombined + p3HoursSimple;
    rule = "4b5a";
  } else if (p2Count > 1 && p3Count > 1) {
    base4b = p2HoursCombined + p3HoursSimple;
    rule = "4b5b";
  }

  const bonus4d = rows.reduce((acc, row) => acc + row.bonus4dHours, 0);
  const ovGroupsSchool = clampInt(input.ovGroupsSchool ?? 0);
  const ovGroupsInstructor = clampInt(input.ovGroupsInstructor ?? 0);
  const ovGroupsEquivalent = ovGroupsSchool + Math.floor(ovGroupsInstructor / 2);
  const ovDeputyEntitlementCount = ovDeputyEntitlementCountByGroups(ovGroupsEquivalent);
  const ovEntitlementText = ovDeputyEntitlementText(ovDeputyEntitlementCount, ovGroupsSchool, ovGroupsInstructor);
  const practicalNonOv = clampInt(input.practicalStudentsGeneralNonOv ?? 0);
  const practicalOv = clampInt(input.practicalStudentsOvEhl0 ?? 0);
  const usingSplit = input.practicalStudentsGeneralNonOv != null || input.practicalStudentsOvEhl0 != null;
  const practicalGeneralCounted = usingSplit
    ? practicalNonOv + (ovGroupsEquivalent < 10 ? practicalOv : 0)
    : clampInt(input.practicalStudentsGeneral ?? 0);
  if (usingSplit && ovGroupsEquivalent >= 10 && practicalOv > 0) {
    notes.push(
      "Žáci OV (E/H/L0) nejsou započteni do §4c, protože ekvivalent skupin OV je 10 a více; místo toho vzniká nárok na funkce OV dle vyhl. 13/2005.",
    );
  }
  const bonus4c = bonus4cGeneral(practicalGeneralCounted) + bonus4cSec16(input.practicalStudentsSec16 ?? 0);

  return {
    bankHoursTotal: base4b + bonus4c + bonus4d,
    bankHoursBase4b: base4b,
    bonus4cHours: bonus4c,
    bonus4dHours: bonus4d,
    appliedRule: rule,
    breakdown: rows,
    notes,
    ovGroupsEquivalent,
    ovDeputyEntitlementCount,
    ovDeputyEntitlementText: ovEntitlementText,
    practicalStudentsGeneralCounted: practicalGeneralCounted,
  };
}
