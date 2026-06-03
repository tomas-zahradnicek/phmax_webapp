import type { CalculatorQuickTourStep } from "./CalculatorModuleQuickTour";

export const PV_QUICK_TOUR_LS_KEY = "phmax-pv-quick-tour-v1";
export const SD_QUICK_TOUR_LS_KEY = "phmax-sd-quick-tour-v1";
export const SS_QUICK_TOUR_LS_KEY = "phmax-ss-quick-tour-v1";
export const NV75_QUICK_TOUR_LS_KEY = "phmax-nv75-quick-tour-v1";
export const ZS_QUICK_TOUR_LS_KEY = "phmax-zs-quick-tour-v1";

export const PV_QUICK_TOUR_STEPS: readonly CalculatorQuickTourStep[] = [
  {
    title: "Volitelná ukázka",
    detail: "Combobox Příkladové výpočty v Akcích – nebo rovnou vlastní pracoviště ve formuláři.",
    targetId: "pv-hero-example-select",
  },
  {
    title: "Vyplňte pracoviště",
    detail: "Upravte řádky tabulky – souhrn PHmax se přepočítá podle vašich vstupů.",
    targetId: "pv-vstupy",
  },
  {
    title: "Souhrn a export",
    detail: "Kontext výpočtu vpravo: verdikt, uložení a export CSV.",
    targetId: "workspace-results-dock",
  },
];

export const SD_QUICK_TOUR_STEPS: readonly CalculatorQuickTourStep[] = [
  {
    title: "Volitelná ukázka",
    detail: "Ukázka v Akcích je volitelná – formulář je vždy editovatelný.",
    targetId: "sd-hero-example-select",
  },
  { title: "Vstupy družiny", detail: "Vyplňte údaje školní družiny podle vaší provozní reality.", targetId: "sd-vstupy" },
  { title: "Souhrn", detail: "Dock vpravo ukáže PHmax a stav vstupů.", targetId: "workspace-results-dock" },
];

export const SS_QUICK_TOUR_STEPS: readonly CalculatorQuickTourStep[] = [
  {
    title: "Volitelná ukázka",
    detail: "Příkladové výpočty v Akcích – nebo rovnou evidence tříd.",
    targetId: "ss-hero-example-select",
  },
  { title: "Evidence tříd", detail: "Řádky tabulky – u každého řádku tlačítko Proč? vysvětlí vstupy.", targetId: "ss-vstupy" },
  { title: "Souhrn", detail: "PHmax a varování § 16 v docku.", targetId: "workspace-results-dock" },
];

export const ZS_QUICK_TOUR_STEPS: readonly CalculatorQuickTourStep[] = [
  {
    title: "Volitelná ukázka",
    detail: "Combobox Příkladové výpočty v Akcích – nebo rovnou vlastní třídy.",
    targetId: "zs-hero-example-select",
  },
  {
    title: "Režim a typ školy",
    detail: "Zvolte režim PHmax; přípravná třída ZŠ je v režimu „přípravné třídy, § 38 a § 41“ (ne v modulu PV/MŠ).",
    targetId: "zs-setup",
  },
  {
    title: "Souhrn a záložky",
    detail: "Dock vpravo: PHmax, PHAmax, PHPmax a mapa průběhu; pojmenované zálohy v Akcích.",
    targetId: "workspace-results-dock",
  },
];

export const NV75_QUICK_TOUR_STEPS: readonly CalculatorQuickTourStep[] = [
  {
    title: "Volitelná ukázka",
    detail: "Ukázka A v Akcích – nebo vlastní řádky banky odpočtů.",
    targetId: "nv75-hero-example-select",
  },
  { title: "Řádky banky", detail: "Vyplňte odpočty podle NV 75/2016 – orientační model.", targetId: "nv75-vstupy" },
  { title: "Souhrn banky", detail: "Celkový stav a export v docku.", targetId: "workspace-results-dock" },
];
