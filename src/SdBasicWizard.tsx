import {
  SD_BASIC_WIZARD_STEPS,
  SD_HERO_EXAMPLE_SELECT_ID,
  type SdBasicWizardStep,
} from "./sd-basic-wizard";
import { ProductBasicWizard } from "./ProductBasicWizard";

type SdBasicWizardInputIssueFix = {
  onFix: () => void;
  fixLabel?: string;
};

type SdBasicWizardProps = {
  step: SdBasicWizardStep;
  onStartEmptyForm?: () => void;
  inputIssueFix?: SdBasicWizardInputIssueFix;
  onStepChange: (step: SdBasicWizardStep) => void;
  onBack: () => void;
  onNext: () => void;
};

export function SdBasicWizard({ step, onStartEmptyForm, inputIssueFix, onStepChange, onBack, onNext }: SdBasicWizardProps) {
  return (
    <ProductBasicWizard
      productLabel="ŠD"
      steps={SD_BASIC_WIZARD_STEPS}
      step={step}
      heroExampleSelectId={SD_HERO_EXAMPLE_SELECT_ID}
      onStartEmptyForm={onStartEmptyForm}
      inputIssueFix={inputIssueFix}
      onStepChange={onStepChange}
      onBack={onBack}
      onNext={onNext}
    />
  );
}
