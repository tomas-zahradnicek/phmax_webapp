import React from "react";
import type { CompareProductVariantsResult } from "./phmax-product-compare";

type BasicComparePreviewProps = {
  result: CompareProductVariantsResult | null;
  emptyHint: string;
  metricLabel?: string;
};

function formatMetric(value: number | null, suffix = ""): string {
  if (value == null) return "–";
  return `${value.toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}${suffix}`;
}

/** Zjednodušené porovnání dvou variant pro základní režim (2 čísla vedle sebe). */
export function BasicComparePreview({
  result,
  emptyHint,
  metricLabel = "PHmax",
}: BasicComparePreviewProps) {
  if (!result || result.metrics.length < 2) {
    return (
      <div className="basic-compare-preview basic-compare-preview--empty" role="status">
        <p className="muted-text">{emptyHint}</p>
      </div>
    );
  }

  const left = result.metrics[0]!;
  const right = result.metrics[1]!;
  const delta =
    left.totalPrimary != null && right.totalPrimary != null
      ? right.totalPrimary - left.totalPrimary
      : null;

  return (
    <div className="basic-compare-preview" role="region" aria-label="Porovnání variant">
      <p className="basic-compare-preview__title">Porovnání s uloženou zálohou</p>
      <div className="basic-compare-preview__grid">
        <div className="basic-compare-preview__col">
          <span className="basic-compare-preview__label">Aktuální stav</span>
          <strong className="basic-compare-preview__value">
            {formatMetric(left.totalPrimary, " h")}
          </strong>
          <span className="muted-text basic-compare-preview__hint">{metricLabel}</span>
        </div>
        <div className="basic-compare-preview__col">
          <span className="basic-compare-preview__label">{right.variantLabel || "Záloha"}</span>
          <strong className="basic-compare-preview__value">
            {formatMetric(right.totalPrimary, " h")}
          </strong>
          <span className="muted-text basic-compare-preview__hint">{metricLabel}</span>
        </div>
      </div>
      {delta != null ? (
        <p className="basic-compare-preview__delta">
          Rozdíl: {delta > 0 ? "+" : ""}
          {delta.toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} h
        </p>
      ) : (
        <p className="muted-text basic-compare-preview__delta">Rozdíl nelze určit – chybí metrika u jedné varianty.</p>
      )}
    </div>
  );
}
