import type { PvProvozKind } from "../phmax-pv-logic";

export const PV_PROVOZ_OPTIONS: { value: PvProvozKind; label: string }[] = [
  { value: "polodenni", label: "Polodenní provoz (tabulka 1)" },
  { value: "celodenni", label: "Celodenní provoz (tabulka 2)" },
  { value: "internat", label: "Internátní provoz (tabulka 3)" },
  { value: "zdravotnicke", label: "Mateřská škola při zdravotnickém zařízení (S 4-01)" },
];

export type PvWorkplaceRowState = {
  id: string;
  label: string;
  provoz: PvProvozKind;
  classCount: number;
  avgHours: number;
  sec16Count: number;
  languageGroups: number;
  pv1dActualChildren: number;
  pv1dMinimumChildren: number;
  pv1dKuPhmaxCap: number;
  pv1dKuDecisionRef: string;
  pv1dExemption: boolean;
};

export function pvDurationBandTableNo(provoz: PvProvozKind): string {
  if (provoz === "polodenni") return "1";
  if (provoz === "celodenni") return "2";
  if (provoz === "internat") return "3";
  return "";
}

export function pvAvgHoursField(provoz: PvProvozKind): { min: number; max: number; step: number; hint: string } {
  if (provoz === "polodenni") {
    return {
      min: 4,
      max: 6.5,
      step: 0.25,
      hint: "Zadejte průměr za den podle reality; tabulka 1 rozpozná sloupec (4 až 6,5 h včetně).",
    };
  }
  if (provoz === "celodenni") {
    return {
      min: 6.5,
      max: 12,
      step: 0.25,
      hint: "Tabulka 2: musí být vyšší než 6,5 h až 12 h včetně. Hodnota přesně 6,5 h patří do tabulky 1 (přepněte na polodenní).",
    };
  }
  if (provoz === "internat") {
    return {
      min: 20,
      max: 24,
      step: 0.25,
      hint: "Tabulka 3: průměrná denní doba nejméně 20 h (sloupce dle přílohy až 22 h a více).",
    };
  }
  return { min: 0, max: 24, step: 0.25, hint: "" };
}
