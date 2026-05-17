import React from "react";

export type ResultAnchorTone = "ok" | "warning" | "danger" | "neutral";

export type ResultAnchorStat = {
  label: string;
  value: React.ReactNode;
  title?: string;
};

type ResultAnchorCardProps = {
  tone?: ResultAnchorTone;
  primaryLabel: string;
  primaryValue: React.ReactNode;
  stats?: readonly ResultAnchorStat[];
  verdictLabel: string;
  verdictDetail: string;
};

/**
 * Dominantní kotva stránky – hlavní výsledek, stav a stručný verdikt (sticky na širších displejích).
 */
export function ResultAnchorCard({
  tone = "neutral",
  primaryLabel,
  primaryValue,
  stats = [],
  verdictLabel,
  verdictDetail,
}: ResultAnchorCardProps) {
  return (
    <aside
      className={`result-anchor-card result-anchor-card--${tone}`}
      aria-label="Hlavní výsledek výpočtu"
    >
      <p className="result-anchor-card__primary-label">{primaryLabel}</p>
      <p className="result-anchor-card__primary-value">{primaryValue}</p>
      {stats.length > 0 ? (
        <dl className="result-anchor-card__stats">
          {stats.map((s) => (
            <div key={s.label} className="result-anchor-card__stat">
              <dt>{s.label}</dt>
              <dd title={s.title}>{s.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="result-anchor-card__verdict">
        <p className="result-anchor-card__verdict-label">{verdictLabel}</p>
        <p className="result-anchor-card__verdict-detail">{verdictDetail}</p>
      </div>
    </aside>
  );
}
