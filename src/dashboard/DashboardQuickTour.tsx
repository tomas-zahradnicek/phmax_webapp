import React, { useCallback, useState } from "react";
import { DASHBOARD_QUICK_TOUR_LS_KEY, DASHBOARD_QUICK_TOUR_STEPS, type DashboardQuickTourStep } from "../phmax-dashboard-quick-tour";

function goToTourTarget(targetSelector: string): void {
  document.querySelectorAll(".calculator-quick-tour-highlight").forEach((el) => {
    el.classList.remove("calculator-quick-tour-highlight");
  });
  const el = document.querySelector(targetSelector);
  if (!(el instanceof HTMLElement)) return;
  el.classList.add("calculator-quick-tour-highlight");
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** Tři kroky na Přehledu – záložky, karty modulů, návod. */
export function DashboardQuickTour() {
  const [stepIndex, setStepIndex] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof localStorage === "undefined") return true;
    return localStorage.getItem(DASHBOARD_QUICK_TOUR_LS_KEY) === "1";
  });

  const dismiss = useCallback(() => {
    if (typeof localStorage !== "undefined") localStorage.setItem(DASHBOARD_QUICK_TOUR_LS_KEY, "1");
    setDismissed(true);
    document.querySelectorAll(".calculator-quick-tour-highlight").forEach((el) => {
      el.classList.remove("calculator-quick-tour-highlight");
    });
  }, []);

  if (dismissed || DASHBOARD_QUICK_TOUR_STEPS.length === 0) return null;

  const step: DashboardQuickTourStep = DASHBOARD_QUICK_TOUR_STEPS[stepIndex]!;
  const isLast = stepIndex >= DASHBOARD_QUICK_TOUR_STEPS.length - 1;

  return (
    <section className="card section-card calculator-quick-tour dash-quick-tour" aria-label="První kroky na přehledu">
      <div className="calculator-quick-tour__head">
        <span className="pill pill--step">
          První spuštění · krok {stepIndex + 1} / {DASHBOARD_QUICK_TOUR_STEPS.length}
        </span>
        <h2 className="section-title">{step.title}</h2>
        <p className="muted-text">{step.detail}</p>
      </div>
      <div className="calculator-quick-tour__nav">
        <button type="button" className="btn ghost" onClick={() => goToTourTarget(step.targetSelector)}>
          Ukázat na stránce
        </button>
        {!isLast ? (
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              const next = stepIndex + 1;
              setStepIndex(next);
              goToTourTarget(DASHBOARD_QUICK_TOUR_STEPS[next]!.targetSelector);
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
