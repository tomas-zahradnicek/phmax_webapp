import type { ProductBasicWizardStepMeta } from "../product-basic-wizard";

export const ZS_PHA_BASIC_WIZARD_LS_KEY = "phmax-zs-pha-basic-wizard-step";

export const ZS_PHA_HERO_EXAMPLE_SELECT_ID = "zs-hero-example-select";

export const ZS_PHA_BASIC_WIZARD_STEPS: readonly ProductBasicWizardStepMeta[] = [
  {
    step: 1,
    label: "Typ školy",
    lead: "Zkontrolujte režim výpočtu – PHAmax se zobrazí jen u typů školy, kde metodika modul počítá.",
    scrollSectionId: "setup",
  },
  {
    step: 2,
    label: "Vstupy PHAmax",
    lead: "Vyplňte třídy a žáky v tabulce asistentů pedagoga; ukázka v horní liště je volitelná.",
    scrollSectionId: "pha",
  },
  {
    step: 3,
    label: "Souhrn",
    lead: "Porovnejte PHAmax s PHmax a PHPmax v celkovém přehledu; případně přepněte na jinou záložku.",
    scrollSectionId: "overview",
  },
];
