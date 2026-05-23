import React from "react";
import { BASIC_QUICK_START_EXAMPLE_CTA_LABEL } from "./basic-quick-start";
import {
  SD_BASIC_WIZARD_STEP_COUNT,
  SD_BASIC_WIZARD_STEPS,
  SD_HERO_EXAMPLE_SELECT_ID,
  type SdBasicWizardStep,
} from "./sd-basic-wizard";

type SdBasicWizardProps = {
  step: SdBasicWizardStep;
  onStepChange: (step: SdBasicWizardStep) => void;
  onBack: () => void;
  onNext: () => void;
};

export function SdBasicWizard({ step, onStepChange, onBack, onNext }: SdBasicWizardProps) {
  const meta = SD_BASIC_WIZARD_STEPS[step - 1]!;
  const isFirst = step === 1;
  const isLast = step === SD_BASIC_WIZARD_STEP_COUNT;

  const focusExampleSelect = () => {
    const el = document.getElementById(SD_HERO_EXAMPLE_SELECT_ID);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLElement) el.focus();
  };

  return (
    <section className="card card--onboarding section-card zs-basic-wizard sd-basic-wizard" aria-label="Průvodce výpočtem PHmax ve školní družině">
      <div className="zs-basic-wizard__head">
        <div className="pill pill--step">
          Průvodce ŠD · krok {step} ze {SD_BASIC_WIZARD_STEP_COUNT}
        </div>
        <h2 className="section-title">{meta.label}</h2>
        <p className="muted-text zs-basic-wizard__lead">{meta.lead}</p>
        {step === 1 ? (
          <button type="button" className="btn ghost" style={{ marginTop: 10 }} onClick={focusExampleSelect}>
            {BASIC_QUICK_START_EXAMPLE_CTA_LABEL}
          </button>
        ) : null}
      </div>

      <ol className="zs-basic-wizard__steps" aria-label="Kroky průvodce">
        {SD_BASIC_WIZARD_STEPS.map((item) => {
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
