import React from "react";
import { BASIC_QUICK_START_EXAMPLE_CTA_LABEL } from "./basic-quick-start";
import {
  PRODUCT_BASIC_WIZARD_STEP_COUNT,
  type ProductBasicWizardStep,
  type ProductBasicWizardStepMeta,
} from "./product-basic-wizard";

type ProductBasicWizardProps = {
  productLabel: string;
  steps: readonly ProductBasicWizardStepMeta[];
  step: ProductBasicWizardStep;
  heroExampleSelectId?: string;
  onStepChange: (step: ProductBasicWizardStep) => void;
  onBack: () => void;
  onNext: () => void;
};

export function ProductBasicWizard({
  productLabel,
  steps,
  step,
  heroExampleSelectId,
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
        {step === 1 && heroExampleSelectId ? (
          <button type="button" className="btn ghost" style={{ marginTop: 10 }} onClick={focusExampleSelect}>
            {BASIC_QUICK_START_EXAMPLE_CTA_LABEL}
          </button>
        ) : null}
      </div>

      <ol className="zs-basic-wizard__steps" aria-label="Kroky průvodce">
        {steps.map((item) => {
          const done = item.step < step;
          const active = item.step === step;
          return (
            <li key={item.step}>
              <button
                type="button"
                className={`zs-basic-wizard__step${active ? " zs-basic-wizard__step--active" : ""}${done ? " zs-basic-wizard__step--done" : ""}`}
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
        <button type="button" className="btn primary" onClick={onNext}>
          {isLast ? "Přejít na výsledek" : "Další krok"}
        </button>
      </div>
    </section>
  );
}
