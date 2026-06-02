import React from "react";
import {
  ZS_BASIC_WIZARD_STEP_COUNT,
  ZS_BASIC_WIZARD_STEPS,
  type ZsBasicWizardStep,
} from "./zs-basic-wizard";
import { WIZARD_START_EMPTY_FORM_BUTTON_LABEL } from "./calculator-ui-constants";
import { basicWizardStepButtonClass } from "./product-basic-wizard";

type WizardChoiceOption = {
  value: string;
  label: string;
  title?: string;
};

type ZsBasicWizardInputIssueFix = {
  onFix: () => void;
  fixLabel?: string;
};

type ZsBasicWizardProps = {
  step: ZsBasicWizardStep;
  modeLabel: string;
  hasExceptionModules: boolean;
  wizardChoice: string;
  wizardOptions: readonly WizardChoiceOption[];
  inputIssueFix?: ZsBasicWizardInputIssueFix;
  onStartEmptyForm?: () => void;
  onWizardChoice: (value: string) => void;
  onStepChange: (step: ZsBasicWizardStep) => void;
  onBack: () => void;
  onNext: () => void;
};

export function ZsBasicWizard({
  step,
  modeLabel,
  hasExceptionModules,
  wizardChoice,
  wizardOptions,
  inputIssueFix,
  onStartEmptyForm,
  onWizardChoice,
  onStepChange,
  onBack,
  onNext,
}: ZsBasicWizardProps) {
  const meta = ZS_BASIC_WIZARD_STEPS[step - 1]!;
  const isFirst = step === 1;
  const isLast = step === ZS_BASIC_WIZARD_STEP_COUNT;

  return (
    <section className="card card--onboarding section-card zs-basic-wizard" aria-label="Průvodce výpočtem PHmax">
      <div className="zs-basic-wizard__head">
        <div className="pill pill--step">Průvodce · krok {step} ze {ZS_BASIC_WIZARD_STEP_COUNT}</div>
        <h2 className="section-title">{meta.label}</h2>
        <p className="muted-text zs-basic-wizard__lead">{meta.lead}</p>
        <p className="muted-text zs-basic-wizard__context">
          <strong>Aktivní režim:</strong> {modeLabel}
          {step === 3 && !hasExceptionModules ? (
            <>
              {" "}
              · v tomto režimu nejsou viditelné doplňkové moduly – můžete přejít rovnou na souhrn.
            </>
          ) : null}
        </p>
      </div>

      {step === 1 ? (
        <div className="field zs-basic-wizard__preset">
          <label htmlFor="zs-basic-wizard-preset">Rychlá situace (volitelné)</label>
          <select
            id="zs-basic-wizard-preset"
            className="input"
            value={wizardChoice}
            onChange={(e) => onWizardChoice(e.target.value)}
          >
            <option value="">Vyberte situaci…</option>
            {wizardOptions.map((opt) => (
              <option key={opt.value} value={opt.value} title={opt.title}>
                {opt.label}
              </option>
            ))}
          </select>
          {onStartEmptyForm ? (
            <button type="button" className="btn ghost" style={{ marginTop: 10 }} onClick={onStartEmptyForm}>
              {WIZARD_START_EMPTY_FORM_BUTTON_LABEL}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="zs-basic-wizard__progress">
        <ol className="zs-basic-wizard__steps" aria-label="Kroky průvodce">
          {ZS_BASIC_WIZARD_STEPS.map((item, index) => {
            const active = item.step === step;
            const previousStep = index > 0 ? ZS_BASIC_WIZARD_STEPS[index - 1]! : null;
            return (
              <li key={item.step} className="zs-basic-wizard__steps-item">
                {previousStep ? (
                  <span
                    className={[
                      "zs-basic-wizard__step-arrow",
                      previousStep.step < step ? "zs-basic-wizard__step-arrow--done" : "",
                      previousStep.step === step ? "zs-basic-wizard__step-arrow--next" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-hidden="true"
                  >
                    →
                  </span>
                ) : null}
                <button
                  type="button"
                  className={basicWizardStepButtonClass(item.step, step)}
                  aria-current={active ? "step" : undefined}
                  onClick={() => onStepChange(item.step)}
                >
                  <span className="zs-basic-wizard__step-num">{item.step}</span>
                  <span className="zs-basic-wizard__step-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="zs-basic-wizard__nav">
          <button type="button" className="btn ghost" onClick={onBack} disabled={isFirst}>
            Zpět
          </button>
          {isLast && inputIssueFix ? (
            <button type="button" className="btn ghost" onClick={inputIssueFix.onFix}>
              {inputIssueFix.fixLabel ?? "Přejít k chybě"}
            </button>
          ) : null}
          <button type="button" className="btn primary" onClick={onNext}>
            {isLast ? "Dokončit průvodce" : "Další krok"}
          </button>
        </div>
      </div>
    </section>
  );
}
