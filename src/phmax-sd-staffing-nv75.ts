import { round2 } from "./phmax-zs-logic";

const MSG_NO_VEDOUCI_HEAD =
  "Vedoucí vychovatel není v tomto modelu uplatněn samostatným slotem dle tab. 7.2; veškeré PHmax se dělí dle PPV ostatních vychovatelů (tab. 7.1).";

/** Týdenní rozsah přímé pedagogické činnosti vychovatele (příl. č. 1, tab. 7.1, NV č. 75/2005 Sb.) – volitelná volba plného „slotu“. */
export type SdVychovatelPpcFullHours = 28 | 29 | 30;

/**
 * Vedoucí vychovatel – příl. č. 1, tab. 7.2, řádek „Školní družina / vedoucí vychovatel“.
 * Počet jednotek = počet oddělení družiny (v aplikaci: celkový počet oddělení pro výpočet).
 * Pro 1–2 oddělení tabulka 7.2 rozsah neuvádí — vracíme 0 a informační poznámku.
 */
export function getNv2005VedouciVychovatelHours(departmentCount: number): { hours: number; note?: string } {
  if (departmentCount < 1) {
    return { hours: 0, note: "Neplatný počet oddělení." };
  }
  if (departmentCount <= 2) {
    return {
      hours: 0,
      note:
        "Příloha č. 1, tab. 7.2 k nařízení vlády č. 75/2005 Sb. uvádí týdenní rozsah vedoucího vychovatele až od 3 oddělení. " +
        "Celý PHmax je v modelu přidělen ostatním vychovatelům; úvazek vedoucího doplňte dle vnitřních pravidel školy.",
    };
  }
  if (departmentCount === 3) return { hours: 25 };
  if (departmentCount >= 4 && departmentCount <= 6) return { hours: 23 };
  if (departmentCount >= 7 && departmentCount <= 11) return { hours: 21 };
  if (departmentCount >= 12 && departmentCount <= 14) return { hours: 19 };
  return { hours: 17 };
}

export type SdStaffingSplitNv75 = {
  totalPhmax: number;
  departmentCount: number;
  vychovatelFullPpc: SdVychovatelPpcFullHours;
  headVedouciHours: number;
  headNote?: string;
  forOthersPhmax: number;
  fullTimeSlots: number;
  partialHours: number;
  /** Podíl zkráceného slotu vůči zvolenému plnému rozsahu vychovatele (0–100). */
  partialPercentOfFull: number;
  /** PHmax menší než rozsah vedoucího dle tabulky – model je v rozporu, ověřte vstupy. */
  inconsistent: boolean;
  inconsistencyMessage?: string;
  /**
   * Zda v modelu nejdřív odebíráme týdenní rozsah pro vedoucího dle tab. 7.2, pak dělí zbytek.
   * Při `false` není tento slot uplatňován (celé PHmax jde na PPV ostatních, tab. 7.1).
   */
  separateVedoucihoDleT72: boolean;
};

/**
 * Rozdělí součtový PHmax: nejdřív odpovídající rozsah vedoucího (tab. 7.2), zbytek na plné a případně zkrácený úvazek
 * vychovatele s přímou pedagogickou činností ve zvolené délce 28/29/30 h (tab. 7.1, rozsah zákona).
 * @param separateVedoucihoDleT72 Výchozí `true`. Při `false` se rozsah vedoucího dle tab. 7.2 v modelu neodečítá
 *   a celé PHmax se dělí dle PPV ostatních (tab. 7.1).
 */
export function computeSdStaffingSplitNv75(params: {
  totalPhmax: number;
  departmentCount: number;
  vychovatelFullPpc: SdVychovatelPpcFullHours;
  separateVedoucihoDleT72?: boolean;
}): SdStaffingSplitNv75 {
  const { totalPhmax, departmentCount, vychovatelFullPpc: slot, separateVedoucihoDleT72: sepIn = true } = params;
  const separateVedoucihoDleT72 = sepIn !== false;
  const head = separateVedoucihoDleT72 ? getNv2005VedouciVychovatelHours(departmentCount) : { hours: 0, note: undefined };

  if (totalPhmax <= 0) {
    return {
      totalPhmax,
      departmentCount,
      vychovatelFullPpc: slot,
      headVedouciHours: head.hours,
      headNote: head.note,
      forOthersPhmax: 0,
      fullTimeSlots: 0,
      partialHours: 0,
      partialPercentOfFull: 0,
      inconsistent: true,
      inconsistencyMessage: "PHmax není kladné – model úvazků nelze sestavit.",
      separateVedoucihoDleT72,
    };
  }

  if (separateVedoucihoDleT72 && head.hours > totalPhmax + 1e-6) {
    return {
      totalPhmax,
      departmentCount,
      vychovatelFullPpc: slot,
      headVedouciHours: head.hours,
      headNote: head.note,
      forOthersPhmax: 0,
      fullTimeSlots: 0,
      partialHours: 0,
      partialPercentOfFull: 0,
      inconsistent: true,
      inconsistencyMessage:
        "Rozsah vedoucího vychovatele dle tab. 7.2 je vyšší než vypočtený PHmax. Zkontrolujte oddělení, krácení a vstupy – model je jen orientační.",
      separateVedoucihoDleT72: true,
    };
  }

  const forOthers = round2(totalPhmax - head.hours);
  if (forOthers < 0) {
    return {
      totalPhmax,
      departmentCount,
      vychovatelFullPpc: slot,
      headVedouciHours: head.hours,
      headNote: head.note,
      forOthersPhmax: forOthers,
      fullTimeSlots: 0,
      partialHours: 0,
      partialPercentOfFull: 0,
      inconsistent: true,
      inconsistencyMessage: "Záporný zbytek po vedoucím – zkontrolujte výpočet PHmax.",
      separateVedoucihoDleT72: true,
    };
  }

  const fullTimeSlots = Math.floor(forOthers / slot);
  const partialRaw = forOthers - fullTimeSlots * slot;
  const partialHours = round2(partialRaw);
  const partialPercentOfFull = slot > 0 ? round2((partialHours / slot) * 100) : 0;

  return {
    totalPhmax: round2(totalPhmax),
    departmentCount,
    vychovatelFullPpc: slot,
    headVedouciHours: head.hours,
    headNote: !separateVedoucihoDleT72 ? MSG_NO_VEDOUCI_HEAD : head.note,
    forOthersPhmax: forOthers,
    fullTimeSlots,
    partialHours,
    partialPercentOfFull,
    inconsistent: false,
    separateVedoucihoDleT72,
  };
}
