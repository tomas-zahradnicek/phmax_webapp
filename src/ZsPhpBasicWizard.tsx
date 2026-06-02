import { ProductBasicWizard } from "./ProductBasicWizard";
import type { ProductBasicWizardStep } from "./product-basic-wizard";
import { ZS_PHP_BASIC_WIZARD_STEPS, ZS_PHP_HERO_EXAMPLE_SELECT_ID } from "./zs/zs-php-basic-wizard";

type ZsPhpBasicWizardProps = {
  step: ProductBasicWizardStep;
  moduleApplies?: boolean;
  onStartEmptyForm?: () => void;
  onStepChange: (step: ProductBasicWizardStep) => void;
  onBack: () => void;
  onNext: () => void;
};

export function ZsPhpBasicWizard({
  step,
  moduleApplies = true,
  onStartEmptyForm,
  onStepChange,
  onBack,
  onNext,
}: ZsPhpBasicWizardProps) {
  if (!moduleApplies) {
    return (
      <section className="card card--onboarding section-card zs-pha-php-basic-guide" aria-label="Průvodce PHPmax">
        <p className="zs-pha-php-basic-guide__inactive" role="status">
          Pro zvolený typ školy se <strong>PHPmax</strong> v tomto modelu metodiky nepočítá – změňte režim v kroku Typ
          školy.
        </p>
      </section>
    );
  }

  return (
    <ProductBasicWizard
      productLabel="PHPmax"
      steps={ZS_PHP_BASIC_WIZARD_STEPS}
      step={step}
      heroExampleSelectId={ZS_PHP_HERO_EXAMPLE_SELECT_ID}
      onStartEmptyForm={onStartEmptyForm}
      onStepChange={onStepChange}
      onBack={onBack}
      onNext={onNext}
    />
  );
}
