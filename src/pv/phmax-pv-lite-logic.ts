import { computePv1d3Reduction, type Pv1d3ReductionResult } from "../phmax-pv-1d3-reduction";
import {
  computePvPhmaxTotal,
  getPvMaxClassCount,
  getPvSec2MinimumChildrenTotal,
  type PvProvozKind,
} from "../phmax-pv-logic";
import { PV_PROVOZ_OPTIONS } from "./pv-workplace-shared";

export type PvLiteInput = {
  provoz: PvProvozKind;
  classCount: number;
  avgHours: number;
  /** § 2 odst. 2 vyhl. 14/2005 Sb. – jediná mateřská škola v obci. */
  soleMsInMunicipality: boolean;
  /** Skutečný počet dětí na pracovišti; při vyplnění se posoudí krácení § 1d odst. 3. */
  actualChildren: number;
  /** Počet tříd dle § 16 odst. 9 (+5 h/třídu k PHmax). */
  sec16ClassCount: number;
};

export type PvLiteResult = {
  ok: true;
  provoz: PvProvozKind;
  provozLabel: string;
  classCount: number;
  avgHours: number;
  soleMsInMunicipality: boolean;
  actualChildren: number;
  sec16ClassCount: number;
  sec16Bonus: number;
  minimumChildren: number | null;
  phmaxHours: number;
  basePhmax: number;
  tableBasePhmax: number;
  durationBandLabel: string;
  reduction1d3: Pv1d3ReductionResult | null;
  tableWarning: string | null;
  narrative: { p1: string; p2: string; disclaimer: string };
};

export type PvLiteError = {
  ok: false;
  message: string;
};

export function computePvLitePhmax(input: PvLiteInput): PvLiteResult | PvLiteError {
  const provoz = input.provoz;
  const classCount = Math.max(0, Math.floor(input.classCount));
  const avgHours = Math.max(0, input.avgHours);
  const actualChildren = Math.max(0, Math.floor(input.actualChildren));
  const sec16ClassCount = Math.max(0, Math.floor(input.sec16ClassCount));
  const provozLabel = PV_PROVOZ_OPTIONS.find((o) => o.value === provoz)?.label ?? provoz;

  if (classCount < 1) {
    return { ok: false, message: "Zadejte počet tříd pracoviště (alespoň 1)." };
  }

  if (provoz !== "zdravotnicke" && avgHours <= 0) {
    return { ok: false, message: "Zadejte průměrnou denní dobu provozu v hodinách." };
  }

  const maxClasses = getPvMaxClassCount(provoz);
  const tableWarning =
    provoz !== "zdravotnicke" && classCount > maxClasses
      ? `Tabulka v aplikaci končí u ${maxClasses} tříd – u vyššího počtu ověřte přílohu metodiky.`
      : null;

  const computed = computePvPhmaxTotal({
    provoz,
    classCount,
    avgHoursPerDay: provoz === "zdravotnicke" ? 0 : avgHours,
    sec16ClassCount,
    languageGroupCount: 0,
  });

  if (!computed.totalPhmax || !computed.base) {
    const message = computed.issues[0]?.message ?? "Výpočet se nepodařil – zkontrolujte vstupy.";
    return { ok: false, message };
  }

  const tableBasePhmax = computed.base.basePhmax;
  const basePhmax = computed.totalPhmax;
  const minimumChildren = getPvSec2MinimumChildrenTotal({
    soleMsInMunicipality: input.soleMsInMunicipality,
    classCount,
  });

  let phmaxHours = basePhmax;
  let reduction1d3: Pv1d3ReductionResult | null = null;

  if (actualChildren > 0 && minimumChildren != null) {
    reduction1d3 = computePv1d3Reduction(basePhmax, {
      actualChildren,
      minimumChildren,
    });
    if (reduction1d3.status === "reduced" || reduction1d3.status === "no_reduction") {
      phmaxHours = reduction1d3.phmaxAfter;
    }
  }

  const hoursLabel =
    provoz === "zdravotnicke"
      ? "bez údaje o denní době"
      : `${avgHours.toLocaleString("cs-CZ")} h/den`;

  const minimumNote =
    minimumChildren != null
      ? ` Nejnižší počet dětí dle § 2${input.soleMsInMunicipality ? " odst. 2 (jediná MŠ v obci)" : ""}: ${minimumChildren.toLocaleString("cs-CZ")}.`
      : "";

  const sec16Note =
    sec16ClassCount > 0
      ? ` Bonus § 16 odst. 9: +${computed.sec16Bonus.toLocaleString("cs-CZ")} h (${sec16ClassCount} ${
          sec16ClassCount === 1 ? "třída" : sec16ClassCount < 5 ? "třídy" : "tříd"
        }).`
      : "";

  return {
    ok: true,
    provoz,
    provozLabel,
    classCount,
    avgHours,
    soleMsInMunicipality: input.soleMsInMunicipality,
    actualChildren,
    sec16ClassCount,
    sec16Bonus: computed.sec16Bonus,
    minimumChildren,
    phmaxHours,
    basePhmax,
    tableBasePhmax,
    durationBandLabel: computed.base.durationColumnLabel,
    reduction1d3,
    tableWarning,
    narrative: {
      p1: `${provozLabel}: ${classCount} ${
        classCount === 1 ? "třída" : classCount < 5 ? "třídy" : "tříd"
      }, ${hoursLabel}${actualChildren > 0 ? `, ${actualChildren} dětí` : ""}${sec16Note}`,
      p2:
        reduction1d3?.status === "reduced"
          ? `PHmax po orientačním krácení § 1d odst. 3 činí ${phmaxHours.toLocaleString("cs-CZ", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} h týdně (základ ${basePhmax.toLocaleString("cs-CZ")} h před krácením, tabulka ${tableBasePhmax.toLocaleString("cs-CZ")} h).${minimumNote}`
          : `PHmax z tabulky metodiky činí ${phmaxHours.toLocaleString("cs-CZ", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} h týdně (základ z tabulky ${tableBasePhmax.toLocaleString("cs-CZ")} h, pásmo: ${computed.base.durationColumnLabel}).${minimumNote}`,
      disclaimer:
        actualChildren > 0
          ? "Orientační krácení § 1d odst. 3 – závazné je rozhodnutí krajského úřadu a plné znění vyhlášky č. 14/2005 Sb. Více pracovišť a PHAmax řeší plná verze."
          : "Orientační výpočet. Více pracovišť, jazyková příprava a PHAmax – plná verze kalkulačky.",
    },
  };
}
