import React from "react";
import { CALCULATOR_GLOBAL_DISPLAY_HINT } from "./calculator-ui-constants";

/** Pohodlné / kompaktní / fokus – platí globálně v prohlížeči. */
export function CalculatorGlobalDisplayHint({ className }: { className?: string }) {
  return (
    <p className={["calculator-global-display-hint", className].filter(Boolean).join(" ")} role="note">
      {CALCULATOR_GLOBAL_DISPLAY_HINT}
    </p>
  );
}
