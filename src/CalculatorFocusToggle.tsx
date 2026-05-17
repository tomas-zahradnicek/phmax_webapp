import React from "react";
import type { CalculatorFocusMode } from "./calculator-focus-mode";

type CalculatorFocusToggleProps = {
  mode: CalculatorFocusMode;
  onChange: (mode: CalculatorFocusMode) => void;
  className?: string;
};

/** Skryje metodiku a vedlejší boxy — práce jen ve formuláři a výsledku. */
export function CalculatorFocusToggle({ mode, onChange, className }: CalculatorFocusToggleProps) {
  return (
    <label
      className={["calculator-focus-toggle", className].filter(Boolean).join(" ")}
      title="Skrýt metodické bloky a zjednodušit obrazovku"
    >
      <input
        type="checkbox"
        checked={mode === "on"}
        onChange={(e) => onChange(e.target.checked ? "on" : "off")}
      />
      Fokus na formulář
    </label>
  );
}
