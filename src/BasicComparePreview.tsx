import React from "react";
import type { CompareProductVariantsResult } from "./phmax-product-compare";

type BasicComparePreviewProps = {
  result: CompareProductVariantsResult | null;
  emptyHint: string;
  metricLabel?: string;
  /** Záloha není vybraná – zobrazí neaktivní stav místo prázdného boxu. */
  inactive?: boolean;
  legend?: string;
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
  inactive = false,
  legend = "Porovnání variant",
}: BasicComparePreviewProps) {
  if (inactive || !result || result.metrics.length < 2) {
    return (
      <div
        className="basic-compare-preview basic-compare-preview--inactive"
        role="status"
        aria-label="Porovnání variant – neaktivní"
      >
        <p className="basic-compare-preview__title">{legend}</p>
        <p className="basic-compare-preview__legend-keys" aria-hidden>
          <span className="basic-compare-preview__key">A</span> aktuální stav
          <span className="basic-compare-preview__key-divider">·</span>
          <span className="basic-compare-preview__key basic-compare-preview__key--b">B</span> uložená záloha
        </p>
        <p className="muted-text basic-compare-preview__inactive-hint">{emptyHint}</p>
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
      <p className="basic-compare-preview__title">{legend}</p>
      <p className="basic-compare-preview__legend-keys" aria-hidden>
        <span className="basic-compare-preview__key">A</span> aktuální
        <span className="basic-compare-preview__key-divider">·</span>
        <span className="basic-compare-preview__key basic-compare-preview__key--b">B</span>{" "}
        {right.variantLabel || "záloha"}
      </p>
      <div className="basic-compare-preview__grid">
        <div className="basic-compare-preview__col basic-compare-preview__col--a">
          <span className="basic-compare-preview__label">A · aktuální</span>
          <strong className="basic-compare-preview__value">
            {formatMetric(left.totalPrimary, " h")}
          </strong>
          <span className="muted-text basic-compare-preview__hint">{metricLabel}</span>
        </div>
        <div className="basic-compare-preview__col basic-compare-preview__col--b">
          <span className="basic-compare-preview__label">B · {right.variantLabel || "záloha"}</span>
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
