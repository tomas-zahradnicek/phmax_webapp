import React from "react";
import { OwnDataHint } from "./OwnDataHint";

type CalculatorHeroCollapsibleHintProps = {
  className?: string;
};

/** Sbalitelná věta „Formulář je editovatelný…“ – variant A. */
export function CalculatorHeroCollapsibleHint({ className }: CalculatorHeroCollapsibleHintProps) {
  return (
    <details
      className={[
        "calculator-hero-collapsible-hint ux-collapsible ux-collapsible--hero",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <summary className="ux-collapsible__summary calculator-hero-collapsible-hint__summary">
        ⓘ Jak modul funguje
      </summary>
      <div className="ux-collapsible__body calculator-hero-collapsible-hint__body">
        <OwnDataHint variant="hero" />
      </div>
    </details>
  );
}
