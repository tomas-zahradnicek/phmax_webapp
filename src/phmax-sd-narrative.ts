import { SD_MAX_DEPARTMENTS_IN_TABLE, suggestedDepartmentsFromPupils } from "./phmax-sd-logic";

/**
 * Orientační meze počtu oddělení z počtu žáků 1. stupně — pro laický text v UI, ne pro právní normu.
 * - Doporučeno: běžná metodická orientace dělení 27 (ceil).
 * - Horní mez: při průměru aspoň cca 20 dětí na oddělení (floor ÷ 20, min. 1, max z tabulky).
 * - Spodní větev: při průměru cca až 32 dětí na oddělení (ceil ÷ 32) — může být splatná s výjimkou / vnitřní organizací.
 */
export function getSdDepartmentRangeFromPupils(pupils: number): {
  recommended: number;
  maxBy20: number;
  minBy32: number;
} | null {
  if (pupils <= 0) return null;
  return {
    recommended: suggestedDepartmentsFromPupils(pupils),
    maxBy20: Math.max(1, Math.min(SD_MAX_DEPARTMENTS_IN_TABLE, Math.floor(pupils / 20))),
    minBy32: Math.max(1, Math.ceil(pupils / 32)),
  };
}

export function buildSdPlainNarrativeText(params: {
  pupils: number;
  hasSpecialDepartments: boolean;
  totalDepartments: number;
  phmaxHours: number;
}): { p1: string; p2: string; disclaimer: string } | null {
  const { pupils, hasSpecialDepartments, totalDepartments, phmaxHours } = params;
  if (pupils <= 0) return null;

  const r = getSdDepartmentRangeFromPupils(pupils);
  if (!r) return null;

  const pFmt = pupils.toLocaleString("cs-CZ", { maximumFractionDigits: 0 });
  const phmaxFmt = phmaxHours.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const specNote = hasSpecialDepartments
    ? " U speciálních oddělení může být reálné členění a výpočet jiné — vycházejte z metodiky a § 16/9."
    : "";

  let p1: string;
  if (r.minBy32 < r.maxBy20 && r.recommended >= r.minBy32 && r.recommended <= r.maxBy20) {
    p1 =
      `Při zadaném počtu ${pFmt} žáků 1. stupně lze orientačně uvažovat o ${r.minBy32} až ${r.maxBy20} oddělení (hrubé` +
      ` ohraničení kolem cca 32 a 20 dětí na oddělení, podle běžně používaných postupů v praxi).` +
      ` Doporučené číslo z metodického dělení 27 a zaokrouhlení nahoru je ${r.recommended} oddělení.${specNote} ` +
      `Konečný počet a organizace vždy ověřte ve vyhlášce, metodice a s příslušným orgánem.`;
  } else {
    p1 =
      `Při zadaném počtu ${pFmt} žáků 1. stupně vychází běžná metodická orientace (dělení 27, nahoru) ${r.recommended} oddělení.` +
      ` Rozmezí oddělení dle cca 20 až 32 žáků na oddělení tady na tomto skóre nesedí jednoznačně; u malých kolektivů nebo` +
      ` jinak organizované družiny proto konkrétní počet dál ověřte dle metodiky a u zřizovatele.${specNote}`;
  }

  const p2 =
    `Při celkovém počtu ${totalDepartments} oddělení a vámi zvolenými pravidly činí PHmax ${phmaxFmt} h` +
    ` týdně (nejvyšší týdenní součet přímé pedagogické činnosti vychovatelů podle zvolené tabulky a krácení v aplikaci).` +
    ` Rozpad po odděleních otevřete v části s podrobným rozpisem. Volitelný odhad rozdělení na vedoucího a` +
    ` ostatní vychovatele dle nařízení vlády č. 75/2005 Sb. (příl. č. 1) je v sekci „Model úvazků (NV 75/2005)“` +
    ` pod tímto textem. Konečné úvazky závisí na vnitřním úvazku školy a pracovních smlouvách.`;

  const disclaimer =
    "Jde o srozumitelné shrnutí výsledků v aplikaci, nikoli o oficiální vyjádření. Inspirovali jsme se běžnými" +
    " metodickými popisy, ale nijak nenapodobujeme konkrétní texty třetích stran.";

  return { p1, p2, disclaimer };
}
