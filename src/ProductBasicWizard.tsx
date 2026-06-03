import React from "react";
import { BASIC_QUICK_START_EXAMPLE_CTA_LABEL } from "./basic-quick-start";
import { BASIC_WIZARD_OWN_DATA_NOTE, WIZARD_START_EMPTY_FORM_BUTTON_LABEL } from "./calculator-ui-constants";
import {
  PRODUCT_BASIC_WIZARD_STEP_COUNT,
  basicWizardStepButtonClass,
  type ProductBasicWizardStep,
  type ProductBasicWizardStepMeta,
} from "./product-basic-wizard";

type ProductBasicWizardInputIssueFix = {
  onFix: () => void;
  fixLabel?: string;
};

type ProductBasicWizardProps = {
  productLabel: string;
  steps: readonly ProductBasicWizardStepMeta[];
  step: ProductBasicWizardStep;
  heroExampleSelectId?: string;
  onStartEmptyForm?: () => void;
  inputIssueFix?: ProductBasicWizardInputIssueFix;
  onStepChange: (step: ProductBasicWizardStep) => void;
  onBack: () => void;
  onNext: () => void;
};

export function ProductBasicWizard({
  productLabel,
  steps,
  step,
  heroExampleSelectId,
  onStartEmptyForm,
  inputIssueFix,
  onStepChange,
  onBack,
  onNext,
}: ProductBasicWizardProps) {
  const meta = steps[step - 1]!;
  const isFirst = step === 1;
  const isLast = step === PRODUCT_BASIC_WIZARD_STEP_COUNT;

  const focusExampleSelect = () => {
    if (!heroExampleSelectId) return;
    const el = document.getElementById(heroExampleSelectId);
    if (!(el instanceof HTMLElement)) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus();
  };

  return (
    <section
      className="card card--onboarding section-card zs-basic-wizard product-basic-wizard"
      aria-label={`Průvodce výpočtem PHmax – ${productLabel}`}
    >
      <div className="zs-basic-wizard__head">
        <div className="pill pill--step">
          Průvodce {productLabel} · krok {step} ze {PRODUCT_BASIC_WIZARD_STEP_COUNT}
        </div>
        <h2 className="section-title">{meta.label}</h2>
        <p className="muted-text zs-basic-wizard__lead">{meta.lead}</p>
        {step === 1 ? <p className="muted-text own-data-hint own-data-hint--wizard">{BASIC_WIZARD_OWN_DATA_NOTE}</p> : null}
        {step === 1 && heroExampleSelectId ? (
          <button type="button" className="btn ghost" style={{ marginTop: 10 }} onClick={focusExampleSelect}>
            {BASIC_QUICK_START_EXAMPLE_CTA_LABEL}
          </button>
        ) : null}
        {step === 1 && onStartEmptyForm ? (
          <button type="button" className="btn ghost" style={{ marginTop: 8 }} onClick={onStartEmptyForm}>
            {WIZARD_START_EMPTY_FORM_BUTTON_LABEL}
          </button>
        ) : null}
      </div>

      <div className="zs-basic-wizard__progress">
        <ol className="zs-basic-wizard__steps" aria-label="Kroky průvodce">
          {steps.map((item, index) => {
            const active = item.step === step;
            const previousStep = index > 0 ? steps[index - 1]! : null;
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
            {isLast ? "Přejít na výsledek" : "Další krok"}
          </button>
        </div>
      </div>

      <div className="product-basic-wizard__mobile-next" aria-hidden={false}>
        <button type="button" className="btn primary product-basic-wizard__mobile-next-btn" onClick={onNext}>
          {isLast ? "Přejít na výsledek" : "Další krok průvodce"}
        </button>
      </div>
    </section>
  );
}
