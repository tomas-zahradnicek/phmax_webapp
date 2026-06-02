import type { ProductBasicWizardStepMeta } from "../product-basic-wizard";

export const ZS_PHP_BASIC_WIZARD_LS_KEY = "phmax-zs-php-basic-wizard-step";

export const ZS_PHP_HERO_EXAMPLE_SELECT_ID = "zs-hero-example-select";

export const ZS_PHP_BASIC_WIZARD_STEPS: readonly ProductBasicWizardStepMeta[] = [
  {
    step: 1,
    label: "Typ školy",
    lead: "U menších škol může být PHPmax nulové – ověřte, že je zvolen správný režim výpočtu.",
    scrollSectionId: "setup",
  },
  {
    step: 2,
    label: "Vstupy PHPmax",
    lead: "Zadejte průměr žáků za tři roky a případné odečty; můžete začít bez ukázky.",
    scrollSectionId: "php",
  },
  {
    step: 3,
    label: "Souhrn",
    lead: "Zkontrolujte pásmo PHPmax a souhrn všech tří modulů v celkovém přehledu.",
    scrollSectionId: "overview",
  },
];
