import { round2 } from "./phmax-zs-logic";

/** Metodika stanovení PHmax a PHAmax pro předškolní vzdělávání, verze 4 (2026) – tabulky 1–3. */

export type PvProvozKind = "polodenni" | "celodenni" | "internat" | "zdravotnicke";

/** Tabulka 1: polodenní provoz. Řádek = počet tříd 1–12, sloupec = pásma doby v h/den. */
export const PHMAX_PV_POLODENNI: readonly (readonly number[])[] = [
  [32.5, 35, 37.5, 40, 42.5],
  [60, 65, 70, 75, 80],
  [87.5, 95, 102.5, 110, 117.5],
  [115, 125, 135, 145, 155],
  [142.5, 155, 167.5, 180, 192.5],
  [170, 185, 200, 215, 230],
  [197.5, 215, 232.5, 250, 267.5],
  [225, 245, 265, 285, 305],
  [252.5, 275, 297.5, 320, 342.5],
  [280, 305, 330, 355, 380],
  [307.5, 335, 362.5, 390, 417.5],
  [335, 365, 395, 425, 455],
];

/** Tabulka 2: celodenní provoz. Řádek = počet tříd 1–12, 12 sloupců doby >6,5 h až 12 h. */
export const PHMAX_PV_CELODENNI: readonly (readonly number[])[] = [
  [45, 47.5, 50, 52.5, 55, 57.5, 60, 62.5, 65, 67.5, 70, 72.5],
  [85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140],
  [125, 132.5, 140, 147.5, 155, 162.5, 170, 177.5, 185, 192.5, 200, 207.5],
  [165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275],
  [205, 217.5, 230, 242.5, 255, 267.5, 280, 292.5, 305, 317.5, 330, 342.5],
  [245, 260, 275, 290, 305, 320, 335, 350, 365, 380, 395, 410],
  [285, 302.5, 320, 337.5, 355, 372.5, 390, 407.5, 425, 442.5, 460, 477.5],
  [325, 345, 365, 385, 405, 425, 445, 465, 485, 505, 525, 545],
  [365, 387.5, 410, 432.5, 455, 477.5, 500, 522.5, 545, 567.5, 590, 612.5],
  [405, 430, 455, 480, 505, 530, 555, 580, 605, 630, 655, 680],
  [445, 472.5, 500, 527.5, 555, 582.5, 610, 637.5, 665, 692.5, 720, 747.5],
  [485, 515, 545, 575, 605, 635, 665, 695, 725, 755, 785, 815],
];

/** Tabulka 3: internátní provoz. Řádek = 1–6 tříd, 5 sloupců doby 20–22+ h/den. */
export const PHMAX_PV_INTERNAT: readonly (readonly number[])[] = [
  [112.5, 115, 117.5, 120, 122.5],
  [225, 230, 235, 240, 245],
  [337.5, 345, 352.5, 360, 367.5],
  [450, 460, 470, 480, 490],
  [562.5, 575, 587.5, 600, 612.5],
  [675, 690, 705, 720, 735],
];

export const PHMAX_PV_ZDRAVOTNICKY_NA_TRIDU = 31;

/** Popisy pásma „průměrná doba provozu“ podle přílohy metodiky (tabulka 1). */
export const PV_POLODENNI_BAND_OPTIONS: readonly string[] = [
  "od 4 h do méně než 4,5 h",
  "od 4,5 h včetně do méně než 5 h",
  "od 5 h včetně do méně než 5,5 h",
  "od 5,5 h včetně do méně než 6 h",
  "od 6 h včetně do 6,5 h včetně",
];

/** Tabulka 2 – sloupce v pořadí jako v příloze. */
export const PV_CELODENNI_BAND_OPTIONS: readonly string[] = [
  "nad 6,5 h do méně než 7 h",
  "od 7 h včetně do méně než 7,5 h",
  "od 7,5 h včetně do méně než 8 h",
  "od 8 h včetně do méně než 8,5 h",
  "od 8,5 h včetně do méně než 9 h",
  "od 9 h včetně do méně než 9,5 h",
  "od 9,5 h včetně do méně než 10 h",
  "od 10 h včetně do méně než 10,5 h",
  "od 10,5 h včetně do méně než 11 h",
  "od 11 h včetně do méně než 11,5 h",
  "od 11,5 h včetně do méně než 12 h",
  "12 h (a více)",
];

/** Tabulka 3. */
export const PV_INTERNAT_BAND_OPTIONS: readonly string[] = [
  "od 20 h včetně do méně než 20,5 h",
  "od 20,5 h včetně do méně než 21 h",
  "od 21 h včetně do méně než 21,5 h",
  "od 21,5 h včetně do méně než 22 h",
  "od 22 h včetně a více",
];

