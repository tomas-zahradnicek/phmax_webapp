import React from "react";

type ZsTabKey = "phmax" | "pha" | "php";

type ZsTabProgressMapProps = {
  activeTab: ZsTabKey;
  phmaxDone: boolean;
  phaDone: boolean;
  phpDone: boolean;
  onSelect: (tab: ZsTabKey) => void;
};

/** Mapa PHmax → PHAmax → PHPmax s checkmarky v docku ZŠ. */
export function ZsTabProgressMap({ activeTab, phmaxDone, phaDone, phpDone, onSelect }: ZsTabProgressMapProps) {
  const steps: { id: ZsTabKey; label: string; done: boolean }[] = [
    { id: "phmax", label: "PHmax", done: phmaxDone },
    { id: "pha", label: "PHAmax", done: phaDone },
    { id: "php", label: "PHPmax", done: phpDone },
  ];

  return (
    <nav className="zs-tab-progress" aria-label="Průběh záložek ZŠ">
      <ol className="zs-tab-progress__list">
        {steps.map((step, index) => (
          <li key={step.id} className="zs-tab-progress__item">
            {index > 0 ? <span className="zs-tab-progress__sep" aria-hidden="true">→</span> : null}
            <button
              type="button"
              className={[
                "zs-tab-progress__btn",
                activeTab === step.id ? "zs-tab-progress__btn--active" : "",
                step.done ? "zs-tab-progress__btn--done" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={activeTab === step.id ? "step" : undefined}
              onClick={() => onSelect(step.id)}
            >
              <span className="zs-tab-progress__check" aria-hidden="true">
                {step.done ? "✓" : "○"}
              </span>
              {step.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
