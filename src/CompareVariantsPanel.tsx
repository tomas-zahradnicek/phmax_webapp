import React from "react";
import type { CompareProductVariantsResult } from "./phmax-product-compare";

type CompareVariantsPanelProps = {
  title: string;
  result: CompareProductVariantsResult | null;
  emptyHint: string;
};

function metricText(value: number | null, suffix = ""): string {
  if (value == null) return "–";
  return `${value.toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}${suffix}`;
}

function normalize(value: number | null): number | null {
  return typeof value === "number" ? value : null;
}

function compareVerdict(result: CompareProductVariantsResult): {
  tone: "ok" | "warning" | "neutral";
  text: string;
  practiceNote: string;
} {
  const left = result.metrics[0];
  const right = result.metrics[1];
  if (!left || !right) {
    return {
      tone: "neutral",
      text: "Porovnání je orientační.",
      practiceNote: "Doplňte obě varianty, aby šly vyhodnotit stejné metriky.",
    };
  }

  if (left.validationOk === false || right.validationOk === false) {
    return {
      tone: "warning",
      text: "Nejdřív opravte validační chyby.",
      practiceNote: "Doporučení porovnání berte jen orientačně, dokud nejsou obě varianty bez chyb.",
    };
  }

  const leftPrimary = normalize(left.totalPrimary);
  const rightPrimary = normalize(right.totalPrimary);
  if (leftPrimary == null || rightPrimary == null) {
    return {
      tone: "neutral",
      text: "Není dostupná primární metrika u obou variant.",
      practiceNote: "Zkontrolujte vstupy, aby obě varianty měly dopočtený PHmax.",
    };
  }

  if (leftPrimary === rightPrimary) {
    return {
      tone: "neutral",
      text: "Obě varianty mají stejný PHmax.",
      practiceNote: "Rozhodujte podle provozních kritérií školy (organizace, personál, stabilita).",
    };
  }

  const better = rightPrimary > leftPrimary ? (right.variantLabel || right.variantId) : (left.variantLabel || left.variantId);
  return {
    tone: "ok",
    text: `Vyšší PHmax má varianta „${better}“.`,
    practiceNote: "Pokud je to záměr školy, pokračujte uložením této varianty jako pracovní referenční scénář.",
  };
}

export function CompareVariantsPanel({ title, result, emptyHint }: CompareVariantsPanelProps) {
  if (!result || result.metrics.length < 2) {
    return (
      <div className="compare-panel compare-panel--empty" role="status" aria-live="polite">
        <p className="compare-panel__empty">{emptyHint}</p>
      </div>
    );
  }

  const left = result.metrics[0];
  const right = result.metrics[1];
  const verdict = compareVerdict(result);

  return (
    <section className="compare-panel" aria-label={title}>
      <p className="compare-panel__title">{title}</p>
      <p className={`compare-panel__verdict compare-panel__verdict--${verdict.tone}`}>{verdict.text}</p>
      <div className="compare-panel__grid">
        <article className="compare-panel__card">
          <h4 className="compare-panel__variant">{left.variantLabel || left.variantId}</h4>
          <p className="compare-panel__metric">
            PHmax: <strong>{metricText(left.totalPrimary, " h")}</strong>
          </p>
          <p className="compare-panel__metric">Sekundární metrika: {metricText(left.totalSecondary)}</p>
          <p className="compare-panel__metric">Validace: {left.validationOk === false ? "chyby" : "OK"}</p>
        </article>
        <article className="compare-panel__card">
          <h4 className="compare-panel__variant">{right.variantLabel || right.variantId}</h4>
          <p className="compare-panel__metric">
            PHmax: <strong>{metricText(right.totalPrimary, " h")}</strong>
          </p>
          <p className="compare-panel__metric">Sekundární metrika: {metricText(right.totalSecondary)}</p>
          <p className="compare-panel__metric">Validace: {right.validationOk === false ? "chyby" : "OK"}</p>
        </article>
      </div>
      <p className="compare-panel__recommendation">
        <strong>Doporučení:</strong> {result.recommendation}
      </p>
      <p className="compare-panel__practice-note">
        <strong>Co to znamená v praxi:</strong> {verdict.practiceNote}
      </p>
      {result.differences.length > 0 ? (
        <ul className="compare-panel__diffs">
          {result.differences.slice(0, 3).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