export function getPvMaxClassCount(provoz: PvProvozKind): number {
  if (provoz === "internat") return PHMAX_PV_INTERNAT.length;
  if (provoz === "zdravotnicke") return 30;
  return 12;
}

export function getPvDurationBandLabel(provoz: PvProvozKind, bandIndex: number): string {
  if (provoz === "polodenni") return PV_POLODENNI_BAND_OPTIONS[bandIndex] ?? "";
  if (provoz === "celodenni") return PV_CELODENNI_BAND_OPTIONS[bandIndex] ?? "";
  if (provoz === "internat") return PV_INTERNAT_BAND_OPTIONS[bandIndex] ?? "";
  return "";
}

export type PvLookupIssue = { code: string; message: string };

export type PvBaseResult = {
  basePhmax: number;
  durationColumnIndex: number;
  durationColumnLabel: string;
};

/** Sloupec polodenního provozu podle průměrné denní doby (hodiny). */
export function polodenniDurationColumnIndex(avgHoursPerDay: number): number | null {
  if (avgHoursPerDay < 4 || avgHoursPerDay > 6.5) return null;
  if (avgHoursPerDay >= 4 && avgHoursPerDay < 4.5) return 0;
  if (avgHoursPerDay >= 4.5 && avgHoursPerDay < 5) return 1;
  if (avgHoursPerDay >= 5 && avgHoursPerDay < 5.5) return 2;
  if (avgHoursPerDay >= 5.5 && avgHoursPerDay < 6) return 3;
  return 4;
}

/** Sloupec celodenního provozu (nad 6,5 h do 12 h včetně). */
export function celodenniDurationColumnIndex(avgHoursPerDay: number): number | null {
  if (avgHoursPerDay <= 6.5) return null;
  if (avgHoursPerDay > 6.5 && avgHoursPerDay < 7) return 0;
  if (avgHoursPerDay >= 7 && avgHoursPerDay < 7.5) return 1;
  if (avgHoursPerDay >= 7.5 && avgHoursPerDay < 8) return 2;
  if (avgHoursPerDay >= 8 && avgHoursPerDay < 8.5) return 3;
  if (avgHoursPerDay >= 8.5 && avgHoursPerDay < 9) return 4;
  if (avgHoursPerDay >= 9 && avgHoursPerDay < 9.5) return 5;
  if (avgHoursPerDay >= 9.5 && avgHoursPerDay < 10) return 6;
  if (avgHoursPerDay >= 10 && avgHoursPerDay < 10.5) return 7;
  if (avgHoursPerDay >= 10.5 && avgHoursPerDay < 11) return 8;
  if (avgHoursPerDay >= 11 && avgHoursPerDay < 11.5) return 9;
  if (avgHoursPerDay >= 11.5 && avgHoursPerDay < 12) return 10;
  return 11;
}

export function internatDurationColumnIndex(avgHoursPerDay: number): number | null {
  if (avgHoursPerDay < 20) return null;
  if (avgHoursPerDay >= 20 && avgHoursPerDay < 20.5) return 0;
  if (avgHoursPerDay >= 20.5 && avgHoursPerDay < 21) return 1;
  if (avgHoursPerDay >= 21 && avgHoursPerDay < 21.5) return 2;
  if (avgHoursPerDay >= 21.5 && avgHoursPerDay < 22) return 3;
  return 4;
}

/**
 * PHmax z tabulek 1–3 podle metodiky: **počet tříd pracoviště** (řádek) a **průměrná denní doba provozu v hodinách**
 * (sloupec – aplikace zařadí do příslušného pásma jako v příloze).
 */
