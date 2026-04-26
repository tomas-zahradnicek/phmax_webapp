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
    bonus4dHours: number;
  }[];
  notes: string[];
  ovGroupsEquivalent: number;
  ovDeputyEntitlementCount: number;
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

function reductionByKind(kind: Nv75DeputyKind, unitsIn: number) {
  const units = clampInt(unitsIn);
  switch (kind) {
    case "ms":
      if (units < 4) return 0;
      if (units <= 6) return 11;
      if (units <= 9) return 14;
      if (units <= 12) return 17;
      return 17 + ceilDivPositive(units - 12, 3) * 3;
    case "ms_internat":
      return units >= 3 ? 15 : 0;
    case "zs":
      if (units < 5) return 0;
      if (units <= 6) return 9;
      if (units <= 14) return 11;
      if (units <= 17) return 15;
      if (units <= 26) return 22;
      if (units <= 35) return 33;
      return 33 + ceilDivPositive(units - 35, 9) * 11;
    case "ss_konz":
      if (units < 4) return 0;
      if (units <= 8) return 7;
      if (units <= 14) return 11;
      if (units <= 17) return 16;
      if (units <= 26) return 22;
      if (units <= 35) return 33;
      return 33 + ceilDivPositive(units - 35, 9) * 11;
    case "sd":
      if (units < 2) return 0;
      if (units <= 3) return 3;
      if (units <= 6) return 5;
      if (units <= 11) return 7;
      if (units <= 14) return 9;
      return 11;
    case "internat":
      if (units < 5) return 0;
      if (units <= 14) return 16;
      if (units <= 22) return 18;
      return 19;
    case "zus_individual":
      if (units <= 0) return 0;
      if (units <= 14) return 11;
      if (units <= 29) return 14;
      if (units <= 39) return 18;
      if (units <= 49) return 23;
      return 28;
    case "zus_group":
      if (units <= 0) return 0;
      if (units <= 14) return 9;
      if (units <= 29) return 12;
      if (units <= 39) return 16;
      if (units <= 49) return 21;
      return 26;
    case "jazykova":
      if (units <= 0) return 0;
      if (units <= 14) return 9;
      if (units <= 29) return 12;
      return 15;
    case "ustavni":
      if (units < 5) return 0;
      if (units <= 14) return 14;
      if (units <= 22) return 16;
      return 17;
    case "domov_mladeze":
      if (units <= 0) return 0;
      if (units <= 5) return 10;
      return 10 + ceilDivPositive(units - 5, 7) * 2;
    case "poradenske":
      return 12;
    case "vos":
      if (units <= 0) return 0;
      if (units <= 8) return 7;
      if (units <= 14) return 11;
      if (units <= 17) return 16;
      if (units <= 26) return 22;
      return 33;
    case "skolni_klub":
      return 3;
  }
}

function bonus4dByKind(kind: Nv75DeputyKind, additionalEligibleIn: number) {
  const additionalEligible = clampInt(additionalEligibleIn);
  if (additionalEligible <= 0) return 0;
  if (kind === "ms" || kind === "zs" || kind === "ss_konz") return additionalEligible * 2;
  if (kind === "poradenske") return additionalEligible;
  return 0;
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

export function calculateNv75DeputyBank(input: Nv75DeputyBankInput): Nv75DeputyBankResult {
  const rows = input.activities.map((a) => {
    const kindHours = reductionByKind(a.kind, a.units);
    const bonus4d = bonus4dByKind(a.kind, a.additionalWorkplacesEligible ?? 0);
    return {
      kind: a.kind,
      units: clampInt(a.units),
      appendix: APPENDIX_GROUP[a.kind],
      hoursByKind: kindHours,
      bonus4dHours: bonus4d,
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
    p2HoursCombined = Math.max(...p2CandidateKinds.map((k) => reductionByKind(k, p2CombinedUnits)));
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
  const ovDeputyEntitlementCount =
    ovGroupsEquivalent < 10 ? 0 : 1 + Math.floor(Math.max(0, ovGroupsEquivalent - 20) / 20);
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
    ovDeputyEntitlementCount: Math.max(0, ovDeputyEntitlementCount),
    practicalStudentsGeneralCounted: practicalGeneralCounted,
  };
}
