import React from "react";
import type { BasicQuickStartStep } from "./basic-quick-start";

type BasicModeStepsProps = {
  heading: string;
  lead?: string;
  steps: readonly BasicQuickStartStep[];
};

export function BasicModeSteps({ heading, lead, steps }: BasicModeStepsProps) {
  const focusTarget = (targetId?: string) => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLElement) el.focus();
  };

  return (
    <section className="card card--onboarding section-card section-card--onboarding">
      <div className="onboarding">
        <div className="onboarding__intro">
          <div className="pill pill--step">Základní režim</div>
          <h2 className="section-title">{heading}</h2>
          {lead ? <p className="muted-text">{lead}</p> : null}
        </div>
        <div className="onboarding__steps">
          {steps.map((step, idx) => (
            <div className="onboarding-step" key={`${idx + 1}-${step.title}`}>
              <div className="onboarding-step__number">{idx + 1}</div>
              <div className="onboarding-step__body">
                <div className="onboarding-step__title">{step.title}</div>
                <div className="onboarding-step__text">
                  {step.text}
                  {step.ctaLabel && step.ctaTargetId ? (
                    <div style={{ marginTop: 8 }}>
                      <button type="button" className="btn ghost" onClick={() => focusTarget(step.ctaTargetId)}>
                        {step.ctaLabel}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
