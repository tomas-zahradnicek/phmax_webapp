import React, { useCallback, useState } from "react";

export type CalculatorQuickTourStep = {
  title: string;
  detail: string;
  targetId?: string;
};

type CalculatorModuleQuickTourProps = {
  moduleLabel: string;
  storageKey: string;
  steps: readonly CalculatorQuickTourStep[];
  exampleSelectId?: string;
};

/** Tři kroky bez externí knihovny – scroll + outline na cíli. */
export function CalculatorModuleQuickTour({
  moduleLabel,
  storageKey,
  steps,
  exampleSelectId,
}: CalculatorModuleQuickTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof localStorage === "undefined") return true;
    return localStorage.getItem(storageKey) === "1";
  });

  const dismiss = useCallback(() => {
    if (typeof localStorage !== "undefined") localStorage.setItem(storageKey, "1");
    setDismissed(true);
    document.querySelectorAll(".calculator-quick-tour-highlight").forEach((el) => {
      el.classList.remove("calculator-quick-tour-highlight");
    });
  }, [storageKey]);

  const goToTarget = useCallback(
    (targetId?: string) => {
      document.querySelectorAll(".calculator-quick-tour-highlight").forEach((el) => {
        el.classList.remove("calculator-quick-tour-highlight");
      });
      const id = targetId ?? exampleSelectId;
      if (!id) return;
      const el = document.getElementById(id);
      if (!(el instanceof HTMLElement)) return;
      el.classList.add("calculator-quick-tour-highlight");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [exampleSelectId],
  );

  if (dismissed || steps.length === 0) return null;

  const step = steps[stepIndex]!;
  const isLast = stepIndex >= steps.length - 1;

  return (
    <section className="card section-card calculator-quick-tour" aria-label={`První kroky – ${moduleLabel}`}>
      <div className="calculator-quick-tour__head">
        <span className="pill pill--step">
          První spuštění · krok {stepIndex + 1} / {steps.length}
        </span>
        <h2 className="section-title">{step.title}</h2>
        <p className="muted-text">{step.detail}</p>
      </div>
      <div className="calculator-quick-tour__nav">
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            goToTarget(step.targetId);
          }}
        >
          Ukázat na stránce
        </button>
        {!isLast ? (
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              const next = stepIndex + 1;
              setStepIndex(next);
              goToTarget(steps[next]?.targetId);
            }}
          >
            Další
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={dismiss}>
            Hotovo
          </button>
        )}
        <button type="button" className="btn ghost" onClick={dismiss}>
          Přeskočit
        </button>
      </div>
    </section>
  );
}
