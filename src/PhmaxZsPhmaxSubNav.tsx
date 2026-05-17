import React from "react";

export type PhmaxZsPhmaxPane = "classes" | "exceptions" | "summary";

const PANES: ReadonlyArray<{ id: PhmaxZsPhmaxPane; label: string }> = [
  { id: "classes", label: "Běžné třídy" },
  { id: "exceptions", label: "Výjimky" },
  { id: "summary", label: "Souhrn" },
];

type PhmaxZsPhmaxSubNavProps = {
  active: PhmaxZsPhmaxPane;
  onChange: (pane: PhmaxZsPhmaxPane) => void;
  className?: string;
};

/** Vnitřní navigace modulu PHmax (ZŠ). */
export function PhmaxZsPhmaxSubNav({ active, onChange, className }: PhmaxZsPhmaxSubNavProps) {
  return (
    <nav
      className={["tabs tabs--compact phmax-zs-subnav", className].filter(Boolean).join(" ")}
      aria-label="Části výpočtu PHmax"
    >
      {PANES.map((pane) => (
        <button
          key={pane.id}
          type="button"
          className={active === pane.id ? "tab active" : "tab"}
          aria-current={active === pane.id ? "page" : undefined}
          onClick={() => onChange(pane.id)}
        >
          {pane.label}
        </button>
      ))}
    </nav>
  );
}

export function phmaxPaneFromWizardStep(step: number): PhmaxZsPhmaxPane {
  if (step <= 2) return "classes";
  if (step === 3) return "exceptions";
  return "summary";
}

export function wizardStepFromPhmaxPane(pane: PhmaxZsPhmaxPane): 2 | 3 | 4 {
  if (pane === "classes") return 2;
  if (pane === "exceptions") return 3;
  return 4;
}
