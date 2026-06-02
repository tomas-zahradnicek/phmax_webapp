import { ProductBasicWizard } from "./ProductBasicWizard";
import type { ProductBasicWizardStep } from "./product-basic-wizard";
import { ZS_PHA_BASIC_WIZARD_STEPS, ZS_PHA_HERO_EXAMPLE_SELECT_ID } from "./zs/zs-pha-basic-wizard";

type ZsPhaBasicWizardProps = {
  step: ProductBasicWizardStep;
  moduleApplies?: boolean;
  onStartEmptyForm?: () => void;
  onStepChange: (step: ProductBasicWizardStep) => void;
  onBack: () => void;
  onNext: () => void;
};

export function ZsPhaBasicWizard({
  step,
  moduleApplies = true,
  onStartEmptyForm,
  onStepChange,
  onBack,
  onNext,
}: ZsPhaBasicWizardProps) {
  if (!moduleApplies) {
    return (
      <section className="card card--onboarding section-card zs-pha-php-basic-guide" aria-label="Průvodce PHAmax">
        <p className="zs-pha-php-basic-guide__inactive" role="status">
          Pro zvolený typ školy se <strong>PHAmax</strong> v tomto modelu metodiky nepočítá – změňte režim v kroku Typ
          školy, nebo použijte jiný modul výpočtu.
        </p>
      </section>
    );
  }

  return (
    <ProductBasicWizard
      productLabel="PHAmax"
      steps={ZS_PHA_BASIC_WIZARD_STEPS}
      step={step}
      heroExampleSelectId={ZS_PHA_HERO_EXAMPLE_SELECT_ID}
      onStartEmptyForm={onStartEmptyForm}
      onStepChange={onStepChange}
      onBack={onBack}
      onNext={onNext}
    />
  );
}
