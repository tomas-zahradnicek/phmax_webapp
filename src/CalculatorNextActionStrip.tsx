import React from "react";
import type { CalculatorNextAction } from "./calculator-next-action";

type CalculatorNextActionStripProps = {
  action: CalculatorNextAction;
  className?: string;
};

/** Jedna věta „co teď“ s volitelným CTA – sjednocený verdikt pod hero. */
export function CalculatorNextActionStrip({ action, className }: CalculatorNextActionStripProps) {
  return (
    <section
      className={["calculator-next-action", `calculator-next-action--${action.tone}`, className]
        .filter(Boolean)
        .join(" ")}
      aria-label="Další krok ve výpočtu"
      data-testid="calculator-next-action"
    >
      <p className="calculator-next-action__message">{action.message}</p>
      {action.onAction && action.actionLabel ? (
        <button type="button" className="btn btn--sm primary calculator-next-action__cta" onClick={action.onAction}>
          {action.actionLabel}
        </button>
      ) : null}
    </section>
  );
}
