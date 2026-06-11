export const DASHBOARD_QUICK_TOUR_LS_KEY = "phmax-dash-quick-tour-v1";

export type DashboardQuickTourStep = {
  title: string;
  detail: string;
  targetSelector: string;
};

export const DASHBOARD_QUICK_TOUR_STEPS: readonly DashboardQuickTourStep[] = [
  {
    title: "Záložky modulů",
    detail: "Přepínejte mezi Přehledem, PV, ŠD, ZŠ, SŠ a NV75 – každý modul má vlastní kalkulačku.",
    targetSelector: ".calculator-hero-shell--dash .calculator-hero-shell__nav",
  },
  {
    title: "Karty modulů",
    detail: "U každé kalkulačky: Otevřít vlastní data, Rychlý PHmax (kde je k dispozici) nebo Začít u ukázky.",
    targetSelector: "[data-dash-tour='module-cards']",
  },
  {
    title: "Návod k použití",
    detail: "Kompletní průvodce metodikou, postupem a exporty – vždy dostupný vpravo nahoře.",
    targetSelector: "[data-dash-tour='user-guide']",
  },
];
