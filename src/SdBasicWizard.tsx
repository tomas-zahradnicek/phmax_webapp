import {
  SD_BASIC_WIZARD_STEPS,
  SD_HERO_EXAMPLE_SELECT_ID,
  type SdBasicWizardStep,
} from "./sd-basic-wizard";
import { ProductBasicWizard } from "./ProductBasicWizard";

type SdBasicWizardProps = {
  step: SdBasicWizardStep;
  onStepChange: (step: SdBasicWizardStep) => void;
  onBack: () => void;
  onNext: () => void;
};

export function SdBasicWizard({ step, onStepChange, onBack, onNext }: SdBasicWizardProps) {
  return (
    <ProductBasicWizard
      productLabel="ŠD"
      steps={SD_BASIC_WIZARD_STEPS}
      step={step}
      heroExampleSelectId={SD_HERO_EXAMPLE_SELECT_ID}
      onStepChange={onStepChange}
      onBack={onBack}
      onNext={onNext}
    />
  );
}
