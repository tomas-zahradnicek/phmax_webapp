import React from "react";
import {
  ZS_BASIC_WIZARD_STEPS,
  type ZsBasicWizardStep,
} from "./zs-basic-wizard";

type WizardChoiceOption = {
  value: string;
  label: string;
  title?: string;
};

type ZsBasicWizardProps = {
  step: ZsBasicWizardStep;
  modeLabel: string;
  hasExceptionModules: boolean;
  wizardChoice: string;
  wizardOptions: readonly WizardChoiceOption[];
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
  onWizardChoice,
  onStepChange,
  onBack,
  onNext,
}: ZsBasicWizardProps) {
  const meta = ZS_BASIC_WIZARD_STEPS[step - 1]!;
  const isFirst = step === 1;
  const isLast = step === 4;

  return (
    <section className="card card--onboarding section-card zs-basic-wizard" aria-label="Průvodce výpočtem PHmax">
      <div className="zs-basic-wizard__head">
        <div className="pill pill--step">Průvodce · krok {step} ze 4</div>
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

      <ol className="zs-basic-wizard__steps" aria-label="Kroky průvodce">
        {ZS_BASIC_WIZARD_STEPS.map((item) => {
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
        </div>
      ) : null}

      <div className="zs-basic-wizard__nav">
        <button type="button" className="btn ghost" onClick={onBack} disabled={isFirst}>
          Zpět
        </button>
        <button type="button" className="btn primary" onClick={onNext}>
          {isLast ? "Dokončit průvodce" : "Další krok"}
        </button>
      </div>
    </section>
  );
}
