import {
  clampProductBasicWizardStep,
  productWizardScrollSection,
  readProductBasicWizardStep,
  type ProductBasicWizardStep,
  type ProductBasicWizardStepMeta,
} from "./product-basic-wizard";

export const PV_BASIC_WIZARD_LS_KEY = "phmax-pv-basic-wizard-step";
export const PV_HERO_EXAMPLE_SELECT_ID = "pv-hero-example-select";

export type PvBasicWizardStep = ProductBasicWizardStep;

export const PV_BASIC_WIZARD_STEPS: readonly ProductBasicWizardStepMeta[] = [
  {
    step: 1,
    label: "Ukázka",
    lead: "Volitelně načtěte ukázku v horní liště, nebo rovnou přejděte na krok Vstupy a zadejte údaje své školy.",
    scrollSectionId: "pv-vstupy",
  },
  {
    step: 2,
    label: "Vstupy",
    lead: "Doplňte druh provozu, počet tříd a průměrnou denní dobu u každého pracoviště.",
    scrollSectionId: "pv-vstupy",
  },
  {
    step: 3,
    label: "Výsledek",
    lead: "Zkontrolujte součtový přehled PHmax/PHAmax a exportujte nebo uložte scénář.",
    scrollSectionId: "pv-vysledek",
  },
];

export const readPvBasicWizardStep = (): PvBasicWizardStep => readProductBasicWizardStep(PV_BASIC_WIZARD_LS_KEY);
export const clampPvBasicWizardStep = clampProductBasicWizardStep;
export const pvWizardScrollSection = (step: PvBasicWizardStep): string =>
  productWizardScrollSection(PV_BASIC_WIZARD_STEPS, step);