export function getPhmaxPvBase(params: {
  provoz: PvProvozKind;
  classCount: number;
  avgHoursPerDay: number;
}): { data: PvBaseResult | null; issues: PvLookupIssue[] } {
  const issues: PvLookupIssue[] = [];
  const { provoz, classCount, avgHoursPerDay } = params;

  if (classCount < 1) {
    issues.push({ code: "classes", message: "Zadejte počet tříd alespoň 1." });
    return { data: null, issues };
  }

  if (provoz === "zdravotnicke") {
    return {
      data: {
        basePhmax: round2(classCount * PHMAX_PV_ZDRAVOTNICKY_NA_TRIDU),
        durationColumnIndex: -1,
        durationColumnLabel: "MŠ při zdravotnickém zařízení (31 h/třídu dle metodiky)",
      },
      issues,
    };
  }

  if (provoz === "polodenni") {
    const col = polodenniDurationColumnIndex(avgHoursPerDay);
    if (col === null) {
      issues.push({
        code: "duration",
        message:
          "Polodenní provoz (tabulka 1): zadejte průměrnou denní dobu od 4 h do 6,5 h včetně (podle řádku záhlaví přílohy).",
      });
      return { data: null, issues };
    }
    if (classCount > PHMAX_PV_POLODENNI.length) {
      issues.push({
        code: "classes",
        message: `Tabulka polodenního provozu v aplikaci má ${PHMAX_PV_POLODENNI.length} tříd – nad limit použijte přílohu metodiky.`,
      });
      return { data: null, issues };
    }
    return {
      data: {
        basePhmax: PHMAX_PV_POLODENNI[classCount - 1][col],
        durationColumnIndex: col,
        durationColumnLabel: getPvDurationBandLabel("polodenni", col),
      },
      issues,
    };
  }

  if (provoz === "celodenni") {
    const col = celodenniDurationColumnIndex(avgHoursPerDay);
    if (col === null) {
      issues.push({
        code: "duration",
        message:
          "Celodenní provoz (tabulka 2): průměrná denní doba musí být vyšší než 6,5 h a nejvýše 12 h včetně (poslední sloupec). Do 6,5 h včetně patří tabulka 1 – polodenní provoz.",
      });
      return { data: null, issues };
    }
    if (classCount > PHMAX_PV_CELODENNI.length) {
      issues.push({
        code: "classes",
        message: `Tabulka celodenního provozu v aplikaci má ${PHMAX_PV_CELODENNI.length} tříd.`,
      });
      return { data: null, issues };
    }
    return {
      data: {
        basePhmax: PHMAX_PV_CELODENNI[classCount - 1][col],
        durationColumnIndex: col,
        durationColumnLabel: getPvDurationBandLabel("celodenni", col),
      },
      issues,
    };
  }

  const col = internatDurationColumnIndex(avgHoursPerDay);
  if (col === null) {
    issues.push({
      code: "duration",
      message:
        "Internátní provoz (tabulka 3): průměrná denní doba musí být nejméně 20 h (sloupce 20 h až 22 h a více dle přílohy).",
    });
    return { data: null, issues };
  }
  if (classCount > PHMAX_PV_INTERNAT.length) {
    issues.push({
      code: "classes",
      message: `Tabulka internátního provozu v aplikaci má ${PHMAX_PV_INTERNAT.length} tříd (příloha metodiky).`,
    });
    return { data: null, issues };
  }
  return {
    data: {
      basePhmax: PHMAX_PV_INTERNAT[classCount - 1][col],
      durationColumnIndex: col,
      durationColumnLabel: getPvDurationBandLabel("internat", col),
    },
    issues,
  };
}

/** +5 h/týden za každou třídu (školu) dle § 16 odst. 9 (metodika PV v4). */
export function phmaxPvSec16Bonus(sec16ClassCount: number): number {
  return Math.max(0, sec16ClassCount) * 5;
}

/** +1 h za každou skupinu jazykové přípravy (§ 1d odst. 11, metodika v4). */
export function phmaxPvLanguagePrepBonus(languageGroupCount: number): number {
  return Math.max(0, languageGroupCount);
}

/**
 * PHAmax za třídy § 16 odst. 9: 36 h/třídu při provozu ≥ 8 h, jinak poměrně (metodika PV v4).
 */
export function getPhaMaxPv(sec16ClassCount: number, avgHoursPerDayForWorkplace: number): number | null {
  if (sec16ClassCount <= 0) return null;
  const perClass = avgHoursPerDayForWorkplace >= 8 ? 36 : round2(36 * (avgHoursPerDayForWorkplace / 8));
  return round2(perClass * sec16ClassCount);
}

export function computePvPhmaxTotal(params: {
  provoz: PvProvozKind;
  classCount: number;
  avgHoursPerDay: number;
  sec16ClassCount: number;
  languageGroupCount: number;
}): {
  base: PvBaseResult | null;
  sec16Bonus: number;
  languageBonus: number;
  totalPhmax: number | null;
  issues: PvLookupIssue[];
} {
  const { data: base, issues: lookupIssues } = getPhmaxPvBase({
    provoz: params.provoz,
    classCount: params.classCount,
    avgHoursPerDay: params.avgHoursPerDay,
  });
  const issues = [...lookupIssues];
  const sec16Bonus = phmaxPvSec16Bonus(params.sec16ClassCount);
  const languageBonus = phmaxPvLanguagePrepBonus(params.languageGroupCount);

  if (!base) {
    return { base: null, sec16Bonus, languageBonus, totalPhmax: null, issues };
  }

  const totalPhmax = round2(base.basePhmax + sec16Bonus + languageBonus);
  return { base, sec16Bonus, languageBonus, totalPhmax, issues };
}
